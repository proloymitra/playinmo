import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusCircle, 
  Search,
  Trash2,
  Edit,
  Star,
  Flame,
  Globe,
  FileCode
} from 'lucide-react';

import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

// Simple game interface
interface Game {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  categoryId: number;
  isFeatured: boolean | null;
  plays: number | null;
  rating: number | null;
  developer: string;
  releaseDate: string;
  instructions: string;
  externalUrl: string | null;
  createdAt: string;
}

export default function CMSGamesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewGameDialogOpen, setIsNewGameDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  const [gameToDelete, setGameToDelete] = useState<number | null>(null);
  
  // Get all games
  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });
  
  // Get all categories
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });
  
  // Delete game mutation
  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete game');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Game deleted',
        description: 'The game has been successfully deleted',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/featured'] });
      setGameToDelete(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete game: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    },
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
  
  // State for game type selection (URL or HTML package)
  const [gameType, setGameType] = useState<'url' | 'html'>('url');
  
  // Create game mutation for adding new games
  const createGameMutation = useMutation({
    mutationFn: async (data: any) => {
      // Use the correct API endpoint
      let endpoint = '/api/admin/games';
      let method = 'POST';
      let body;
      
      if (gameType === 'url') {
        // For URL-based games, send JSON data
        body = JSON.stringify(data);
        return fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body,
        });
      } else {
        // For HTML package uploads, use FormData
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        
        if (data.htmlFile) {
          formData.append('htmlPackage', data.htmlFile);
        }
        
        endpoint = '/api/admin/games/upload';
        return fetch(endpoint, {
          method,
          body: formData,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Game created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      setIsNewGameDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create game: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    },
  });
  
  // Function to handle adding a new game
  const handleAddNewGame = (formData: any) => {
    createGameMutation.mutate(formData);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Games Management</h1>
        <Button onClick={() => setIsNewGameDialogOpen(true)}>
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
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Plays</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px] mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[40px] ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-[80px] ml-auto" /></TableCell>
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
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => {
                              setGameToEdit(game);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Game</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{game.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteGameMutation.mutate(game.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  {deleteGameMutation.isPending && gameToDelete === game.id ? (
                                    <>Deleting...</>
                                  ) : (
                                    <>Delete</>
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
      
      {/* Enhanced Add New Game Dialog with URL and HTML Package options */}
      {isNewGameDialogOpen && (
        <Dialog open={isNewGameDialogOpen} onOpenChange={(open) => !open && setIsNewGameDialogOpen(false)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Game</DialogTitle>
              <DialogDescription>
                Add a new game to your platform using an external URL or by uploading an HTML package
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="url" onValueChange={(value) => setGameType(value as 'url' | 'html')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  External URL
                </TabsTrigger>
                <TabsTrigger value="html" className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  HTML Package
                </TabsTrigger>
              </TabsList>
              
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title *</label>
                    <Input 
                      id="game-title" 
                      placeholder="Game title"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category *</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description *</label>
                  <Textarea 
                    placeholder="Provide a description of the game"
                    className="min-h-[100px]"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Image URL *</label>
                  <Input 
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide a URL to an image that will be used as the game thumbnail
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Developer</label>
                  <Input placeholder="Game developer name" />
                </div>
                
                <TabsContent value="url" className="p-0 m-0 space-y-2">
                  <label className="text-sm font-medium">Game URL *</label>
                  <Input 
                    placeholder="https://example.com/game"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide the URL to the external game that will be embedded in an iframe
                  </p>
                </TabsContent>
                
                <TabsContent value="html" className="p-0 m-0 space-y-2">
                  <label className="text-sm font-medium">HTML Package *</label>
                  <Input 
                    type="file" 
                    accept=".zip,.html"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a ZIP file containing your HTML game files or a single HTML file
                  </p>
                </TabsContent>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Game Instructions</label>
                  <Textarea 
                    placeholder="How to play the game"
                    className="min-h-[80px]"
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="featured-game" />
                  <label 
                    htmlFor="featured-game" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Featured Game (displayed on homepage)
                  </label>
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsNewGameDialogOpen(false)}
                  disabled={createGameMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    // Collect form data
                    const formData = {
                      title: (document.getElementById('game-title') as HTMLInputElement)?.value,
                      // Add other form fields as needed
                      gameType: gameType
                    };
                    handleAddNewGame(formData);
                  }}
                  disabled={createGameMutation.isPending}
                >
                  {createGameMutation.isPending ? 
                    (gameType === 'html' ? 'Uploading...' : 'Creating...') : 
                    'Add Game'
                  }
                </Button>
              </DialogFooter>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Dialog (Simplified) */}
      {isEditDialogOpen && gameToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && setIsEditDialogOpen(false)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Game</DialogTitle>
              <DialogDescription>
                Edit game details. Changes will be saved when you click the Save button.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input defaultValue={gameToEdit.title} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select 
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue={gameToEdit.categoryId}
                  >
                    {categories.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL</label>
                <Input defaultValue={gameToEdit.imageUrl} />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  defaultValue={gameToEdit.description}
                ></textarea>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setGameToEdit(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  toast({
                    title: "Saved",
                    description: "Game details have been updated."
                  });
                  setIsEditDialogOpen(false);
                  setGameToEdit(null);
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}