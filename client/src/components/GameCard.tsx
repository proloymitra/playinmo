import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, StarHalf } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface GameCardProps {
  id: number;
  title: string;
  imageUrl: string;
  rating: number; // Rating out of 50 (to display as 0-5 stars)
  plays: number;
  isNew?: boolean;
  isHot?: boolean;
  className?: string;
}

export default function GameCard({ 
  id, 
  title, 
  imageUrl, 
  rating, 
  plays, 
  isNew, 
  isHot,
  className
}: GameCardProps) {
  // Transform rating from 0-50 scale to 0-5 scale
  const starRating = rating / 10;
  
  // Generate stars based on rating
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(starRating);
    const hasHalfStar = starRating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="text-accent h-4 w-4 fill-accent" />);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="text-accent h-4 w-4 fill-accent" />);
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-gray-300 h-4 w-4" />);
    }
    
    return stars;
  };

  const handlePlay = async () => {
    try {
      await apiRequest('POST', `/api/games/${id}/play`, null);
    } catch (error) {
      console.error('Error incrementing game plays:', error);
    }
  };

  return (
    <Card className={cn("game-card overflow-hidden", className)}>
      <div className="relative h-40 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        
        {isNew && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="bg-accent text-accent-foreground">
              New
            </Badge>
          </div>
        )}
        
        {isHot && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-primary text-primary-foreground">
              Hot
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate">{title}</h3>
        
        <div className="flex items-center mb-1">
          <div className="flex">
            {renderStars()}
          </div>
          <span className="text-gray-500 text-sm ml-2">{starRating.toFixed(1)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">{formatNumber(plays)} plays</span>
          <Link href={`/game/${id}`}>
            <Button 
              size="sm" 
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              onClick={handlePlay}
            >
              Play
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
