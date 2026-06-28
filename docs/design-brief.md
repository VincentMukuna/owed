# Design Brief: Personal Credit Tracker MVP

## Product Context

Design a clean, modern mobile app for tracking informal personal debts.

The app helps users remember:

* Who owes them money
* How much they owe
* When they promised to pay
* What the money was for
* Whether they have partially or fully paid

This is not a debt collection app, lending app, loan shark tool, or formal finance product. It should feel like a private memory assistant for personal money promises.

The emotional goal is calm clarity.

The user should feel:
“I have this handled. I don’t need to keep thinking about it.”

## Product Name Placeholder

Use a neutral placeholder name for now:

**Owed**

Alternative names to explore visually:

* Tally
* Promise
* OweMe
* Settled
* Due

Do not make the branding too playful or too aggressive.

## Design Direction

Style:

* Clean
* Modern
* Calm
* Premium but simple
* Mobile-first
* Soft financial utility
* Not corporate banking
* Not dark fintech bro
* Not debt collection

Visual inspiration:

* Linear-level cleanliness
* Apple Wallet simplicity
* Modern finance apps
* Calm habit trackers
* Minimal SaaS dashboards
* Premium ledger rows layered directly on the page
* Soft carded surfaces only where containment adds clarity

The app should look trustworthy, private, and easy to use.

## Current UI Philosophy

The latest direction is **card-light, not card-first**.

Default to layouts that feel like information is layered directly onto the app background: ledger rows, section bands, thin dividers, and careful spacing. Cards should be used sparingly and intentionally, not as the default answer for every list, form, or section.

Use cards when they create a real mental container:

* Hero/overview summaries that need to feel like a distinct object
* Dashboard stat summaries where large values need stable space
* Copyable follow-up message content
* Input bodies, with labels kept outside the card
* Modals, bottom sheets, and genuinely framed tools

Avoid cards when the content is naturally a list:

* Debt rows
* People rows
* Activity rows
* Person detail metadata
* Payment history rows
* Repeated section content where dividers are enough

Rows should feel premium and calm:

* Use a two-column ledger rhythm: person/context on the left, amount/date/status on the right
* Keep names and amounts medium-weight unless hierarchy truly requires more emphasis
* Prefer subtle separators over floating containers
* Keep row padding balanced; avoid asymmetric top-heavy spacing
* Use avatars/initials as anchors, not decorative badges everywhere

Status treatment:

* Do not default to large status pills in list rows
* When the section heading already communicates status, hide redundant row status cues
* When a status cue is needed, place it near the amount/date column rather than beside the name
* Use compact dot + label treatment for status, especially for partial/overdue/due soon states

Forms:

* Labels should remain flush on the background as persistent section labels
* Only the actual input/control body should be carded
* Avoid underlined inputs when the form needs more structure
* Keep carded input bodies quiet: subtle border, small radius, tiny/no shadow, no chunky nested cards

Light and dark mode:

* Light mode should feel warm, legible, and lightly elevated
* Dark mode can keep slightly stronger separation, but should not become heavy fintech
* Muted labels must remain readable when placed directly on the background

## Target User

Young working adults, freelancers, students, and small earners who lend or front money casually to friends, family, coworkers, or partners.

They are not using formal accounting software. They just need a private place to remember informal money promises.

## UX Principles

### 1. Calm, not aggressive

Avoid language like:

* Collect
* Chase
* Debtor
* Debt collection
* Bad payer
* Demand
* Default

Prefer language like:

* Track
* Remember
* Follow up
* Promised
* Owed
* Due
* Paid
* Settled

### 2. Fast entry

Adding a new debt should feel as quick as creating a note.

The primary flow should be:
Person → Amount → Due date → Note → Save

### 3. Private by default

The app should not imply that the other person is being notified automatically.

Follow-up messages should be copyable templates, not automatic sending.

### 4. Financial clarity

The user should quickly see:

* Total amount owed
* What is overdue
* What is due soon
* What has been paid

