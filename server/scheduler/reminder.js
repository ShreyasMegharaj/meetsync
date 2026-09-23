const cron = require('node-cron');
const Appointment = require('../models/appointment');
const sendEmail = require('../utils/sendEmail');

/**
 * Build a beautiful HTML reminder email.
 */
const buildReminderHTML = (recipientName, otherPersonName, appointment) => {
  const dateObj = new Date(appointment.scheduled_for);
  const dateStr = dateObj.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
  const timeStr = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  const note = appointment.note
    ? `<tr><td style="padding:12px 24px;color:#94a3b8;font-size:14px;">
         <strong style="color:#cbd5e1;">Note:</strong> ${appointment.note}
       </td></tr>`
    : '';

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid #334155;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr><td style="padding:32px 24px 16px;text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#f8fafc;letter-spacing:-0.5px;">
              ⚡ MeetSync
            </div>
            <div style="margin-top:4px;font-size:13px;color:#64748b;">Appointment Reminder</div>
          </td></tr>

          <!-- Divider -->
          <tr><td style="padding:0 24px;">
            <div style="height:1px;background:linear-gradient(90deg,transparent,#334155,transparent);"></div>
          </td></tr>

          <!-- Greeting -->
          <tr><td style="padding:24px 24px 8px;color:#e2e8f0;font-size:16px;">
            Hi <strong>${recipientName}</strong>,
          </td></tr>
          <tr><td style="padding:0 24px 20px;color:#94a3b8;font-size:15px;line-height:1.6;">
            This is a friendly reminder that you have an upcoming appointment:
          </td></tr>

          <!-- Appointment Card -->
          <tr><td style="padding:0 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border:1px solid #334155;border-radius:12px;">
              <tr><td style="padding:16px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#64748b;font-size:13px;padding-bottom:6px;">📅 Date</td>
                    <td style="color:#f1f5f9;font-size:15px;text-align:right;padding-bottom:6px;">${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-size:13px;padding-bottom:6px;">⏰ Time</td>
                    <td style="color:#f1f5f9;font-size:15px;text-align:right;padding-bottom:6px;">${timeStr}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-size:13px;">👤 With</td>
                    <td style="color:#f1f5f9;font-size:15px;text-align:right;">${otherPersonName}</td>
                  </tr>
                </table>
              </td></tr>
              ${note}
            </table>
          </td></tr>

          <!-- CTA Button -->
          <tr><td style="padding:28px 24px 12px;text-align:center;">
            <a href="${process.env.CLIENT_URL || 'https://meetsync-sand.vercel.app'}/appointments"
               style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
              View Appointment
            </a>
          </td></tr>

          <!-- Footer -->
          <tr><td style="padding:20px 24px 28px;text-align:center;color:#475569;font-size:12px;line-height:1.5;">
            You're receiving this because you have an appointment on MeetSync.<br>
            © ${new Date().getFullYear()} MeetSync
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
};

const startReminderJob = () => {

  // Runs every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running reminder check...');

      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const appointments = await Appointment.find({
        status: 'accepted',
        reminder_sent: false,
        scheduled_for: { $gte: now, $lte: next24Hours }
      }).populate('host_id', 'name email')
        .populate('client_id', 'name email');

      for (const appointment of appointments) {
        const host = appointment.host_id;
        const client = appointment.client_id;

        if (!host?.email || !client?.email) {
          console.warn(`Skipping appointment ${appointment._id} — missing user email(s)`);
          continue;
        }

        try {
          // Send reminder to the host
          await sendEmail(
            host.email,
            `⏰ Reminder: Appointment with ${client.name} tomorrow`,
            buildReminderHTML(host.name, client.name, appointment)
          );

          // Send reminder to the client
          await sendEmail(
            client.email,
            `⏰ Reminder: Appointment with ${host.name} tomorrow`,
            buildReminderHTML(client.name, host.name, appointment)
          );

          appointment.reminder_sent = true;
          await appointment.save();

          console.log(`✅ Reminders sent for appointment ${appointment._id}`);
        } catch (emailErr) {
          console.error(`❌ Failed to send reminder for ${appointment._id}:`, emailErr.message);
        }
      }

      console.log(`Reminders processed: ${appointments.length}`);

    } catch (error) {
      console.error('Reminder job error:', error);
    }
  });

};

module.exports = startReminderJob;