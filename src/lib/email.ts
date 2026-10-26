import { getServerEnv } from "@/lib/env";

export interface OptionalEmailPayload {
  to: string;
  subject: string;
  text: string;
}

/**
 * Optional email notification sender via Resend behind `ENABLE_EMAIL_NOTIFICATIONS="true"`.
 * Gracefully no-ops when disabled (WhatsApp link-based flow is primary for MVP).
 */
export async function sendOptionalNotificationEmail(
  payload: OptionalEmailPayload
): Promise<{ sent: boolean }> {
  const env = getServerEnv();
  if (
    env.ENABLE_EMAIL_NOTIFICATIONS !== "true" ||
    !env.RESEND_API_KEY
  ) {
    return { sent: false };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.NOTIFICATION_FROM_EMAIL,
        to: [payload.to],
        subject: payload.subject,
        text: payload.text,
      }),
    });
    return { sent: response.ok };
  } catch {
    return { sent: false };
  }
}
