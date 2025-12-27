import { Calendar, MapPin, Shield, FileText } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Easy Online Booking",
    description: "Search tests, book time slot, enter address",
    icon: Calendar,
  },
  {
    number: 2,
    title: "Live Tracking",
    description: "Track phlebotomist's real-time location",
    icon: MapPin,
  },
  {
    number: 3,
    title: "Safe Sample Collection",
    description: "Trained professional collects sample at home",
    icon: Shield,
  },
  {
    number: 4,
    title: "Quick Reports",
    description: "Get reports via email & WhatsApp in 24-48 hours",
    icon: FileText,
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          How Home Sample Collection Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 border-t-2 border-dashed border-primary-light"></div>
                )}
                
                <div className="flex flex-col items-center text-center relative z-10">
                  {/* Icon Circle */}
                  <div className="w-24 h-24 rounded-full bg-primary-lighter flex items-center justify-center mb-4 border-4 border-background shadow-md">
                    <Icon className="w-10 h-10 text-primary" />
                  </div>
                  
                  {/* Step Number */}
                  <div className="absolute top-0 right-1/3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                    {step.number}
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
