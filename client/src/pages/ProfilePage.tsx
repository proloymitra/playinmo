import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useParams } from "wouter";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Trophy, 
  Medal, 
  Gamepad, 
  BarChart2, 
  Clock, 
  Star,
  MessageSquare 
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import GameCard from "@/components/GameCard";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("stats");
  
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: [`/api/users/${id}`],
    enabled: !!id,
  });
  
  const { data: leaderboardData } = useQuery({
    queryKey: ['/api/leaderboard'],
  });
  
  const { data: games } = useQuery({
    queryKey: ['/api/games'],
  });

  // Get player's ranking from leaderboard
  const playerRanking = leaderboardData?.findIndex((player: any) => 
    player.user.id === parseInt(id as string)
  );
  
  const playerStats = leaderboardData?.find((player: any) => 
    player.user.id === parseInt(id as string)
  );
  
  // Mocked recently played games (in a real app, this would come from an API)
  const recentlyPlayedGames = games?.slice(0, 5).map((game: any) => ({
    ...game,
    lastPlayed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Random date within the last week
  }));

  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="pt-6 text-center">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
            <p className="text-muted-foreground mb-4">The profile you're looking for doesn't exist or has been removed.</p>
            <Button className="mx-auto">Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{user.username}'s Profile - PlayinMO</title>
        <meta name="description" content={`Check out ${user.username}'s gaming profile, stats, and achievements on PlayinMO.`} />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback className="text-2xl">
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h1 className="text-2xl font-bold mb-1">{user.username}</h1>
                  
                  {playerRanking !== undefined && playerRanking >= 0 && (
                    <Badge className={cn(
                      "mb-4",
                      playerRanking === 0 ? "bg-primary" : 
                      playerRanking === 1 ? "bg-secondary" : 
                      playerRanking === 2 ? "bg-accent text-accent-foreground" : 
                      "bg-muted"
                    )}>
                      Rank #{playerRanking + 1}
                    </Badge>
                  )}
                  
                  <div className="w-full border-t my-4 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-muted-foreground flex items-center">
                        <Trophy className="h-4 w-4 mr-2" /> Total Score
                      </span>
                      <span className="font-bold">{formatNumber(playerStats?.totalScore || 0)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-muted-foreground flex items-center">
                        <Gamepad className="h-4 w-4 mr-2" /> Games Played
                      </span>
                      <span className="font-bold">{playerStats?.gamesPlayed || 0}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-muted-foreground flex items-center">
                        <BarChart2 className="h-4 w-4 mr-2" /> Win Rate
                      </span>
                      <div className="flex items-center">
                        <div className="w-20 h-2 bg-muted rounded-full mr-2">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${playerStats?.winRate || 0}%` }}
                          ></div>
                        </div>
                        <span className="font-bold">{playerStats?.winRate || 0}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center">
                        <Clock className="h-4 w-4 mr-2" /> Member Since
                      </span>
                      <span className="font-bold">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full">
                    <Button className="w-full mb-2">
                      <MessageSquare className="h-4 w-4 mr-2" /> Message
                    </Button>
                    <Button variant="outline" className="w-full">
                      Add Friend
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="stats" onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="games">Recent Games</TabsTrigger>
              </TabsList>
              
              {/* Stats Tab */}
              <TabsContent value="stats" className="space-y-6 mt-6">
                {/* Top Performances */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Medal className="mr-2 h-5 w-5 text-primary" />
                      Top Performances
                    </CardTitle>
                    <CardDescription>
                      Highest scores across different games
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {games?.slice(0, 3).map((game: any, index: number) => (
                        <Card key={game.id} className="overflow-hidden border-0 shadow-md">
                          <div className="h-24 overflow-hidden">
                            <img
                              src={game.imageUrl}
                              alt={game.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-sm mb-1 truncate">{game.title}</h3>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">High Score</span>
                              <span className="font-bold text-sm">
                                {formatNumber(Math.floor(10000 + Math.random() * 90000))}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Game Stats Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart2 className="mr-2 h-5 w-5 text-secondary" />
                      Performance Breakdown
                    </CardTitle>
                    <CardDescription>
                      Gameplay statistics across different categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Action Games</span>
                          <span className="text-sm font-medium">{Math.floor(Math.random() * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Puzzle Games</span>
                          <span className="text-sm font-medium">{Math.floor(Math.random() * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full">
                          <div 
                            className="h-full bg-secondary rounded-full" 
                            style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Strategy Games</span>
                          <span className="text-sm font-medium">{Math.floor(Math.random() * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full">
                          <div 
                            className="h-full bg-accent rounded-full" 
                            style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Racing Games</span>
                          <span className="text-sm font-medium">{Math.floor(Math.random() * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Achievements Tab */}
              <TabsContent value="achievements" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="mr-2 h-5 w-5 text-accent" />
                      Achievements Showcase
                    </CardTitle>
                    <CardDescription>
                      Accomplishments and trophies earned through gameplay
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Achievement 1 */}
                      <div className="border rounded-lg p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Trophy className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">First Victory</h3>
                          <p className="text-xs text-muted-foreground">Win your first game</p>
                        </div>
                      </div>
                      
                      {/* Achievement 2 */}
                      <div className="border rounded-lg p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                          <Star className="h-6 w-6 text-secondary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Rising Star</h3>
                          <p className="text-xs text-muted-foreground">Reach level 10 in any game</p>
                        </div>
                      </div>
                      
                      {/* Achievement 3 */}
                      <div className="border rounded-lg p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                          <Gamepad className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Game Explorer</h3>
                          <p className="text-xs text-muted-foreground">Play 10 different games</p>
                        </div>
                      </div>
                      
                      {/* Locked Achievement 1 */}
                      <div className="border rounded-lg p-4 flex items-center gap-4 opacity-50">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                          <Medal className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Champion</h3>
                          <p className="text-xs text-muted-foreground">Reach #1 on any leaderboard</p>
                        </div>
                      </div>
                      
                      {/* Locked Achievement 2 */}
                      <div className="border rounded-lg p-4 flex items-center gap-4 opacity-50">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                          <Clock className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Dedicated Player</h3>
                          <p className="text-xs text-muted-foreground">Play games for 100 hours</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm text-muted-foreground">3/10 achievements unlocked</div>
                    <Button variant="outline" size="sm">View All</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Recent Games Tab */}
              <TabsContent value="games" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Gamepad className="mr-2 h-5 w-5 text-primary" />
                      Recently Played Games
                    </CardTitle>
                    <CardDescription>
                      Games {user.username} has played recently
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentlyPlayedGames?.length ? (
                      <div className="space-y-4">
                        {recentlyPlayedGames.map((game: any) => (
                          <div key={game.id} className="flex border-b pb-4 last:border-b-0 last:pb-0">
                            <div className="w-20 h-16 rounded-md overflow-hidden mr-4 flex-shrink-0">
                              <img
                                src={game.imageUrl}
                                alt={game.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-grow">
                              <h3 className="font-semibold mb-1">{game.title}</h3>
                              <div className="flex justify-between">
                                <div className="text-sm text-muted-foreground">
                                  Last played {new Date(game.lastPlayed).toLocaleDateString()}
                                </div>
                                <div className="text-sm font-medium">
                                  Score: {formatNumber(Math.floor(1000 + Math.random() * 9000))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Gamepad className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Recent Games</h3>
                        <p className="text-muted-foreground">
                          {user.username} hasn't played any games recently.
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">View All Games</Button>
                  </CardFooter>
                </Card>
                
                {/* Favorite Games */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Star className="mr-2 h-5 w-5 text-accent" />
                      Favorite Games
                    </CardTitle>
                    <CardDescription>
                      Games {user.username} plays the most
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {games?.slice(0, 3).map((game: any) => (
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
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