### 5. Human tone

The app should feel socially aware. Many users feel awkward asking friends/family to repay. The UI should reduce that emotional friction.

## Color Direction

Use a calm, trustworthy palette.

Recommended direction:

* Background: warm off-white or very light neutral
* Cards: white or slightly elevated neutral
* Primary color: deep green, muted blue, or soft indigo
* Success: green
* Warning/due soon: amber
* Overdue: soft red, not harsh red
* Text: near-black, not pure black
* Secondary text: muted gray

Avoid:

* Neon colors
* Aggressive red-heavy design
* Loud finance gradients
* Dark-only UI
* Overly playful pastel UI

Light mode first.

Optional dark mode can be considered later, but MVP should prioritize a polished light mode.

## Typography

Use a modern, highly readable sans-serif.

The hierarchy should feel premium:

* Large number-focused hero text for total owed
* Clear section labels
* Compact metadata
* Friendly labels
* Good spacing

Amount values should be visually prominent but not overwhelming.

Use currency formatting like:
KES 3,000
KES 12,500
KES 850

## Navigation

Use a simple bottom tab navigation with 3–4 tabs.

Recommended tabs:

1. Home
2. Debts
3. Activity
4. Settings

Alternatively:

1. Home
2. People
3. Activity
4. Settings

Primary action:
A floating or prominent “Add” button should be available from Home and Debts.

## Core Screens to Design

### 1. Onboarding Screen

Goal:
Explain the product quickly and get the user to add their first debt.

Content:
Headline:
“Never forget who owes you.”

Subtext:
“Track amounts, promised dates, notes, and payments in one private place.”

Primary CTA:
“Add first debt”

Secondary CTA:
“Explore app” or “Skip”

Visual:
A simple card mockup showing:

* Brian owes KES 3,000
* Due Friday
* Status: Due soon

Tone:
Calm, clear, modern.

### 2. Empty Home State

This is what the user sees before adding anything.

Show:

* Friendly illustration or simple empty card
* Clear explanation
* CTA

Copy:
“No money tracked yet.”
“Add the first amount someone owes you and we’ll help you remember the details.”

CTA:
“Add debt”

### 3. Home / Dashboard

This is the main screen.

Purpose:
Give the user immediate financial clarity.

Top section:

* Greeting or simple title: “Home”
* Optional subtitle: “Here’s what you’re owed”

Hero card:

* Total owed
* Example: KES 14,500
* Supporting text: “Across 4 active promises”

Small summary cards:

* Active: 4
* Overdue: 1
* Due soon: 2
* Paid this month: KES 5,000

Sections:

1. Due soon
2. Overdue
3. Recent activity

Primary CTA:
“Add debt”

Design notes:

* Make the total owed card feel calm, not alarming.
* Overdue should be visible but not panic-inducing.
* Keep dashboard stat summaries as compact cards; large numbers need stable containment.
* Do not force the debt sections into cards. Use section headings plus ledger rows on the background.
* Avoid clutter.

### 4. Debt List Screen

Purpose:
Show all tracked debts.

Header:
“Debts”

Tabs / filters:

* Active
* Overdue
* Paid
* All

Sort priority:

* All tab: sort by due date
* Overdue tab: overdue debts only
* Due soon/Home section: due-soon debts only
* Paid tab: paid debts only

Debt row content:

* Person name
* Amount remaining
* Due date
* Compact status cue only when needed
* Note preview
* Optional progress indicator if partially paid

Example row:
Brian Mwangi
KES 3,000
Due Friday
“Transport + drinks”
Status: Due soon

Status cues:

* Active
* Due soon
* Overdue
* Partially paid
* Paid

Interaction:
Tapping a row opens debt detail.

Design notes:

* Prefer rows with thin separators over individual debt cards.
* Use cards only for alternate experiments or non-list contexts.
* Hide redundant row status cues when the section label already says Due soon, Overdue, or Active.
* If status is shown, keep it near the amount/date column.
* In the All tab, sort by due date. Users can open the Overdue tab when they specifically want overdue first.

