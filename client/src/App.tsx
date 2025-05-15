import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import GameDetailsPage from "@/pages/GameDetailsPage";
import CategoryPage from "@/pages/CategoryPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import ProfilePage from "@/pages/ProfilePage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";
import CookiePolicyPage from "@/pages/CookiePolicyPage";
import ResponsibleGamingPage from "@/pages/ResponsibleGamingPage";
import AdvertiseWithUsPage from "@/pages/AdvertiseWithUsPage";

// CMS Pages
import CMSLoginPage from "@/pages/admin/CMSLoginPage";
import CMSDashboardPage from "@/pages/admin/CMSDashboardPage";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsentBanner from "@/components/CookieConsentBanner";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/game/:id" component={GameDetailsPage} />
          <Route path="/category/:slug" component={CategoryPage} />
          <Route path="/leaderboard" component={LeaderboardPage} />
          <Route path="/profile/:id" component={ProfilePage} />
          <Route path="/privacy-policy" component={PrivacyPolicyPage} />
          <Route path="/terms-of-service" component={TermsOfServicePage} />
          <Route path="/cookie-policy" component={CookiePolicyPage} />
          <Route path="/responsible-gaming" component={ResponsibleGamingPage} />
          <Route path="/advertise-with-us" component={AdvertiseWithUsPage} />
          
          {/* CMS Routes */}
          <Route path="/cms" component={CMSLoginPage} />
          <Route path="/cms/dashboard" component={CMSDashboardPage} />
          
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <CookieConsentBanner />
    </div>
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
