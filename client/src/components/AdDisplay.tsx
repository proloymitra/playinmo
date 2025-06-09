import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

interface AdDisplayProps {
  placement: "banner" | "sidebar" | "popup" | "interstitial";
  className?: string;
}

interface Advertisement {
  id: number;
  title: string;
  description?: string;
  type: "image" | "video" | "audio";
  mediaUrl: string;
  clickUrl?: string;
  placement: string;
  priority: number;
  isActive: boolean;
  viewCount: number;
  clickCount: number;
}

export default function AdDisplay({ placement, className }: AdDisplayProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  const { data: advertisements = [] } = useQuery({
    queryKey: ["/api/advertisements", placement],
    queryFn: () => apiRequest(`/api/advertisements?placement=${placement}`),
  });

  // Get the highest priority ad for this placement
  const ad = advertisements.length > 0 ? advertisements[0] : null;

  useEffect(() => {
    if (ad && !hasTrackedView && adRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasTrackedView) {
              trackView(ad.id);
              setHasTrackedView(true);
            }
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(adRef.current);
      return () => observer.disconnect();
    }
  }, [ad, hasTrackedView]);

  const trackView = async (adId: number) => {
    try {
      await apiRequest(`/api/advertisements/${adId}/view`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to track ad view:", error);
    }
  };

  const trackClick = async (adId: number) => {
    try {
      await apiRequest(`/api/advertisements/${adId}/click`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to track ad click:", error);
    }
  };

  const handleAdClick = () => {
    if (!ad) return;
    
    trackClick(ad.id);
    
    if (ad.clickUrl) {
      window.open(ad.clickUrl, "_blank");
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!ad || !isVisible) {
    return null;
  }

  const renderAdContent = () => {
    switch (ad.type) {
      case "image":
        return (
          <img
            src={ad.mediaUrl}
            alt={ad.title}
            className="w-full h-full object-cover cursor-pointer"
            onClick={handleAdClick}
          />
        );
      
      case "video":
        return (
          <video
            src={ad.mediaUrl}
            autoPlay
            muted
            loop
            className="w-full h-full object-cover cursor-pointer"
            onClick={handleAdClick}
          />
        );
      
      case "audio":
        return (
          <div 
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 cursor-pointer"
            onClick={handleAdClick}
          >
            <div className="text-center text-white p-4">
              <h3 className="font-bold text-lg mb-2">{ad.title}</h3>
              {ad.description && (
                <p className="text-sm opacity-90">{ad.description}</p>
              )}
              <audio src={ad.mediaUrl} controls className="mt-2" />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getAdStyles = () => {
    switch (placement) {
      case "banner":
        return "w-full h-24 md:h-32";
      case "sidebar":
        return "w-full h-48";
      case "popup":
        return "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-60 z-50";
      case "interstitial":
        return "fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center";
      default:
        return "w-full h-32";
    }
  };

  if (placement === "interstitial") {
    return (
      <div className={getAdStyles()}>
        <Card className="relative w-96 h-72 overflow-hidden">
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
          <div ref={adRef} className="w-full h-full">
            {renderAdContent()}
          </div>
        </Card>
      </div>
    );
  }

  if (placement === "popup") {
    return (
      <Card className={`${getAdStyles()} ${className} relative overflow-hidden`}>
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
        >
          <X className="h-4 w-4" />
        </button>
        <div ref={adRef} className="w-full h-full">
          {renderAdContent()}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${getAdStyles()} ${className} relative overflow-hidden`}>
      <div ref={adRef} className="w-full h-full">
        {renderAdContent()}
      </div>
      <div className="absolute bottom-1 right-1 text-xs text-gray-400 bg-black bg-opacity-50 px-1 rounded">
        Ad
      </div>
    </Card>
  );
}