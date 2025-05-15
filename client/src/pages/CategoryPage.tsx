import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Helmet } from "react-helmet";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/GameCard";
import { Gamepad, LayoutGrid, BarChart } from "lucide-react";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [visibleGames, setVisibleGames] = useState(12);
  
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: [`/api/categories/${slug}`],
    enabled: !!slug,
  });
  
  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: [`/api/games/category/${slug}`],
    enabled: !!slug,
  });

  // If the category is "new", get all games and filter for new ones
  const { data: allGames, isLoading: allGamesLoading } = useQuery({
    queryKey: ['/api/games'],
    enabled: slug === "new" || slug === "hot",
  });

  // Reset visible games when slug changes
  useEffect(() => {
    setVisibleGames(12);
  }, [slug]);

  const filteredGames = (() => {
    if (slug === "new" && allGames) {
      return allGames.filter((game: any) => game.new);
    }
    if (slug === "hot" && allGames) {
      return allGames.filter((game: any) => game.hot);
    }
    return games;
  })();

  const loadMoreGames = () => {
    setVisibleGames(prev => prev + 12);
  };

  const getCategoryTitle = () => {
    if (slug === "new") return "New Games";
    if (slug === "hot") return "Hot Games";
    return category?.name || "Category";
  };

  const getCategoryDescription = () => {
    if (slug === "new") return "Check out our latest games added to the platform";
    if (slug === "hot") return "Popular games that are trending right now";
    return `Explore our collection of ${category?.name.toLowerCase()} games`;
  };

  return (
    <>
      <Helmet>
        <title>{getCategoryTitle()} - GameZone</title>
        <meta name="description" content={getCategoryDescription()} />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{getCategoryTitle()}</h1>
          <p className="text-muted-foreground text-lg">{getCategoryDescription()}</p>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Gamepad className="mr-2 h-5 w-5 text-primary" />
            <span className="font-medium">
              {filteredGames ? `${filteredGames.length} games` : "Loading games..."}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <BarChart className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {categoryLoading || gamesLoading || (slug === "new" && allGamesLoading) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : filteredGames?.length > 0 ? (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {filteredGames.slice(0, visibleGames).map((game: any) => (
              <GameCard
                key={game.id}
                id={game.id}
                title={game.title}
                imageUrl={game.imageUrl}
                rating={game.rating}
                plays={game.plays}
                isNew={game.new}
                isHot={game.hot}
                className={viewMode === "list" ? "flex flex-row h-32" : ""}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gamepad className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No Games Found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                We couldn't find any games in this category. Please check back later or try a different category.
              </p>
            </CardContent>
          </Card>
        )}
        
        {filteredGames && filteredGames.length > visibleGames && (
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
    </>
  );
}
