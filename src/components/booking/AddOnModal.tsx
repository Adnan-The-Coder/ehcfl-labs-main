import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { mockPackages } from '@/lib/mockData';

interface Props {
  booking: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddOnModal = ({ booking, open, onClose, onSuccess }: Props) => {
  const { toast } = useToast();
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Get packages not already in the booking
  const availableAddOns = mockPackages.filter(
    (pkg) => !booking.packages.some((p: any) => p.id === pkg.id)
  ).slice(0, 6); // Show only 6 add-ons

  const handleToggleTest = (testId: string) => {
    setSelectedTests((prev) =>
      prev.includes(testId)
        ? prev.filter((id) => id !== testId)
        : [...prev, testId]
    );
  };

  const calculateAdditionalCost = () => {
    return selectedTests.reduce((total, testId) => {
      const test = availableAddOns.find((t) => t.id === testId);
      return total + (test?.price || 0);
    }, 0);
  };

  const handleAddTests = () => {
    if (selectedTests.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one test to add',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const bookings = JSON.parse(localStorage.getItem('ehcf-bookings') || '[]');
      const selectedPackages = availableAddOns.filter((pkg) =>
        selectedTests.includes(pkg.id)
      );

      const updatedBookings = bookings.map((b: any) =>
        b.id === booking.id
          ? {
              ...b,
              packages: [...b.packages, ...selectedPackages],
              totalPrice: b.totalPrice + calculateAdditionalCost(),
            }
          : b
      );
      localStorage.setItem('ehcf-bookings', JSON.stringify(updatedBookings));

      toast({
        title: 'Tests Added',
        description: `${selectedTests.length} test(s) added to your booking`,
      });

      setLoading(false);
      onSuccess();
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add More Tests</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Current Package(s)</p>
            <p className="font-medium">
              {booking.packages.map((p: any) => p.name).join(', ')}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Total: ₹{booking.totalPrice.toLocaleString()}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Available Add-Ons</h3>
            {availableAddOns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No additional tests available at this time
              </p>
            ) : (
              <div className="space-y-3">
                {availableAddOns.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={test.id}
                      checked={selectedTests.includes(test.id)}
                      onCheckedChange={() => handleToggleTest(test.id)}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={test.id}
                        className="font-medium cursor-pointer"
                      >
                        {test.name}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {test.testsCount} tests included
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        ₹{test.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground line-through">
                        ₹{test.originalPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedTests.length > 0 && (
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Additional Cost</p>
                  <p className="text-2xl font-bold text-primary">
                    ₹{calculateAdditionalCost().toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">New Total</p>
                  <p className="text-xl font-bold">
                    ₹{(booking.totalPrice + calculateAdditionalCost()).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTests}
              className="flex-1"
              disabled={loading || selectedTests.length === 0}
            >
              {loading ? 'Adding...' : `Add ${selectedTests.length} Test(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddOnModal;
