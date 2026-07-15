#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import { access, copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromWebsite = createRequire(path.join(ROOT, "website", "package.json"));
const sharp = requireFromWebsite("sharp");

const APP_ID = "com.vincentmukuna.owed";
const SIMULATOR_NAME = "Owed Website Screenshots";
const PREFERRED_DEVICE_NAMES = ["iPhone 16 Pro", "iPhone 15 Pro", "iPhone 14 Pro"];
const METRO_PORT = 8081;
const ASSET_DIR = path.join(ROOT, "website", "public", "screens");
const FLOW_PATH = path.join(ROOT, ".maestro", "website-screenshots.yaml");
const ARTIFACT_ROOT = path.join(ROOT, ".artifacts", "screenshots");
const LOCAL_MAESTRO = path.join(ROOT, ".artifacts", "tools", "maestro", "bin", "maestro");
const LOCAL_TOOL_HOME = path.join(ROOT, ".artifacts", "tools", "home");
const FULL_WIDTH = 1125;
const FULL_HEIGHT = 2436;
const HERO_WIDTH = 1920;
const HERO_HEIGHT = 1440;

const SCREENS = ["home", "debts", "people", "reminders"];
const THEMES = ["light", "dark"];
const FULL_ASSETS = THEMES.flatMap((theme) =>
  SCREENS.map((screen) => ({
    screen,
    theme,
    filename: `${screen}${theme === "dark" ? "-dark" : ""}.jpeg`,
  })),
);
const ALL_ASSETS = [...FULL_ASSETS.map(({ filename }) => filename), "hero.png", "hero-dark.png"];
let maestroCommand = "maestro";
let reuseExistingMetro = false;

function log(message) {
  process.stdout.write(`[screenshots] ${message}\n`);
}

function fail(message) {
  throw new Error(message);
}

function commandExists(command) {
  return spawnSync("/usr/bin/env", ["which", command], { stdio: "ignore" }).status === 0;
}

