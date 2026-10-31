import { execFileSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
process.chdir(root);
process.env.NODE_ENV ??= "development";
require("@expo/env").load(root);
const expo = require.resolve("expo/bin/cli");
const host = process.env.IOS_SIMULATOR_HOST;
let metro;

function startExpo(args) {
  const child = spawn(process.execPath, [expo, ...args], { stdio: "inherit" });
  child.on("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  child.on("exit", (code, signal) => {
    process.exitCode = code ?? (signal ? 1 : 0);
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => child.kill(signal));
  }
  return child;
}

function remote(...args) {
  const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;
  return execFileSync(
    "ssh",
    ["-o", "BatchMode=yes", "-o", "ConnectTimeout=10", "--", host, args.map(quote).join(" ")],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], timeout: 180_000 },
  );
}

async function metroReady() {
  let response;
  try {
    response = await fetch("http://localhost:8082/status", { signal: AbortSignal.timeout(1500) });
  } catch {
    return false;
  }
  if (response.headers.get("x-react-native-project-root") !== root.replace(/\/$/, "")) {
    throw new Error("Port 8082 belongs to another project. Stop that server and try again.");
  }
  return response.ok && (await response.text()) === "packager-status:running";
}

async function openRemoteSimulator() {
  const server = process.env.REACT_NATIVE_PACKAGER_HOSTNAME;
  if (!server)
    throw new Error(
      "Set REACT_NATIVE_PACKAGER_HOSTNAME in .env.local to this Mac's reachable hostname.",
    );
  // Check SSH and Xcode before starting a server or changing simulator state.
  const { devices } = JSON.parse(
    remote("xcrun", "simctl", "list", "devices", "available", "--json"),
  );
  const phones = Object.entries(devices)
    .filter(([runtime]) => runtime.includes(".iOS-"))
    .flatMap(([, list]) => list)
    .filter((device) => device.isAvailable && device.name.startsWith("iPhone"));
  const device = phones.find((item) => item.state === "Booted") ?? phones[0];
  if (!device) throw new Error(`No iPhone simulator is installed on ${host}.`);
  if (device.state !== "Booted") remote("xcrun", "simctl", "boot", device.udid);
  remote("open", "-a", "Simulator");
  remote("xcrun", "simctl", "bootstatus", device.udid, "-b");
  const app = require("../app.json").expo;
  try {
    remote("xcrun", "simctl", "get_app_container", device.udid, app.ios.bundleIdentifier, "app");
  } catch {
    throw new Error(`Install the iOS development build on ${host} first. See docs/remote-ios.md.`);
  }
  if (!(await metroReady())) {
    metro = startExpo(["start", "--dev-client", "--scheme", app.scheme, "--port", "8082"]);
    const deadline = Date.now() + 90_000;
    while (!(await metroReady())) {
      if (metro.exitCode !== null || metro.signalCode)
        throw new Error("Metro stopped before it was ready.");
      if (Date.now() > deadline) throw new Error("Metro did not become ready within 90 seconds.");
      await delay(500);
    }
  }
  const url = `http://${server}:8082`;
  remote("curl", "--fail", "--silent", "--show-error", "--max-time", "10", `${url}/status`);
  remote(
    "xcrun",
    "simctl",
    "openurl",
    device.udid,
    `${app.scheme}://expo-development-client/?url=${encodeURIComponent(url)}`,
  );
  console.log(`Opened ${app.name} on ${host} (${device.name}).`);
}

try {
  if (host) await openRemoteSimulator();
  else startExpo(["run:ios", "--device", ...process.argv.slice(2)]);
} catch (error) {
  console.error(error.message);
  metro?.kill("SIGINT");
  process.exitCode = 1;
}
