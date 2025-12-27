import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import ehcfLogo from "@/assets/ehcf-logo.png";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();

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

            {/* Login Button */}
            <Button className="hidden md:flex">Login</Button>

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
              <Button className="w-full">Login</Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
