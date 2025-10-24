// scheduler.js
import cron from "node-cron";
import { exec } from "child_process";

// Run sync.js every 15 minutes
cron.schedule("*/15 * * * *", () => {
  console.log("⏰ Running scheduled sync...");
  exec("node sync.js", (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Sync error:", err);
      return;
    }
    console.log(stdout);
    if (stderr) console.error(stderr);
  });
});

console.log("✅ Scheduler started. Sync will run automatically every 15 minutes.");

// Run Shopify → Odoo sync every 30 minutes
cron.schedule("*/15 * * * *", () => {
  console.log("⏰ Running Shopify → Odoo reverse sync...");
  exec("node shopifyToOdooSync.js", (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Reverse sync error:", err);
      return;
    }
    console.log(stdout);
    if (stderr) console.error(stderr);
  });
});

console.log("✅ Sync will run automatically every 15 minutes.");