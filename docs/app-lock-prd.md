# PRD: App Lock

**Status:** Approved — implemented
**Scope:** Native iOS and Android app locking with a four-digit PIN and optional biometrics
**Positioning:** A calm privacy layer for Owed's local financial data, optimized for smooth everyday use

This document captures the product decisions agreed during the App Lock grilling session. It is the approval gate for implementation; no decision in the **Frozen product decisions** section should be changed during implementation without product sign-off.

**Related docs**

| Document                                         | Role                                       |
| ------------------------------------------------ | ------------------------------------------ |
| [design-brief.md](./design-brief.md)             | Calm, private, card-light visual direction |
| [prd.md](./prd.md)                               | Original Owed product vision               |
| [backup-restore-prd.md](./backup-restore-prd.md) | Portable backup scope and privacy model    |

**Expo version:** SDK 56. Before implementation, read the exact versioned [Expo LocalAuthentication](https://docs.expo.dev/versions/v56.0.0/sdk/local-authentication/) and [Expo SecureStore](https://docs.expo.dev/versions/v56.0.0/sdk/securestore/) documentation. Face ID must be tested in a development build because it is not supported in Expo Go.

---

## 1. Summary

App Lock prevents casual access to Owed when another person is holding or borrowing the user's already-unlocked phone.

Users enable it from Settings by creating a four-digit Owed PIN. If supported, Owed then offers optional Face ID, Touch ID, or the standard Android biometric prompt. Once enabled, Owed automatically attempts biometrics when a locked session opens and silently falls back to Owed's custom PIN keypad.

This is a privacy feature, not a hardened anti-tampering or high-assurance security system. The experience should be quick, quiet, and unmistakably part of Owed.

---

## 2. Problem

Owed contains sensitive names, balances, payment history, and reminders. The phone's device lock does not protect that information when the phone is already unlocked and temporarily handed to another person.

Users need a lightweight second boundary that:

- protects Owed without requiring an account;
- opens quickly for the owner;
- does not expose app content before authentication;
- does not trap the owner if the Owed PIN is forgotten; and
- avoids bank-like friction or aggressive security language.

---

## 3. Goals

| #   | Goal                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------ |
| G1  | Let users enable a four-digit app PIN from Settings                                                          |
| G2  | Offer optional device biometrics for faster unlock                                                           |
| G3  | Automatically request biometrics once when a new locked session opens, then silently reveal the PIN fallback |
| G4  | Re-lock on cold launch and after 30 seconds in the background                                                |
| G5  | Hide Owed's content immediately in app-switcher previews                                                     |
| G6  | Preserve the user's intended destination through locked notification and deep-link opens                     |
| G7  | Provide simple recovery through trusted phone authentication                                                 |
| G8  | Match Owed's themes, accessibility behavior, and calm visual language                                        |

---

## 4. Non-goals

- User accounts, remote authentication, or server-managed recovery
- Protection from a determined attacker with device or filesystem access
- Protection from someone who knows the phone passcode
- Alphanumeric passwords, passphrases, or configurable PIN length
- Web support
- Notification redaction
- Screenshot or screen-recording prevention while Owed is unlocked
- Encrypting the entire SQLite database
- Backing up or transferring app-lock credentials
- Per-screen locks or locks for individual debts
- A separate notification-privacy or screenshot-privacy setting

---

## 5. Frozen product decisions

| Topic                               | Decision                                                                                                                                                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Threat model**                    | Protect against casual access to an already-unlocked phone; do not overengineer for advanced attacks                                                                                                  |
| **Platforms**                       | Native iOS and Android only; no web UI or fallback                                                                                                                                                    |
| **PIN**                             | Exactly four numeric digits                                                                                                                                                                           |
| **PIN entry**                       | Owed-owned full-screen keypad with four square OTP-style cells; validate automatically on the fourth digit                                                                                            |
| **Biometric action**                | Icon only at the keypad's bottom-left; delete at bottom-right; both have accessible labels                                                                                                            |
| **Automatic biometrics**            | Attempt once when a new locked session opens; manual retries remain unlimited through the keypad icon                                                                                                 |
| **Biometric failure**               | Never show an error for a normal failure or cancellation; reveal the PIN keypad immediately                                                                                                           |
| **Normal device-passcode fallback** | Disabled; normal biometric failure returns to the Owed PIN, not the phone passcode                                                                                                                    |
| **iOS biometrics**                  | Use the biometric modality provided by iOS (Face ID or Touch ID)                                                                                                                                      |
| **Android biometrics**              | Use the standard Android biometric prompt; do not restrict it to fingerprint-only or strong-only authentication                                                                                       |
| **Unavailable biometrics**          | Quietly skip the offer/prompt; PIN remains fully usable                                                                                                                                               |
| **Cold launch**                     | Lock every cold launch when App Lock is enabled                                                                                                                                                       |
| **Background timeout**              | Lock after Owed has remained outside the foreground for 30 seconds                                                                                                                                    |
| **Short interruption**              | Returning within 30 seconds keeps the current unlocked session                                                                                                                                        |
| **App switcher**                    | Apply a neutral Owed privacy cover immediately whenever Owed leaves the foreground, independent of the 30-second grace period                                                                         |
| **Lock now**                        | Lock immediately without auto-launching biometrics; manual biometric retry stays available                                                                                                            |
| **Wrong PIN**                       | Shake PIN indicators, apply the soft error color, give error haptics, then clear; do not show persistent error copy                                                                                   |
| **Retry protection**                | After five wrong PINs, start a 30-second pause that persists across relaunches                                                                                                                        |
| **Pause interaction**               | Keep the complete keypad visible and interactive. Show `Try again in N seconds`. Four digits entered during the pause are not checked; nudge the countdown with motion/haptics, then clear the digits |
| **Forgot PIN visibility**           | Reveal `Forgot PIN?` below the keypad after the first incorrect PIN attempt in the current locked session                                                                                             |
| **Recovery**                        | Authenticate with trusted phone security (biometric or device passcode), then create a new Owed PIN                                                                                                   |
| **Recovery failure**                | Cancellation returns quietly. Explain only when phone authentication is genuinely unavailable                                                                                                         |
| **Settings changes**                | Changing the PIN, changing biometric access, or turning off App Lock requires fresh authentication using the Owed PIN or trusted phone authentication                                                 |
| **Backups**                         | App-lock state, biometric preference, PIN material, attempt count, and lockout deadline are device-local and excluded from Owed backup files                                                          |
| **Notifications**                   | Existing reminder names and amounts remain unchanged even when App Lock is enabled                                                                                                                    |
| **Deep links**                      | Authenticate first, then continue to the notification/deep-link destination                                                                                                                           |
| **Screenshots**                     | Allowed while Owed is unlocked and active                                                                                                                                                             |
| **Appearance**                      | Respect Owed's light/dark mode and selected accent color                                                                                                                                              |

---

## 6. Information architecture

### Main Settings

Add an **App Lock** row with a trailing `On` or `Off` value. The row opens a dedicated App Lock screen.

### App Lock off

The dedicated screen explains the feature briefly and offers **Turn on App Lock**.

### App Lock on

The dedicated screen contains:

- biometric preference, shown only when a supported biometric is currently available and enrolled;
- **Change PIN**;
- **Lock now**; and
- **Turn off App Lock**.

Use Owed's existing platform-appropriate settings presentation. Avoid a dense security dashboard or extra explanatory cards.

---

## 7. Setup flow

### 7.1 Enable App Lock

1. User opens Settings → App Lock.
2. User taps **Turn on App Lock**.
3. Owed presents its full-screen keypad with **Create a PIN**.
4. The fourth digit advances the same screen to **Confirm your PIN**.
5. If confirmation matches, the PIN is committed.
6. If confirmation does not match:
   - provide visual and haptic feedback;
   - clear only the confirmation attempt; and
   - keep the user on confirmation so they can retry.
7. A Back action lets the user return to **Create a PIN** if the original PIN was mistyped.
8. If usable biometrics are available, offer **Unlock faster with Face ID / Touch ID / biometrics** with a primary enable action and **Not now**.
9. Choosing biometrics performs one system authentication to confirm the preference.
10. Complete setup by returning to Settings and showing a lightweight `App lock is on` confirmation.

App Lock does not interrupt the current session after setup. It begins on the next cold launch, qualifying background timeout, or explicit **Lock now** action.

### 7.2 Abandoned setup

App Lock remains off until PIN creation and confirmation complete successfully. Never leave a partially enabled lock or save an unconfirmed PIN as active.

---

## 8. Unlock flow

### 8.1 New locked session

1. Keep the native splash visible until Owed has resolved whether App Lock is enabled and whether the current session is locked.
2. Do not render protected content visibly before that decision.
3. Present a full-screen Owed lock surface.
4. If the user enabled biometrics and they are currently usable, launch the system biometric prompt automatically once.
5. On biometric success, reveal the intended Owed destination.
6. On biometric failure, cancellation, system lockout, or unavailability, silently show the PIN state.
7. Keep the biometric icon available for user-initiated retries whenever the OS permits them.

The automatic prompt is once per locked session, not once per every `AppState` activation. This prevents repeated involuntary prompts while preserving unlimited manual biometric attempts.

### 8.2 PIN success

- Validate immediately after the fourth digit.
- Unlock without a confirm button.
- Give success haptic feedback.
- Clear failed-attempt state and any active retry deadline.
- Continue to the intended route without an intermediate Home redirect.

### 8.3 PIN failure

- Give error haptic feedback.
- Shake and briefly recolor the PIN indicators.
- Clear the four digits.
- Reveal **Forgot PIN?** after the first failed attempt.
- After the fifth consecutive failed attempt, start the 30-second retry pause.

### 8.4 Retry pause

- Keep all digits and actions visible; do not gray out, hide, or replace the keypad.
- Show `Try again in N seconds` near the PIN indicators.
- Allow digit taps so the surface continues to feel responsive.
- When four digits are entered, do not validate them. Shake the countdown, give error haptics, and clear the indicators.
- Keep manual biometrics and **Forgot PIN?** available.
- Persist the absolute retry deadline so force-closing Owed does not bypass the pause.
- When the deadline expires, clear any partial digits and accept a fresh normal attempt.

### 8.5 Lock now

**Lock now** immediately replaces protected UI with the lock screen. It deliberately suppresses the automatic biometric attempt for that lock-screen appearance, because the user may be preparing to hand the phone to someone else. The biometric icon remains available for an intentional retry.

---

## 9. Recovery and settings authentication

### 9.1 Forgot PIN

1. **Forgot PIN?** becomes available after the first wrong PIN.
2. User initiates recovery.
3. Owed asks the operating system for trusted device authentication, allowing biometrics or the device passcode.
4. Success starts the same progressive create-and-confirm PIN flow.
5. The replacement becomes active only after confirmation succeeds.
6. Cancellation returns to the lock screen without error copy.
7. True unavailability shows concise guidance that the existing Owed PIN is required.

Recovery is intentionally appropriate for the agreed casual-privacy threat model. It is not intended to protect Owed from someone who already knows the device passcode.

### 9.2 Re-authentication for changes

Even in an unlocked session, require fresh Owed PIN or trusted phone authentication before:

- changing the PIN;
- turning biometric unlock on or off; or
- turning App Lock off.

Do not require re-authentication merely to view the App Lock settings screen or use **Lock now**.

---

## 10. Lock lifecycle and privacy cover

### 10.1 Lifecycle rules

- An enabled lock starts locked after every process/cold launch.
- Record when an unlocked app leaves the foreground.
- If it becomes active in less than 30 seconds, restore the session without authentication.
- At 30 seconds or later, establish a new locked session and follow the automatic biometric flow.
- A session that was already locked remains locked regardless of background duration.
- Do not treat the system biometric prompt's own lifecycle transitions as a new session or recursively prompt.

### 10.2 App-switcher protection

Cover protected content as soon as Owed becomes inactive/backgrounded, even during the 30-second unlock grace period. The cover should:

- use the current Owed theme;
- show neutral Owed identity only;
- contain no people, amounts, activity, or route-specific content; and
- disappear only after Owed is active and its locked/unlocked state is known.

The privacy cover and authentication state are separate concerns: the cover is immediate, while re-authentication follows the 30-second rule.

---

## 11. Lock-screen experience

### 11.1 Content

Above the PIN controls, show:

- the same Owed wallet mark used during onboarding; and
- **Enter your PIN**.

Do not add a user profile, avatar, phone number, debt summary, balance, or last-opened context.

### 11.2 Keypad

- Four square OTP-style PIN cells with concealed entered digits
- Large, comfortably spaced digits in a 3 × 4 keypad rhythm
- Biometric icon at bottom-left when available
- `0` centered on the bottom row
- Delete icon at bottom-right
- No system keyboard
- No submit button
- No card-heavy framing

The screenshot supplied during discovery is behavioral inspiration only. The final surface must use Owed's spacing, typography, tokens, light/dark themes, and soft financial-utility character rather than reproducing a banking interface.

### 11.3 Haptics

- Light haptic feedback for digit and delete taps
- Success feedback when authentication completes
- Error feedback for wrong PINs and retry-pause nudges

---

## 12. Accessibility

- Each digit key has a correct accessible name and button role.
- PIN cells announce progress without reading the entered digits, for example `2 of 4 digits entered`.
- The icon-only biometric action has a modality-appropriate accessible label where known, otherwise `Unlock with biometrics`.
- Delete is announced as `Delete digit` and is disabled semantically when no digit is entered.
- Announce retry countdown state without continuously interrupting the screen reader; announce meaningful boundary changes rather than every visual tick.
- Honor Reduce Motion by removing shake animations while retaining color, haptics where enabled, and accessible announcements.
- Maintain sufficient contrast in every Owed theme and accent combination.
- Use minimum comfortable touch targets and do not rely on color alone for state.

---

## 13. Privacy and credential handling requirements

- Never store the raw PIN in AsyncStorage, SQLite, logs, analytics, crash messages, route parameters, or backup documents.
- Keep the PIN verifier and any secret material in secure device storage appropriate to SDK 56.
- Keep the enabled state and biometric preference device-local and fail safely if secure credential state is missing or inconsistent.
- Exclude all App Lock state from Owed's `.owedbackup` schema and restore pipeline.
- Restoring an Owed backup never enables App Lock on the destination device.
- Do not place sensitive content in the lock surface, privacy cover, or accessibility labels.
- Normal unlock must disable device-passcode fallback from the biometric prompt. Recovery may use trusted device authentication including the device passcode.
- Authentication failures should not include technical OS error details in user-facing copy.

---

## 14. Deep links and notifications

- A notification or deep link may establish a pending destination while Owed is locked.
- Do not reveal destination content before authentication.
- On successful authentication, continue directly to that destination.
- On unsuccessful or cancelled authentication, retain the locked screen and pending destination for the current launch.
- Existing notification titles and bodies remain unchanged; enabling App Lock does not redact scheduled or delivered notifications.

---

## 15. User-facing copy

Copy may be tuned during visual implementation while preserving meaning and tone.

| Context              | Copy                                                              |
| -------------------- | ----------------------------------------------------------------- |
| Main settings row    | App Lock                                                          |
| Setup title          | Create a PIN                                                      |
| Confirmation title   | Confirm your PIN                                                  |
| Biometric offer      | Unlock faster with Face ID / Touch ID / biometrics                |
| Lock title           | Enter your PIN                                                    |
| Retry pause          | Try again in {seconds} seconds                                    |
| Recovery action      | Forgot PIN?                                                       |
| Setup confirmation   | App lock is on                                                    |
| Unavailable recovery | Phone authentication isn't available. Enter your PIN to continue. |

Avoid language such as `access denied`, `intruder`, `breach`, or `too many suspicious attempts`.

---

## 16. Acceptance criteria

### Setup and settings

- [ ] App Lock is reachable through a dedicated Settings screen on iOS and Android.
- [ ] A user can create and confirm a four-digit PIN with the custom keypad.
- [ ] Confirmation mismatch clears only confirmation and provides a Back route to redefine the original PIN.
- [ ] App Lock is not enabled when setup is abandoned or incomplete.
- [ ] Biometrics are offered only when usable; declining them completes PIN setup normally.
- [ ] Setup returns to Settings without immediately locking the current session.
- [ ] App-lock changes require fresh Owed PIN or trusted phone authentication.
- [ ] **Lock now** locks without automatically invoking biometrics.

### Unlocking

- [ ] Every cold launch is locked when App Lock is enabled.
- [ ] Returning before 30 seconds does not request authentication.
- [ ] Returning at or after 30 seconds starts a new locked session.
- [ ] The first appearance of a normal new locked session automatically requests enabled, usable biometrics exactly once.
- [ ] Biometric failure/cancellation shows no Owed error and leaves the custom PIN keypad ready.
- [ ] Phone-passcode fallback is not offered during normal biometric unlock.
- [ ] Manual biometric retries remain available through the icon.
- [ ] Correct PIN entry unlocks immediately after digit four.
- [ ] Successful PIN or biometric authentication clears failed-attempt state.

### Failed attempts and recovery

- [ ] Wrong PIN feedback uses motion/color/haptics and clears the digits without persistent error text.
- [ ] **Forgot PIN?** appears after the first wrong attempt.
- [ ] Five consecutive wrong PINs start a 30-second retry pause.
- [ ] The keypad stays visible and interactive during the pause, but PINs are not validated.
- [ ] A four-digit entry during the pause nudges the countdown and clears.
- [ ] Force-closing and reopening Owed does not reset the retry deadline.
- [ ] Trusted phone authentication can reset a forgotten PIN.
- [ ] Cancelling recovery returns silently; true unavailability receives concise guidance.

### Privacy and navigation

- [ ] Protected app content never flashes between splash and authentication.
- [ ] App-switcher previews are covered immediately, including during the 30-second grace period.
- [ ] Notification/deep-link destinations open only after authentication and are preserved through unlock.
- [ ] Notifications retain their current names and amounts.
- [ ] Screenshots and screen recording work normally while unlocked.
- [ ] Exported and restored Owed backups contain no App Lock state or credential material.

### Design and accessibility

- [ ] Lock UI follows the active Owed light/dark theme and accent color.
- [ ] The biometric action is icon-only visually and fully labeled for assistive technology.
- [ ] Screen readers receive PIN progress without hearing entered digits.
- [ ] Reduce Motion removes shakes while preserving equivalent feedback.
- [ ] The keypad remains usable at supported text sizes and on supported phone screen sizes.

### Verification

- [ ] Test iOS Face ID in a development build, not Expo Go.
- [ ] Test iOS Touch ID where available.
- [ ] Test the standard Android biometric prompt on at least fingerprint and face-capable configurations where available.
- [ ] Test biometric unavailable, not enrolled, cancelled, failed, and OS-lockout cases.
- [ ] Test cold launch, sub-30-second resume, 30-second resume, app-switcher preview, notification open, deep link, and **Lock now**.
- [ ] Test retry-pause persistence across force-close/relaunch.
- [ ] Test backup and restore to confirm App Lock remains device-local.

---

## 17. Approval gate

Implementation begins only after product approval of this PRD.

Approval should confirm:

1. the four-digit/custom-keypad interaction;
2. biometric auto-attempt and silent PIN fallback;
3. the 30-second lifecycle policy and immediate privacy cover;
4. recovery through trusted phone authentication;
5. retry-pause behavior; and
6. the explicit non-goals.
