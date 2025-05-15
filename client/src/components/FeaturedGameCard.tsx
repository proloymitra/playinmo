import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, StarHalf } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface FeaturedGameCardProps {
  id: number;
  title: string;
  imageUrl: string;
  description: string;
  rating: number; // Rating out of 50 (to display as 0-5 stars)
  plays: number;
}

export default function FeaturedGameCard({ 
  id, 
  title, 
  imageUrl, 
  description, 
  rating, 
  plays 
}: FeaturedGameCardProps) {
  // Transform rating from 0-50 scale to 0-5 scale
  const starRating = rating / 10;
  
  // Format play count
  const formatPlays = (plays: number) => {
    if (plays >= 1000) {
      return `${(plays / 1000).toFixed(1)}k plays`;
    }
    return `${plays} plays`;
  };
  
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
    <Card className="game-card min-w-[280px] md:min-w-[320px] overflow-hidden shadow-md bg-card">
      <div className="relative h-40 md:h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        <div className="absolute top-2 right-2">
          <Badge className="bg-primary text-white text-xs">
            Featured
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        
        <div className="flex items-center mb-2">
          <div className="flex">
            {renderStars()}
          </div>
          <span className="text-gray-500 text-sm ml-2">{starRating.toFixed(1)}</span>
          <span className="text-gray-400 text-xs ml-2">({formatPlays(plays)})</span>
        </div>
        
        <p className="text-muted-foreground text-sm mb-4">
          {description.length > 60 ? description.substring(0, 60) + '...' : description}
        </p>
        
        <Link href={`/game/${id}`}>
          <Button 
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            onClick={handlePlay}
          >
            Play Now
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
