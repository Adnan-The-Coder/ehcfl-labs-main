import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FiltersSidebar } from "@/components/tests/FiltersSidebar";
import { PackageCard } from "@/components/tests/PackageCard";
import { PackageCardSkeleton } from "@/components/tests/PackageCardSkeleton";
import { PackageDetailModal } from "@/components/tests/PackageDetailModal";
import { SearchBar } from "@/components/tests/SearchBar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, List, AlertCircle } from "lucide-react";
import { Package } from "@/lib/mockData";
import { useHealthiansPackages } from "@/hooks/useHealthiansPackages";
import { usePincode } from "@/contexts/PincodeContext";

const Tests = () => {
  const { pincode } = usePincode();
  
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("popularity");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [testsCountFilter, setTestsCountFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch packages from Healthians API using user's pincode
  const { data: apiPackages, isLoading, error } = useHealthiansPackages(pincode || undefined, searchQuery);
  

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 5000]);
    setTestsCountFilter("all");
    setSearchQuery("");
  };

  const handleViewDetails = (pkg: Package) => {
    setSelectedPackage(pkg);
    setModalOpen(true);
  };

  const filteredPackages = useMemo(() => {
    if (!apiPackages) return [];
    let filtered = [...apiPackages];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pkg.tests.some((test) => test.toLowerCase().includes(searchQuery.toLowerCase())) ||
          pkg.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((pkg) =>
        selectedCategories.includes(pkg.category)
      );
    }

    // Price range filter
    filtered = filtered.filter(
      (pkg) => pkg.price >= priceRange[0] && pkg.price <= priceRange[1]
    );

    // Tests count filter
    if (testsCountFilter !== "all") {
      if (testsCountFilter === "1-10") {
        filtered = filtered.filter((pkg) => pkg.testsCount <= 10);
      } else if (testsCountFilter === "11-50") {
        filtered = filtered.filter(
          (pkg) => pkg.testsCount > 10 && pkg.testsCount <= 50
        );
      } else if (testsCountFilter === "50+") {
        filtered = filtered.filter((pkg) => pkg.testsCount > 50);
      }
    }

    // Sorting
    if (sortBy === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "popularity") {
      filtered.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    }

    return filtered;
  }, [apiPackages, selectedCategories, priceRange, testsCountFilter, searchQuery, sortBy]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">All Lab Tests & Packages</h1>
            <p className="text-muted-foreground">Find and book the right health tests for you</p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <SearchBar onSearch={setSearchQuery} />
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <FiltersSidebar
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                testsCountFilter={testsCountFilter}
                onTestsCountChange={setTestsCountFilter}
                onClearFilters={handleClearFilters}
              />
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Error State */}
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load packages. Please try again later.
                  </AlertDescription>
                </Alert>
              )}

              {/* Top Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-card p-4 rounded-xl shadow-sm">
                <p className="text-sm text-muted-foreground">
                  {isLoading ? (
                    "Loading packages..."
                  ) : (
                    <>
                      Showing <span className="font-semibold text-foreground">{filteredPackages.length}</span> tests
                    </>
                  )}
                </p>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Sort Dropdown */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popularity">Popularity</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Toggle */}
                  <div className="flex gap-2">
                    <Button
                      variant={view === "grid" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setView("grid")}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={view === "list" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setView("list")}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Package Grid/List */}
              {isLoading ? (
                <div
                  className={
                    view === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                      : "flex flex-col gap-4"
                  }
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <PackageCardSkeleton key={i} view={view} />
                  ))}
                </div>
              ) : filteredPackages.length > 0 ? (
                <div
                  className={
                    view === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                      : "flex flex-col gap-4"
                  }
                >
                  {filteredPackages.map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      package={pkg}
                      view={view}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-lg text-muted-foreground mb-2">No tests found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your filters or search query
                  </p>
                  <Button onClick={handleClearFilters} variant="outline">
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Package Detail Modal */}
      <PackageDetailModal
        package={selectedPackage}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default Tests;
