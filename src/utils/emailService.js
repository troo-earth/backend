const SibApiV3Sdk = require('sib-api-v3-sdk');

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.SENDINBLUE_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

async function sendEmail({ to, subject, html }) {
  try {
    await emailApi.sendTransacEmail({
      sender: {
        email: process.env.MAIL_FROM, // still noreply@troo.earth
        name: 'Troo',
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      replyTo: { // <-- Added this block
        email: 'support@troo.earth',
        name: 'Troo Support'
      }
    });
  } catch (error) {
    console.error('Brevo email send failed:', error.message);
  }
}

module.exports = { sendEmail };
