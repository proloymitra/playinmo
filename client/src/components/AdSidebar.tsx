import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, X } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { Advertisement } from "@shared/schema";

interface AdSidebarProps {
  placement: string;
  className?: string;
  title?: string;
}

export default function AdSidebar({ placement, className = "", title = "Sponsored" }: AdSidebarProps) {
  const [closedAds, setClosedAds] = useState<number[]>([]);

  const { data: ads, isLoading } = useQuery<Advertisement[]>({
    queryKey: [`/api/advertisements?placement=${placement}`],
  });

  const handleAdClick = async (ad: Advertisement) => {
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

  const handleAdView = async (ad: Advertisement) => {
    try {
      await apiRequest(`/api/advertisements/${ad.id}/view`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error tracking ad view:', error);
    }
  };

  const handleCloseAd = (adId: number) => {
    setClosedAds(prev => [...prev, adId]);
  };

  if (isLoading || !ads || ads.length === 0) {
    return null;
  }

  const visibleAds = ads.filter(ad => !closedAds.includes(ad.id));

  if (visibleAds.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      
      {visibleAds.map((ad) => (
        <AdCard 
          key={ad.id} 
          ad={ad} 
          onClose={() => handleCloseAd(ad.id)}
          onClick={() => handleAdClick(ad)}
          onView={() => handleAdView(ad)}
        />
      ))}
    </div>
  );
}

interface AdCardProps {
  ad: Advertisement;
  onClose: () => void;
  onClick: () => void;
  onView: () => void;
}

function AdCard({ ad, onClose, onClick, onView }: AdCardProps) {
  const [hasViewed, setHasViewed] = useState(false);

  // Track view when component mounts
  if (!hasViewed) {
    onView();
    setHasViewed(true);
  }

  return (
    <Card className="relative overflow-hidden cursor-pointer group hover:shadow-md transition-shadow">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Close advertisement"
      >
        <X className="w-3 h-3" />
      </button>

      <div onClick={onClick}>
        {ad.mediaUrl && ad.type === 'image' && (
          <div className="aspect-video overflow-hidden">
            <img 
              src={ad.mediaUrl} 
              alt={ad.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <CardContent className="p-4">
          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {ad.title}
          </h4>
          
          {ad.description && (
            <p className="text-xs text-muted-foreground line-clamp-3 mt-2">
              {ad.description}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">Sponsored</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardContent>

        {ad.type === 'video' && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-medium">
              Watch Video
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}