import { Switch, Route, Redirect, useLocation } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initDynamicPhoneNumbers, replacePhoneNumbers } from "@/lib/dynamicPhoneNumbers";
import { initAllAnalytics } from "@/lib/analytics";
import { useAnalytics } from "@/hooks/use-analytics";
import CookieBanner from "@/components/CookieBanner";
import { PhoneConfigProvider } from "@/contexts/PhoneConfigContext";

// Critical pages - eagerly loaded for best initial load
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";

// Service pages - lazy loaded to reduce main bundle
const WaterHeaterServices = lazy(() => import("@/pages/WaterHeaterServices"));
const DrainCleaning = lazy(() => import("@/pages/DrainCleaning"));
const LeakRepair = lazy(() => import("@/pages/LeakRepair"));
const ToiletFaucet = lazy(() => import("@/pages/ToiletFaucet"));
const GasServices = lazy(() => import("@/pages/GasServices"));
const CommercialPlumbing = lazy(() => import("@/pages/CommercialPlumbing"));
const BackflowTesting = lazy(() => import("@/pages/BackflowTesting"));
const EmergencyPlumbing = lazy(() => import("@/pages/EmergencyPlumbing"));
const PlumberNearMe = lazy(() => import("@/pages/PlumberNearMe"));
const CommercialServicesLanding = lazy(() => import("@/pages/CommercialServicesLanding"));

