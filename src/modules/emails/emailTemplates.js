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
    <h1>Account Details Successfully Updated</h1>

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

// Invitation email template
function inviteTemplate({ role_name, joinUrl, inviteId, org_id, expires_at }) {
  const content = `
    <h1>You're Invited to Join the Movement!</h1>

    <p>You have been invited to join an organization on <strong>troo.earth</strong> with the role of <strong>${role_name}</strong>.</p>

    <p>We believe that investing in our planet should be simple, transparent, and accessible. Join us in making a difference through verified carbon offset projects.</p>

    <center>
      <a href="${joinUrl}" class="troo-button">Accept Invitation & Get Started</a>
    </center>

    <p style="margin-top: 24px;"><strong>Invitation Details:</strong></p>
    <div style="background-color: #F9FAFB; border-radius: 6px; padding: 16px; margin: 12px 0;">
      <p style="margin: 4px 0; font-size: 14px;"><strong>Role:</strong> ${role_name}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Invite ID:</strong> <code style="background: #E5E7EB; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${inviteId}</code></p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Organization ID:</strong> <code style="background: #E5E7EB; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${org_id}</code></p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Expires:</strong> ${new Date(expires_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short'
      })}</p>
    </div>

    <p style="margin-top: 20px; font-size: 14px; color: #666;">
      If you're having trouble with the button above, you can also copy and paste this link into your browser:
    </p>
    <p style="word-break: break-all; font-size: 13px; color: #666;">
      <a href="${joinUrl}">${joinUrl}</a>
    </p>

    <p style="margin-top: 24px; font-size: 14px; color: #666;">
      If you did not expect this invitation, you can safely ignore this email.
    </p>

    <p>— The troo.earth Team</p>
  `;

  return emailLayout(content);
}

function inviteTextTemplate({ role_name, joinUrl, inviteId, org_id, expires_at }) {
  return `You have been invited to join troo.earth as ${role_name}.
Join URL: ${joinUrl}
Invite ID: ${inviteId}
Organization ID: ${org_id}
Expires: ${expires_at} (UTC)`;
}

module.exports = { accountCreatedTemplate, accountUpdatedTemplate, inviteTemplate, inviteTextTemplate };