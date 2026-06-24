# PRD: Personal Credit Tracker MVP v1

## 1. Product Summary

A mobile-first personal credit tracker that helps users remember who owes them money, how much they owe, when they promised to pay, and the context behind the debt.

The product is not a formal lending platform or debt collection app. It is a private memory and follow-up tool for informal personal debts.

## 2. Problem

People often lend money casually to friends, family, coworkers, partners, or acquaintances. These debts are usually agreed through conversation, WhatsApp, M-Pesa, or verbal promises.

The user later forgets:

* The exact amount owed
* When the person promised to pay
* Whether part of the debt was paid
* The original reason/context
* Whether they already followed up

This creates stress, awkwardness, resentment, and financial loss.

## 3. Target User

Primary user:

* Young working adults, freelancers, students, and small earners who frequently lend or front money informally.
* Users who use M-Pesa/WhatsApp socially but do not want formal accounting software.

Example user:
"I lent someone KES 3,000 and they said they'd pay on Friday. I don't want to keep thinking about it or scrolling through chats to remember."

## 4. Product Goal

Help users privately track informal money owed to them so they can stay clear, calm, and organized.

## 5. MVP Objective

Build a simple mobile-first app where a user can:

1. Add someone who owes them money
2. Record the amount owed
3. Add the promised repayment date
4. Add notes/context
5. Track partial/full payments
6. Receive reminders
7. See a clear summary of what they are owed

## 6. Success Criteria

The MVP is successful if a user can:

* Add a debt in under 30 seconds
* Quickly see total amount owed
* Know who is overdue
* Track partial payments without confusion
* Receive a useful reminder on the promised repayment date
* Stop relying on memory or WhatsApp scrolling

## 7. Core User Stories

### Add a Debt

As a user, I want to record that someone owes me money so that I do not forget the amount and context.

Required fields:

* Person name
* Amount owed
* Due/promised date
* Note/reason

Optional fields:

* Phone number
* Original date lent
* Category/reason
* Reminder time

### View Dashboard

As a user, I want to see a quick overview of all debts so I know my current position.

Dashboard should show:

* Total amount owed
* Number of active debts
* Overdue debts
* Debts due soon
* Recently paid debts

### View Debt List

As a user, I want to view all active debts in one place.

Each debt card should show:

* Person name
* Amount remaining
* Due date
* Status: active, due soon, overdue, paid
* Short note/reason

Sorting:

* Overdue first
* Due soon next
* Newest after that

Filters:

* Active
* Overdue
* Paid

### View Person/Debt Details

As a user, I want to view the full history of a debt so I can remember what happened.

Debt detail page should show:

* Person
* Original amount
* Amount remaining
* Due date
* Note/context
* Payment history
* Status
* Created date
* Last updated date

### Record Payment

As a user, I want to record partial or full repayments so that the remaining balance stays accurate.

Payment fields:

* Amount paid
* Date paid
* Optional note

Rules:

* If amount paid equals remaining balance, mark debt as paid
* If amount paid is less than remaining balance, reduce balance and keep debt active
* Prevent payment amount from exceeding remaining balance unless user confirms adjustment

### Mark as Paid

As a user, I want to quickly mark a debt as fully paid.

Behavior:

* Mark remaining balance as paid
* Add payment record for remaining amount
* Update status to paid

### Reminder

As a user, I want to be reminded when someone promised to pay so I can follow up.

MVP reminders:

* Local notification on due date
* Default reminder time: 9:00 AM or user-selected time
* Optional second reminder if overdue

Reminder copy example:
"Brian promised to pay KES 3,000 today."

### Gentle Follow-up Message

As a user, I want help writing a polite follow-up message so I can ask without feeling awkward.

MVP version:
Generate simple copyable message templates, not automatic sending.

Examples:
"Hey Brian, just a reminder about the KES 3,000 you said you'd send today."

"Hey, checking in on the KES 3,000 from last week. Are you still able to send it today?"

## 8. Core Screens

### 1. Onboarding Screen

Purpose:
Explain the app in one line and get the user started.

Copy:
"Track who owes you, how much, and when they promised to pay."

CTA:
"Add first debt"

### 2. Dashboard

Sections:

* Total owed
* Active debts count
* Overdue count
* Due soon section
* Recent activity

Primary CTA:
"Add debt"

### 3. Add Debt Screen

Fields:

* Person name
* Amount
* Due date
* Reason/note
* Reminder toggle
* Reminder time

CTA:
"Save debt"

### 4. Debt List Screen

Tabs:

* Active
* Overdue
* Paid

