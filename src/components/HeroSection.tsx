import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Bus, BarChart3, Route, Users } from "lucide-react";
import heroImage from "@/assets/hero-transit.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_theme(colors.primary.glow)_0%,_transparent_50%)]" />
      </div>
      
      {/* Hero Content */}
      <div className="relative container mx-auto px-4 pt-20 pb-16 lg:pt-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 text-white/90 text-sm">
              <Bus className="w-4 h-4" />
              <span>Transit Optimization Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Optimize Your
              <span className="block bg-gradient-to-r from-white to-primary-glow bg-clip-text text-transparent">
                Transit Network
              </span>
            </h1>
            
            <p className="text-xl text-white/80 mb-8 max-w-lg">
              Advanced route optimization, demand forecasting, and fleet management 
              powered by AI and real-time data analytics.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                variant="hero" 
                size="lg" 
                className="group"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              >
                View Demo
              </Button>
            </div>
          </div>
          
          {/* Right Column - Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-strong">
              <img 
                src={heroImage} 
                alt="Transit optimization dashboard showing route analytics and real-time data"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            
            {/* Floating Stats Cards */}
            <Card className="absolute -top-6 -left-6 bg-white/95 backdrop-blur-sm shadow-medium p-4 border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-transit-green/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-transit-green" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">95%</div>
                  <div className="text-sm text-muted-foreground">On-time Performance</div>
                </div>
              </div>
            </Card>
            
            <Card className="absolute -bottom-6 -right-6 bg-white/95 backdrop-blur-sm shadow-medium p-4 border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">2.3M+</div>
                  <div className="text-sm text-muted-foreground">Daily Passengers</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 lg:mt-24">
          {[
            {
              icon: Route,
              title: "Smart Route Planning",
              description: "AI-powered optimization for maximum efficiency and passenger satisfaction"
            },
            {
              icon: BarChart3,
              title: "Demand Forecasting",
              description: "Predictive analytics using historical data and real-time patterns"
            },
            {
              icon: Bus,
              title: "Fleet Management",
              description: "Optimize bus allocation, schedules, and maintenance planning"
            }
          ].map((feature, index) => (
            <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/10 p-6 text-center hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/70 text-sm">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;