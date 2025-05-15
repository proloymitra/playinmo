import { useState, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Game } from '@shared/schema';
import { ChevronLeft, ChevronRight } from "lucide-react";
import FeaturedGameCard from "./FeaturedGameCard";
import { cn } from "@/lib/utils";

export default function HeroSection() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const featuredGamesRef = useRef<HTMLDivElement>(null);
  
  const { data: featuredGames = [], isLoading, error } = useQuery<Game[]>({
    queryKey: ['/api/games/featured'],
  });

  const handleScroll = (direction: 'left' | 'right') => {
    if (!featuredGamesRef.current) return;
    
    const scrollAmount = 340; // Approximate width of a card + margin
    const maxScroll = featuredGamesRef.current.scrollWidth - featuredGamesRef.current.clientWidth;
    
    let newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(maxScroll, scrollPosition + scrollAmount);
    
    featuredGamesRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
    
    setScrollPosition(newPosition);
  };
  
  return (
    <section className="relative overflow-hidden">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{ 
          backgroundImage: "url('https://source.unsplash.com/random/1920x1080/?gaming,setup')",
          filter: "brightness(0.3)" 
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-50 z-0"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16 md:py-24">
        <div className="max-w-3xl">
          <h1 className="font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-4">
            Play More Games on <span className="text-primary">MOPLAY</span>
          </h1>
          <p className="text-gray-200 text-lg md:text-xl mb-8">
            Join millions of players in the ultimate online gaming experience. 
            Discover thousands of free games to play instantly!
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/games/featured">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Play Now
              </Button>
            </Link>
            <Link href="/games">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-foreground"
              >
                Browse Games
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Games Carousel */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-16 md:-mt-24">
        <div className="bg-card rounded-xl shadow-lg p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-2xl">Featured Games</h2>
            <div className="flex space-x-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleScroll('left')}
                disabled={scrollPosition === 0}
                className="h-10 w-10 rounded-full"
                aria-label="Previous featured games"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleScroll('right')}
                className="h-10 w-10 rounded-full"
                aria-label="Next featured games"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div 
            ref={featuredGamesRef}
            className="flex overflow-x-auto pb-4 space-x-4 no-scrollbar"
          >
            {isLoading ? (
              // Loading skeleton
              Array(4).fill(0).map((_, index) => (
                <div 
                  key={index}
                  className="min-w-[280px] md:min-w-[320px] rounded-lg overflow-hidden shadow-md bg-card animate-pulse"
                >
                  <div className="h-40 md:h-48 bg-muted"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-9 bg-muted rounded w-full"></div>
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="p-4 text-destructive">
                Failed to load featured games
              </div>
            ) : (
              featuredGames && featuredGames.length > 0 ? featuredGames.map((game) => (
                <FeaturedGameCard
                  key={game.id}
                  id={game.id}
                  title={game.title}
                  imageUrl={game.imageUrl}
                  description={game.description}
                  rating={game.rating || 0}
                  plays={game.plays || 0}
                />
              )) : <div className="p-4">No featured games available</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
