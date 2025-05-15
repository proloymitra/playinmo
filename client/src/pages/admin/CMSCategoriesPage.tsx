import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  PlusCircle, 
  Search,
  Trash2,
  Edit,
  Eye
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

export default function CMSCategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Get all categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Get all games (to count games per category)
  const { data: games } = useQuery<any[]>({
    queryKey: ['/api/games'],
  });

  // Filter categories based on search query
  const filteredCategories = categories?.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count games in each category
  const getGameCount = (categoryId: number) => {
    return games?.filter(game => game.categoryId === categoryId).length || 0;
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Categories Management</h1>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Game Categories</CardTitle>
          <CardDescription>
            Manage categories that organize your games.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
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
                  <TableHead className="w-[250px]">Category Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Games</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isCategoriesLoading ? (
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[250px]" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-5 w-[40px] mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-9 w-[120px] ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredCategories?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories?.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="w-8 h-8 mr-2 overflow-hidden rounded">
                            <img 
                              src={category.imageUrl} 
                              alt={category.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{category.slug}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{category.description}</TableCell>
                      <TableCell className="text-center">{getGameCount(category.id)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" asChild>
                            <a href={`/category/${category.slug}`} target="_blank">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
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