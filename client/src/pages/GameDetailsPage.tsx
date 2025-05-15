import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useParams } from "wouter";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, StarHalf, Trophy, Users, BarChart3 } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

export default function GameDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const numId = parseInt(id);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const { data: game, isLoading: gameLoading, error: gameError } = useQuery({
    queryKey: [`/api/games/${id}`],
  });
  
  const { data: topScores, isLoading: scoresLoading } = useQuery({
    queryKey: [`/api/scores/game/${id}`],
    enabled: !!numId,
  });

  // Transform rating from 0-50 scale to 0-5 scale
  const starRating = game ? game.rating / 10 : 0;
  
  // Generate stars based on rating
  const renderStars = () => {
    if (!game) return null;
    
    const stars = [];
    const fullStars = Math.floor(starRating);
    const hasHalfStar = starRating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="text-accent h-5 w-5 fill-accent" />);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="text-accent h-5 w-5 fill-accent" />);
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-gray-300 h-5 w-5" />);
    }
    
    return (
      <div className="flex items-center">
        <div className="flex mr-2">{stars}</div>
        <span className="text-lg font-medium">{starRating.toFixed(1)}</span>
        <span className="text-muted-foreground ml-2">({formatNumber(game.plays)} plays)</span>
      </div>
    );
  };

  const handlePlay = async () => {
    // Check if the game has an external URL
    if (game.externalUrl) {
      // Increment play count before opening the external URL
      try {
        await apiRequest('POST', `/api/games/${id}/play`, null);
        // Open the external game in a new tab
        window.open(game.externalUrl, '_blank', 'noopener,noreferrer');
      } catch (error) {
        console.error('Error incrementing game plays:', error);
      }
    } else {
      // Regular internal game
      setIsPlaying(true);
      try {
        await apiRequest('POST', `/api/games/${id}/play`, null);
      } catch (error) {
        console.error('Error incrementing game plays:', error);
      }
    }
  };

  if (gameLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (gameError || !game) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
              <p className="text-muted-foreground">Sorry, we couldn't find the game you're looking for.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{game.title} - GameZone</title>
        <meta name="description" content={game.description} />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="h-[60vh] bg-muted relative">
                {isPlaying ? (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <iframe 
                      src={`/game-frame/${id}`} 
                      className="w-full h-full border-0"
                      title={`Play ${game.title}`}
                    ></iframe>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <img 
                      src={game.imageUrl} 
                      alt={game.title}
                      className="w-full h-full object-cover opacity-75"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button 
                        size="lg" 
                        onClick={handlePlay}
                        className="bg-primary hover:bg-primary/90 text-white font-bold text-lg px-8 py-6"
                      >
                        Play Now
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{game.title}</h1>
                    {renderStars()}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-sm">
                      {game.category}
                    </Badge>
                    {game.new && (
                      <Badge variant="outline" className="bg-accent text-accent-foreground">
                        New
                      </Badge>
                    )}
                    {game.hot && (
                      <Badge className="bg-primary text-primary-foreground">
                        Hot
                      </Badge>
                    )}
                    {game.featured && (
                      <Badge className="bg-secondary text-white">
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Tabs defaultValue="about">
                  <TabsList>
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="how-to-play">How to Play</TabsTrigger>
                    <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="about" className="pt-4">
                    <p className="text-lg">{game.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="bg-muted p-4 rounded-lg flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-accent" />
                        <div>
                          <p className="text-sm text-muted-foreground">High Score</p>
                          <p className="font-medium">{formatNumber(topScores?.[0]?.score || 0)}</p>
                        </div>
                      </div>
                      <div className="bg-muted p-4 rounded-lg flex items-center">
                        <Users className="h-5 w-5 mr-2 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Players</p>
                          <p className="font-medium">{formatNumber(Math.floor(game.plays * 0.7))}</p>
                        </div>
                      </div>
                      <div className="bg-muted p-4 rounded-lg flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2 text-secondary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Difficulty</p>
                          <p className="font-medium">Medium</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="how-to-play" className="pt-4">
                    <h3 className="text-xl font-bold mb-2">Game Controls</h3>
                    <p className="mb-4">
                      Use your keyboard arrows to move and spacebar to jump. Collect all the items to advance to the next level.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-muted p-3 rounded-lg text-center">
                        <kbd className="px-2 py-1 bg-background rounded border">↑</kbd>
                        <p className="mt-2 text-sm">Jump/Up</p>
                      </div>
                      <div className="bg-muted p-3 rounded-lg text-center">
                        <kbd className="px-2 py-1 bg-background rounded border">←</kbd>
                        <p className="mt-2 text-sm">Move Left</p>
                      </div>
                      <div className="bg-muted p-3 rounded-lg text-center">
                        <kbd className="px-2 py-1 bg-background rounded border">→</kbd>
                        <p className="mt-2 text-sm">Move Right</p>
                      </div>
                      <div className="bg-muted p-3 rounded-lg text-center">
                        <kbd className="px-2 py-1 bg-background rounded border">Space</kbd>
                        <p className="mt-2 text-sm">Action</p>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Tips & Tricks</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Collect power-ups to gain special abilities</li>
                      <li>Avoid obstacles and enemies to preserve your lives</li>
                      <li>Look for hidden areas to find bonus points</li>
                      <li>Time your jumps carefully on moving platforms</li>
                    </ul>
                  </TabsContent>
                  
                  <TabsContent value="leaderboard" className="pt-4">
                    <h3 className="text-xl font-bold mb-4">Top Players</h3>
                    {scoresLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : topScores?.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left border-b">
                              <th className="pb-2 font-medium">Rank</th>
                              <th className="pb-2 font-medium">Player</th>
                              <th className="pb-2 font-medium">Score</th>
                              <th className="pb-2 font-medium">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topScores.map((score: any, index: number) => (
                              <tr key={score.id} className="border-b hover:bg-muted/20 transition-colors">
                                <td className="py-3">
                                  <span className={`text-xs px-2 py-1 rounded-md ${
                                    index === 0 ? 'bg-primary text-white' :
                                    index === 1 ? 'bg-secondary text-white' :
                                    index === 2 ? 'bg-accent text-dark' :
                                    'bg-muted text-foreground'
                                  }`}>
                                    {index + 1}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <div className="flex items-center">
                                    <Avatar className="mr-2 h-6 w-6">
                                      <AvatarImage src={score.user.avatarUrl} />
                                      <AvatarFallback>
                                        {score.user.username.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{score.user.username}</span>
                                  </div>
                                </td>
                                <td className="py-3 font-medium">{score.score.toLocaleString()}</td>
                                <td className="py-3 text-muted-foreground">
                                  {new Date(score.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No scores recorded yet. Be the first to play and set a high score!
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Similar Games</CardTitle>
                <CardDescription>You might also like these games</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Loading skeletons for similar games */}
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-20 h-16 bg-muted rounded-md animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View More</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
