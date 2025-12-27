import { Award, Home, Zap, DollarSign, ShieldCheck, MousePointerClick } from "lucide-react";

const features = [
  {
    icon: Award,
    title: "NABL Certified Labs",
    description: "All partner labs are NABL accredited for quality assurance",
  },
  {
    icon: Home,
    title: "Home Sample Collection",
    description: "Get samples collected from the comfort of your home",
  },
  {
    icon: Zap,
    title: "Reports in 24-48 Hours",
    description: "Receive your reports quickly via email and WhatsApp",
  },
  {
    icon: DollarSign,
    title: "Best Price Guarantee",
    description: "Get the most competitive prices with regular discounts",
  },
  {
    icon: ShieldCheck,
    title: "100% Safe & Hygienic",
    description: "Trained professionals with strict safety protocols",
  },
  {
    icon: MousePointerClick,
    title: "Easy Online Booking",
    description: "Book your tests in just a few clicks anytime, anywhere",
  },
];

export const WhyChooseUs = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Why Choose EHCF Labs
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-card rounded-xl p-6 shadow-card hover:shadow-lg transition-smooth"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary-lighter flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
