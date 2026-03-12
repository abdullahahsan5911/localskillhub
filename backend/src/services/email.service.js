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
export const sendOtpEmail = async (toEmail, name, otp) => {
  const mailOptions = {
    from: `"LocalSkillHub" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `${otp} – Your LocalSkillHub verification code`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f4f7f6;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#0f4c3a,#1a6e55);padding:36px 40px;text-align:center;">
                  <div style="display:inline-flex;align-items:center;gap:10px;">
                    <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:8px;">
                      <span style="font-size:20px;">📍</span>
                    </div>
                    <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">LocalSkillHub</span>
                  </div>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px 40px 32px;">
                  <p style="margin:0 0 8px;font-size:15px;color:#6b7280;">Hello, <strong style="color:#111827;">${name || 'there'}</strong> 👋</p>
                  <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">Verify your email address</h1>
                  <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                    Use the code below to verify your email. It expires in <strong>10 minutes</strong>.
                  </p>
                  <!-- OTP Box -->
                  <div style="background:#f0fdf4;border:2px dashed #22c55e;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                    <span style="font-size:48px;font-weight:800;letter-spacing:12px;color:#15803d;font-family:monospace;">${otp}</span>
                  </div>
                  <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                    If you didn't create an account on LocalSkillHub, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 LocalSkillHub · Connecting local talent</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};
