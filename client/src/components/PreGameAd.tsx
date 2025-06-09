import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Play } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PreGameAdProps {
  onAdComplete: () => void;
  onSkip: () => void;
}

export default function PreGameAd({ onAdComplete, onSkip }: PreGameAdProps) {
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [adViewed, setAdViewed] = useState(false);

  const { data: ad, isLoading } = useQuery({
    queryKey: ['/api/advertisements/placement/pre-game'],
  });

  useEffect(() => {
    if (!ad || adViewed) return;

    // Track ad view
    const trackView = async () => {
      try {
        await apiRequest(`/api/advertisements/${ad.id}/view`, {
          method: 'POST'
        });
        setAdViewed(true);
      } catch (error) {
        console.error('Failed to track ad view:', error);
      }
    };

    trackView();

    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [ad, adViewed]);

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
      console.error('Failed to track ad click:', error);
    }
  };

  const handleSkip = () => {
    if (canSkip) {
      onSkip();
      onAdComplete();
    }
  };

  const handleContinue = () => {
    onAdComplete();
  };

  if (isLoading || !ad) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <Card className="w-96 max-w-[90vw]">
          <CardContent className="p-6 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="relative">
          {/* Skip button */}
          <div className="absolute top-4 right-4 z-10">
            {canSkip ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSkip}
                className="bg-black bg-opacity-50 text-white hover:bg-opacity-75"
              >
                <X className="h-4 w-4 mr-1" />
                Skip
              </Button>
            ) : (
              <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                Skip in {countdown}s
              </div>
            )}
          </div>

          <CardContent className="p-0">
            {/* Ad content */}
            <div 
              className="cursor-pointer relative overflow-hidden"
              onClick={handleAdClick}
            >
              {ad.type === 'image' && (
                <img 
                  src={ad.mediaUrl} 
                  alt={ad.title}
                  className="w-full h-auto max-h-[60vh] object-cover"
                />
              )}
              
              {ad.type === 'video' && (
                <video 
                  src={ad.mediaUrl}
                  autoPlay
                  muted
                  loop
                  className="w-full h-auto max-h-[60vh] object-cover"
                />
              )}

              {/* Ad overlay info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <h3 className="text-white font-semibold text-lg">{ad.title}</h3>
                {ad.description && (
                  <p className="text-white/80 text-sm mt-1">{ad.description}</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-4 bg-muted">
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleContinue}
                  className="flex-1 max-w-xs"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continue to Game
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Advertisement • Click to learn more
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}