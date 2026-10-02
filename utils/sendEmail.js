const nodemailer = require('nodemailer');

/**
 * Send an email asynchronously without blocking requests
 * Supports SMTP_HOST / SMTP_USER / SMTP_PASS or test environment
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

    if (!to) {
      console.warn('[Email Warning] No recipient email specified.');
      return;
    }

    // If SMTP is not properly configured with real credentials, log notification safely
    if (
      !SMTP_HOST ||
      !SMTP_USER ||
      !SMTP_PASS ||
      SMTP_USER.includes('your_email') ||
      SMTP_USER.includes('dummy') ||
      SMTP_PASS.includes('dummy')
    ) {
      console.log(`[Email Mock Service] Email simulated successfully to: ${to} | Subject: ${subject}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS ? SMTP_PASS.replace(/\s+/g, '') : ''
      }
    });

    const info = await transporter.sendMail({
      from: EMAIL_FROM || `"Nettech Help Desk" <${SMTP_USER}>`,
      to,
      subject,
      text: text || '',
      html: html || `<p>${text}</p>`
    });

    console.log(`[Email Sent] Message sent to ${to}: %s`, info.messageId);
  } catch (err) {
    // Non-blocking as specified in PRD/TRD: log error but do not throw
    console.error(`[Email Error] Failed to send email to ${to}:`, err.message);
  }
}

module.exports = sendEmail;
