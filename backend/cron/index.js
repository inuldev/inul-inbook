const cron = require("node-cron");
const { cleanupExpiredStories } = require("./storyCleanup");

/**
 * Initialize cron jobs
 */
const initCronJobs = async () => {
  // Run story cleanup immediately on startup
  console.log("Running initial cleanup of expired stories");
  await cleanupExpiredStories();

  // Run story cleanup every hour
  cron.schedule("0 * * * *", async () => {
    console.log("Running scheduled task: Cleanup expired stories");
    await cleanupExpiredStories();
  });

  console.log("Cron jobs initialized");
};

module.exports = {
  initCronJobs,
};
