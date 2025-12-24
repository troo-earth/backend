function emailLayout(contentHtml) {
  // Brand Configuration - Minimalist Palette
  const theme = {
    primary: "#007473",   // Only for Buttons/Links
    textMain: "#1F2937",  // Near Black for readability
    textMuted: "#6B7280", // Grey for footer/subtext
    bgBody: "#F3F4F6",    // Very light grey background
    white: "#FFFFFF",
    assetBase: "https://xwsiuytkbefejvoqpjyg.supabase.co/storage/v1/object/public/troo.earth%20Assets"
  };

  return `
    <!DOCTYPE html>
    <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Troo</title>
      
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
      
      <style>
        /* General Resets */
        body { margin: 0; padding: 0; width: 100% !important; background-color: ${theme.bgBody}; -webkit-font-smoothing: antialiased; }
        table { border-collapse: collapse; }
        img { border: 0; outline: none; text-decoration: none; }

        /* Typography */
        body, td, p, a, li {
          font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: ${theme.textMain};
        }

        /* Content Styling */
        .content-body p {
            margin: 0 0 24px 0;
            font-size: 16px;
            line-height: 1.6;
            color: #374151; /* Dark grey */
        }
        .content-body h1 {
            color: #111827; /* Black */
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 20px;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        .content-body h2 {
            color: #111827;
            font-size: 18px;
            margin-top: 25px;
            margin-bottom: 12px;
            font-weight: 600;
        }
        
        /* Links */
        .content-body a {
            color: ${theme.primary};
            font-weight: 600;
            text-decoration: none;
        }
        .content-body a:hover {
            text-decoration: underline;
        }

        /* BUTTON Style - Minimal & Clean */
        .troo-button {
            display: inline-block;
            background-color: ${theme.primary};
            color: #ffffff !important;
            padding: 12px 32px;
            text-decoration: none !important;
            border-radius: 6px; 
            font-weight: 600;
            font-size: 15px;
            text-align: center;
            margin-top: 10px;
            margin-bottom: 10px;
        }

        /* Footer Styling */
        .footer-text {
            color: ${theme.textMuted};
            font-size: 13px;
            line-height: 1.5;
        }
        .footer-link {
            color: ${theme.textMuted};
            text-decoration: underline;
        }
        
        /* Mobile */
        @media only screen and (max-width: 600px) {
            .main-container { width: 100% !important; }
            .mobile-p { padding-left: 20px !important; padding-right: 20px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${theme.bgBody};">
      
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${theme.bgBody};">
        <tr>
          <td align="center" style="padding: 40px 0;">
            
            <table class="main-container" role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="width: 600px; background-color: ${theme.white}; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">
              
              <tr>
                <td align="center" style="padding: 48px 0 32px 0;">
                  <a href="https://troo.earth" target="_blank">
                    <img 
                      src="${theme.assetBase}/TE_Logo_Full_Transparent_Bg.png" 
                      alt="Troo.earth" 
                      width="150" 
                      style="display: block; width: 150px; border: 0;"
                    />
                  </a>
                </td>
              </tr>

              <tr>
                <td class="content-body mobile-p" style="padding: 0 48px 30px 48px;">
                  ${contentHtml}
                </td>
              </tr>
              
              <tr>
                <td class="mobile-p" style="padding: 0 48px 30px 48px;">
                   <div style="background-color: #F9FAFB; border-radius: 6px; padding: 16px; text-align: center;">
                        <p style="margin: 0; font-size: 14px; color: #4B5563;">
                            Need assistance? Contact us at <a href="mailto:support@troo.earth" style="color: ${theme.primary}; font-weight: 700; text-decoration: none;">support@troo.earth</a>
                        </p>
                   </div>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 48px;">
                    <div style="height: 1px; background-color: #E5E7EB; width: 100%;"></div>
                </td>
              </tr>

              <tr>
                <td class="mobile-p" align="center" style="padding: 32px 48px 40px 48px; background-color: ${theme.white};">
                  
                  <div style="margin-bottom: 24px;">
                     <a href="https://x.com/troo_earth" style="text-decoration: none; margin: 0 10px;">
                        <img src="${theme.assetBase}/x.png" alt="X" width="20" height="20" style="display: inline-block; filter: grayscale(100%) opacity(0.5);" />
                     </a>
                     <a href="https://facebook.com/troo.earth" style="text-decoration: none; margin: 0 10px;">
                        <img src="${theme.assetBase}/facebook.png" alt="Facebook" width="20" height="20" style="display: inline-block; filter: grayscale(100%) opacity(0.5);" />
                     </a>
                     <a href="https://instagram.com/troo.earth" style="text-decoration: none; margin: 0 10px;">
                        <img src="${theme.assetBase}/instagram.png" alt="Instagram" width="20" height="20" style="display: inline-block; filter: grayscale(100%) opacity(0.5);" />
                     </a>
                     <a href="https://linkedin.com/company/troo-earth" style="text-decoration: none; margin: 0 10px;">
                        <img src="${theme.assetBase}/linkedin.png" alt="LinkedIn" width="20" height="20" style="display: inline-block; filter: grayscale(100%) opacity(0.5);" />
                     </a>
                  </div>

                  <img 
                    src="${theme.assetBase}/TE_Logo_Bird_Tansparent_Bg.png" 
                    alt="Troo" 
                    width="24" 
                    style="display: block; margin: 0 auto 20px auto; opacity: 0.3;" 
                  />

                  <p class="footer-text" style="margin: 0 0 10px 0;">
                    © ${new Date().getFullYear()} Troo Earth. All rights reserved.
                  </p>
                  <p class="footer-text" style="margin: 0;">
                    <a href="https://troo.earth/privacy" class="footer-link">Privacy Policy</a> &nbsp;•&nbsp; 
                    <a href="https://troo.earth/terms" class="footer-link">Terms of Service</a>
                  </p>
                </td>
              </tr>
              
            </table>
            
            <p style="margin-top: 24px; color: #9CA3AF; font-size: 12px; font-family: 'Nunito Sans', sans-serif;">
                Don't want to receive these emails? <a href="{{unsubscribe_url}}" style="color: #9CA3AF; text-decoration: underline;">Unsubscribe</a>
            </p>

          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

module.exports = { emailLayout };