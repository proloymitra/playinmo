import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
}

interface DashboardData {
  counts: {
    games: number;
    categories: number;
  };
}

import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CMSDashboardPage() {
  const [, navigate] = useLocation();

  // Check if user is admin
  const { data: adminUser, isLoading: isCheckingAdmin, error: adminError } = useQuery<AdminUser>({
    queryKey: ['/api/admin/user'],
    retry: false,
  });

  // Get dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<DashboardData>({
    queryKey: ['/api/admin/dashboard'],
    enabled: !!adminUser,
  });

  // Redirect to login if not authorized
  useEffect(() => {
    if (adminError) {
      navigate('/cms');
    }
  }, [adminError, navigate]);

  // Handle logout
  const handleLogout = () => {
    // Redirect to the logout endpoint
    window.location.href = '/api/logout';
  };

  if (isCheckingAdmin) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null; // This will be handled by the useEffect redirect
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          <Button size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Game
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isDashboardLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                dashboardData?.counts?.games || 0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isDashboardLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                dashboardData?.counts?.categories || 0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isDashboardLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                "—"
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Overview of recent changes and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Activity tracking coming soon
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common management tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button variant="outline" className="justify-start" asChild>
              <a href="/cms/upload-game">
                <PlusCircle className="h-4 w-4 mr-2" />
                Upload Game
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/cms/games">
                <PlusCircle className="h-4 w-4 mr-2" />
                Manage Games
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/cms/categories">
                <PlusCircle className="h-4 w-4 mr-2" />
                Manage Categories
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/cms/advertisements">
                <PlusCircle className="h-4 w-4 mr-2" />
                Manage Advertisements
              </a>
            </Button>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              More management options coming soon
            </p>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
}