import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockPackages } from "@/lib/mockData";
import { ShoppingCart, Eye } from "lucide-react";

export const PopularPackages = () => {
  const popularPackages = mockPackages.filter(pkg => pkg.popular);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Most Booked Health Checkups</h2>
        
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-6 min-w-max md:min-w-0 md:grid md:grid-cols-2 lg:grid-cols-4">
            {popularPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-card rounded-xl p-6 shadow-card hover:shadow-lg transition-smooth border border-border min-w-[280px] md:min-w-0 flex flex-col"
              >
                {/* Package Name */}
                <h3 className="text-lg font-bold mb-3">{pkg.name}</h3>
                
                {/* Divider */}
                <div className="border-t border-border mb-3"></div>
                
                {/* Tests Info */}
                <p className="text-sm text-muted-foreground mb-2">Contains {pkg.testsCount} tests</p>
                <div className="text-sm text-muted-foreground mb-4 flex-1">
                  <p className="line-clamp-2">• {pkg.tests.join(", ")}</p>
                </div>
                
                {/* Pricing */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-primary">₹{pkg.price.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground line-through">₹{pkg.originalPrice.toLocaleString()}</span>
                  </div>
                  <Badge className="bg-success text-success-foreground">{pkg.discount}% OFF</Badge>
                </div>
                
                {/* Buttons */}
                <div className="flex gap-2">
                  <Button className="flex-1" size="sm">
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Add to Cart
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