### 5. Add Debt Screen

Purpose:
Quickly record a new amount owed.

The screen should feel simple and low-friction.

Fields:

1. Person name
2. Amount
3. Due/promised date
4. Reason/note
5. Reminder toggle
6. Reminder time, shown only if reminder is enabled

Primary CTA:
“Save debt”

Field behavior:

* Amount input should be large and easy to type.
* Default currency: KES
* Due date should have quick chips:

  * Today
  * Tomorrow
  * Friday
  * Next week
  * Pick date

Reason/note placeholder:
“e.g. Lunch, rent help, transport, emergency”

Reminder copy:
“Remind me on the promised date”

Design notes:
This should be one of the most polished screens. The whole app depends on fast entry.

Form layout notes:

* Keep labels flush on the page background.
* Card only the input/control body beneath each label.
* Avoid underlined inputs for primary forms.
* Keep spacing generous enough that the form breathes, but preserve fast entry.

### 6. Debt Detail Screen

Purpose:
Give the full context and actions for one debt.

Header:
Person name + status

Top overview card:

* Amount remaining
* Original amount
* Due date
* Status

Example:
KES 2,000 remaining
Original: KES 3,000
Due: Friday, 28 June
Partially paid

Sections:

1. Note/context
2. Payment history
3. Reminder
4. Follow-up message

Design notes:

* The overview should remain a card; it is the screen's main summary object.
* Detail sections below the overview should mostly be divider-based, not carded.
* Always show the progress bar for active/partial debts, even at 0%, so the summary layout is stable.
* The follow-up message text/action should sit inside a subtle message card, without a trailing bottom separator.

Actions:

* Add payment
* Mark as paid
* Copy reminder message
* Edit
* Archive/delete

Payment history:
Show as a simple timeline.

Example:
KES 1,000 paid
Yesterday, 6:20 PM
“M-Pesa partial”

Follow-up message section:
Show a generated/copyable message:
“Hey Brian, just a reminder about the KES 2,000 you said you’d send on Friday.”

CTA:
“Copy message”

Do not include automatic sending in MVP.

### 7. Add Payment Modal / Screen

Purpose:
Record a full or partial payment.

Fields:

* Amount paid
* Date paid
* Optional note

CTA:
“Save payment”

Secondary action:
“Mark full remaining amount”

Design:
This can be a bottom sheet modal.

After saving:
Show confirmation:
“Payment recorded.”

If amount equals remaining balance:
Show:
“Debt marked as paid.”

### 8. People Screens

Purpose:
Let users understand money owed by person, not only by individual debt.

Design notes:

* People lists should use the same ledger-row language as debt lists.
* Keep the person overview summary as a card when it aggregates totals.
* Person detail metadata should be divider-based, not a card.
* Active and settled debt sections within a person detail should reuse ledger rows.
* Avoid nested cards inside person detail; section labels and separators should do most of the grouping.

### 9. Paid / Settled State

A paid debt should feel satisfying.

Debt row:

* Status: Paid
* Amount: KES 0 remaining
* Original amount visible
* Paid date visible

Detail page:
Show a subtle success state:
“Settled”
“Brian has fully paid this amount.”

Avoid over-celebrating. Keep it mature.

### 10. Activity Screen

Purpose:
Show a chronological record of payments, added debts, and status changes.

Activity examples:

* Brian paid KES 1,000
* You added KES 3,000 owed by Brian
* Grace’s KES 2,500 is now overdue
* Kevin’s debt was marked as paid

Design:
Simple timeline/list.

### 11. Settings Screen

MVP settings:

* Default currency: KES
* Default reminder time
* Notification permission status
* Local privacy lock placeholder
* Export data placeholder
* About

Design:
Minimal and functional.

## Components Needed

Design reusable components for:

