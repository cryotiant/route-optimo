import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Clock, 
  Users, 
  Bus, 
  AlertTriangle,
  CheckCircle,
  MapPin,
  BarChart3
} from "lucide-react";

const DashboardPreview = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4">Platform Overview</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Complete Transit Management
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time monitoring, predictive analytics, and optimization tools 
            all in one powerful dashboard.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {/* Main Dashboard Card */}
          <Card className="lg:col-span-2 p-6 bg-gradient-card border shadow-medium">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Route Performance</h3>
                <p className="text-sm text-muted-foreground">Real-time optimization metrics</p>
              </div>
              <Badge variant="outline" className="bg-transit-green/10 text-transit-green border-transit-green/20">
                Live
              </Badge>
            </div>

            {/* Route Stats */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {[
                { label: "Route A1", passengers: "1,247", efficiency: 94, status: "optimal" },
                { label: "Route B3", passengers: "892", efficiency: 78, status: "attention" },
                { label: "Route C2", passengers: "1,563", efficiency: 96, status: "optimal" },
                { label: "Route D4", passengers: "634", efficiency: 85, status: "good" }
              ].map((route, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-transit-blue"></div>
                    <div>
                      <div className="font-medium text-foreground">{route.label}</div>
                      <div className="text-sm text-muted-foreground">{route.passengers} passengers</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">{route.efficiency}%</div>
                    <Progress value={route.efficiency} className="w-16 h-2 mt-1" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button size="sm" variant="transit">
                Optimize Routes
              </Button>
              <Button size="sm" variant="outline">
                View Details
              </Button>
            </div>
          </Card>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            {/* Fleet Status */}
            <Card className="p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-foreground">Fleet Status</h4>
                <Bus className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Buses</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-transit-green" />
                    <span className="font-medium">127/135</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Maintenance</span>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-transit-orange" />
                    <span className="font-medium">5</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Out of Service</span>
                  <span className="font-medium">3</span>
                </div>
              </div>
            </Card>

            {/* Performance Metrics */}
            <Card className="p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-foreground">Today's Metrics</h4>
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">On-time Performance</span>
                    <span className="text-sm font-semibold text-transit-green">94.2%</span>
                  </div>
                  <Progress value={94.2} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Passenger Satisfaction</span>
                    <span className="text-sm font-semibold text-transit-blue">4.6/5</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Route Efficiency</span>
                    <span className="text-sm font-semibold text-transit-purple">89.1%</span>
                  </div>
                  <Progress value={89.1} className="h-2" />
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 shadow-soft">
              <h4 className="font-semibold text-foreground mb-4">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <MapPin className="w-4 h-4 mr-2" />
                  View Live Map
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule Update
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <Button variant="hero" size="lg">
            Explore Full Dashboard
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;