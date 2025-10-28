#!/bin/bash
# Bulk migrate all React pages to Next.js with exact URL matching

set -e

echo "🚀 Migrating all pages to Next.js..."

# Function to create Next.js page from React component
create_nextjs_page() {
  local OLD_PATH=$1
  local NEW_DIR=$2
  
  if [[ ! -f "$OLD_PATH" ]]; then
    echo "⚠️  Skipping $OLD_PATH (not found)"
    return
  fi
  
  mkdir -p "$NEW_DIR"
  
  # Copy and add 'use client' directive at the top
  echo "'use client';" > "$NEW_DIR/page.tsx"
  cat "$OLD_PATH" >> "$NEW_DIR/page.tsx"
  
  echo "✅ Created $NEW_DIR/page.tsx"
}

# Service Pages
create_nextjs_page "client/src/pages/ToiletFaucet.tsx" "app/toilet-faucet"
create_nextjs_page "client/src/pages/GasServices.tsx" "app/gas-services"
create_nextjs_page "client/src/pages/PlumberNearMe.tsx" "app/plumber-near-me"
create_nextjs_page "client/src/pages/CommercialServicesLanding.tsx" "app/commercial-services"
create_nextjs_page "client/src/pages/DrainageSolutions.tsx" "app/drainage-solutions"
create_nextjs_page "client/src/pages/GarbageDisposalRepair.tsx" "app/garbage-disposal-repair"
create_nextjs_page "client/src/pages/GasLeakDetection.tsx" "app/gas-leak-detection"
create_nextjs_page "client/src/pages/PermitResolution.tsx" "app/permit-resolution-services"
create_nextjs_page "client/src/pages/RooterServices.tsx" "app/rooter-services"
create_nextjs_page "client/src/pages/SewagePumpServices.tsx" "app/sewage-pump-services"
create_nextjs_page "client/src/pages/WaterHeaterGuide.tsx" "app/water-heater-guide"
create_nextjs_page "client/src/pages/PlumbingCostEstimator.tsx" "app/plumbing-cost-estimator"
create_nextjs_page "client/src/pages/WaterPressureSolutions.tsx" "app/water-pressure-solutions"
create_nextjs_page "client/src/pages/HydroJetting.tsx" "app/hydro-jetting"

# Utility Pages
create_nextjs_page "client/src/pages/LeaveReview.tsx" "app/leave-review"
create_nextjs_page "client/src/pages/Unsubscribe.tsx" "app/unsubscribe"
create_nextjs_page "client/src/pages/ReferredBy.tsx" "app/referred-by/[referrerCustomerId]"
create_nextjs_page "client/src/pages/MembershipBenefits.tsx" "app/membership-benefits"
create_nextjs_page "client/src/pages/SuccessStories.tsx" "app/success-stories"
create_nextjs_page "client/src/pages/ScheduleAppointment.tsx" "app/schedule-appointment"
create_nextjs_page "client/src/pages/ReferralLanding.tsx" "app/ref/[code]"
create_nextjs_page "client/src/pages/ReferralOffer.tsx" "app/referral-offer"
create_nextjs_page "client/src/pages/ReferAFriend.tsx" "app/refer-a-friend"

# Store checkout
create_nextjs_page "client/src/pages/MembershipCheckout.tsx" "app/store/checkout/[slug]"
create_nextjs_page "client/src/pages/MembershipSuccess.tsx" "app/store/checkout/success"

# Location Pages
create_nextjs_page "client/src/pages/service-areas/Austin.tsx" "app/plumber-austin"
create_nextjs_page "client/src/pages/service-areas/CedarPark.tsx" "app/plumber-in-cedar-park--tx"
create_nextjs_page "client/src/pages/service-areas/Leander.tsx" "app/plumber-leander"
create_nextjs_page "client/src/pages/service-areas/RoundRock.tsx" "app/round-rock-plumber"
create_nextjs_page "client/src/pages/service-areas/Georgetown.tsx" "app/plumber-georgetown"
create_nextjs_page "client/src/pages/service-areas/Pflugerville.tsx" "app/plumber-pflugerville"
create_nextjs_page "client/src/pages/service-areas/LibertyHill.tsx" "app/plumber-liberty-hill"
create_nextjs_page "client/src/pages/service-areas/Buda.tsx" "app/plumber-buda"
create_nextjs_page "client/src/pages/service-areas/Kyle.tsx" "app/plumber-kyle"
create_nextjs_page "client/src/pages/service-areas/MarbleFalls.tsx" "app/plumber-marble-falls"
create_nextjs_page "client/src/pages/service-areas/Burnet.tsx" "app/plumber-burnet"
create_nextjs_page "client/src/pages/service-areas/HorseshoeBay.tsx" "app/plumber-horseshoe-bay"
create_nextjs_page "client/src/pages/service-areas/Kingsland.tsx" "app/plumber-kingsland"
create_nextjs_page "client/src/pages/service-areas/GraniteShoals.tsx" "app/plumber-granite-shoals"
create_nextjs_page "client/src/pages/service-areas/Bertram.tsx" "app/plumber-bertram"
create_nextjs_page "client/src/pages/service-areas/Spicewood.tsx" "app/plumber-spicewood"

# Also create alternate URL aliases
create_nextjs_page "client/src/pages/DrainCleaning.tsx" "app/drain-cleaning-services"
create_nextjs_page "client/src/pages/FaucetInstallation.tsx" "app/faucet-installation"
create_nextjs_page "client/src/pages/BackflowTesting.tsx" "app/backflow-testing"
create_nextjs_page "client/src/pages/LeakRepair.tsx" "app/water-leak-repair"
create_nextjs_page "client/src/pages/EmergencyPlumbing.tsx" "app/emergency-plumbing"
create_nextjs_page "client/src/pages/GasServices.tsx" "app/gas-line-services"

# Create service-area dynamic route fallback
create_nextjs_page "client/src/pages/ServiceAreaPage.tsx" "app/service-area/[slug]"

echo ""
echo "✨ Migration complete!"
echo "📊 Created $(find app -name 'page.tsx' | wc -l) Next.js pages"
