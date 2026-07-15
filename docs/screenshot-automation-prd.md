# PRD: Local Website Screenshot Automation

**Status:** Draft — ready for implementation planning
**Baseline:** Expo SDK 56, Expo Router, native iOS project, Next.js marketing website
**Scope of this doc:** A deterministic, local-only Maestro workflow that refreshes Owed's website screenshots from the current app source. This document does **not** authorize cloud CI, EAS Simulator, App Store screenshot automation, or production-only test hooks.

**Related docs**

| Document                                                                               | Role                                                     |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [prd.md](./prd.md)                                                                     | Product vision and tone                                  |
| [design-brief.md](./design-brief.md)                                                   | Visual language the generated assets must preserve       |
| [performance.md](./performance.md)                                                     | Required list/data patterns used by the captured screens |
| [Expo Router navigation](https://docs.expo.dev/router/basics/navigation/)              | Route and deep-link behavior                             |
| [Expo E2E tests with Maestro](https://docs.expo.dev/eas/workflows/examples/e2e-tests/) | Official Expo example of local Maestro flows             |

---

## 1. Summary

Owed's app UI is still changing. Each relevant screen change currently requires manually navigating the iOS app, loading representative data, switching themes, taking screenshots, copying them into the website, and rebuilding the two hero composites.

This feature introduces a single local command that launches Owed on a dedicated iOS Simulator, prepares deterministic screenshot data, captures the required light and dark screens with Maestro, regenerates the hero composites, validates the resulting files, and replaces the website assets only after the complete run succeeds.

The intended operator experience is:

```sh
npm run screenshots
```

The output remains reviewable source-controlled website assets. The command does not commit, stage, push, deploy, or publish anything.

---

## 2. Problem

The current workflow is slow and inconsistent:

- Navigation, data setup, theme switching, and file copying are manual.
- Screens can be captured with different device state, status-bar values, dates, locale, or scroll position.
- A developer can forget a light/dark variant or update a full-screen asset without updating the hero.
- The current full-screen assets do not consistently match their extensions: `reminders.jpeg` contains PNG data.
- A failed or interrupted manual refresh can leave the website with a mixture of old and new screens.
- There is no repeatable command another contributor can run after changing the UI.

---

## 3. Goals

| #   | Goal                                                                                       |
| --- | ------------------------------------------------------------------------------------------ |
| G1  | Refresh every required website screenshot with one local command                           |
| G2  | Produce deterministic output from fixed data, time, locale, device, theme, and route state |
| G3  | Capture the real native app, including native navigation and tab UI                        |
| G4  | Generate both light and dark assets in the filenames already consumed by the website       |
| G5  | Regenerate hero images from the newly captured screens in the same run                     |
| G6  | Fail safely without partially replacing checked-in assets                                  |
| G7  | Keep screenshot-only data mutation inaccessible in production builds                       |
| G8  | Make failures understandable and the workflow maintainable by a single developer           |

---

## 4. Non-goals (v1)

- GitHub Actions, EAS Workflows, EAS Simulator, Maestro Cloud, or any other hosted execution.
- Automatic commits, pull requests, pushes, website deployments, or App Store uploads.
- Android screenshots.
- Multiple iPhone sizes, iPad layouts, localization matrices, or App Store screenshot framing.
- Pixel-diff approval or visual regression testing. The workflow may report changed files, but image approval remains human.
- Replacing product tests with screenshot automation.
- Capturing every app route. Only assets currently used by the marketing website are in scope.
- Redesigning the marketing website or changing its public copy.
- Using a physical device or modifying a developer's real Owed data.

---

## 5. Frozen product decisions

| Topic                     | Decision                                                                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Execution environment** | Local macOS + Xcode iOS Simulator + local Maestro CLI                                                                                     |
| **Primary command**       | `npm run screenshots` from the repository root                                                                                            |
| **App build**             | Development-only simulator build from the current source; never a stale production artifact                                               |
| **Device isolation**      | Use a named, dedicated screenshot simulator or a freshly erased disposable simulator; never a physical device                             |
| **Fixture**               | Reuse the realistic screenshot dataset as the product baseline, but make it deterministic and directly invokable by screenshot automation |
| **Navigation**            | Open stable Expo Router paths/deep links instead of relying on tab coordinates                                                            |
| **Theme**                 | Force explicit `light` and `dark`; never use `auto` for captured assets                                                                   |
| **Output replacement**    | Capture and process in a temporary staging directory; replace website assets only when every validation passes                            |
| **Source control**        | Leave generated changes unstaged for human review                                                                                         |
| **Failure behavior**      | Non-zero exit, clear failed stage, preserve the previously valid website assets                                                           |
| **Production safety**     | Screenshot bootstrap is development-only and must be inert or unreachable in production                                                   |

Changing a frozen decision requires updating this PRD before implementation changes diverge from it.

---

## 6. Asset contract

The pipeline owns these existing files:

| Screen         | Light                                   | Dark                                         | Source route                         |
| -------------- | --------------------------------------- | -------------------------------------------- | ------------------------------------ |
| Home           | `website/public/screens/home.jpeg`      | `website/public/screens/home-dark.jpeg`      | `/(tabs)/home`                       |
| Debts          | `website/public/screens/debts.jpeg`     | `website/public/screens/debts-dark.jpeg`     | `/(tabs)/debts`                      |
| People         | `website/public/screens/people.jpeg`    | `website/public/screens/people-dark.jpeg`    | `/(tabs)/people`                     |
| Notifications  | `website/public/screens/reminders.jpeg` | `website/public/screens/reminders-dark.jpeg` | Home bell → `/notifications`         |
| Hero composite | `website/public/screens/hero.png`       | `website/public/screens/hero-dark.png`       | Derived from Home, Debts, and People |

### 6.1 Full-screen output

- All eight full-screen files are actual JPEG data with the `.jpeg` extension.
- Default dimensions remain `1125 × 2436` so this feature does not change the website's current layout contract.
- Captures use a fixed portrait simulator device and OS runtime selected in configuration.
- Raw simulator captures may be normalized to the output dimensions through deterministic crop/resize processing.
- Normalization must preserve aspect ratio. Any crop must be symmetric and must not remove app content, the status bar, or the tab bar.
- JPEG quality is fixed in configuration and identical across runs.
- No EXIF capture timestamp or other volatile metadata is retained.

### 6.2 Hero output

- Both hero files remain `1920 × 1440` PNGs.
- Each hero is regenerated from the same run's Home, Debts, and People captures.
- Phone frames, Face ID pills, transforms, z-order, shadows, masks, and crop coordinates are version-controlled inputs.
- The hero generator must not depend on a GUI image editor or manual dragging.
- Light captures generate `hero.png`; dark captures generate `hero-dark.png`.
- A hero is never regenerated from a mixture of staged and previously checked-in captures.

### 6.3 Ownership boundary

Only the ten files listed above may be replaced. The command must not modify website source, app source, unrelated assets, or user-authored files unless implementation explicitly requires a generated manifest described by this PRD.

---

## 7. Deterministic screenshot state

Screenshots must represent a stable product fixture rather than incidental simulator state.

### 7.1 Fixture requirements

The automation bootstrap must:

1. Reset the app database inside the dedicated simulator.
2. Load the realistic screenshot dataset.
3. Use a fixed Faker seed or explicit records.
4. Use a versioned reference date/time rather than the wall clock for relative due dates, activities, greetings, and summaries that affect the captures.
5. Set the default currency and fixture currency to USD, matching the existing marketing images.
6. Mark onboarding complete.
7. Disable app lock and other gates that can obscure target screens.
8. Avoid scheduling real notifications as a side effect.
9. Clear search, filters, temporary UI state, modals, sheets, and toasts before capture.
10. Invalidate/reload queries through the app's normal mutation boundary so every target screen observes the new fixture.
11. Suppress development warning chrome while the screenshot bootstrap is active.

The existing Settings → Developer → **Load screenshot dataset** behavior remains available for humans. Automation must call the same domain-level fixture logic without navigating through Settings or accepting native confirmation alerts.

### 7.2 Device state requirements

The runner must control or verify:

- Portrait orientation.
- Fixed simulator device type and iOS runtime.
- Fixed locale and calendar.
- Fixed timezone.
- Fixed light/dark appearance for each pass.
- Stable status bar values where `simctl` supports overrides.
- No software keyboard, permission prompt, notification banner, debug menu, or Metro error overlay.
- Reduced or completed animations before capture.
- Target screen at its initial scroll position.

The selected device, runtime policy, locale, timezone, reference clock, and output encoding settings live in one version-controlled configuration source rather than being repeated across shell and Maestro files.

---

## 8. Development-only automation entry point

The app needs a stable way for Maestro to request setup without tapping through fragile developer menus.

### 8.1 Required behavior

- Available only in a development simulator build.
- Accepts a requested theme and target screen from a tightly validated allowlist.
- Runs the deterministic bootstrap exactly once per screenshot run unless explicitly reset.
- Navigates to the requested route after data and settings are ready.
- Exposes a visible/accessibility readiness marker that Maestro can wait for.
- Rejects unknown themes, screens, or commands without mutating data.
- Cannot be used to seed, clear, or alter data in a production build.

The likely interface is an `owed://` development deep link because Expo Router already supports route-based deep linking. The implementation may use another stable local mechanism if it satisfies the same safety and observability requirements.

### 8.2 Readiness contract

Time-based sleeps are not sufficient as the primary synchronization mechanism. Each target capture must wait for a screen-specific assertion, such as:

- Home: summary heading and populated summary value visible.
- Debts: title and a known fixture debt visible.
- People: title and a known fixture person visible.
- Reminders: title and the expected settings/summary content visible.

A small bounded settling delay may follow the assertion to allow native tab animations, list layout, and image decoding to finish.

---

## 9. Maestro flow

### 9.1 Logical sequence

```text
preflight
  → prepare dedicated simulator
  → build/install current development app
  → bootstrap deterministic fixture
  → capture light routes
  → capture dark routes
  → validate raw captures
  → normalize full-screen images
  → generate light/dark heroes
  → validate complete staged asset set
  → atomically replace website assets
  → build website
  → print changed assets and summary
```

### 9.2 Flow organization

- Shared setup and capture behavior is defined once and reused.
- Screen names, routes, readiness assertions, and output filenames are explicit and reviewable.
- Maestro selectors prefer accessibility text/IDs over coordinates.
- Coordinates are permitted only for simulator/device operations that lack a stable semantic selector and must be documented.
- Each capture asserts the target route's content before writing an image.
- Screens are captured serially in v1 to minimize native simulator and database state flakiness.

### 9.3 Build reuse

The command may reuse an installed development build only when it can prove the native build matches the current native dependency/config fingerprint. Otherwise it rebuilds and installs.

JavaScript/TypeScript UI changes must always be sourced from the current working tree. A stale installed release or preview build is never an acceptable capture source.

---

## 10. Commands and operator experience

### 10.1 Required commands

| Command                     | Purpose                                                         |
| --------------------------- | --------------------------------------------------------------- |
| `npm run screenshots`       | Full build/setup/capture/generate/validate/replace workflow     |
| `npm run screenshots:check` | Validate the checked-in asset set without launching a simulator |

Implementation may add lower-level debugging commands, but they are not part of the stable product interface.

### 10.2 Preflight

Before changing any asset, the runner checks:

- macOS host.
- Xcode command-line tools and `simctl` availability.
- A supported iOS Simulator runtime/device, or the ability to create the configured device.
- Node and repository dependencies.
- Maestro availability and compatible version.
- Required static hero template assets/configuration.
- No conflicting simulator operation owned by this screenshot runner.

Missing prerequisites produce actionable instructions. The command must not silently download large tools, alter global configuration, or start cloud services.

### 10.3 Completion summary

A successful run prints:

- Device/runtime used.
- App build reused or rebuilt.
- Captured and generated filenames.
- Dimensions and encoded formats.
- Total duration.
- Which assets differ from Git.
- Reminder that files are unstaged and require visual review.

---

## 11. Validation and failure safety

### 11.1 Staged validation

Before replacing checked-in assets, verify:

- Exactly ten expected files exist; no expected file is missing.
- Full-screen images decode as JPEG and are `1125 × 2436`.
- Hero images decode as PNG and are `1920 × 1440`.
- No file is empty or below a conservative minimum byte size.
- Light and dark versions are not byte-identical.
- Each image has non-trivial color/variance and is not a blank launch screen, error overlay, or single-color frame.
- Hero generation consumed only the current staged captures.

### 11.2 Atomic replacement

- Work is written outside `website/public/screens/` first.
- The previous valid asset set remains intact until all capture and image validation succeeds.
- Replacement covers the complete owned set, not individual files as they arrive.
- If website build validation fails after replacement, the command exits non-zero and clearly reports that generated assets are present for inspection. It must not use destructive Git commands to restore them.
- Temporary simulator/capture resources are cleaned up on success, failure, or interruption where practical.

### 11.3 Repository safety

- Existing unrelated working-tree changes are preserved.
- The runner never calls `git add`, `git commit`, `git reset`, `git checkout`, `git clean`, `git push`, or deployment commands.
- The runner does not require a clean working tree, but it warns if any of the ten owned assets already contain uncommitted changes because a successful run will replace them.

---

## 12. Acceptance criteria

### 12.1 Happy path

- [ ] From the repository root on a supported Mac, `npm run screenshots` completes without manual taps.
- [ ] The run captures Home, Debts, People, and Reminders in light and dark modes.
- [ ] The run generates both hero composites from that run's captures.
- [ ] All filenames match the current website imports; no website source edit is required after generation.
- [ ] Full-screen outputs are valid `1125 × 2436` JPEGs.
- [ ] Hero outputs are valid `1920 × 1440` PNGs.
- [ ] `npm run screenshots:check` passes on the generated set.
- [ ] The website production build passes.
- [ ] Generated changes remain unstaged.

### 12.2 Determinism

- [ ] Two consecutive runs from the same commit, dependency state, configured simulator runtime, and screenshot configuration produce byte-identical files.
- [ ] Captures do not vary with host date, current time, host locale, host timezone, or pre-existing simulator app data.
- [ ] The screenshot fixture includes populated, representative content on every target screen.
- [ ] Every capture begins at a known route and scroll position.

### 12.3 Safety and recovery

- [ ] Killing the command during capture leaves the previously checked-in website asset set complete and usable.
- [ ] A missing readiness assertion fails the run instead of capturing the wrong screen.
- [ ] Onboarding is dismissed when present, and no capture is written while onboarding remains visible.
- [ ] A React Native development warning banner fails the capture instead of appearing in a website asset.
- [ ] A failed hero generation does not replace full-screen website assets.
- [ ] Production builds cannot invoke screenshot reset/seed behavior.
- [ ] No physical device data, developer production data, or unrelated working-tree file is changed.

### 12.4 Visual review

- [ ] Home, Debts, People, and Reminders match the current app UI in both themes.
- [ ] Status bar, native tab bar, safe areas, typography, and system appearance are coherent.
- [ ] No toasts, alerts, loading states, debug overlays, permission prompts, keyboards, or transient animations appear.
- [ ] Both heroes have correct phone order, framing, shadows, overlap, and theme.
- [ ] The website renders all assets without layout shift, stretching, or broken paths.

---

## 13. Testing strategy

| Layer                  | Coverage                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| Fixture unit tests     | Same records for fixed seed/reference clock; correct USD setting; expected screen states exist      |
| Bootstrap unit tests   | Development gate, input allowlist, theme/route handling, failure behavior                           |
| Image validation tests | Extension/codec match, dimensions, complete manifest, light/dark distinction, blank-image rejection |
| Hero generator tests   | Fixed output size, deterministic composition, missing input failure                                 |
| Maestro smoke flow     | Development app launches, bootstrap succeeds, every readiness assertion passes                      |
| End-to-end local run   | All ten assets generated and website build succeeds                                                 |

Generated screenshot binaries are reviewed visually rather than stored as a second set of test snapshots.

---

## 14. Implementation phases

| Phase                           | Deliverable                                                                                             | Exit condition                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **1 — Deterministic app state** | Screenshot configuration, fixed fixture clock/seed, development-only bootstrap, readiness markers       | Maestro can open each target route with stable populated data in either theme |
| **2 — Native capture**          | Preflight, dedicated simulator lifecycle, build/install logic, Maestro capture flows, staging directory | Eight staged full-screen captures pass route and image validation             |
| **3 — Asset processing**        | JPEG normalization, metadata stripping, deterministic hero generator, complete manifest validation      | Ten staged assets satisfy the asset contract and repeat runs are identical    |
| **4 — Operator workflow**       | Root npm scripts, atomic replacement, website build verification, concise run summary, documentation    | Acceptance criteria pass from a fresh supported local environment             |

Implementation should land in phase-sized commits or reviewable changes. Cloud execution remains a separate future decision after the local command proves stable.

---

## 15. Risks and mitigations

| Risk                                                         | Impact                        | Mitigation                                                                        |
| ------------------------------------------------------------ | ----------------------------- | --------------------------------------------------------------------------------- |
| Native UI or accessibility labels change                     | Maestro cannot find a screen  | Use intentional stable readiness IDs/text and fail before capture                 |
| Simulator runtime updates alter native chrome                | Non-deterministic pixels      | Pin/configure device and runtime policy; report exact runtime used                |
| Current source is served by stale Metro/build state          | Old UI captured               | Fresh controlled Metro session and native fingerprint check                       |
| Relative dates/greeting use wall clock                       | Output changes daily          | Versioned screenshot clock used by fixture and affected view derivations          |
| Toast or animation overlaps capture                          | Bad marketing asset           | Clear transient UI, semantic wait, then bounded settle                            |
| Partial generation replaces valid assets                     | Broken website                | Stage and validate the complete ten-file set before replacement                   |
| Screenshot deep link ships with destructive behavior         | Production data risk          | Development-only gate plus strict command allowlist and production tests          |
| Hero composition depends on unavailable proprietary template | Workflow cannot be reproduced | Store all required frame/mask/config assets in the repo with compatible licensing |
| Raw screenshot dimensions differ by simulator                | Stretching or layout drift    | Fixed device and deterministic aspect-preserving normalization                    |

---

## 16. Future extensions

Explicitly deferred until the local v1 is reliable:

- A manually dispatched GitHub Actions workflow that opens a screenshot-update PR.
- EAS Workflows + Maestro for hosted execution.
- Visual diff reports with configurable thresholds.
- Android, tablet, localization, and multiple-device matrices.
- App Store-specific framed screenshots and localized captions.
- Automatically triggering screenshot review when target screen files change.

These extensions must reuse the deterministic fixture and asset manifest rather than introduce a second screenshot source of truth.
