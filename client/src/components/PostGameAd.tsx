import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, RotateCcw, Home, Trophy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PostGameAdProps {
  onPlayAgain: () => void;
  onGoHome: () => void;
  gameScore?: number;
  gameResult?: 'win' | 'lose' | 'complete';
}

export default function PostGameAd({ onPlayAgain, onGoHome, gameScore, gameResult }: PostGameAdProps) {
  const [countdown, setCountdown] = useState(10);
  const [canClose, setCanClose] = useState(false);
  const [adViewed, setAdViewed] = useState(false);

  const { data: ad, isLoading } = useQuery({
    queryKey: ['/api/advertisements/placement/post-game'],
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
          setCanClose(true);
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

  const handleClose = () => {
    if (canClose) {
      onGoHome();
    }
  };

  const getResultMessage = () => {
    switch (gameResult) {
      case 'win':
        return '🎉 Congratulations! You won!';
      case 'lose':
        return '😔 Game Over! Better luck next time!';
      case 'complete':
        return '✨ Game completed!';
      default:
        return '🎮 Thanks for playing!';
    }
  };

  const getResultColor = () => {
    switch (gameResult) {
      case 'win':
        return 'text-green-600';
      case 'lose':
        return 'text-red-600';
      case 'complete':
        return 'text-blue-600';
      default:
        return 'text-primary';
    }
  };

  if (isLoading) {
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

  if (!ad) {
    // No ad available, show game results directly
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="mb-6">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
              <h2 className={`text-2xl font-bold mb-2 ${getResultColor()}`}>
                {getResultMessage()}
              </h2>
              {gameScore !== undefined && (
                <p className="text-lg text-muted-foreground">
                  Final Score: <span className="font-semibold text-foreground">{gameScore.toLocaleString()}</span>
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={onPlayAgain} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Play Again
              </Button>
              <Button onClick={onGoHome} variant="outline" className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="relative">
          {/* Close button */}
          <div className="absolute top-4 right-4 z-10">
            {canClose ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClose}
                className="bg-black bg-opacity-50 text-white hover:bg-opacity-75"
              >
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            ) : (
              <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                Close in {countdown}s
              </div>
            )}
          </div>

          <CardContent className="p-0">
            {/* Game result header */}
            <div className="p-6 text-center border-b">
              <h2 className={`text-2xl font-bold mb-2 ${getResultColor()}`}>
                {getResultMessage()}
              </h2>
              {gameScore !== undefined && (
                <p className="text-lg text-muted-foreground">
                  Final Score: <span className="font-semibold text-foreground">{gameScore.toLocaleString()}</span>
                </p>
              )}
            </div>

            {/* Ad content */}
            <div 
              className="cursor-pointer relative overflow-hidden"
              onClick={handleAdClick}
            >
              {ad.type === 'image' && (
                <img 
                  src={ad.mediaUrl} 
                  alt={ad.title}
                  className="w-full h-auto max-h-[50vh] object-cover"
                />
              )}
              
              {ad.type === 'video' && (
                <video 
                  src={ad.mediaUrl}
                  autoPlay
                  muted
                  loop
                  className="w-full h-auto max-h-[50vh] object-cover"
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
              <div className="flex gap-3 justify-center mb-3">
                <Button onClick={onPlayAgain} className="flex-1 max-w-xs">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Play Again
                </Button>
                <Button onClick={onGoHome} variant="outline" className="flex-1 max-w-xs">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Advertisement • Click to learn more
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}