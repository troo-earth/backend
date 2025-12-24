const { emailLayout } = require('./emailLayout');

function accountCreatedTemplate({ user_name }) {
  const dashboardUrl = "https://dev.troo.earth/"; // Replace with your actual URL

  const content = `
    <h1>Welcome to the Movement, ${user_name}!</h1>

    <p>Thank you for joining <strong>troo.earth</strong>. Your account has been successfully created, and you are now part of a community dedicated to transparent and impactful carbon offsetting.</p>

    <p>We believe that investing in our planet should be simple, transparent, and accessible. You can now browse our verified projects and start making a difference today.</p>

    <center>
      <a href="${dashboardUrl}" class="troo-button">Explore the Marketplace</a>
    </center>

    <p style="margin-top: 20px; font-size: 14px; color: #666;">
      If you did not sign up for this account, please contact our support team immediately.
    </p>

    <p>— The troo.earth Team</p>
  `;

  return emailLayout(content);
}

/**
 * Account Updated Email
 * - Clear notification of changes
 * - Security focus (If you didn't do this...)
 * - "View Account" button for quick verification
 */
function accountUpdatedTemplate({ user_name }) {
  const accountUrl = "https://dev.troo.earth/"; // Replace with your actual URL

  const content = `
    <h1>Account Details Updated</h1>

    <p>Hi ${user_name},</p>

    <p>This is a quick notification to let you know that the information associated with your <strong>troo.earth</strong> account has been successfully updated.</p>

    <center>
      <a href="${accountUrl}" class="troo-button">View Your Account</a>
    </center>

    <p><strong>Security Notice:</strong><br>
    If you did not make this change, someone else may have access to your account. Please <a href="mailto:support@troo.earth">contact support</a> immediately to secure your profile.</p>

    <p>— The troo.earth Team</p>
  `;

  return emailLayout(content);
}

module.exports = { accountCreatedTemplate, accountUpdatedTemplate };