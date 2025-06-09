import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useEffect } from 'react';
import { initGA } from './lib/analytics';
import { useAnalytics } from './hooks/use-analytics';

import Home from "@/pages/Home";
import GamesPage from "@/pages/GamesPage";
import GameDetailsPage from "@/pages/GameDetailsPage";
import CategoryPage from "@/pages/CategoryPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import ProfilePage from "@/pages/ProfilePage";
import LoginPage from "@/pages/LoginPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import HelpPage from "@/pages/HelpPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";
import CookiePolicyPage from "@/pages/CookiePolicyPage";
import ResponsibleGamingPage from "@/pages/ResponsibleGamingPage";
import AdvertiseWithUsPage from "@/pages/AdvertiseWithUsPage";
import AchievementsPage from "@/pages/AchievementsPage";
import RewardsPage from "@/pages/RewardsPage";

// CMS Pages
import CMSLoginPage from "@/pages/admin/CMSLoginPage";
import CMSDashboardPage from "@/pages/admin/CMSDashboardPage";
import CMSGamesPage from "@/pages/admin/CMSGamesPage";
import CMSCategoriesPage from "@/pages/admin/CMSCategoriesPage";
import CMSWebsiteContentPage from "@/pages/admin/CMSWebsiteContentPage";
import AdvertisementManagementPage from "@/pages/admin/AdvertisementManagementPage";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsentBanner from "@/components/CookieConsentBanner";

function Router() {
  // Track page views when routes change
  useAnalytics();
  
  // Check if the current route is an admin route
  const isAdminRoute = window.location.pathname.startsWith('/cms');
  
  // Regular site with header and footer
  if (!isAdminRoute) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/games" component={GamesPage} />
            <Route path="/game/:id" component={GameDetailsPage} />
            <Route path="/category/:slug" component={CategoryPage} />
            <Route path="/leaderboard" component={LeaderboardPage} />
            <Route path="/achievements" component={AchievementsPage} />
            <Route path="/rewards" component={RewardsPage} />
            <Route path="/profile/:id" component={ProfilePage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/about" component={AboutPage} />
            <Route path="/contact" component={ContactPage} />
            <Route path="/help" component={HelpPage} />
            <Route path="/privacy-policy" component={PrivacyPolicyPage} />
            <Route path="/terms-of-service" component={TermsOfServicePage} />
            <Route path="/cookie-policy" component={CookiePolicyPage} />
            <Route path="/responsible-gaming" component={ResponsibleGamingPage} />
            <Route path="/advertise-with-us" component={AdvertiseWithUsPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <Footer />
        <CookieConsentBanner />
      </div>
    );
  }
  
  // Admin routes without header and footer
  return (
    <div>
      <Switch>
        <Route path="/cms" component={CMSLoginPage} />
        <Route path="/cms/dashboard" component={CMSDashboardPage} />
        <Route path="/cms/games" component={CMSGamesPage} />
        <Route path="/cms/categories" component={CMSCategoriesPage} />
        <Route path="/cms/website-content" component={CMSWebsiteContentPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }
  }, []);

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
