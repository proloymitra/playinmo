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

type NavItemProps = {
  href: string;
  label: string;
  currentPath: string;
};

const NavItem = ({ href, label, currentPath }: NavItemProps) => {
  const isActive = currentPath === href;
  
  return (
    <Link href={href}>
      <a className={`nav-link font-medium hover:text-primary transition-colors ${
        isActive ? "text-primary" : "text-foreground"
      }`}>
        {label}
      </a>
    </Link>
  );
};

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();

  // Mock user state - In a real app, this would come from authentication
  const [user, setUser] = useState<{ id: number; username: string; avatarUrl?: string } | null>(null);
  
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
            <Link href="/">
              <a className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-2">
                  <Gamepad className="text-white h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-foreground tracking-wider">
                    MO<span className="text-primary">PLAY</span>
                  </span>
                  <span className="text-xs text-muted-foreground -mt-1">Play more games on MOPLAY</span>
                </div>
              </a>
            </Link>
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
              {!user ? (
                <Button
                  className="hidden sm:inline-flex bg-primary text-white hover:bg-primary/90"
                >
                  Sign In
                </Button>
              ) : null}
              
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="User menu">
                    {user ? (
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                        <AvatarFallback>
                          {user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar>
                        <AvatarFallback>GZ</AvatarFallback>
                      </Avatar>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {user ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={`/profile/${user.id}`}>Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>My Games</DropdownMenuItem>
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        Sign Out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem>Sign In</DropdownMenuItem>
                      <DropdownMenuItem>Register</DropdownMenuItem>
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
              <Link href="/">
                <a className="px-3 py-2 text-base font-medium hover:bg-accent/10 rounded-md">
                  Home
                </a>
              </Link>
              <Link href="/category/action">
                <a className="px-3 py-2 text-base font-medium hover:bg-accent/10 rounded-md">
                  Categories
                </a>
              </Link>
              <Link href="/category/new">
                <a className="px-3 py-2 text-base font-medium hover:bg-accent/10 rounded-md">
                  New Games
                </a>
              </Link>
              <Link href="/leaderboard">
                <a className="px-3 py-2 text-base font-medium hover:bg-accent/10 rounded-md">
                  Leaderboards
                </a>
              </Link>
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
