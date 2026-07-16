# Security Policy

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report privately using GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) for this repository (Security tab → "Report a vulnerability"), or email the maintainer at **mukunavincent28@gmail.com**.

Please include:

- A description of the issue and its potential impact.
- Steps to reproduce, or a proof of concept.
- Any relevant version, platform, and configuration details.

You can expect an acknowledgement within a few days. Please give a reasonable amount of time for a fix before any public disclosure.

## Scope and data handling

Owwed is a local-first app: debts, people, payments, notes, reminder settings, and app-lock configuration are stored on the user's device and are not uploaded to any server by default.

The two optional network features are:

- **Feedback submission** — sends only the feedback you type (plus basic device/app metadata) to a configured Supabase endpoint.
- **Currency conversion** — requests a public exchange-rate suggestion.

There is no authentication server, no analytics, and no third-party tracking SDKs. Any credentials for the optional feedback backend are supplied via `EXPO_PUBLIC_*` environment variables and are never committed to the repository.
