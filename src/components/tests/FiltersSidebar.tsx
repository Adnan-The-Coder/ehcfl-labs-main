import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { categories } from "@/lib/mockData";

interface FiltersSidebarProps {
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  testsCountFilter: string;
  onTestsCountChange: (filter: string) => void;
  onClearFilters: () => void;
}

export const FiltersSidebar = ({
  selectedCategories,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  testsCountFilter,
  onTestsCountChange,
  onClearFilters,
}: FiltersSidebarProps) => {
  return (
    <aside className="w-full lg:w-72 bg-card rounded-xl shadow-card p-6 h-fit sticky top-20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">Filters</h3>
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-primary hover:text-primary-hover">
          Clear All
        </Button>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Filter by Category</h4>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => onCategoryChange(category)}
              />
              <Label
                htmlFor={category}
                className="text-sm cursor-pointer leading-tight"
              >
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Price Range</h4>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => onPriceRangeChange(value as [number, number])}
            max={5000}
            step={100}
            className="mb-3"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Number of Tests Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Number of Tests</h4>
        <RadioGroup value={testsCountFilter} onValueChange={onTestsCountChange}>
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all" className="text-sm cursor-pointer">
              All
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="1-10" id="1-10" />
            <Label htmlFor="1-10" className="text-sm cursor-pointer">
              1-10 tests
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="11-50" id="11-50" />
            <Label htmlFor="11-50" className="text-sm cursor-pointer">
              11-50 tests
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="50+" id="50+" />
            <Label htmlFor="50+" className="text-sm cursor-pointer">
              50+ tests
            </Label>
          </div>
        </RadioGroup>
      </div>
    </aside>
  );
};
