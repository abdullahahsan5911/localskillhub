import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a 6-digit OTP verification email.
 */
export const sendOtpEmail = async (toEmail, name, otp, type = 'verification') => {
  const isDeletion = type === 'deletion';
  
  const mailOptions = {
    from: `"LocalSkillHub" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: isDeletion 
      ? `Action Required: ${otp} – Account Deletion code`
      : `${otp} – Your LocalSkillHub verification code`,
    html: `
          <!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f6f9fc;font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">

        <table width="480" cellpadding="0" cellspacing="0" style="background:${isDeletion ? '#fff5f5' : '#ffffff'};border-radius:8px;border:1px solid ${isDeletion ? '#fecaca' : '#e5e7eb'};">

          <!-- Header -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid ${isDeletion ? '#fecaca' : '#e5e7eb'};">
              <h1 style="margin:0;font-size:18px;color:${isDeletion ? '#991b1b' : '#111827'};font-weight:600;">
                LocalSkillHub ${isDeletion ? '• Account Security' : ''}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">

              <p style="margin:0 0 16px;font-size:14px;color:#111827;">
                Hello ${name || 'User'},
              </p>

              <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
                ${isDeletion 
                  ? "We received a request to <strong>permanently delete</strong> your LocalSkillHub account. This will remove all your profile data, jobs, and history. Please use the security code below to confirm this action."
                  : "Use the verification code below to confirm your email address and finish setting up your account."}
              </p>

              <!-- OTP -->
              <div style="text-align:center;margin:30px 0;">
                <div style="display:inline-block;padding:16px 24px;border:1px solid ${isDeletion ? '#f87171' : '#d1d5db'};border-radius:6px;background:#ffffff;">
                  <span style="font-size:28px;font-weight:600;letter-spacing:6px;color:${isDeletion ? '#dc2626' : '#111827'};font-family:monospace;">
                    ${otp}
                  </span>
                </div>
              </div>

              <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">
                This code will expire in 10 minutes. 
              </p>

              <p style="margin:0;font-size:13px;color:#6b7280;">
                ${isDeletion 
                  ? "<strong>If you did not request to delete your account</strong>, please ignore this email and change your password immediately." 
                  : "If you did not request this, you can safely ignore this email."}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid ${isDeletion ? '#fecaca' : '#e5e7eb'};text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © 2026 LocalSkillHub • Secure Disposal Service
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send account risk level notification email
 */
export const sendRiskLevelNotification = async (toEmail, name, riskLevel, reason) => {
  const riskConfig = {
    high: {
      title: 'Account Flagged - Action Required',
      color: '#dc2626',
      bgColor: '#fef2f2',
      borderColor: '#fecaca',
      message: 'Your account has been flagged with <strong>high risk</strong>. This means you are currently restricted from:',
      restrictions: [
        'Posting new jobs',
        'Submitting proposals',
        'Sending messages',
        'Making payments'
      ],
      action: 'Contact support to resolve this issue'
    },
    medium: {
      title: 'Account Under Review',
      color: '#ea580c',
      bgColor: '#fff7ed',
      borderColor: '#fed7aa',
      message: 'Your account is under review with <strong>medium risk</strong>. You are currently restricted from:',
      restrictions: [
        'Posting new jobs (requires admin approval)'
      ],
      action: 'You can still submit proposals and continue working on existing contracts'
    },
    low: {
      title: 'Account Risk Status Updated',
      color: '#059669',
      bgColor: '#f0fdf4',
      borderColor: '#86efac',
      message: 'Your account risk level has been updated to <strong>low</strong>. You now have full access to all platform features.',
      restrictions: [],
      action: 'No restrictions apply'
    }
  };

  const config = riskConfig[riskLevel] || riskConfig.low;

  const mailOptions = {
    from: `"LocalSkillHub" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: config.title,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f6f9fc;font-family:Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;">
                
                <!-- Header -->
                <tr>
                  <td style="padding:24px 32px;border-bottom:1px solid #e5e7eb;">
                    <h1 style="margin:0;font-size:18px;color:#111827;font-weight:600;">
                      LocalSkillHub
                    </h1>
                  </td>
                </tr>

                <!-- Alert Banner -->
                <tr>
                  <td style="padding:24px 32px;background:${config.bgColor};border-left:4px solid ${config.color};">
                    <h2 style="margin:0 0 12px;font-size:16px;color:${config.color};font-weight:600;">
                      ${config.title}
                    </h2>
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
                      ${config.message}
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 16px;font-size:14px;color:#111827;">
                      Hello ${name || 'User'},
                    </p>

                    ${config.restrictions.length > 0 ? `
                      <p style="margin:0 0 12px;font-size:13px;color:#493d3d;font-weight:600;">Restricted Actions:</p>
                      <ul style="margin:0 0 24px 0;padding-left:20px;font-size:13px;color:#374151;line-height:1.8;">
                        ${config.restrictions.map(r => `<li>${r}</li>`).join('')}
                      </ul>
                    ` : ''}

                    <div style="background:#f3f4f6;padding:16px;border-radius:6px;margin:24px 0;">
                      <p style="margin:0;font-size:13px;color:#374151;">
                        <strong>Reason:</strong> ${reason || 'Account security review'}
                      </p>
                    </div>

                    <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">
                      <strong>${config.action}</strong>
                    </p>

                    <p style="margin:0;font-size:13px;color:#6b7280;">
                      If you believe this decision is incorrect or have questions, please contact our support team at support@localskillhub.com
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">
                      © 2026 LocalSkillHub
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};
