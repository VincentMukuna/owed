"use client";

import { useId, useState, type FormEvent } from "react";
import {
  feedbackCategories,
  submitWebsiteFeedback,
  type FeedbackCategory,
} from "../lib/submit-feedback";

const detailPlaceholders: Record<FeedbackCategory, string> = {
  bug: "What happened? What did you expect instead?",
  feature_request: "What would you like Owwed to help you do?",
  feedback: "What should feel clearer, faster, or easier?",
};

type Status = "idle" | "submitting" | "success" | "error";

function syncAriaInvalid(input: HTMLInputElement | HTMLTextAreaElement) {
  if (input.matches(":user-invalid")) {
    input.setAttribute("aria-invalid", "true");
  } else {
    input.removeAttribute("aria-invalid");
  }
}

export function FeedbackForm() {
  const titleId = useId();
  const detailsId = useId();
  const emailId = useId();
  const titleErrorId = useId();
  const detailsErrorId = useId();
  const emailErrorId = useId();

  const [category, setCategory] = useState<FeedbackCategory>("feedback");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("submitting");

    try {
      await submitWebsiteFeedback({ category, title, description, email });
      setStatus("success");
      setTitle("");
      setDescription("");
      setEmail("");
    } catch (submitError) {
      setStatus("error");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not send feedback. Please try again.",
      );
    }
  }

  if (status === "success") {
    return (
      <div className="feedback-success" role="status" aria-live="polite">
        <span className="feedback-success-mark" aria-hidden="true">
          ✓
        </span>
        <h2>Thanks for telling us.</h2>
        <p>Your note landed privately.</p>
        <button
          type="button"
          className="feedback-again"
          onClick={() => {
            setStatus("idle");
            setError(null);
          }}
        >
          Send another note
        </button>
      </div>
    );
  }

  return (
    <form className="feedback-form" onSubmit={onSubmit} noValidate>
      <div className="feedback-tabs" role="group" aria-label="Feedback type">
        {feedbackCategories.map((item) => {
          const active = category === item.value;

          return (
            <button
              key={item.value}
              type="button"
              className={`feedback-tab${active ? " active" : ""}`}
              aria-pressed={active}
              disabled={status === "submitting"}
              onClick={() => setCategory(item.value)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="feedback-field">
        <label htmlFor={titleId}>
          Subject <span aria-hidden="true">*</span>
        </label>
        <input
          id={titleId}
          name="title"
          type="text"
          autoComplete="off"
          required
          maxLength={160}
          placeholder="Short summary"
          value={title}
          disabled={status === "submitting"}
          aria-errormessage={titleErrorId}
          onBlur={(event) => syncAriaInvalid(event.currentTarget)}
          onInput={(event) => {
            if (event.currentTarget.hasAttribute("aria-invalid")) {
              syncAriaInvalid(event.currentTarget);
            }
          }}
          onChange={(event) => {
            setTitle(event.target.value);
            if (status === "error") {
              setStatus("idle");
              setError(null);
            }
          }}
        />
        <span id={titleErrorId} className="feedback-field-error">
          Add a short subject.
        </span>
      </div>

      <div className="feedback-field">
        <label htmlFor={detailsId}>
          Details <span aria-hidden="true">*</span>
        </label>
        <textarea
          id={detailsId}
          name="description"
          required
          maxLength={4000}
          rows={6}
          placeholder={detailPlaceholders[category]}
          value={description}
          disabled={status === "submitting"}
          aria-errormessage={detailsErrorId}
          onBlur={(event) => syncAriaInvalid(event.currentTarget)}
          onInput={(event) => {
            if (event.currentTarget.hasAttribute("aria-invalid")) {
              syncAriaInvalid(event.currentTarget);
            }
          }}
          onChange={(event) => {
            setDescription(event.target.value);
            if (status === "error") {
              setStatus("idle");
              setError(null);
            }
          }}
        />
        <span id={detailsErrorId} className="feedback-field-error">
          Tell us a bit more about what happened.
        </span>
      </div>

      <div className="feedback-field">
        <label htmlFor={emailId}>Email (optional)</label>
        <input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="Where we can follow up"
          value={email}
          disabled={status === "submitting"}
          aria-errormessage={emailErrorId}
          onBlur={(event) => {
            if (event.currentTarget.value) {
              syncAriaInvalid(event.currentTarget);
            } else {
              event.currentTarget.removeAttribute("aria-invalid");
            }
          }}
          onInput={(event) => {
            if (event.currentTarget.hasAttribute("aria-invalid")) {
              syncAriaInvalid(event.currentTarget);
            }
          }}
          onChange={(event) => setEmail(event.target.value)}
        />
        <span id={emailErrorId} className="feedback-field-error">
          Enter a valid email address.
        </span>
      </div>

      {error ? (
        <p className="feedback-submit-error" role="alert">
          {error}
        </p>
      ) : null}

      <button className="feedback-submit" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send feedback"}
      </button>

      <p className="feedback-note">Please leave out private financial details.</p>
    </form>
  );
}
