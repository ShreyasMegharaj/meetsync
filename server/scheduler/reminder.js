const cron = require('node-cron');
const Appointment = require('../models/appointment');

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
      });

      for (const appointment of appointments) {
        appointment.reminder_sent = true;
        await appointment.save();
      }

      console.log(`Reminders processed: ${appointments.length}`);

    } catch (error) {
      console.error('Reminder job error:', error);
    }
  });

};

module.exports = startReminderJob;