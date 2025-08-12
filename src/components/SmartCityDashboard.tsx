import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  Bus,
  MapPin,
  Thermometer,
  Wind,
  Droplets,
  Smartphone,
  Wifi,
  Activity
} from 'lucide-react';

interface CityMetric {
  name: string;
  value: number;
  unit: string;
  change: number;
  status: 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
}

interface EnvironmentalData {
  time: string;
  airQuality: number;
  temperature: number;
  humidity: number;
  trafficVolume: number;
}

interface ConnectivityData {
  name: string;
  connected: number;
  total: number;
}

const SmartCityDashboard: React.FC = () => {
  const [cityMetrics, setCityMetrics] = useState<CityMetric[]>([]);
  const [environmentalData, setEnvironmentalData] = useState<EnvironmentalData[]>([]);
  const [connectivityData, setConnectivityData] = useState<ConnectivityData[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Generate city metrics
    const metrics: CityMetric[] = [
      {
        name: 'Air Quality Index',
        value: 68,
        unit: 'AQI',
        change: -12,
        status: 'good',
        icon: <Wind className="w-5 h-5" />
      },
      {
        name: 'Average Temperature',
        value: 28,
        unit: '°C',
        change: 2,
        status: 'warning',
        icon: <Thermometer className="w-5 h-5" />
      },
      {
        name: 'Traffic Congestion',
        value: 34,
        unit: '%',
        change: -8,
        status: 'good',
        icon: <Activity className="w-5 h-5" />
      },
      {
        name: 'Public Transit Usage',
        value: 1247000,
        unit: 'rides',
        change: 15,
        status: 'good',
        icon: <Bus className="w-5 h-5" />
      },
      {
        name: 'IoT Device Connectivity',
        value: 94.2,
        unit: '%',
        change: 3,
        status: 'good',
        icon: <Wifi className="w-5 h-5" />
      },
      {
        name: 'Emergency Response Time',
        value: 6.8,
        unit: 'min',
        change: -1.2,
        status: 'good',
        icon: <Clock className="w-5 h-5" />
      }
    ];

    setCityMetrics(metrics);

    // Generate environmental data for the last 24 hours
    const envData: EnvironmentalData[] = Array.from({ length: 24 }, (_, i) => {
      const hour = i;
      const baseAQI = 65 + Math.sin(hour * Math.PI / 12) * 15;
      const baseTemp = 25 + Math.sin((hour - 6) * Math.PI / 12) * 8;
      const baseHumidity = 70 + Math.sin((hour - 3) * Math.PI / 12) * 20;
      const baseTraffic = 30 + (hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19 ? 40 : 0);
      
      return {
        time: `${hour.toString().padStart(2, '0')}:00`,
        airQuality: Math.round(baseAQI + (Math.random() * 10 - 5)),
        temperature: Math.round((baseTemp + (Math.random() * 4 - 2)) * 10) / 10,
        humidity: Math.round(Math.max(40, Math.min(90, baseHumidity + (Math.random() * 10 - 5)))),
        trafficVolume: Math.round(Math.max(10, baseTraffic + (Math.random() * 20 - 10)))
      };
    });

    setEnvironmentalData(envData);

    // Generate connectivity data
    const connectivity: ConnectivityData[] = [
      { name: 'Smart Traffic Lights', connected: 847, total: 892 },
      { name: 'Bus Stop Sensors', connected: 234, total: 245 },
      { name: 'Air Quality Monitors', connected: 67, total: 72 },
      { name: 'CCTV Cameras', connected: 1456, total: 1502 },
      { name: 'Emergency Beacons', connected: 198, total: 203 },
      { name: 'Parking Sensors', connected: 3421, total: 3567 }
    ];

    setConnectivityData(connectivity);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-transit-green';
      case 'warning':
        return 'text-transit-orange';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      good: 'bg-transit-green/20 text-transit-green border-transit-green/30',
      warning: 'bg-transit-orange/20 text-transit-orange border-transit-orange/30',
      critical: 'bg-red-500/20 text-red-500 border-red-500/30'
    };
    
    return variants[status as keyof typeof variants] || variants.good;
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--transit-green))', 'hsl(var(--transit-orange))', 'hsl(var(--transit-blue))'];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4">
            <Brain className="w-3 h-3 mr-1" />
            Smart City Integration
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Comprehensive Urban Intelligence
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time monitoring of transit, environment, and urban infrastructure with AI-powered insights.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transit">Transit</TabsTrigger>
            <TabsTrigger value="environment">Environment</TabsTrigger>
            <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Key Metrics Grid */}
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
              {cityMetrics.map((metric, index) => (
                <Card key={index} className="p-6 shadow-soft">
                  <div className="flex items-center justify-between mb-3">
                    <div className={getStatusColor(metric.status)}>
                      {metric.icon}
                    </div>
                    <Badge className={getStatusBadge(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-foreground">
                      {typeof metric.value === 'number' && metric.value > 10000 
                        ? `${(metric.value / 1000).toFixed(0)}k` 
                        : metric.value}
                      <span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{metric.name}</div>
                    <div className={`text-xs flex items-center gap-1 ${
                      metric.change > 0 ? 'text-transit-green' : 'text-red-500'
                    }`}>
                      <TrendingUp className="w-3 h-3" />
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Real-time Alerts */}
            <Card className="p-6 shadow-elegant">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Real-time City Alerts</h3>
                <Badge variant="outline" className="bg-transit-green/10 text-transit-green border-transit-green/20">
                  Live Monitoring
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-transit-green/10 border border-transit-green/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-transit-green flex-shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">All transit systems operational</div>
                    <div className="text-sm text-muted-foreground">97.3% on-time performance across the network</div>
                  </div>
                  <div className="text-xs text-muted-foreground ml-auto">2 min ago</div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-transit-orange/10 border border-transit-orange/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-transit-orange flex-shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">High traffic volume detected</div>
                    <div className="text-sm text-muted-foreground">Jl. Sudirman experiencing 15% above normal congestion</div>
                  </div>
                  <div className="text-xs text-muted-foreground ml-auto">5 min ago</div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-transit-blue/10 border border-transit-blue/20 rounded-lg">
                  <Zap className="w-5 h-5 text-transit-blue flex-shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">AI optimization in progress</div>
                    <div className="text-sm text-muted-foreground">Route efficiency improvements being deployed</div>
                  </div>
                  <div className="text-xs text-muted-foreground ml-auto">8 min ago</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="environment" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Environmental Trends */}
              <Card className="p-6 shadow-elegant">
                <h3 className="text-lg font-semibold text-foreground mb-4">24-Hour Environmental Data</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={environmentalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="airQuality" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Air Quality Index"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="hsl(var(--transit-orange))" 
                        strokeWidth={2}
                        name="Temperature (°C)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Traffic Volume */}
              <Card className="p-6 shadow-elegant">
                <h3 className="text-lg font-semibold text-foreground mb-4">Traffic Volume Patterns</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={environmentalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="trafficVolume" 
                        fill="hsl(var(--transit-blue))" 
                        name="Traffic Volume (%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="connectivity" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* IoT Device Status */}
              <Card className="p-6 shadow-elegant">
                <h3 className="text-lg font-semibold text-foreground mb-6">IoT Infrastructure Status</h3>
                <div className="space-y-4">
                  {connectivityData.map((item, index) => {
                    const percentage = Math.round((item.connected / item.total) * 100);
                    const status = percentage >= 95 ? 'good' : percentage >= 85 ? 'warning' : 'critical';
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {item.connected}/{item.total}
                            </span>
                            <Badge className={getStatusBadge(status)}>
                              {percentage}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-secondary/50 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              status === 'good' ? 'bg-transit-green' :
                              status === 'warning' ? 'bg-transit-orange' : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Network Health */}
              <Card className="p-6 shadow-elegant">
                <h3 className="text-lg font-semibold text-foreground mb-6">Network Health Distribution</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Excellent', value: 78, color: 'hsl(var(--transit-green))' },
                          { name: 'Good', value: 16, color: 'hsl(var(--transit-blue))' },
                          { name: 'Warning', value: 4, color: 'hsl(var(--transit-orange))' },
                          { name: 'Critical', value: 2, color: 'hsl(var(--destructive))' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: 'Excellent', value: 78 },
                          { name: 'Good', value: 16 },
                          { name: 'Warning', value: 4 },
                          { name: 'Critical', value: 2 }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {[
                    { name: 'Excellent', value: 78, color: 'bg-transit-green' },
                    { name: 'Good', value: 16, color: 'bg-transit-blue' },
                    { name: 'Warning', value: 4, color: 'bg-transit-orange' },
                    { name: 'Critical', value: 2, color: 'bg-red-500' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm text-foreground">{item.name}</span>
                      <span className="text-sm text-muted-foreground ml-auto">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transit" className="space-y-8">
            {/* This will show the existing DashboardPreview content */}
            <Card className="p-6 shadow-elegant">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground mb-4">Transit Operations Hub</h3>
                <p className="text-muted-foreground">
                  Comprehensive transit monitoring and optimization tools are integrated above in the main dashboard.
                </p>
                <Button variant="outline" className="mt-4">
                  <Activity className="w-4 h-4 mr-2" />
                  View Full Transit Dashboard
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default SmartCityDashboard;