Debt card:

* Name
* Amount remaining
* Due date
* Status
* Note preview

### 5. Debt Detail Screen

Sections:

* Debt summary
* Person details
* Payment history
* Notes/context
* Actions

Actions:

* Add payment
* Mark as paid
* Edit debt
* Copy reminder message
* Delete/archive debt

### 6. Add Payment Modal

Fields:

* Amount paid
* Date
* Optional note

CTA:
"Save payment"

### 7. Settings Screen

MVP settings:

* Default currency: KES
* Default reminder time
* Notification permission status
* Data/export placeholder

## 9. Data Model

### User

* id
* name
* email/phone
* default_currency
* default_reminder_time
* created_at
* updated_at

### Person

* id
* user_id
* name
* phone_number nullable
* notes nullable
* created_at
* updated_at

### Debt

* id
* user_id
* person_id
* original_amount
* remaining_amount
* currency
* reason nullable
* due_date
* lent_date nullable
* status: active, overdue, paid, archived
* reminder_enabled
* reminder_time nullable
* created_at
* updated_at

### Payment

* id
* debt_id
* amount
* paid_at
* note nullable
* created_at

### Reminder

* id
* debt_id
* remind_at
* status: scheduled, sent, cancelled
* created_at
* updated_at

## 10. Status Logic

### Active

Debt has remaining amount greater than 0 and due date is today or in the future.

### Due Soon

Debt is due within the next 3 days.

### Overdue

Debt has remaining amount greater than 0 and due date is before today.

### Paid

Debt remaining amount is 0.

### Archived

Debt is hidden from main views but kept in history.

## 11. MVP Scope

### In Scope

* Manual debt creation
* Manual person creation
* Debt list
* Debt detail page
* Dashboard summary
* Partial payments
* Mark as paid
* Local reminders
* Basic follow-up message templates
* Basic edit/delete/archive
* Default KES currency
* Mobile-first UI

### Out of Scope for v1

* M-Pesa integration
* WhatsApp integration
* Automatic SMS parsing
* Contact import
* AI extraction from screenshots/messages
* Automatic message sending
* Multi-user/shared debts
* Formal loan agreements
* Interest calculation
* Credit scoring
* Public profiles
* Payment collection
* KYC
* Lending marketplace
* Group expenses

## 12. Non-Goals

The product should not:

* Act like a loan shark tool
* Shame debtors
* Send automatic reminders to other people
* Encourage aggressive collection
* Present itself as a formal lending or credit product
* Require complex accounting knowledge

## 13. UX Principles

### Calm, not aggressive

The app should reduce emotional stress, not increase it.

### Memory first

The app is mainly for remembering details clearly.

### Fast entry

Adding a debt should feel as quick as writing a note.

### Private by default

The debtor should not be notified unless the user manually chooses to message them.

### Human tone

Reminder messages should be polite, casual, and socially appropriate.

## 14. Suggested MVP Tech Stack

### Mobile App

React Native with Expo

### Frontend-Only Architecture

No backend required. All data is stored locally on the device using secure local storage.

### Data Storage

Local storage (e.g., AsyncStorage or SQLite) for persisting debts, payments, and user preferences.

### Auth

No authentication required for MVP. Optional local PIN or biometric lock for privacy.

### Notifications

Expo Notifications

### State/Data

React Query or Zustand

### UI

React Native StyleSheet or Unistyles
Simple custom component system

## 15. Key Metrics

* Number of debts created
* Number of active debts per user
* Percentage of debts with due dates
* Percentage of debts marked paid
* Reminder opt-in rate
* Number of copied follow-up messages
* 7-day retention
* 30-day retention

## 16. MVP Release Plan

### Phase 1: Core Tracking

* Auth
* Dashboard
* Add debt
* Debt list
* Debt detail
* Add payment
* Mark as paid

### Phase 2: Reminder Layer

* Notification permissions
* Due date reminders
* Overdue reminders
* Reminder settings

### Phase 3: Polish

* Better empty states
* Better debt status visuals
* Follow-up message templates
* Payment history timeline
* Archive/delete flows

## 17. Risks

### Risk: User forgets to add debts

Mitigation:
Make debt creation extremely fast and accessible from the home screen.

### Risk: App feels too serious or predatory

Mitigation:
Use calm language around "tracking," "remembering," and "follow-up," not "collection."

### Risk: Manual entry feels tedious

Mitigation:
Keep required fields minimal: person, amount, due date.

### Risk: Reminders become annoying

Mitigation:
Let users control reminder time and disable reminders per debt.
