import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Bell, Menu, Search, Gamepad } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";

type NavItemProps = {
  href: string;
  label: string;
  currentPath: string;
};

const NavItem = ({ href, label, currentPath }: NavItemProps) => {
  const isActive = currentPath === href;
  
  return (
    <div 
      className={`nav-link font-medium hover:text-primary transition-colors cursor-pointer ${
        isActive ? "text-primary" : "text-foreground"
      }`}
      onClick={() => window.location.href = href}
    >
      {label}
    </div>
  );
};

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const { user, isAuthenticated, logout } = useAuth();
  
  // Handle scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={`sticky top-0 z-50 w-full ${
      scrolled ? "bg-background/95 backdrop-blur border-b" : "bg-background"
    } transition-all duration-200`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => window.location.href = '/'}
            >
              <img 
                src="/src/assets/plainmo_logo1.png" 
                alt="PlayinMO Logo" 
                className="w-10 h-10 mr-2" 
              />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-foreground tracking-wider">
                  Playin<span className="text-primary">MO</span>
                </span>
                <span className="text-xs text-muted-foreground -mt-1">your web gaming destination for Ai powered games</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavItem href="/" label="Home" currentPath={location} />
            <NavItem href="/category/action" label="Categories" currentPath={location} />
            <NavItem href="/category/new" label="New Games" currentPath={location} />
            <NavItem href="/leaderboard" label="Leaderboards" currentPath={location} />
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Bar - Desktop */}
            <div className="hidden md:flex relative">
              <Input
                type="text"
                placeholder="Search games..."
                className="pl-10 w-64"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {!isAuthenticated ? (
                <Button
                  className="hidden sm:inline-flex bg-primary text-white hover:bg-primary/90"
                  onClick={() => window.location.href = '/api/auth/login'}
                >
                  Sign In
                </Button>
              ) : null}
              
              {isAuthenticated && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    3
                  </span>
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="User menu">
                    {isAuthenticated && user ? (
                      <Avatar>
                        <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
                        <AvatarFallback>
                          {user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar>
                        <AvatarFallback>GU</AvatarFallback>
                      </Avatar>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAuthenticated && user ? (
                    <>
                      <DropdownMenuItem onClick={() => window.location.href = `/profile/${user.id}`}>
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>My Games</DropdownMenuItem>
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => logout()}>
                        Sign Out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => window.location.href = '/api/auth/login'}>
                        Sign In
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = '/api/auth/login'}>
                        Register
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <div 
                className="px-3 py-2 text-base font-medium hover:bg-accent/10 rounded-md cursor-pointer"
                onClick={() => window.location.href = '/'}
              >
                Home
              </div>
              <div 
                className="px-3 py-2 text-base font-medium hover:bg-accent/10 rounded-md cursor-pointer"
                onClick={() => window.location.href = '/category/action'}
              >
                Categories
              </div>
              <div 
                className="px-3 py-2 text-base font-medium hover:bg-accent/10 rounded-md cursor-pointer"
                onClick={() => window.location.href = '/category/new'}
              >
                New Games
              </div>
              <div 
                className="px-3 py-2 text-base font-medium hover:bg-accent/10 rounded-md cursor-pointer"
                onClick={() => window.location.href = '/leaderboard'}
              >
                Leaderboards
              </div>
              <div className="relative mt-2">
                <Input
                  type="text"
                  placeholder="Search games..."
                  className="w-full pl-10"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
