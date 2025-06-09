import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, Award, Medal, Crown, Zap, Target, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface Achievement {
  id: number;
  name: string;
  description: string;
  iconUrl: string;
  category: string;
  type: string;
  condition: any;
  points: number;
  rarity: string;
  isActive: boolean;
}

interface UserAchievement {
  id: number;
  userId: string;
  achievementId: number;
  unlockedAt: string;
  progress: any;
  isCompleted: boolean;
  achievement: Achievement;
}

interface UserPoints {
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
}

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState("all");

  // Fetch user achievements
  const { data: userAchievements, isLoading: achievementsLoading } = useQuery<UserAchievement[]>({
    queryKey: ['/api/user/achievements'],
  });

  // Fetch all achievements
  const { data: allAchievements, isLoading: allAchievementsLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements'],
  });

  // Fetch user points
  const { data: userPoints, isLoading: pointsLoading } = useQuery<UserPoints>({
    queryKey: ['/api/user/points'],
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'epic': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'rare': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'common': return 'bg-gradient-to-r from-gray-400 to-gray-600';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gaming': return <Trophy className="h-5 w-5" />;
      case 'social': return <Users className="h-5 w-5" />;
      case 'progression': return <Target className="h-5 w-5" />;
      case 'special': return <Crown className="h-5 w-5" />;
      default: return <Award className="h-5 w-5" />;
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return <Crown className="h-4 w-4 text-yellow-400" />;
      case 'epic': return <Star className="h-4 w-4 text-purple-400" />;
      case 'rare': return <Medal className="h-4 w-4 text-blue-400" />;
      case 'common': return <Zap className="h-4 w-4 text-gray-400" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  const getProgressPercentage = (achievement: Achievement, userAchievement?: UserAchievement) => {
    if (userAchievement?.isCompleted) return 100;
    if (!userAchievement?.progress) return 0;

    const progress = userAchievement.progress;
    const condition = achievement.condition;

    switch (achievement.type) {
      case 'score_based':
        return Math.min(100, (progress.currentScore || 0) / condition.score * 100);
      case 'games_played':
        return Math.min(100, (progress.count || 0) / condition.count * 100);
      case 'social':
        return Math.min(100, (progress.messages || 0) / condition.messages * 100);
      default:
        return 0;
    }
  };

  const getProgressText = (achievement: Achievement, userAchievement?: UserAchievement) => {
    if (userAchievement?.isCompleted) return 'Completed!';
    if (!userAchievement?.progress) return 'Not started';

    const progress = userAchievement.progress;
    const condition = achievement.condition;

    switch (achievement.type) {
      case 'score_based':
        return `${progress.currentScore || 0} / ${condition.score}`;
      case 'games_played':
        return `${progress.count || 0} / ${condition.count}`;
      case 'social':
        return `${progress.messages || 0} / ${condition.messages}`;
      default:
        return 'In progress';
    }
  };

  // Combine achievements with user progress
  const achievementsWithProgress = allAchievements?.map(achievement => {
    const userProgress = userAchievements?.find(ua => ua.achievementId === achievement.id);
    return {
      ...achievement,
      userProgress,
      isUnlocked: userProgress?.isCompleted || false,
      progressPercentage: getProgressPercentage(achievement, userProgress),
      progressText: getProgressText(achievement, userProgress)
    };
  }) || [];

  // Filter achievements by category
  const filteredAchievements = achievementsWithProgress.filter(achievement => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unlocked') return achievement.isUnlocked;
    if (activeTab === 'locked') return !achievement.isUnlocked;
    return achievement.category === activeTab;
  });

  // Get unique categories
  const categories = [...new Set(allAchievements?.map(a => a.category) || [])];

  const completedCount = userAchievements?.filter(ua => ua.isCompleted).length || 0;
  const totalCount = allAchievements?.length || 0;

  if (achievementsLoading || allAchievementsLoading || pointsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPoints?.totalPoints || 0}</div>
            <p className="text-xs text-muted-foreground">
              {userPoints?.availablePoints || 0} available to spend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}/{totalCount}</div>
            <Progress value={(completedCount / totalCount) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {totalCount - completedCount} remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>
            Complete challenges to earn points and unlock rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 flex-wrap">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
              <TabsTrigger value="locked">Locked</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAchievements.map((achievement) => (
                  <Card 
                    key={achievement.id} 
                    className={`relative overflow-hidden transition-all hover:shadow-lg ${
                      achievement.isUnlocked ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' : 'opacity-75'
                    }`}
                  >
                    {/* Rarity indicator */}
                    <div className={`absolute top-0 right-0 w-16 h-16 ${getRarityColor(achievement.rarity)} opacity-20 rounded-bl-full`} />
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${achievement.isUnlocked ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            {getCategoryIcon(achievement.category)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{achievement.name}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              {getRarityIcon(achievement.rarity)}
                              <Badge variant="outline" className="text-xs">
                                {achievement.points} pts
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-4">
                        {achievement.description}
                      </p>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className={achievement.isUnlocked ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                            {achievement.progressText}
                          </span>
                        </div>
                        <Progress 
                          value={achievement.progressPercentage} 
                          className={`h-2 ${achievement.isUnlocked ? 'bg-green-100' : ''}`}
                        />
                      </div>

                      {achievement.isUnlocked && (
                        <Badge className="mt-3 bg-green-100 text-green-800 hover:bg-green-100">
                          <Award className="h-3 w-3 mr-1" />
                          Unlocked
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredAchievements.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No achievements found
                  </h3>
                  <p className="text-muted-foreground">
                    Try a different category or start playing games to unlock achievements!
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}