import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Phone, FileText, MessageCircle, Loader2, Heart, Activity, Droplets, Pill, Stethoscope } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { usePincode } from "@/contexts/PincodeContext";
import { checkServiceability } from "@/services/healthiansApi";
import { useNavigate } from "react-router-dom";

const categories = [
  { name: "Full Body Packages", icon: Stethoscope, color: "text-primary" },
  { name: "Diabetes Tests", icon: Droplets, color: "text-rose-500" },
  { name: "Heart Health", icon: Heart, color: "text-red-500" },
  { name: "Thyroid Tests", icon: Activity, color: "text-blue-500" },
  { name: "Vitamin Tests", icon: Pill, color: "text-amber-500" },
];

const features = [
  {
    title: "Trusted NABL certified labs",
    subtitle: "Hygienic & safety assured testing",
    bg: "bg-primary",
  },
  {
    title: "Wide coverage across India",
    subtitle: "Most trusted service in 100+ cities",
    bg: "bg-sky-600",
  },
  {
    title: "Home sample collection",
    subtitle: "Safe pickup at your doorstep",
    bg: "bg-emerald-600",
  },
  {
    title: "Fast, accurate reports",
    subtitle: "Doctor-verified, delivered on time",
    bg: "bg-amber-600",
  },
];

export const Hero = () => {
  const { pincode: savedPincode, setPincode: savePincode, setIsServiceable } = usePincode();
  const [pinCode, setPinCode] = useState(savedPincode || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (pinCode.length !== 6) {
      toast.error("Please enter a valid 6-digit PIN code");
      return;
    }

    setChecking(true);

    try {
      const { isServiceable, message } = await checkServiceability(pinCode);

      if (isServiceable) {
        savePincode(pinCode);
        setIsServiceable(true);
        toast.success("Service available! Redirecting to tests...");
        navigate(`/tests${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`);
      } else {
        setIsServiceable(false);
        toast.error(message || "Service not available in this area yet.");
      }
    } catch (error) {
      console.error("Serviceability check failed:", error);
      toast.error("Failed to check serviceability. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleCategoryClick = async (category: string) => {
    if (!pinCode || pinCode.length !== 6) {
      toast.error("Please enter your PIN code first");
      return;
    }
    
    if (!savedPincode) {
      setChecking(true);
      try {
        const { isServiceable, message } = await checkServiceability(pinCode);
        if (isServiceable) {
          savePincode(pinCode);
          setIsServiceable(true);
          navigate(`/tests?search=${encodeURIComponent(category)}`);
        } else {
          toast.error(message || "Service not available in this area yet.");
        }
      } catch (error) {
        toast.error("Failed to check serviceability.");
      } finally {
        setChecking(false);
      }
    } else {
      navigate(`/tests?search=${encodeURIComponent(category)}`);
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-background to-sky-50/50 py-10 md:py-16 lg:py-20 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full border-8 border-primary" />
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full border-4 border-sky-400" />
        <div className="absolute bottom-20 left-1/4 w-16 h-16 rounded-full border-4 border-emerald-400" />
        <div className="absolute bottom-40 right-1/3 w-20 h-20 rounded-full border-6 border-primary/50" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Heart className="w-4 h-4 fill-primary" />
              Ethical Healthcare for All
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Book lab tests online from{" "}
              <span className="text-primary">trusted</span> and{" "}
              <span className="text-primary">certified</span> labs
            </h1>

            {/* Search Bar with Location */}
            <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Location Input */}
              <div className="flex items-center gap-2 px-4 py-2 sm:py-0 sm:border-r border-border/50 min-w-[140px] bg-muted/30 sm:bg-transparent rounded-xl sm:rounded-none">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <Input
                  type="text"
                  placeholder="PIN Code"
                  value={pinCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 6) setPinCode(value);
                  }}
                  className="border-0 p-0 h-9 text-base focus-visible:ring-0 bg-transparent font-medium"
                  maxLength={6}
                />
              </div>

              {/* Search Input */}
              <div className="flex-1 flex items-center">
                <Input
                  type="text"
                  placeholder="Search tests or health checkups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 h-11 text-base focus-visible:ring-0 bg-transparent px-4"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              {/* Search Button */}
              <Button 
                onClick={handleSearch} 
                size="lg"
                className="rounded-xl h-11 px-6 gap-2 font-semibold"
                disabled={checking}
              >
                {checking ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span className="hidden sm:inline">Search</span>
                  </>
                )}
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="rounded-full gap-2 bg-card hover:bg-primary/5 border-border/50" asChild>
                <a href="tel:+918000000000">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <span>Book via <strong>Phone</strong></span>
                </a>
              </Button>
              <Button variant="outline" className="rounded-full gap-2 bg-card hover:bg-amber-50 border-border/50" asChild>
                <a href="/tests">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-amber-600" />
                  </div>
                  <span>Quick <strong>Order</strong></span>
                </a>
              </Button>
              <Button variant="outline" className="rounded-full gap-2 bg-card hover:bg-emerald-50 border-border/50" asChild>
                <a href="https://wa.me/918000000000" target="_blank" rel="noopener noreferrer">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span>Book via <strong>WhatsApp</strong></span>
                </a>
              </Button>
            </div>

            {/* Category Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Find tests & packages for your needs
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.name}
                      onClick={() => handleCategoryClick(category.name)}
                      className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col items-center gap-3 hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all group"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-white to-muted flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                        <IconComponent className={`w-6 h-6 ${category.color}`} />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Feature Cards */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`relative rounded-3xl overflow-hidden shadow-lg ${
                  index === 0 || index === 2 ? 'h-44 sm:h-52' : 'h-36 sm:h-44'
                }`}
              >
                <div className={`absolute inset-0 ${feature.bg}`} />
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-16 h-16 rounded-full border-4 border-white/20" />
                <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full border-4 border-white/10" />
                
                <div className="relative h-full flex flex-col justify-end p-5 sm:p-6">
                  <h4 className="text-white font-bold text-base sm:text-lg leading-tight">
                    {feature.title}
                  </h4>
                  <p className="text-white/80 text-xs sm:text-sm mt-1.5">
                    {feature.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
