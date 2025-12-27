import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Eye } from "lucide-react";
import { Package } from "@/lib/mockData";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface PackageCardProps {
  package: Package;
  view: "grid" | "list";
  onViewDetails: (pkg: Package) => void;
}

export const PackageCard = ({ package: pkg, view, onViewDetails }: PackageCardProps) => {
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addItem(pkg);
    toast({
      title: "Added to cart",
      description: `${pkg.name} has been added to your cart`,
    });
  };

  if (view === "list") {
    return (
      <div className="bg-card rounded-xl p-6 shadow-card hover:shadow-lg transition-smooth border border-border flex gap-6">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold mb-1">{pkg.name}</h3>
              <p className="text-sm text-muted-foreground">Contains {pkg.testsCount} tests</p>
            </div>
            <Badge className="bg-success text-success-foreground">{pkg.discount}% OFF</Badge>
          </div>
          
          <div className="text-sm text-muted-foreground mb-4">
            <p className="line-clamp-2">• {pkg.tests.join(", ")}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>📋 {pkg.sampleType}</span>
            <span>🍽️ {pkg.fastingRequired ? "Fasting Required" : "No Fasting"}</span>
            <span>⏱️ {pkg.reportTime}</span>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between min-w-[180px]">
          <div className="text-right">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-primary">₹{pkg.price.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground line-through">₹{pkg.originalPrice.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex gap-2 w-full">
            <Button className="flex-1" size="sm" onClick={handleAddToCart}>
              <ShoppingCart className="w-4 h-4 mr-1" />
              Add
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewDetails(pkg)}>
              <Eye className="w-4 h-4 mr-1" />
              Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-card hover:shadow-lg transition-smooth border border-border flex flex-col h-full">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-bold line-clamp-2 flex-1">{pkg.name}</h3>
      </div>
      
      <div className="border-t border-border my-3"></div>
      
      <p className="text-sm text-muted-foreground mb-2">Contains {pkg.testsCount} tests</p>
      <div className="text-sm text-muted-foreground mb-4 flex-1">
        <p className="line-clamp-2">• {pkg.tests.join(", ")}</p>
      </div>
      
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-primary">₹{pkg.price.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground line-through">₹{pkg.originalPrice.toLocaleString()}</span>
        </div>
        <Badge className="bg-success text-success-foreground">{pkg.discount}% OFF</Badge>
      </div>
      
      <div className="flex gap-2 mt-auto">
        <Button className="flex-1" size="sm" onClick={handleAddToCart}>
          <ShoppingCart className="w-4 h-4 mr-1" />
          Add to Cart
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewDetails(pkg)}>
          <Eye className="w-4 h-4 mr-1" />
          Details
        </Button>
      </div>
    </div>
  );
};
