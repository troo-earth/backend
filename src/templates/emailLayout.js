function emailLayout(contentHtml) {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #333;">
      ${contentHtml}

      <hr style="margin: 24px 0;" />

      <div style="text-align: center;">
        <img
          src="https://troo.earth/assets/logo.png"
          alt="Troo"
          width="120"
          style="margin-bottom: 8px;"
        />

        <p style="font-size: 12px; color: #777; margin: 4px 0;">
          Need help? Contact us at
          <a href="mailto:support@troo.earth">support@troo.earth</a>
        </p>

        <p style="font-size: 11px; color: #999;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </div>
  `;
}

module.exports = { emailLayout };
