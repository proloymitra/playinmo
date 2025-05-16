import { ReactNode } from 'react';
import { 
  BarChart, 
  Gamepad2, 
  Home, 
  LayoutDashboard, 
  LogOut, 
  Settings, 
  Users,
  FileEdit
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Handle logout
  const handleLogout = () => {
    // Redirect to the logout endpoint
    window.location.href = '/api/logout';
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-slate-950 text-white p-4 hidden md:block">
        <div className="text-xl font-bold mb-6">PlayinMO CMS</div>
        <nav className="space-y-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <a href="/" className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Main Site
            </a>
          </Button>
          <Separator className="my-2" />
          <Button variant="ghost" className="w-full justify-start" asChild>
            <a href="/cms/dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </a>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <a href="/cms/games" className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Games
            </a>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <a href="/cms/categories" className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Categories
            </a>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <a href="/cms/website-content" className="flex items-center gap-2">
              <FileEdit className="h-5 w-5" />
              Website Content
            </a>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <a href="/cms/users" className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users
            </a>
          </Button>
          <Separator className="my-4" />
          <Button variant="ghost" className="w-full justify-start" asChild>
            <a href="/cms/settings" className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </a>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-red-400" onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile top bar */}
        <div className="border-b md:hidden p-4 flex justify-between items-center">
          <h1 className="font-bold">PlayinMO CMS</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}