import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, ShoppingCart, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/contexts/CartContext";
import ehcfLogo from "@/assets/ehcf-logo.png";
import SignIn from "@/components/Sign-in";
import { supabase } from "@/utils/supabase/client";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    email: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null>(null);
  const { totalItems } = useCart();

  // Load current auth session and subscribe to changes
  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sUser = data.session?.user;
        if (active && sUser) {
          setUser({
            id: sUser.id,
            email: sUser.email,
            full_name: (sUser.user_metadata?.full_name || sUser.user_metadata?.name) ?? null,
            avatar_url: (sUser.user_metadata?.avatar_url || sUser.user_metadata?.picture) ?? null,
          });
        } else if (active) {
          setUser(null);
        }
      } catch {
        // ignore
      }
    };

    loadSession();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={ehcfLogo} alt="EHCF - Ethical Health Care Foundation" className="h-12 w-auto" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-smooth">
              Home
            </Link>
            <Link to="/tests" className="text-sm font-medium text-foreground hover:text-primary transition-smooth">
              Lab Tests
            </Link>
            <Link to="/packages" className="text-sm font-medium text-foreground hover:text-primary transition-smooth">
              Health Packages
            </Link>
            <Link to="/track" className="text-sm font-medium text-foreground hover:text-primary transition-smooth">
              Track Booking
            </Link>
            <Link to="/my-orders" className="text-sm font-medium text-foreground hover:text-primary transition-smooth">
              My Orders
            </Link>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-4">
            {/* Search - Hidden on small screens */}
            <div className="hidden lg:flex items-center relative">
              <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for tests, packages..."
                className="pl-10 w-80 rounded-full bg-muted border-0"
              />
            </div>

            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Auth Area */}
            <div className="hidden md:flex items-center">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="px-2">
                      <Avatar className="h-8 w-8">
                        {user.avatar_url ? (
                          <AvatarImage src={user.avatar_url} alt={user.full_name ?? user.email ?? "User"} />
                        ) : (
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {user.avatar_url ? (
                            <AvatarImage src={user.avatar_url} alt={user.full_name ?? user.email ?? "User"} />
                          ) : (
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{user.full_name ?? "User"}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/my-orders" className="flex items-center gap-2">
                        <span>My Orders</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/tests" className="flex items-center gap-2">
                        <span>Explore Tests</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button className="hidden md:flex" onClick={() => setIsSignInOpen(true)}>Login</Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Input
                type="search"
                placeholder="Search for tests..."
                className="rounded-full bg-muted border-0"
              />
              <Link to="/" className="text-sm font-medium text-foreground hover:text-primary py-2">
                Home
              </Link>
              <Link to="/tests" className="text-sm font-medium text-foreground hover:text-primary py-2">
                Lab Tests
              </Link>
              <Link to="/packages" className="text-sm font-medium text-foreground hover:text-primary py-2">
                Health Packages
              </Link>
              <Link to="/track" className="text-sm font-medium text-foreground hover:text-primary py-2">
                Track Booking
              </Link>
              <Link to="/my-orders" className="text-sm font-medium text-foreground hover:text-primary py-2">
                My Orders
              </Link>
              {user ? (
                <div className="w-full">
                  <Link to="/my-orders">
                    <Button className="w-full">My Orders</Button>
                  </Link>
                  <Button variant="ghost" className="mt-2 w-full" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </Button>
                </div>
              ) : (
                <Button className="w-full" onClick={() => setIsSignInOpen(true)}>Login</Button>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Sign-In Modal */}
      <SignIn isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} redirectUrl={window.location.pathname} />
    </nav>
  );
};