function run(command, args, options = {}) {
  log(`${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env: { ...process.env, ...options.env },
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    stdio: options.capture ? "pipe" : "inherit",
  });
  if (result.status !== 0) {
    const detail = options.capture ? `\n${result.stdout ?? ""}${result.stderr ?? ""}` : "";
    fail(`${command} exited with status ${result.status}.${detail}`);
  }
  return options.capture ? String(result.stdout).trim() : "";
}

function parseJsonCommand(command, args) {
  return JSON.parse(run(command, args, { capture: true }));
}

async function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForPort(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortOpen(port)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  fail(`Metro did not open port ${port} within ${timeoutMs / 1000}s.`);
}

function metroOwnerCwd() {
  const listener = spawnSync("lsof", ["-tiTCP:8081", "-sTCP:LISTEN"], {
    encoding: "utf8",
  });
  const pid = String(listener.stdout).trim().split("\n")[0];
  if (!pid) return null;
  const cwd = spawnSync("lsof", ["-a", "-p", pid, "-d", "cwd", "-Fn"], {
    encoding: "utf8",
  });
  return String(cwd.stdout)
    .split("\n")
    .find((line) => line.startsWith("n"))
    ?.slice(1);
}

async function preflight() {
  if (process.platform !== "darwin") fail("Local screenshot automation requires macOS.");
  for (const command of ["xcrun", "xcodebuild", "npx", "npm"]) {
    if (!commandExists(command)) fail(`Missing required command: ${command}`);
  }
  if (process.env.MAESTRO_BIN) {
    maestroCommand = process.env.MAESTRO_BIN;
  } else if (
    await access(LOCAL_MAESTRO, fsConstants.X_OK)
      .then(() => true)
      .catch(() => false)
  ) {
    maestroCommand = LOCAL_MAESTRO;
  } else if (!commandExists("maestro")) {
    fail(
      "Missing Maestro CLI. Install it globally or place it at .artifacts/tools/maestro/bin/maestro.",
    );
  }
  await Promise.all([
    access(FLOW_PATH, fsConstants.R_OK),
    access(path.join(ROOT, "ios"), fsConstants.R_OK),
    access(path.join(ROOT, "website", "node_modules", "sharp"), fsConstants.R_OK),
  ]);
  if (await isPortOpen(METRO_PORT)) {
    const ownerCwd = metroOwnerCwd();
    if (ownerCwd !== ROOT) {
      fail(
        `Port ${METRO_PORT} is already in use by ${ownerCwd ?? "an unknown process"}. Stop it and retry.`,
      );
    }
    reuseExistingMetro = true;
    log("reusing the existing Owed Metro server on port 8081");
  }
}

function selectSimulatorRuntime() {
  const { runtimes } = parseJsonCommand("xcrun", ["simctl", "list", "runtimes", "-j"]);
  const available = runtimes
    .filter((runtime) => runtime.isAvailable && runtime.platform === "iOS")
    .sort((a, b) =>
      String(b.version).localeCompare(String(a.version), undefined, { numeric: true }),
    );
  if (available.length === 0) fail("No available iOS Simulator runtime was found in Xcode.");
  return available[0];
}

function selectDeviceType() {
  const { devicetypes } = parseJsonCommand("xcrun", ["simctl", "list", "devicetypes", "-j"]);
  for (const name of PREFERRED_DEVICE_NAMES) {
    const match = devicetypes.find((device) => device.name === name);
    if (match) return match;
  }
  const fallback = devicetypes.find((device) => /^iPhone .* Pro$/.test(device.name));
  if (!fallback) fail("No supported iPhone Pro simulator device type was found.");
  return fallback;
}

function findExistingSimulator(runtimeIdentifier) {
  const { devices } = parseJsonCommand("xcrun", ["simctl", "list", "devices", "-j"]);
  return (devices[runtimeIdentifier] ?? []).find((device) => device.name === SIMULATOR_NAME);
}

function prepareSimulator() {
  const runtime = selectSimulatorRuntime();
  const deviceType = selectDeviceType();
  let simulator = findExistingSimulator(runtime.identifier);
  let udid;

  if (simulator) {
    udid = simulator.udid;
    if (simulator.state === "Booted") {
      run("xcrun", ["simctl", "shutdown", udid]);
    }
    run("xcrun", ["simctl", "erase", udid]);
  } else {
    udid = run(
      "xcrun",
      ["simctl", "create", SIMULATOR_NAME, deviceType.identifier, runtime.identifier],
      { capture: true },
    );
  }

  run("xcrun", ["simctl", "boot", udid]);
  run("xcrun", ["simctl", "bootstatus", udid, "-b"]);

  // Keep device-level chrome stable. Unsupported status-bar fields are non-fatal
  // across Xcode versions, but the common values are applied when available.
  spawnSync("xcrun", [
    "simctl",
    "status_bar",
    udid,
    "override",
    "--time",
    "9:41",
    "--batteryState",
    "charged",
    "--batteryLevel",
    "100",
    "--wifiBars",
    "3",
    "--cellularBars",
    "4",
  ]);

  log(`using ${deviceType.name}, iOS ${runtime.version} (${udid})`);
  return { udid, runtime: runtime.version, device: deviceType.name };
}

function startMetro(logPath) {
  const output = [];
  const child = spawn("npx", ["expo", "start", "--localhost", "--port", String(METRO_PORT)], {
    cwd: ROOT,
    env: { ...process.env, CI: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => output.push(chunk));
  child.stderr.on("data", (chunk) => output.push(chunk));
  child.once("exit", async () => {
    await writeFile(logPath, Buffer.concat(output).toString()).catch(() => {});
  });
  return { child, output, logPath };
}

async function stopMetro(metro) {
  if (!metro) return;
  metro.child.kill("SIGTERM");
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      metro.child.kill("SIGKILL");
      resolve();
    }, 3000);
    metro.child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
  await writeFile(metro.logPath, Buffer.concat(metro.output).toString());
}

async function normalizeCaptures(rawDir, processedDir) {
  for (const asset of FULL_ASSETS) {
    const input = path.join(rawDir, asset.theme, `${asset.screen}.png`);
    const output = path.join(processedDir, asset.filename);
    await access(input, fsConstants.R_OK).catch(() => fail(`Missing Maestro capture: ${input}`));
    await sharp(input)
      .resize(FULL_WIDTH, FULL_HEIGHT, { fit: "cover", position: "centre" })
      .jpeg({ quality: 90, chromaSubsampling: "4:4:4", mozjpeg: true })
      .toFile(output);
  }
}

function roundedRectSvg(width, height, radius, fill, stroke = "none", strokeWidth = 0) {
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect x="${strokeWidth / 2}" y="${strokeWidth / 2}" width="${width - strokeWidth}" height="${height - strokeWidth}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/></svg>`,
  );
}

