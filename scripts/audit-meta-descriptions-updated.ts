// Audit all meta descriptions for character count (UPDATED)
const metaDescriptions = [
  { page: "Home", desc: "Austin & Marble Falls plumber. Water heater repair, drain cleaning, leak repair, emergency plumbing. Licensed experts. Same-day service. (512) 368-9159." },
  { page: "PlumberNearMe", desc: "Looking for a plumber near you in Austin or Marble Falls? 24/7 emergency service, water heater repair, drain cleaning. Same-day service. Call (512) 368-9159." },
  { page: "FAQ", desc: "Plumbing FAQs answered: services, pricing, water heaters, drain cleaning, gas lines. Expert advice for Austin & Marble Falls. Call (512) 368-9159 today." },
  { page: "CommercialServicesLanding (FIXED)", desc: "Austin & Marble Falls commercial plumber for restaurants, offices & businesses. 25% off first service. Same-day emergency. Call (512) 368-9159." },
  { page: "WaterHeaterServices", desc: "Austin & Marble Falls water heater repair, installation & replacement. Tankless, traditional, gas & electric. Same-day service. Call (512) 368-9159 today." },
  { page: "DrainCleaning", desc: "Austin & Marble Falls drain cleaning, water heater & sewer services. Video inspection, hydro jetting, root removal. Same-day service. Call (512) 368-9159." },
  { page: "LeakRepair", desc: "Fast leak detection & repair in Austin & Marble Falls. Slab leaks, pipe leaks, faucet leaks. Insurance help. Emergency 24/7 service. Call (512) 368-9159." },
  { page: "Contact", desc: "Contact Economy Plumbing Austin (512) 368-9159, Marble Falls (830) 460-3565. Schedule online. 24/7 emergency plumbing available. Visit our offices." },
  { page: "About (FIXED)", desc: "Central Texas water heater experts since 2005. Tankless & traditional installation, repair & replacement. Licensed plumbers. Austin to Marble Falls. (512) 368-9159." },
];

console.log("\n📊 META DESCRIPTION CHARACTER COUNT AUDIT (UPDATED)\n");
console.log("Optimal: 150-160 characters");
console.log("Maximum: 165 characters (mobile shows ~120)\n");
console.log("=".repeat(80) + "\n");

let issuesFound = 0;

metaDescriptions.forEach(({ page, desc }) => {
  const length = desc.length;
  const status = length > 165 ? "❌ TOO LONG" : length > 160 ? "⚠️  SLIGHTLY LONG" : length >= 150 ? "✅ OPTIMAL" : "⚠️  SHORT";
  
  console.log(`${status.padEnd(20)} | ${length.toString().padStart(3)} chars | ${page}`);
  
  if (length > 160) {
    console.log(`   → "${desc}"`);
    console.log(`   → Exceeds by: ${length - 160} characters\n`);
    issuesFound++;
  }
});

console.log("\n" + "=".repeat(80));
console.log(`\n📈 Summary: ${issuesFound} description(s) need shortening\n`);

if (issuesFound > 0) {
  console.log("🔧 Action Required: Shorten descriptions over 160 characters");
  process.exit(1);
} else {
  console.log("✅ All descriptions within optimal range!");
  process.exit(0);
}