// Lazy load less critical pages for better performance
const ServiceAreas = lazy(() => import("@/pages/ServiceAreas"));
const ServiceAreaPage = lazy(() => import("@/pages/ServiceAreaPage"));
const AustinServiceArea = lazy(() => import("@/pages/service-areas/Austin"));
const CedarParkServiceArea = lazy(() => import("@/pages/service-areas/CedarPark"));
const LeanderServiceArea = lazy(() => import("@/pages/service-areas/Leander"));
const RoundRockServiceArea = lazy(() => import("@/pages/service-areas/RoundRock"));
const GeorgetownServiceArea = lazy(() => import("@/pages/service-areas/Georgetown"));
const PflugervilleServiceArea = lazy(() => import("@/pages/service-areas/Pflugerville"));
const LibertyHillServiceArea = lazy(() => import("@/pages/service-areas/LibertyHill"));
const BudaServiceArea = lazy(() => import("@/pages/service-areas/Buda"));
const KyleServiceArea = lazy(() => import("@/pages/service-areas/Kyle"));
const MarbleFallsServiceArea = lazy(() => import("@/pages/service-areas/MarbleFalls"));
const BurnetServiceArea = lazy(() => import("@/pages/service-areas/Burnet"));
const HorseshoeBayServiceArea = lazy(() => import("@/pages/service-areas/HorseshoeBay"));
const KingslandServiceArea = lazy(() => import("@/pages/service-areas/Kingsland"));
const GraniteShoalsServiceArea = lazy(() => import("@/pages/service-areas/GraniteShoals"));
const BertramServiceArea = lazy(() => import("@/pages/service-areas/Bertram"));
const SpicewoodServiceArea = lazy(() => import("@/pages/service-areas/Spicewood"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const About = lazy(() => import("@/pages/About"));
const Store = lazy(() => import("@/pages/Store"));
const ScheduleAppointment = lazy(() => import("@/pages/ScheduleAppointment"));
const DrainageSolutions = lazy(() => import("@/pages/DrainageSolutions"));
const FaucetInstallation = lazy(() => import("@/pages/FaucetInstallation"));
const GarbageDisposalRepair = lazy(() => import("@/pages/GarbageDisposalRepair"));
const GasLeakDetection = lazy(() => import("@/pages/GasLeakDetection"));
const HydroJetting = lazy(() => import("@/pages/HydroJetting"));
const PermitResolution = lazy(() => import("@/pages/PermitResolution"));
const RooterServices = lazy(() => import("@/pages/RooterServices"));
const SewagePumpServices = lazy(() => import("@/pages/SewagePumpServices"));
const WaterPressureSolutions = lazy(() => import("@/pages/WaterPressureSolutions"));
const WaterHeaterGuide = lazy(() => import("@/pages/WaterHeaterGuide"));
const Services = lazy(() => import("@/pages/Services"));
const Contact = lazy(() => import("@/pages/Contact"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const RefundReturns = lazy(() => import("@/pages/RefundReturns"));
const MembershipBenefits = lazy(() => import("@/pages/MembershipBenefits"));
const MembershipCheckout = lazy(() => import("@/pages/MembershipCheckout"));
const MembershipSuccess = lazy(() => import("@/pages/MembershipSuccess"));
const SuccessStories = lazy(() => import("@/pages/SuccessStories"));
const OAuthAdminLogin = lazy(() => import("@/pages/OAuthAdminLogin"));
const UnifiedAdminDashboard = lazy(() => import("@/pages/UnifiedAdminDashboard"));
const TrackingNumbersAdmin = lazy(() => import("@/pages/TrackingNumbersAdmin"));
const SuccessStoriesAdmin = lazy(() => import("@/pages/SuccessStoriesAdmin"));
const CommercialCustomersAdmin = lazy(() => import("@/pages/CommercialCustomersAdmin"));
const PageMetadataAdmin = lazy(() => import("@/pages/PageMetadataAdmin"));
const ProductsAdmin = lazy(() => import("@/pages/ProductsAdmin"));

// Simple loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Immediately scroll to top - use 'auto' to override smooth scroll behavior for navigation
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    // Re-run phone number replacement on route change
    setTimeout(replacePhoneNumbers, 100);
  }, [location]);

  return null;
}

function Router() {
  useAnalytics();
  
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Switch>
      <Route path="/" component={Home} />
      
      {/* SEO Landing Pages */}
      <Route path="/plumber-near-me" component={PlumberNearMe} />
      <Route path="/commercial-services" component={CommercialServicesLanding} />
      
      {/* Main service pages */}
      <Route path="/water-heater-services" component={WaterHeaterServices} />
      <Route path="/drain-cleaning" component={DrainCleaning} />
      <Route path="/leak-repair" component={LeakRepair} />
      <Route path="/toilet-faucet" component={ToiletFaucet} />
      <Route path="/gas-services" component={GasServices} />
      <Route path="/backflow" component={BackflowTesting} />
      <Route path="/commercial-plumbing" component={CommercialPlumbing} />
      <Route path="/emergency" component={EmergencyPlumbing} />
      <Route path="/emergency-plumbing" component={EmergencyPlumbing} />
      
      {/* Additional service pages */}
      <Route path="/backflow-testing" component={BackflowTesting} />
      <Route path="/drainage-solutions" component={DrainageSolutions} />
      <Route path="/drain-cleaning-services" component={DrainCleaning} />
      <Route path="/faucet-installation" component={FaucetInstallation} />
      <Route path="/garbage-disposal-repair" component={GarbageDisposalRepair} />
      <Route path="/gas-leak-detection" component={GasLeakDetection} />
      <Route path="/gas-line-services" component={GasServices} />
      <Route path="/hydro-jetting-services" component={HydroJetting} />
      <Route path="/permit-resolution-services" component={PermitResolution} />
      <Route path="/rooter-services" component={RooterServices} />
      <Route path="/sewage-pump-services" component={SewagePumpServices} />
      <Route path="/services" component={Services} />
      {/* 301 redirect: toilet-repair-services -> toilet-faucet for SEO canonicalization */}
      <Route path="/toilet-repair-services">{() => <Redirect to="/toilet-faucet" />}</Route>
      <Route path="/water-heater-guide" component={WaterHeaterGuide} />
      <Route path="/water-leak-repair" component={LeakRepair} />
      <Route path="/water-pressure-solutions" component={WaterPressureSolutions} />
      
      {/* Service areas */}
      <Route path="/service-area" component={ServiceAreas} />
      <Route path="/service-area/:slug" component={ServiceAreaPage} />
      <Route path="/plumber-austin" component={AustinServiceArea} />
      <Route path="/plumber-in-cedar-park--tx" component={CedarParkServiceArea} />
      <Route path="/plumber-leander" component={LeanderServiceArea} />
      {/* 301 redirect: legacy Leander URL -> canonical Leander URL for SEO */}
      <Route path="/plumber-in-leander--tx524c3ae3">{() => <Redirect to="/plumber-leander" />}</Route>
      <Route path="/round-rock-plumber" component={RoundRockServiceArea} />
      <Route path="/plumber-georgetown" component={GeorgetownServiceArea} />
      <Route path="/plumber-pflugerville" component={PflugervilleServiceArea} />
      <Route path="/plumber-liberty-hill" component={LibertyHillServiceArea} />
      <Route path="/plumber-buda" component={BudaServiceArea} />
      <Route path="/plumber-kyle" component={KyleServiceArea} />
      <Route path="/plumber-marble-falls" component={MarbleFallsServiceArea} />
      <Route path="/plumber-burnet" component={BurnetServiceArea} />
      <Route path="/plumber-horseshoe-bay" component={HorseshoeBayServiceArea} />
      <Route path="/plumber-kingsland" component={KingslandServiceArea} />
      <Route path="/plumber-granite-shoals" component={GraniteShoalsServiceArea} />
      <Route path="/plumber-bertram" component={BertramServiceArea} />
      <Route path="/plumber-spicewood" component={SpicewoodServiceArea} />
      
      {/* Utility pages */}
      <Route path="/contact" component={Contact} />
      <Route path="/faq" component={FAQ} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/refund_returns" component={RefundReturns} />
      <Route path="/membership-benefits" component={MembershipBenefits} />
      <Route path="/store/checkout/:slug" component={MembershipCheckout} />
      <Route path="/store/checkout/success" component={MembershipSuccess} />
      <Route path="/success-stories" component={SuccessStories} />
      
      {/* Store & Shop - Now using Square Online */}
      <Route path="/store" component={Store} />
      <Route path="/shop" component={Store} />
      <Route path="/category/memberships" component={Store} />
      <Route path="/category/products" component={Store} />
      <Route path="/signin">{() => <Redirect to="/store" />}</Route>
      
      {/* 301 redirects: Old product URLs -> /store (Square Online manages products now) */}
      <Route path="/store/checkout/commercial-vip">{() => <Redirect to="/store" />}</Route>
      <Route path="/store/checkout/platinum-vip-membership-tank">{() => <Redirect to="/store" />}</Route>
      <Route path="/store/checkout/platinum-vip-membership-tankless">{() => <Redirect to="/store" />}</Route>
      <Route path="/store/checkout/rental-vip">{() => <Redirect to="/store" />}</Route>
      <Route path="/store/checkout/silver-vip-membership-tank">{() => <Redirect to="/store" />}</Route>
      <Route path="/store/checkout/silver-vip-membership-tankless">{() => <Redirect to="/store" />}</Route>
      <Route path="/store/checkout/bio-pure-septic-drain-rv-restore-maintain-32-oz">{() => <Redirect to="/store" />}</Route>
      {/* Catch-all for any other old checkout URLs */}
      <Route path="/store/checkout/:slug">{() => <Redirect to="/store" />}</Route>
      <Route path="/store/success">{() => <Redirect to="/store" />}</Route>
      
      {/* Blog listing page */}
      <Route path="/blog" component={Blog} />
      
      {/* Other pages */}
      <Route path="/schedule-appointment" component={ScheduleAppointment} />
      <Route path="/about" component={About} />
      
      {/* Admin routes - OAuth only */}
      <Route path="/admin/oauth-login" component={OAuthAdminLogin} />
      <Route path="/admin/login">{() => <Redirect to="/admin/oauth-login" />}</Route>
      <Route path="/admin/success-stories" component={SuccessStoriesAdmin} />
      <Route path="/admin/tracking-numbers" component={TrackingNumbersAdmin} />
      <Route path="/admin/commercial-customers" component={CommercialCustomersAdmin} />
      <Route path="/admin/page-metadata" component={PageMetadataAdmin} />
      <Route path="/admin/products" component={ProductsAdmin} />
      <Route path="/admin" component={UnifiedAdminDashboard} />
      
      {/* Blog posts - must be last to avoid conflicts with other routes */}
      <Route path="/:slug" component={BlogPost} />
      
      <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function App() {
  const [location] = useLocation();

  useEffect(() => {
    // Initialize dynamic phone number tracking
    initDynamicPhoneNumbers();
  }, []); // Run once on mount

  useEffect(() => {
    // Re-run phone number replacement on route changes
    replacePhoneNumbers();
  }, [location]); // Run whenever route changes

  useEffect(() => {
    // Initialize Google Analytics
    // Initialize all analytics platforms (GA, Meta Pixel, GTM, Clarity)
    // Each platform checks for its own environment variable and gracefully skips if missing
    initAllAnalytics();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PhoneConfigProvider>
          <CookieBanner />
          <Toaster />
          <Router />
        </PhoneConfigProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