async function buildPhone(screenPath, width) {
  const height = Math.round(width * (FULL_HEIGHT / FULL_WIDTH));
  const bezel = Math.max(10, Math.round(width * 0.025));
  const radius = Math.round(width * 0.15);
  const faceIdWidth = Math.round(width * 0.24);
  const faceIdHeight = Math.round(width * 0.072);
  const faceIdTop = Math.round(width * 0.05);
  const innerWidth = width - bezel * 2;
  const innerHeight = height - bezel * 2;
  const screenMask = roundedRectSvg(innerWidth, innerHeight, radius - bezel, "white");
  const screen = await sharp(screenPath)
    .resize(innerWidth, innerHeight, { fit: "cover" })
    .ensureAlpha()
    .composite([{ input: screenMask, blend: "dest-in" }])
    .png()
    .toBuffer();
  const body = roundedRectSvg(width, height, radius, "#080909", "#696d70", Math.max(4, bezel / 2));
  const faceIdBlob = roundedRectSvg(
    faceIdWidth,
    faceIdHeight,
    Math.round(faceIdHeight / 2),
    "#0a0a0a",
    "rgba(255,255,255,0.08)",
    1,
  );
  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: body, left: 0, top: 0 },
      { input: screen, left: bezel, top: bezel },
      {
        input: faceIdBlob,
        left: Math.round((width - faceIdWidth) / 2),
        top: faceIdTop,
      },
    ])
    .png()
    .toBuffer();
}

