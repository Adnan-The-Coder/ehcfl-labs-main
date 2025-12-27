import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, CheckCircle2 } from "lucide-react";
import { Package } from "@/lib/mockData";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface PackageDetailModalProps {
  package: Package | null;
  open: boolean;
  onClose: () => void;
}

export const PackageDetailModal = ({ package: pkg, open, onClose }: PackageDetailModalProps) => {
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!pkg) return null;

  const handleAddToCart = () => {
    addItem(pkg);
    toast({
      title: "Added to cart",
      description: `${pkg.name} has been added to your cart`,
    });
    onClose();
  };

  const handleBookNow = () => {
    addItem(pkg);
    navigate('/cart');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold pr-8">{pkg.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pricing */}
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">₹{pkg.price.toLocaleString()}</span>
              <span className="text-lg text-muted-foreground line-through">₹{pkg.originalPrice.toLocaleString()}</span>
            </div>
            <Badge className="bg-success text-success-foreground text-base px-3 py-1">{pkg.discount}% OFF</Badge>
          </div>

          {/* About */}
          <div>
            <h3 className="font-semibold text-lg mb-2">About This Test</h3>
            <p className="text-muted-foreground leading-relaxed">{pkg.description}</p>
          </div>

          {/* Tests Included */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Tests Included ({pkg.testsCount})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {pkg.tests.map((test, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{test}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Test Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Sample Type</p>
              <p className="font-medium">{pkg.sampleType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Fasting Required</p>
              <p className="font-medium">{pkg.fastingRequired ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Report Time</p>
              <p className="font-medium">{pkg.reportTime}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button className="flex-1" size="lg" onClick={handleAddToCart}>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>
            <Button variant="outline" size="lg" className="flex-1" onClick={handleBookNow}>
              Book Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
