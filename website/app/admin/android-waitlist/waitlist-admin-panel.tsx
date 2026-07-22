"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";

import {
  logoutWaitlistAdmin,
  sendAndroidWaitlistInvite,
  type WaitlistAdminRow,
} from "../../actions/waitlist-admin";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function maskEmail(email: string) {
  const at = email.indexOf("@");
  if (at <= 0) {
    return email.slice(0, 4) + (email.length > 4 ? "…" : "");
  }

  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = local.slice(0, Math.min(4, local.length));
  const hidden = local.length > 4 ? "•".repeat(Math.min(local.length - 4, 8)) : "";

  return `${visible}${hidden}${domain}`;
}

function CopyableEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className={`waitlist-admin-email${copied ? " is-copied" : ""}`}
      onClick={onCopy}
      title={copied ? "Copied" : "Copy email"}
      aria-label={`Copy email starting with ${email.slice(0, 4)}`}
    >
      <span className="waitlist-admin-email-text">{maskEmail(email)}</span>
      <span className="waitlist-admin-email-copy" aria-hidden="true">
        {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
      </span>
    </button>
  );
}

export function WaitlistAdminPanel({ rows }: { rows: WaitlistAdminRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pending = rows.filter((row) => row.status === "pending");
  const invited = rows.filter((row) => row.status === "invited");

  function onSend(id: string) {
    setMessage(null);
    setError(null);
    setPendingId(id);

    startTransition(async () => {
      const result = await sendAndroidWaitlistInvite(id);
      setPendingId(null);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setMessage("Invite sent.");
      router.refresh();
    });
  }

  async function onLogout() {
    await logoutWaitlistAdmin();
    router.refresh();
  }

  return (
    <div className="waitlist-admin">
      <div className="waitlist-admin-toolbar">
        <p className="waitlist-admin-hint">
          Add the person in Play Console first, then send the invite email.
        </p>
        <button type="button" className="waitlist-admin-ghost" onClick={onLogout}>
          Sign out
        </button>
      </div>

      {message ? (
        <p className="waitlist-admin-ok" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="android-submit-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="waitlist-admin-section">
        <h2>Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="waitlist-admin-empty">No pending signups.</p>
        ) : (
          <ul className="waitlist-admin-list">
            {pending.map((row) => (
              <li key={row.id} className="waitlist-admin-row">
                <div className="waitlist-admin-row-copy">
                  <CopyableEmail email={row.email} />
                  <span className="waitlist-admin-meta">{formatDate(row.createdAt)}</span>
                </div>
                <button
                  type="button"
                  className="waitlist-admin-send"
                  disabled={isPending && pendingId === row.id}
                  onClick={() => onSend(row.id)}
                >
                  {isPending && pendingId === row.id ? "Sending…" : "Send invite"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="waitlist-admin-section">
        <h2>Invited ({invited.length})</h2>
        {invited.length === 0 ? (
          <p className="waitlist-admin-empty">No invites sent yet.</p>
        ) : (
          <ul className="waitlist-admin-list">
            {invited.map((row) => (
              <li key={row.id} className="waitlist-admin-row waitlist-admin-row-muted">
                <div className="waitlist-admin-row-copy">
                  <CopyableEmail email={row.email} />
                  <span className="waitlist-admin-meta">
                    Joined {formatDate(row.createdAt)}
                    {row.invitedAt ? ` · Invited ${formatDate(row.invitedAt)}` : null}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