async function generateHero(theme, processedDir) {
  const suffix = theme === "dark" ? "-dark" : "";
  const [debts, people, home] = await Promise.all([
    buildPhone(path.join(processedDir, `debts${suffix}.jpeg`), 470),
    buildPhone(path.join(processedDir, `people${suffix}.jpeg`), 470),
    buildPhone(path.join(processedDir, `home${suffix}.jpeg`), 520),
  ]);
  const [left, right] = await Promise.all([
    sharp(debts)
      .rotate(-9, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer(),
    sharp(people)
      .rotate(9, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer(),
  ]);
  const leftMeta = await sharp(left).metadata();
  const rightMeta = await sharp(right).metadata();

  await sharp({
    create: {
      width: HERO_WIDTH,
      height: HERO_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: left, left: 265, top: HERO_HEIGHT - (leftMeta.height ?? 0) - 115 },
      {
        input: right,
        left: HERO_WIDTH - (rightMeta.width ?? 0) - 265,
        top: HERO_HEIGHT - (rightMeta.height ?? 0) - 115,
      },
      { input: home, left: Math.round((HERO_WIDTH - 520) / 2), top: 125 },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(processedDir, `hero${suffix}.png`));
}

async function validateImage(filePath, expected) {
  const metadata = await sharp(filePath).metadata();
  if (metadata.format !== expected.format) {
    fail(`${path.basename(filePath)} is ${metadata.format}, expected ${expected.format}.`);
  }
  if (metadata.width !== expected.width || metadata.height !== expected.height) {
    fail(
      `${path.basename(filePath)} is ${metadata.width}x${metadata.height}, expected ${expected.width}x${expected.height}.`,
    );
  }
  const { channels } = await sharp(filePath).stats();
  if (channels.every((channel) => channel.stdev < 2)) {
    fail(`${path.basename(filePath)} appears blank or single-color.`);
  }
}

async function validateAssetSet(directory) {
  await Promise.all(
    FULL_ASSETS.map(({ filename }) =>
      validateImage(path.join(directory, filename), {
        format: "jpeg",
        width: FULL_WIDTH,
        height: FULL_HEIGHT,
      }),
    ),
  );
  await Promise.all(
    ["hero.png", "hero-dark.png"].map((filename) =>
      validateImage(path.join(directory, filename), {
        format: "png",
        width: HERO_WIDTH,
        height: HERO_HEIGHT,
      }),
    ),
  );

  for (const screen of SCREENS) {
    const [light, dark] = await Promise.all([
      readFile(path.join(directory, `${screen}.jpeg`)),
      readFile(path.join(directory, `${screen}-dark.jpeg`)),
    ]);
    if (light.equals(dark)) fail(`${screen} light and dark captures are byte-identical.`);
  }
}

async function replaceAssets(processedDir) {
  await mkdir(ASSET_DIR, { recursive: true });
  for (const filename of ALL_ASSETS) {
    const temporary = path.join(ASSET_DIR, `.${filename}.next`);
    await copyFile(path.join(processedDir, filename), temporary);
    await rename(temporary, path.join(ASSET_DIR, filename));
  }
}

function changedAssets() {
  const result = spawnSync("git", ["status", "--short", "--", "website/public/screens"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return String(result.stdout).trim();
}

async function checkOnly() {
  await validateAssetSet(ASSET_DIR);
  log(`validated ${ALL_ASSETS.length} checked-in assets`);
}

async function generate() {
  await preflight();
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const runDir = path.join(ARTIFACT_ROOT, stamp);
  const rawDir = path.join(runDir, "raw");
  const processedDir = path.join(runDir, "processed");
  await mkdir(path.join(rawDir, "light"), { recursive: true });
  await mkdir(path.join(rawDir, "dark"), { recursive: true });
  await mkdir(processedDir, { recursive: true });

  const startedAt = Date.now();
  let metro;
  let simulator;
  try {
    simulator = prepareSimulator();
    if (!reuseExistingMetro) {
      metro = startMetro(path.join(runDir, "metro.log"));
      await waitForPort(METRO_PORT, 30_000);
    }
    run("npx", [
      "expo",
      "run:ios",
      "--configuration",
      "Debug",
      "--device",
      simulator.udid,
      "--no-bundler",
    ]);
    await mkdir(path.join(LOCAL_TOOL_HOME, ".maestro"), { recursive: true });
    run(maestroCommand, ["--device", simulator.udid, "test", FLOW_PATH], {
      env: {
        JAVA_TOOL_OPTIONS: `-Duser.home=${LOCAL_TOOL_HOME}`,
        MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED: "true",
        MAESTRO_CLI_NO_ANALYTICS: "1",
        MAESTRO_SCREENSHOT_DIR: rawDir,
      },
    });

    await normalizeCaptures(rawDir, processedDir);
    await Promise.all([generateHero("light", processedDir), generateHero("dark", processedDir)]);
    await validateAssetSet(processedDir);
    await replaceAssets(processedDir);
    run("npm", ["--prefix", "website", "run", "build"]);

    const changed = changedAssets();
    log(`complete in ${Math.round((Date.now() - startedAt) / 1000)}s`);
    log(`generated ${ALL_ASSETS.length} assets with ${simulator.device}, iOS ${simulator.runtime}`);
    log(changed ? `changed assets:\n${changed}` : "assets already matched the generated output");
    log(`run artifacts: ${path.relative(ROOT, runDir)}`);
  } finally {
    await stopMetro(metro);
    if (simulator?.udid) {
      spawnSync("xcrun", ["simctl", "shutdown", simulator.udid], { stdio: "ignore" });
    }
  }
}

try {
  if (process.argv.includes("--check")) {
    await checkOnly();
  } else {
    await generate();
  }
} catch (error) {
  process.stderr.write(`[screenshots] ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
