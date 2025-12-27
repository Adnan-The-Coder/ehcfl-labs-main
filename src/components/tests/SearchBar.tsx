import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { mockPackages } from "@/lib/mockData";
import { Package } from "@/lib/mockData";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Package[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length > 0) {
      const filtered = mockPackages.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(query.toLowerCase()) ||
          pkg.tests.some((test) => test.toLowerCase().includes(query.toLowerCase())) ||
          pkg.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleSuggestionClick = (pkg: Package) => {
    setQuery(pkg.name);
    onSearch(pkg.name);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for tests, packages..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <p className="text-xs text-muted-foreground px-3 py-2">
              Tests ({suggestions.length})
            </p>
            {suggestions.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleSuggestionClick(pkg)}
                className="w-full text-left px-3 py-3 hover:bg-muted rounded-lg transition-smooth"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">{pkg.name}</p>
                    <p className="text-xs text-muted-foreground">{pkg.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">₹{pkg.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground line-through">₹{pkg.originalPrice.toLocaleString()}</p>
                  </div>
                </div>
              </button>
            ))}
            <button
              onClick={() => {
                onSearch(query);
                setShowSuggestions(false);
              }}
              className="w-full text-center py-3 text-sm text-primary hover:bg-muted rounded-lg transition-smooth font-medium"
            >
              View All Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
