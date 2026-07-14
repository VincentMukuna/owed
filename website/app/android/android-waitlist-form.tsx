"use client";

import { useId, useState, type FormEvent } from "react";
import { submitAndroidWaitlistEmail } from "../lib/android-waitlist";

type Status = "idle" | "submitting" | "success" | "duplicate" | "error";

export function AndroidWaitlistForm() {
  const emailId = useId();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("submitting");

    try {
      const result = await submitAndroidWaitlistEmail(email);
      setStatus(result.alreadyJoined ? "duplicate" : "success");
      setEmail("");
    } catch (submitError) {
      setStatus("error");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  if (status === "success" || status === "duplicate") {
    return (
      <div className="android-success" role="status" aria-live="polite">
        <span className="android-success-mark" aria-hidden="true">✓</span>
        <h2>{status === "duplicate" ? "You’re already on the list." : "You’re on the list."}</h2>
        <p>
          {status === "duplicate"
            ? "We’ll email this address when Owwed is ready on Google Play."
            : "We’ll email you when Owwed is ready on Google Play."}
        </p>
      </div>
    );
  }

  return (
    <form className="android-form" onSubmit={onSubmit} noValidate>
      <div className="android-field">
        <label htmlFor={emailId}>Email</label>
        <div className="android-input-row">
          <input
            id={emailId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="done"
            required
            spellCheck={false}
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status === "error") {
                setStatus("idle");
                setError(null);
              }
            }}
            onBlur={(event) => {
              const input = event.currentTarget;
              if (input.matches(":user-invalid")) {
                input.setAttribute("aria-invalid", "true");
              } else {
                input.removeAttribute("aria-invalid");
              }
            }}
            onInput={(event) => {
              const input = event.currentTarget;
              if (input.hasAttribute("aria-invalid")) {
                if (input.matches(":user-invalid")) {
                  input.setAttribute("aria-invalid", "true");
                } else {
                  input.removeAttribute("aria-invalid");
                }
              }
            }}
            aria-errormessage={errorId}
            disabled={status === "submitting"}
          />
          <button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Joining…" : "Join"}
          </button>
        </div>
        <span id={errorId} className="android-field-error">
          Enter a valid email address.
        </span>
        {error ? (
          <p className="android-submit-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <p className="android-form-note">One email when Android launches on Google Play.</p>
    </form>
  );
}