* App header
* Bottom navigation
* Primary button
* Secondary button
* Icon button
* Amount display
* Summary stat card
* Ledger debt row
* Ledger person row
* Compact status cue
* Status pill only for headers/detail summaries
* Empty state
* Text input
* Amount input
* Carded input body
* Date picker row
* Quick date chips
* Toggle row
* Bottom sheet
* Payment history item
* Activity item
* Copyable message card
* Confirmation toast/snackbar

## Status Visual Language

### Active

Neutral or blue/gray tone.

### Due Soon

Amber/yellow tone.

### Overdue

Soft red tone.

### Paid

Green tone.

### Partially Paid

Indigo or muted blue tone.

Keep colors subtle and accessible.

## Microinteractions

Use subtle, polished interactions.

Important moments:

* Add debt success
* Mark as paid
* Copy follow-up message
* Toggle reminder
* Switch between filters
* Empty state to first debt
* Payment recorded

Animation style:

* Fast
* Smooth
* Subtle
* No bouncy gimmicks
* No excessive motion

Examples:

* Row enters with slight fade/slide
* Button press has subtle scale/opacity
* Status cue updates smoothly
* Bottom sheet slides naturally
* Success toast fades in/out

## Example Sample Data for Mockups

Use realistic Kenyan/local examples.

People:

* Brian Mwangi
* Grace Wanjiku
* Kevin Otieno
* Anita Njeri

Debts:

1. Brian Mwangi

   * KES 3,000
   * Due Friday
   * Reason: Transport + drinks
   * Status: Due soon

2. Grace Wanjiku

   * KES 2,500
   * Due yesterday
   * Reason: Emergency cash
   * Status: Overdue

3. Kevin Otieno

   * KES 5,000 original
   * KES 2,000 remaining
   * Reason: Rent support
   * Status: Partially paid

4. Anita Njeri

   * KES 4,000
   * Due next week
   * Reason: Event tickets
   * Status: Active

5. Mark paid example:

   * David paid KES 1,500
   * Status: Paid

## Important UX Copy

Use clear, warm copy.

Examples:

Onboarding:
“Track who owes you, how much, and when they promised to pay.”

Empty state:
“No money tracked yet.”
“Add your first promise and we’ll help you remember the details.”

Reminder:
“Brian promised to pay KES 3,000 today.”

Follow-up:
“Hey Brian, just a reminder about the KES 3,000 you said you’d send today.”

Overdue:
“Due yesterday”
“3 days overdue”

Paid:
“Settled”
“Fully paid”

Avoid:
“Debt collector”
“Bad payer”
“Chase payment”
“Demand money”
“Defaulted”
“Blacklist”

## Layout Requirements

Design for mobile first.

Target:

* iPhone 13/14/15 dimensions
* Also responsive to small Android screens

Use safe areas properly.

Ensure:

* Thumb-friendly buttons
* Good spacing
* Large tappable rows
* Amount input is easy to use
* Bottom CTA remains accessible
* No cramped finance dashboard feel

## Accessibility Requirements

* Text must have strong contrast
* Status should not rely only on color
* Buttons must be clearly tappable
* Input labels should be persistent or clear
* Amounts and dates should be readable
* Motion should be subtle

## Deliverables

Create high-fidelity mobile screens for:

1. Onboarding
2. Empty Home
3. Home Dashboard
4. Debt List - Active
5. Debt List - Overdue
6. Add Debt
7. Debt Detail - Active
8. Debt Detail - Partially Paid
9. Add Payment Modal
10. Paid Debt Detail
11. Activity
12. Settings

Also provide:

* Component system
* Color palette
* Typography scale
* Spacing scale
* Status cue variants
* Card usage rules
* Button/input states
* Empty states
* Toast/snackbar examples

## Overall Design Goal

The final design should make the app feel like a calm personal money memory tool.

It should be simple enough to use every day, polished enough to feel trustworthy, and clear enough that the user always knows:

* Who owes them
* How much remains
* When it is due
* What action they can take next
