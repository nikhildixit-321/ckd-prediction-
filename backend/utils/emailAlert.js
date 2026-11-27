const nodemailer = require('nodemailer');

// Sends a CKD high-risk alert email to the doctor.
// Silently skips if EMAIL_USER / EMAIL_PASS / ALERT_EMAIL are not set in .env
async function sendCKDAlert(user, patientName, probability) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.ALERT_EMAIL) return;

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
        from: `"CKD Insight" <${process.env.EMAIL_USER}>`,
        to: process.env.ALERT_EMAIL,
        subject: '⚠️ CKD Alert: High Risk Patient Detected',
        html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;border:1px solid #fca5a5;border-radius:8px;overflow:hidden;">
        <div style="background:#dc2626;color:#fff;padding:16px 20px;">
          <h2 style="margin:0;">⚠️ CKD High Risk Alert</h2>
        </div>
        <div style="padding:20px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;font-weight:bold;width:140px;">Patient</td><td>${patientName}</td></tr>
            <tr style="background:#fef2f2;"><td style="padding:8px 0;font-weight:bold;">CKD Probability</td><td style="color:#dc2626;font-weight:bold;">${(probability * 100).toFixed(1)}%</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;">Detected by</td><td>${user.name} (${user.email})</td></tr>
            <tr style="background:#fef2f2;"><td style="padding:8px 0;font-weight:bold;">Time</td><td>${new Date().toLocaleString('en-IN')}</td></tr>
          </table>
          <p style="margin-top:16px;color:#6b7280;font-size:12px;">This is an automated alert from CKD Insight. Please review this patient's records.</p>
        </div>
      </div>`
    });
}

module.exports = sendCKDAlert;
