async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.log("\n--- EMAIL SIMULATION ---");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("HTML:", html);
    console.log("--- END EMAIL ---\n");
    return { simulated: true };
  }

  const { Resend } = require("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    to: [to],
    subject,
    html
  });

  if (error) {
    throw new Error(error.message || "Email provider error");
  }

  return data;
}

module.exports = sendEmail;
