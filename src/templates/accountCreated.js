const { emailLayout } = require('./emailLayout');

function accountCreatedTemplate({ user_name }) {
  const content = `
    <p>Hi ${user_name},</p>

    <p>Welcome to <strong>Troo</strong>! Your account has been successfully created.</p>

    <p>You can now log in and start using the platform.</p>

    <p>If this wasn’t you, please contact our support team immediately.</p>

    <p>— Troo Team</p>
  `;

  return emailLayout(content);
}

module.exports = { accountCreatedTemplate };
