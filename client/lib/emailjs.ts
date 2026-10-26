export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactMessage(data: ContactMessage): Promise<void> {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error(
      "The contact form is temporarily unavailable. Please try again later.",
    );
  }

  let response: Response;
  try {
    response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          name: data.name,
          email: data.email,
          subject: data.subject,
          title: data.subject,
          message: data.message,
          from_name: data.name,
          from_email: data.email,
          reply_to: data.email,
          time: new Date().toISOString(),
        },
      }),
    });
  } catch {
    throw new Error(
      "We couldn’t confirm your message was sent. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? "Too many messages right now. Please wait a moment and try again."
        : "Your message couldn’t be sent. Please try again later.",
    );
  }
}
