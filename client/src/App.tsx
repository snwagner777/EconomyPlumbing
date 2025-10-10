import { Switch, Route, Redirect, useLocation } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initDynamicPhoneNumbers, replacePhoneNumbers } from "@/lib/dynamicPhoneNumbers";
import { initGA } from "@/lib/analytics";
import { useAnalytics } from "@/hooks/use-analytics";
import CookieBanner from "@/components/CookieBanner";
import { PhoneConfigProvider } from "@/contexts/PhoneConfigContext";

// Critical pages - eagerly loaded for best UX
import Home from "@/pages/Home";
import WaterHeaterServices from "@/pages/WaterHeaterServices";
import DrainCleaning from "@/pages/DrainCleaning";
import LeakRepair from "@/pages/LeakRepair";
import ToiletFaucet from "@/pages/ToiletFaucet";
import GasServices from "@/pages/GasServices";
import CommercialPlumbing from "@/pages/CommercialPlumbing";
import BackflowTesting from "@/pages/BackflowTesting";
import EmergencyPlumbing from "@/pages/EmergencyPlumbing";
import NotFound from "@/pages/not-found";

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
const Checkout = lazy(() => import("@/pages/Checkout"));
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
const SuccessStories = lazy(() => import("@/pages/SuccessStories"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const TrackingNumbersAdmin = lazy(() => import("@/pages/TrackingNumbersAdmin"));

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
    window.scrollTo(0, 0);
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
      <Route path="/toilet-repair-services" component={ToiletFaucet} />
      <Route path="/water-heater-guide" component={WaterHeaterGuide} />
      <Route path="/water-leak-repair" component={LeakRepair} />
      <Route path="/water-pressure-solutions" component={WaterPressureSolutions} />
      
      {/* Service areas */}
      <Route path="/service-area" component={ServiceAreas} />
      <Route path="/service-area/:slug" component={ServiceAreaPage} />
      <Route path="/plumber-austin" component={AustinServiceArea} />
      <Route path="/plumber-in-cedar-park--tx" component={CedarParkServiceArea} />
      <Route path="/plumber-leander" component={LeanderServiceArea} />
      <Route path="/plumber-in-leander--tx524c3ae3" component={LeanderServiceArea} />
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
      <Route path="/success-stories" component={SuccessStories} />
      
      {/* Store & Shop */}
      <Route path="/store/checkout/:slug" component={Checkout} />
      <Route path="/store" component={Store} />
      <Route path="/shop" component={Store} />
      <Route path="/category/memberships" component={Store} />
      <Route path="/category/products" component={Store} />
      <Route path="/signin">{() => <Redirect to="/store" />}</Route>
      
      {/* Blog listing page */}
      <Route path="/blog" component={Blog} />
      
      {/* Other pages */}
      <Route path="/schedule-appointment" component={ScheduleAppointment} />
      <Route path="/about" component={About} />
      
      {/* Admin routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/tracking-numbers" component={TrackingNumbersAdmin} />
      <Route path="/admin" component={AdminDashboard} />
      
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
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }
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
