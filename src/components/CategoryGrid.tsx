import { 
  Activity, 
  Droplet, 
  Heart, 
  Zap, 
  Pill,
  Users,
  User,
  Thermometer,
  HeartPulse,
  AlertCircle
} from "lucide-react";

const categories = [
  { name: "Full Body Packages", icon: Activity, count: 12, color: "text-blue-600" },
  { name: "Diabetes Tests", icon: Droplet, count: 8, color: "text-orange-600" },
  { name: "Thyroid Tests", icon: Zap, count: 6, color: "text-purple-600" },
  { name: "Liver & Kidney Tests", icon: Heart, count: 15, color: "text-red-600" },
  { name: "Vitamins & Minerals", icon: Pill, count: 10, color: "text-green-600" },
  { name: "Women's Health", icon: Users, count: 14, color: "text-pink-600" },
  { name: "Men's Health", icon: User, count: 9, color: "text-indigo-600" },
  { name: "Fever & Infection Tests", icon: Thermometer, count: 7, color: "text-yellow-600" },
  { name: "Heart Health", icon: HeartPulse, count: 11, color: "text-rose-600" },
  { name: "Allergy Tests", icon: AlertCircle, count: 5, color: "text-teal-600" },
];

export const CategoryGrid = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Find Tests & Packages</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <a
                key={category.name}
                href="/tests"
                className="bg-card rounded-xl p-6 shadow-card hover:shadow-lg transition-smooth hover:-translate-y-1 border border-transparent hover:border-primary group"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`w-12 h-12 rounded-full bg-primary-lighter flex items-center justify-center group-hover:bg-primary transition-smooth`}>
                    <Icon className={`w-6 h-6 ${category.color} group-hover:text-primary-foreground transition-smooth`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">{category.count} tests available</p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};
