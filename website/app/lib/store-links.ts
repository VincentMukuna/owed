export type StoreLinkKind =
  | "appStore"
  | "testFlight"
  | "playStore"
  | "playBeta"
  | "waitlist"
  | "hidden";

export type StoreLink = {
  kind: StoreLinkKind;
  href: string;
  kicker: string;
  label: string;
  navLabel: string;
};

export type StoreLinks = {
  ios: StoreLink;
  android: StoreLink;
};

function trimUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function iosLink(storeUrl: string | null, betaUrl: string | null): StoreLink {
  if (storeUrl) {
    return {
      kind: "appStore",
      href: storeUrl,
      kicker: "Download on the",
      label: "App Store",
      navLabel: "Get on App Store",
    };
  }

  if (betaUrl) {
    return {
      kind: "testFlight",
      href: betaUrl,
      kicker: "Try the iOS beta",
      label: "TestFlight",
      navLabel: "Try iOS beta",
    };
  }

  return {
    kind: "hidden",
    href: "#",
    kicker: "",
    label: "",
    navLabel: "",
  };
}

function androidLink(storeUrl: string | null, betaUrl: string | null): StoreLink {
  if (storeUrl) {
    return {
      kind: "playStore",
      href: storeUrl,
      kicker: "Get it on",
      label: "Google Play",
      navLabel: "Get on Google Play",
    };
  }

  if (betaUrl) {
    return {
      kind: "playBeta",
      href: betaUrl,
      kicker: "Try the Android beta",
      label: "Google Play",
      navLabel: "Try Android beta",
    };
  }

  return {
    kind: "waitlist",
    href: "/android",
    kicker: "On Android?",
    label: "Join the waitlist",
    navLabel: "Android waitlist",
  };
}

const DEFAULT_IOS_BETA_URL = "https://testflight.apple.com/join/B16wcXJ5";

/** Public store / beta CTAs derived from NEXT_PUBLIC_* env vars at build time. */
export function getStoreLinks(): StoreLinks {
  return {
    ios: iosLink(
      trimUrl(process.env.NEXT_PUBLIC_IOS_STORE_URL),
      trimUrl(process.env.NEXT_PUBLIC_IOS_BETA_URL) ?? DEFAULT_IOS_BETA_URL,
    ),
    android: androidLink(
      trimUrl(process.env.NEXT_PUBLIC_ANDROID_STORE_URL),
      trimUrl(process.env.NEXT_PUBLIC_ANDROID_BETA_URL),
    ),
  };
}

export function getDownloadSectionCopy(links: StoreLinks): {
  title: string;
  body: string;
} {
  const { ios, android } = links;
  const iosReady = ios.kind !== "hidden";
  const androidStore = android.kind === "playStore" || android.kind === "playBeta";

  if (ios.kind === "appStore" && android.kind === "playStore") {
    return {
      title: "Get Owwed on your phone.",
      body: "Available on the App Store and Google Play. No account needed.",
    };
  }

  if (ios.kind === "appStore" && android.kind === "playBeta") {
    return {
      title: "Get Owwed on your phone.",
      body: "On the App Store now. Android is in open testing on Google Play.",
    };
  }

  if (ios.kind === "appStore" && android.kind === "waitlist") {
    return {
      title: "Get Owwed on iPhone.",
      body: "Available on the App Store. Android is coming; join the waitlist to get a note when it ships.",
    };
  }

  if (ios.kind === "testFlight" && android.kind === "playStore") {
    return {
      title: "Try Owwed on your phone.",
      body: "On Google Play now. The iOS beta is available through TestFlight. No account needed.",
    };
  }

  if (ios.kind === "testFlight" && android.kind === "playBeta") {
    return {
      title: "Try Owwed on your phone.",
      body: "iOS beta on TestFlight. Android open testing on Google Play. No account needed.",
    };
  }

  if (ios.kind === "testFlight" && android.kind === "waitlist") {
    return {
      title: "Try Owwed on iPhone.",
      body: "The beta is available now through TestFlight. No account needed.",
    };
  }

  if (!iosReady && androidStore) {
    return {
      title: "Try Owwed on Android.",
      body:
        android.kind === "playStore"
          ? "Available on Google Play. No account needed."
          : "Android open testing is available on Google Play. No account needed.",
    };
  }

  return {
    title: "Get Owwed.",
    body: "Leave your email on the Android waitlist and we will tell you when it is ready.",
  };
}
