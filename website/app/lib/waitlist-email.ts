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
  const url = process.env.WAITLIST_ANDROID_INVITE_URL;

  if (!url) {
    throw new Error("WAITLIST_ANDROID_INVITE_URL is not configured.");
  }

  return url;
}

function getAdminUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");

  return `${siteUrl}/admin/android-waitlist`;
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
    "Thanks for offering to test Owwed. You’re on the Android beta waitlist.",
    "",
    "We’ll email you the Play Store link once you’ve been added to closed testing.",
    "",
    "Thanks,",
    "Vincent",
  ].join("\n");

  const html = `
    <p>Hi,</p>
    <p>Thanks for offering to test Owwed. You’re on the Android beta waitlist.</p>
    <p>We’ll email you the Play Store link once you’ve been added to closed testing.</p>
    <p>Thanks,<br/>Vincent</p>
  `.trim();

  await sendEmail({
    to,
    subject: "You’re on the Owwed Android waitlist",
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
    "Thanks for offering to test Owwed. You can join the Android beta here:",
    "",
    inviteUrl,
    "",
    "I'd appreciate any feedback or issues you notice.",
    "",
    "Thanks,",
    "Vincent",
  ].join("\n");

  const html = `
    <p>Hi,</p>
    <p>Thanks for offering to test Owwed. You can join the Android beta here:</p>
    <p><a href="${inviteUrl}">${inviteUrl}</a></p>
    <p>I'd appreciate any feedback or issues you notice.</p>
    <p>Thanks,<br/>Vincent</p>
  `.trim();

  await sendEmail({
    to,
    subject: "Owwed Android beta",
    text,
    html,
  });
}
