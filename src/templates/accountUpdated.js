const { emailLayout } = require('./emailLayout');

function accountUpdatedTemplate({ user_name }) {
  const content = `
    <p>Hi ${user_name},</p>

    <p>This is a confirmation that your <strong>Troo</strong> account details were updated.</p>

    <p>If you did not make this change, please contact our support team immediately.</p>

    <p>— Troo Team</p>
  `;

  return emailLayout(content);
}

module.exports = { accountUpdatedTemplate };
