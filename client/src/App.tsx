import { Switch, Route, Redirect, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initDynamicPhoneNumbers, replacePhoneNumbers } from "@/lib/dynamicPhoneNumbers";
import { initGA } from "@/lib/analytics";
import { useAnalytics } from "@/hooks/use-analytics";
import CookieBanner from "@/components/CookieBanner";
import Home from "@/pages/Home";
import WaterHeaterServices from "@/pages/WaterHeaterServices";
import DrainCleaning from "@/pages/DrainCleaning";
import LeakRepair from "@/pages/LeakRepair";
import ToiletFaucet from "@/pages/ToiletFaucet";
import GasServices from "@/pages/GasServices";
import CommercialPlumbing from "@/pages/CommercialPlumbing";
import ServiceAreas from "@/pages/ServiceAreas";
import AustinServiceArea from "@/pages/service-areas/Austin";
import CedarParkServiceArea from "@/pages/service-areas/CedarPark";
import LeanderServiceArea from "@/pages/service-areas/Leander";
import RoundRockServiceArea from "@/pages/service-areas/RoundRock";
import GeorgetownServiceArea from "@/pages/service-areas/Georgetown";
import PflugervilleServiceArea from "@/pages/service-areas/Pflugerville";
import LibertyHillServiceArea from "@/pages/service-areas/LibertyHill";
import BudaServiceArea from "@/pages/service-areas/Buda";
import KyleServiceArea from "@/pages/service-areas/Kyle";
import MarbleFallsServiceArea from "@/pages/service-areas/MarbleFalls";
import BurnetServiceArea from "@/pages/service-areas/Burnet";
import HorseshoeBayServiceArea from "@/pages/service-areas/HorseshoeBay";
import KingslandServiceArea from "@/pages/service-areas/Kingsland";
import GraniteShoalsServiceArea from "@/pages/service-areas/GraniteShoals";
import BertramServiceArea from "@/pages/service-areas/Bertram";
import SpicewoodServiceArea from "@/pages/service-areas/Spicewood";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import About from "@/pages/About";
import Store from "@/pages/Store";
import Checkout from "@/pages/Checkout";
import ScheduleAppointment from "@/pages/ScheduleAppointment";
import BackflowTesting from "@/pages/BackflowTesting";
import DrainageSolutions from "@/pages/DrainageSolutions";
import FaucetInstallation from "@/pages/FaucetInstallation";
import GarbageDisposalRepair from "@/pages/GarbageDisposalRepair";
import GasLeakDetection from "@/pages/GasLeakDetection";
import HydroJetting from "@/pages/HydroJetting";
import PermitResolution from "@/pages/PermitResolution";
import RooterServices from "@/pages/RooterServices";
import SewagePumpServices from "@/pages/SewagePumpServices";
import WaterPressureSolutions from "@/pages/WaterPressureSolutions";
import WaterHeaterGuide from "@/pages/WaterHeaterGuide";
import Services from "@/pages/Services";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import RefundReturns from "@/pages/RefundReturns";
import MembershipBenefits from "@/pages/MembershipBenefits";
import NotFound from "@/pages/not-found";

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
      
      {/* Store & Shop */}
      <Route path="/store/checkout/:slug" component={Checkout} />
      <Route path="/store" component={Store} />
      <Route path="/shop" component={Store} />
      <Route path="/category/memberships" component={Store} />
      <Route path="/category/products" component={Store} />
      <Route path="/signin">{() => <Redirect to="/store" />}</Route>
      
      {/* Blog */}
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/fall-plumbing-tips" component={BlogPost} />
      <Route path="/blog" component={Blog} />
      
      {/* Other pages */}
      <Route path="/schedule-appointment" component={ScheduleAppointment} />
      <Route path="/about" component={About} />
      
      <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  useEffect(() => {
    // Initialize dynamic phone number tracking
    initDynamicPhoneNumbers();
    
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
        <CookieBanner />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
