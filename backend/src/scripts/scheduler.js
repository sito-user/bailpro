require('dotenv').config();
const { sendLateRentReminders } = require('../services/reminderService');
const { sendMonthlyReport } = require('../services/reportService');

/**
 * Simple scheduler that runs daily tasks
 * Called from server.js on startup and then every 24 hours
 */
const runDailyTasks = async () => {
  const now = new Date();
  console.log(`[Scheduler] Running daily tasks at ${now.toISOString()}`);

  // Send late rent reminders
  const reminded = await sendLateRentReminders();
  console.log(`[Scheduler] Sent ${reminded} late rent reminder(s)`);

  // Send monthly report on the 1st of each month
  if (now.getDate() === 1) {
    console.log('[Scheduler] First day of month — sending monthly reports');
    await sendMonthlyReport();
  }
};

const startScheduler = () => {
  // Run once on startup
  runDailyTasks().catch(console.error);

  // Then run every 24 hours
  setInterval(() => {
    runDailyTasks().catch(console.error);
  }, 24 * 60 * 60 * 1000);
};

module.exports = { startScheduler, runDailyTasks };
