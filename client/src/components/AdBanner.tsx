import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, X } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { Advertisement } from "@shared/schema";

interface AdBannerProps {
  placement: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function AdBanner({ placement, className = "", size = 'medium' }: AdBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  const { data: ad, isLoading } = useQuery<Advertisement | null>({
    queryKey: [`/api/advertisements/placement/${placement}`],
  });

  const handleAdClick = async () => {
    if (!ad) return;

    try {
      await apiRequest(`/api/advertisements/${ad.id}/click`, {
        method: 'POST'
      });
      
      if (ad.clickUrl) {
        window.open(ad.clickUrl, '_blank');
      }
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }
  };

  const handleAdView = async () => {
    if (!ad || hasTrackedView) return;

    try {
      await apiRequest(`/api/advertisements/${ad.id}/view`, {
        method: 'POST'
      });
      setHasTrackedView(true);
    } catch (error) {
      console.error('Error tracking ad view:', error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'h-20 text-xs';
      case 'large':
        return 'h-32 text-base';
      default:
        return 'h-24 text-sm';
    }
  };

  if (isLoading || !ad || !isVisible) {
    return null;
  }

  // Track view when component mounts
  if (!hasTrackedView) {
    handleAdView();
  }

  return (
    <Card className={`relative overflow-hidden border border-muted ${getSizeClasses()} ${className}`}>
      <button
        onClick={handleClose}
        className="absolute top-1 right-1 z-10 p-1 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Close advertisement"
      >
        <X className="w-3 h-3" />
      </button>

      <CardContent 
        className="p-0 h-full cursor-pointer group relative"
        onClick={handleAdClick}
      >
        <div className="flex items-center h-full">
          {ad.mediaUrl && ad.type === 'image' && (
            <div className="flex-shrink-0 w-16 h-full">
              <img 
                src={ad.mediaUrl} 
                alt={ad.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 p-3 flex flex-col justify-center">
            <h4 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
              {ad.title}
            </h4>
            {ad.description && (
              <p className="text-muted-foreground line-clamp-2 mt-1">
                {ad.description}
              </p>
            )}
            <div className="flex items-center mt-1 text-xs text-muted-foreground">
              <span>Sponsored</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </div>
          </div>
        </div>

        {ad.type === 'video' && ad.mediaUrl && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
              Watch Video
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}