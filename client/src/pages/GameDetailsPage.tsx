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
import GameReviews from "@/components/GameReviews";

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
    // Increment play count for all games
    setIsPlaying(true);
    try {
      await apiRequest('POST', `/api/games/${id}/play`, null);
      
      // Automatically enter fullscreen mode after a short delay to allow iframe to load
      setTimeout(() => {
        const iframe = document.querySelector('iframe');
        if (iframe && document.fullscreenEnabled) {
          iframe.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
          });
        }
      }, 1500);
    } catch (error) {
      console.error('Error incrementing game plays:', error);
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
        <title>{game.title} - PlayinMO</title>
        <meta name="description" content={game.description} />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="h-[80vh] bg-muted relative">
                {isPlaying ? (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <div className="game-frame-container relative w-full h-full">
                      <iframe 
                        ref={(el) => {
                          // Assign the iframe to a variable for later focus
                          if (el) {
                            window.setTimeout(() => el.focus(), 1000);
                          }
                        }}
                        src={
                          game.isHosted && game.gameFolder 
                            ? `/games/${game.gameFolder}/${game.entryFile || 'index.html'}`
                            : game.externalUrl || `/game-frame/${id}`
                        } 
                        className="w-full h-full border-0 absolute inset-0"
                        title={`Play ${game.title}`}
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-orientation-lock allow-pointer-lock"
                        referrerPolicy="no-referrer-when-downgrade"
                        allow="accelerometer; autoplay; camera; encrypted-media; fullscreen; geolocation; gyroscope; microphone; midi; payment; picture-in-picture"
                        tabIndex={0}
                      ></iframe>
                      
                      {/* Game controls */}
                      <div className="absolute top-4 right-4 flex gap-2 z-10">
                        {/* Maximize button */}
                        <button 
                          onClick={() => {
                            const iframe = document.querySelector('iframe');
                            if (iframe) {
                              if (document.fullscreenElement) {
                                document.exitFullscreen();
                              } else {
                                iframe.requestFullscreen();
                              }
                            }
                          }}
                          className="bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-75 transition-colors"
                          title="Toggle fullscreen"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                          </svg>
                        </button>
                        
                        {/* Refresh button */}
                        <button 
                          onClick={() => {
                            const iframe = document.querySelector('iframe');
                            if (iframe) {
                              iframe.src = iframe.src;
                            }
                          }}
                          className="bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-75 transition-colors"
                          title="Reload game"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                            <path d="M21 3v5h-5"></path>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                            <path d="M8 16H3v5"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
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
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
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
                  
                  <TabsContent value="reviews" className="pt-4">
                    <GameReviews gameId={numId} />
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
