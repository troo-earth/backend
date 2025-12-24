const SibApiV3Sdk = require('sib-api-v3-sdk');

const client = SibApiV3Sdk.ApiClient.instance;
// Ensure your API key is correctly loaded from .env
client.authentications['api-key'].apiKey = process.env.SENDINBLUE_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Core Email Sender Service
 * Used across the notifications/email module
 */
async function sendEmail({ to, subject, html }) {
  try {
    const sendData = {
      sender: {
        email: process.env.MAIL_FROM || 'noreply@troo.earth',
        name: 'troo.earth',
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      replyTo: {
        email: 'support@troo.earth',
        name: 'troo.earth Support'
      }
    };

    const response = await emailApi.sendTransacEmail(sendData);
    return response;
  } catch (error) {
    // Log the error for the backend logs
    console.error('Brevo email send failed:', error.response ? error.response.body : error.message);
    
    // Throwing the error allows your feature services (like auth) 
    // to decide if they should retry or log it to an error monitor
    throw new Error('Email delivery failed');
  }
}

module.exports = { sendEmail };