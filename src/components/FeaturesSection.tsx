import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  Brain, 
  Route, 
  TrendingUp, 
  MapPin, 
  Clock,
  Users,
  BarChart3,
  Zap,
  Shield,
  Globe,
  Cpu
} from "lucide-react";

const FeaturesSection = () => {
  const coreFeatures = [
    {
      icon: Database,
      title: "GTFS Data Ingestion",
      description: "Seamless integration with GTFS feeds, GPS/AVL traces, and ridership data",
      technical: "Real-time data validation and processing pipeline"
    },
    {
      icon: Brain,
      title: "AI Demand Forecasting", 
      description: "Machine learning models predict passenger demand with 95%+ accuracy",
      technical: "Time-series analysis with MAE, RMSE, MAPE evaluation"
    },
    {
      icon: Route,
      title: "Route Optimization",
      description: "MILP-based optimization for bus allocation and scheduling",
      technical: "OR-Tools solver with custom objective functions"
    },
    {
      icon: TrendingUp,
      title: "OD Matrix Estimation",
      description: "Origin-Destination flow analysis using IPF and smartcard inference",
      technical: "Peak/off-peak passenger flow modeling"
    }
  ];

  const advancedFeatures = [
    {
      icon: MapPin,
      category: "Simulation",
      title: "Micro-simulation Engine",
      description: "SUMO-based validation of schedules with real-world constraints"
    },
    {
      icon: Clock,
      category: "Optimization", 
      title: "Dynamic Headway Adjustment",
      description: "Real-time schedule optimization based on demand patterns"
    },
    {
      icon: Users,
      category: "Analytics",
      title: "Passenger Flow Analysis", 
      description: "Heat maps and congestion predictions with waiting time distribution"
    },
    {
      icon: BarChart3,
      category: "KPIs",
      title: "Performance Dashboard",
      description: "On-time performance, occupancy rates, and service reliability metrics"
    },
    {
      icon: Zap,
      category: "Real-time",
      title: "Live Fleet Monitoring",
      description: "GPS tracking with automatic delay detection and rerouting"
    },
    {
      icon: Shield,
      category: "Privacy",
      title: "Data Privacy First",
      description: "Anonymized passenger data with GDPR compliance built-in"
    }
  ];

  return (
    <section className="py-20 bg-muted/20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4">Platform Features</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Complete Transit Intelligence
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From GTFS ingestion to real-time optimization, our platform handles every aspect 
            of transit planning with enterprise-grade reliability and accuracy.
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {coreFeatures.map((feature, index) => (
            <Card key={index} className="p-6 text-center hover:shadow-medium transition-shadow bg-card border shadow-soft">
              <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
              <div className="text-xs text-primary font-medium">{feature.technical}</div>
            </Card>
          ))}
        </div>

        {/* Advanced Features */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">
            Advanced Capabilities
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedFeatures.map((feature, index) => (
              <Card key={index} className="p-6 bg-card border shadow-soft hover:shadow-medium transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">{feature.category}</Badge>
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Technical Specifications */}
        <Card className="p-8 bg-gradient-card border shadow-medium">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Technical Stack</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Optimization Engine</span>
                  <span className="font-medium">OR-Tools / PuLP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data Processing</span>
                  <span className="font-medium">Python / Pandas</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Simulation</span>
                  <span className="font-medium">SUMO / Custom Engine</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ML Framework</span>
                  <span className="font-medium">scikit-learn / TensorFlow</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data Formats</span>
                  <span className="font-medium">GTFS / JSON / CSV</span>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Integration Ready</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Deploy anywhere with our containerized solution. Supports on-premise, 
                cloud, and hybrid deployments with REST APIs for seamless integration.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="transit">
                  View Documentation
                </Button>
                <Button variant="outline">
                  API Reference
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default FeaturesSection;