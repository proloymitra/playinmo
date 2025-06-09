import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileArchive, Gamepad2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GameUploadPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [gameFile, setGameFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [gameData, setGameData] = useState({
    title: "",
    description: "",
    category: "",
    imageUrl: "",
    gameType: "html5",
    featured: false
  });

  // Fetch categories for the dropdown
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Game file upload mutation
  const uploadGameMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('gameFile', file);
      formData.append('gameTitle', gameData.title);
      formData.append('gameType', gameData.gameType);

      const response = await fetch('/api/admin/upload-game', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (result) => {
      setUploadProgress("Game files uploaded successfully! Creating game entry...");
      
      // Create the game entry with the uploaded data
      createGameMutation.mutate({
        ...gameData,
        isHosted: true,
        gameFolder: result.gameFolder,
        entryFile: result.entryFile,
        gameType: result.gameType,
        fileSize: result.fileSize
      });
    },
    onError: (error: Error) => {
      setUploadProgress("");
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create game entry mutation
  const createGameMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/games", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setUploadProgress("");
      toast({
        title: "Success",
        description: "Game uploaded and created successfully!",
      });
      
      // Reset form
      setGameFile(null);
      setGameData({
        title: "",
        description: "",
        category: "",
        imageUrl: "",
        gameType: "html5",
        featured: false
      });
      
      // Refresh games list
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
    onError: (error: Error) => {
      setUploadProgress("");
      toast({
        title: "Game Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a ZIP file containing your game assets.",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast({
          title: "File Too Large",
          description: "Game file must be under 100MB.",
          variant: "destructive",
        });
        return;
      }
      
      setGameFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gameFile) {
      toast({
        title: "No File Selected",
        description: "Please select a ZIP file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    if (!gameData.title || !gameData.description || !gameData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setUploadProgress("Uploading game files...");
    uploadGameMutation.mutate(gameFile);
  };

  const isLoading = uploadGameMutation.isPending || createGameMutation.isPending;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Upload Game</h1>
          <p className="text-muted-foreground">
            Upload HTML5 or Construct 3 games as ZIP files
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Upload your game as a ZIP file containing all HTML, CSS, JavaScript, and asset files. 
            The system will automatically extract and host your game. Make sure your main game file is named 'index.html'.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Game Upload
            </CardTitle>
            <CardDescription>
              Upload and configure your game files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="gameFile">Game ZIP File *</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="gameFile"
                    type="file"
                    accept=".zip,application/zip"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {gameFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileArchive className="h-4 w-4" />
                      {gameFile.name} ({(gameFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </div>

              {/* Game Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Game Title *</Label>
                  <Input
                    id="title"
                    value={gameData.title}
                    onChange={(e) => setGameData({ ...gameData, title: e.target.value })}
                    disabled={isLoading}
                    placeholder="Enter game title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={gameData.category}
                    onValueChange={(value) => setGameData({ ...gameData, category: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category: any) => (
                        <SelectItem key={category.slug} value={category.slug}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={gameData.description}
                  onChange={(e) => setGameData({ ...gameData, description: e.target.value })}
                  disabled={isLoading}
                  placeholder="Enter game description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Game Icon URL</Label>
                  <Input
                    id="imageUrl"
                    value={gameData.imageUrl}
                    onChange={(e) => setGameData({ ...gameData, imageUrl: e.target.value })}
                    disabled={isLoading}
                    placeholder="Enter game icon URL"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gameType">Game Type</Label>
                  <Select
                    value={gameData.gameType}
                    onValueChange={(value) => setGameData({ ...gameData, gameType: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="html5">HTML5 Game</SelectItem>
                      <SelectItem value="construct3">Construct 3 Game</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={gameData.featured}
                  onChange={(e) => setGameData({ ...gameData, featured: e.target.checked })}
                  disabled={isLoading}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="featured">Feature this game</Label>
              </div>

              {uploadProgress && (
                <Alert>
                  <Gamepad2 className="h-4 w-4" />
                  <AlertDescription>{uploadProgress}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading || !gameFile}
                className="w-full"
              >
                {isLoading ? "Uploading..." : "Upload Game"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}