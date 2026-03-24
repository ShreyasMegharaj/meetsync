const Brevo = require('@getbrevo/brevo');

/**
 * Send an email via Brevo (Sendinblue) Transactional Email API.
 *
 * Accepts either positional args:  sendEmail(to, subject, html)
 * or a single options object:      sendEmail({ to, subject, html })
 * so that reminder.js works without modification.
 */
const sendEmail = async (toOrOptions, subject, html) => {
  // Support both calling conventions
  let to;
  if (toOrOptions && typeof toOrOptions === 'object' && !Array.isArray(toOrOptions) && toOrOptions.to) {
    ({ to, subject, html } = toOrOptions);
  } else {
    to = toOrOptions;
  }

  const client = Brevo.ApiClient.instance;
  client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

  const api = new Brevo.TransactionalEmailsApi();
  await api.sendTransacEmail({
    sender: { email: process.env.EMAIL_USER, name: 'MeetSync' },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  });
};

module.exports = sendEmail;
