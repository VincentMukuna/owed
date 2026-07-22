"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { loginWaitlistAdmin } from "../../actions/waitlist-admin";

export function WaitlistAdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await loginWaitlistAdmin(password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <form className="android-form" onSubmit={onSubmit}>
      <div className="android-field">
        <label htmlFor="waitlist-admin-password">Admin password</label>
        <div className="android-input-row">
          <input
            id="waitlist-admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </div>
        {error ? (
          <p className="android-submit-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
