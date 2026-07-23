import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  return new Resend(apiKey);
}

function getFromAddress() {
  const from = process.env.WAITLIST_FROM_EMAIL;

  if (!from) {
    throw new Error("WAITLIST_FROM_EMAIL is not configured.");
  }

  return `Owwed <${from}>`;
}

function getReplyTo() {
  return process.env.WAITLIST_REPLY_TO || undefined;
}

function getNotifyEmail() {
  const email = process.env.WAITLIST_NOTIFY_EMAIL;

  if (!email) {
    throw new Error("WAITLIST_NOTIFY_EMAIL is not configured.");
  }

  return email;
}

function getInviteUrl() {
  if (!process.env.WAITLIST_ANDROID_INVITE_URL?.trim()) {
    throw new Error("WAITLIST_ANDROID_INVITE_URL is not configured.");
  }

  // Same-domain hop so Resend doesn’t flag play.google.com as a mismatched URL.
  return `${getSiteOrigin()}/go/android`;
}

function getSiteOrigin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) {
    return explicit;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  return "http://localhost:3000";
}

function getAdminUrl() {
  return `${getSiteOrigin()}/admin/android-waitlist`;
}

async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const { error } = await getResend().emails.send({
    from: getFromAddress(),
    to: input.to,
    replyTo: getReplyTo(),
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendWaitlistJoinedAck(to: string) {
  const text = [
    "Hi,",
    "",
    "Thanks for helping me test Owwed. You’re on the Android waitlist.",
    "",
    "I’ll email you the install link once I’ve added your email to the testing group.",
    "",
    "Thanks,",
    "Vincent",
  ].join("\n");

  const html = `
    <p>Hi,</p>
    <p>Thanks for helping me test Owwed. You’re on the Android waitlist.</p>
    <p>I’ll email you the install link once I’ve added your email to the testing group.</p>
    <p>Thanks,<br/>Vincent</p>
  `.trim();

  await sendEmail({
    to,
    subject: "You’re on the Owwed waitlist",
    text,
    html,
  });
}

export async function sendWaitlistJoinedNotify(signupEmail: string) {
  const adminUrl = getAdminUrl();
  const text = [
    "New Android waitlist signup:",
    signupEmail,
    "",
    "1. Add them in Play Console → Closed testing.",
    `2. Send the invite from ${adminUrl}`,
  ].join("\n");

  const html = `
    <p><strong>New Android waitlist signup:</strong> ${signupEmail}</p>
    <ol>
      <li>Add them in Play Console → Closed testing.</li>
      <li><a href="${adminUrl}">Send the invite from the admin page</a></li>
    </ol>
  `.trim();

  await sendEmail({
    to: getNotifyEmail(),
    subject: `Owwed waitlist: ${signupEmail}`,
    text,
    html,
  });
}

export async function sendAndroidBetaInvite(to: string) {
  const inviteUrl = getInviteUrl();
  const text = [
    "Hi,",
    "",
    "Thanks for helping me test Owwed. I’ve added your email to the Android testing group.",
    "",
    "Install the app here:",
    "",
    inviteUrl,
    "",
    "Please let me know if the link doesn’t work or if you notice any issues.",
    "",
    "Thanks,",
    "Vincent",
  ].join("\n");

  const html = `
    <p>Hi,</p>
    <p>Thanks for helping me test Owwed. I’ve added your email to the Android testing group.</p>
    <p>Install the app here:</p>
    <p><a href="${inviteUrl}">${inviteUrl}</a></p>
    <p>Please let me know if the link doesn’t work or if you notice any issues.</p>
    <p>Thanks,<br/>Vincent</p>
  `.trim();

  await sendEmail({
    to,
    subject: "Your Owwed test link",
    text,
    html,
  });
}
