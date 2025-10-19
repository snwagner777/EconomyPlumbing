import { syncServiceTitanCustomers } from "./server/lib/serviceTitanSync";

console.log("Starting manual ServiceTitan customer sync...");

syncServiceTitanCustomers()
  .then(() => {
    console.log("✅ Sync completed successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Sync failed:", err);
    process.exit(1);
  });
