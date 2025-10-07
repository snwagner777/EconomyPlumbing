import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import WaterHeaterServices from "@/pages/WaterHeaterServices";
import DrainCleaning from "@/pages/DrainCleaning";
import LeakRepair from "@/pages/LeakRepair";
import ToiletFaucet from "@/pages/ToiletFaucet";
import GasServices from "@/pages/GasServices";
import BackflowServices from "@/pages/BackflowServices";
import CommercialPlumbing from "@/pages/CommercialPlumbing";
import EmergencyPlumbing from "@/pages/EmergencyPlumbing";
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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/water-heater-services" component={WaterHeaterServices} />
      <Route path="/drain-cleaning" component={DrainCleaning} />
      <Route path="/leak-repair" component={LeakRepair} />
      <Route path="/toilet-faucet" component={ToiletFaucet} />
      <Route path="/gas-services" component={GasServices} />
      <Route path="/backflow" component={BackflowServices} />
      <Route path="/commercial-plumbing" component={CommercialPlumbing} />
      <Route path="/emergency" component={EmergencyPlumbing} />
      <Route path="/service-areas" component={ServiceAreas} />
      <Route path="/service-areas/austin" component={AustinServiceArea} />
      <Route path="/service-areas/cedar-park" component={CedarParkServiceArea} />
      <Route path="/service-areas/leander" component={LeanderServiceArea} />
      <Route path="/service-areas/round-rock" component={RoundRockServiceArea} />
      <Route path="/service-areas/georgetown" component={GeorgetownServiceArea} />
      <Route path="/service-areas/pflugerville" component={PflugervilleServiceArea} />
      <Route path="/service-areas/liberty-hill" component={LibertyHillServiceArea} />
      <Route path="/service-areas/buda" component={BudaServiceArea} />
      <Route path="/service-areas/kyle" component={KyleServiceArea} />
      <Route path="/service-areas/marble-falls" component={MarbleFallsServiceArea} />
      <Route path="/service-areas/burnet" component={BurnetServiceArea} />
      <Route path="/service-areas/horseshoe-bay" component={HorseshoeBayServiceArea} />
      <Route path="/service-areas/kingsland" component={KingslandServiceArea} />
      <Route path="/service-areas/granite-shoals" component={GraniteShoalsServiceArea} />
      <Route path="/service-areas/bertram" component={BertramServiceArea} />
      <Route path="/service-areas/spicewood" component={SpicewoodServiceArea} />
      <Route path="/schedule-appointment" component={ScheduleAppointment} />
      <Route path="/fall-plumbing-tips">
        {() => <BlogPost params={{ slug: "fall-plumbing-tips" }} />}
      </Route>
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/blog" component={Blog} />
      <Route path="/about" component={About} />
      <Route path="/store/checkout/:slug" component={Checkout} />
      <Route path="/store" component={Store} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
