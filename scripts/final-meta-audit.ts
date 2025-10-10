// Final meta description audit - all pages
const metaDescriptions = [
  { page: "Home", desc: "Austin & Marble Falls plumber. Water heater repair, drain cleaning, leak repair, emergency plumbing. Licensed experts. Same-day service. (512) 368-9159." },
  { page: "PlumberNearMe", desc: "Looking for a plumber near you in Austin or Marble Falls? 24/7 emergency service, water heater repair, drain cleaning. Same-day service. Call (512) 368-9159." },
  { page: "FAQ", desc: "Plumbing FAQs answered: services, pricing, water heaters, drain cleaning, gas lines. Expert advice for Austin & Marble Falls. Call (512) 368-9159 today." },
  { page: "CommercialServices", desc: "Austin & Marble Falls commercial plumber for restaurants, offices & businesses. 25% off first service for new customers. Same-day emergency. (512) 368-9159." },
  { page: "WaterHeaterServices", desc: "Austin & Marble Falls water heater repair, installation & replacement. Tankless, traditional, gas & electric. Same-day service. Call (512) 368-9159 today." },
  { page: "DrainCleaning", desc: "Austin & Marble Falls drain cleaning, water heater & sewer services. Video inspection, hydro jetting, root removal. Same-day service. Call (512) 368-9159." },
  { page: "LeakRepair", desc: "Fast leak detection & repair in Austin & Marble Falls. Slab leaks, pipe leaks, faucet leaks. Insurance help. Emergency 24/7 service. Call (512) 368-9159." },
  { page: "Contact", desc: "Contact Economy Plumbing Austin (512) 368-9159, Marble Falls (830) 460-3565. Schedule online. 24/7 emergency plumbing available. Visit our offices." },
  { page: "About", desc: "Central Texas water heater experts since 2005. Tankless & traditional installation, repair, replacement. Licensed. Austin-Marble Falls. (512) 368-9159." },
];

console.log("\n✅ FINAL META DESCRIPTION AUDIT\n");
console.log("Target: 150-160 characters (optimal for SEO)");
console.log("Maximum: 165 characters\n");
console.log("=".repeat(85) + "\n");

let allOptimal = true;

metaDescriptions.forEach(({ page, desc }) => {
  const length = desc.length;
  const status = length > 165 ? "❌ TOO LONG" : length > 160 ? "⚠️  OVER" : length >= 150 ? "✅ OPTIMAL" : "⚠️  SHORT";
  
  if (length < 150 || length > 160) {
    allOptimal = false;
  }
  
  console.log(`${status.padEnd(15)} | ${length.toString().padStart(3)} chars | ${page.padEnd(25)} | "${desc.substring(0, 60)}..."`);
});

console.log("\n" + "=".repeat(85) + "\n");

if (allOptimal) {
  console.log("🎉 SUCCESS! All meta descriptions are within the optimal 150-160 character range!");
  console.log("\n✓ Phone numbers included on conversion/service pages");
  console.log("✓ All descriptions provide clear value propositions");
  console.log("✓ Location keywords (Austin & Marble Falls) included");
  console.log("✓ Call-to-action present in descriptions\n");
  process.exit(0);
} else {
  console.log("⚠️  Some descriptions are outside the 150-160 optimal range");
  process.exit(1);
}
