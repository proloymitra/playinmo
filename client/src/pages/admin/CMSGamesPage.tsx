import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  PlusCircle, 
  Search,
  Trash2,
  Edit,
  ArrowUpDown,
  Star,
  Flame
} from 'lucide-react';

import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Game {
  id: number;
  title: string;
  imageUrl: string;
  categoryId: number;
  isFeatured: boolean | null;
  plays: number | null;
  rating: number | null;
  developer: string;
  createdAt: string;
}

export default function CMSGamesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Get all games
  const { data: games, isLoading: isGamesLoading } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });

  // Get all categories
  const { data: categories } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });

  // Filter games based on search query
  const filteredGames = games?.filter(game => 
    game.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get category name by ID
  const getCategoryName = (categoryId: number) => {
    const category = categories?.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Games Management</h1>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Game
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Games</CardTitle>
          <CardDescription>
            Manage all games on your platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search games..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-2">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
                <DropdownMenuItem>Name (Z-A)</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Newest First</DropdownMenuItem>
                <DropdownMenuItem>Oldest First</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Most Played</DropdownMenuItem>
                <DropdownMenuItem>Highest Rated</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Game Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Plays</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isGamesLoading ? (
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[80px] mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-[60px] ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-[60px] ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-9 w-[80px] ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredGames?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No games found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGames?.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell className="font-medium">{game.title}</TableCell>
                      <TableCell>{getCategoryName(game.categoryId)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          {game.isFeatured && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {(game.plays || 0) > 10000 && (
                            <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                              <Flame className="h-3 w-3 mr-1" />
                              Hot
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{game.plays?.toLocaleString() || 0}</TableCell>
                      <TableCell className="text-right">{(game.rating ? (game.rating/10) : 0).toFixed(1)}/5</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}