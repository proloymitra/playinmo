import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  
  useEffect(() => {
    // Check if user has already given consent
    const hasConsent = localStorage.getItem("cookieConsent");
    if (!hasConsent) {
      setShowBanner(true);
    }
  }, []);
  
  const acceptAll = () => {
    localStorage.setItem("cookieConsent", "all");
    setShowBanner(false);
  };
  
  const acceptEssential = () => {
    localStorage.setItem("cookieConsent", "essential");
    setShowBanner(false);
  };
  
  const handleClose = () => {
    setShowBanner(false);
  };
  
  if (!showBanner) return null;
  
  return (
    <div className="fixed bottom-0 left-0 w-full bg-card p-4 shadow-lg z-50 border-t">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Cookie Notice</h3>
            <p className="text-sm text-muted-foreground">
              We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies as described in our 
              <a href="/cookie-policy" className="text-primary underline ml-1 hover:text-primary/90">
                Cookie Policy
              </a>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={acceptEssential}
            >
              Essential Only
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={acceptAll}
            >
              Accept All
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}