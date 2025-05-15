import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import GameCard from "./GameCard";
import { cn } from "@/lib/utils";

export default function CategorySection() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleGames, setVisibleGames] = useState(10);
  
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['/api/games'],
  });

  const filteredGames = games?.filter((game: any) => {
    if (activeCategory === "All") return true;
    if (activeCategory === "New") return game.new;
    if (activeCategory === "Hot") return game.hot;
    return game.category === activeCategory;
  });

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    // Reset visible games when changing category
    setVisibleGames(10);
  };

  const loadMoreGames = () => {
    setVisibleGames(prev => prev + 10);
  };

  return (
    <section className="py-12 container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="font-bold text-2xl mb-4">Browse by Category</h2>
        
        {/* Category Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant="outline"
            className={cn(
              "category-btn",
              activeCategory === "All" && "active"
            )}
            onClick={() => handleCategoryClick("All")}
          >
            All Games
          </Button>
          
          <Button
            variant="outline"
            className={cn(
              "category-btn",
              activeCategory === "New" && "active"
            )}
            onClick={() => handleCategoryClick("New")}
          >
            New
          </Button>
          
          <Button
            variant="outline"
            className={cn(
              "category-btn",
              activeCategory === "Hot" && "active"
            )}
            onClick={() => handleCategoryClick("Hot")}
          >
            Hot
          </Button>
          
          {categoriesLoading
            ? Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-10 w-20 bg-muted rounded-md animate-pulse"></div>
              ))
            : categories?.map((category: any) => (
                <Button
                  key={category.id}
                  variant="outline"
                  className={cn(
                    "category-btn",
                    activeCategory === category.name && "active"
                  )}
                  onClick={() => handleCategoryClick(category.name)}
                >
                  {category.name}
                </Button>
              ))
          }
        </div>
        
        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {gamesLoading
            ? Array(10).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg animate-pulse"></div>
              ))
            : filteredGames?.slice(0, visibleGames).map((game: any) => (
                <GameCard
                  key={game.id}
                  id={game.id}
                  title={game.title}
                  imageUrl={game.imageUrl}
                  rating={game.rating}
                  plays={game.plays}
                  isNew={game.new}
                  isHot={game.hot}
                />
              ))
          }
        </div>
        
        {/* Load More Button */}
        {filteredGames?.length > visibleGames && (
          <div className="flex justify-center mt-10">
            <Button
              variant="outline"
              onClick={loadMoreGames}
              className="font-medium"
            >
              Load More Games
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
