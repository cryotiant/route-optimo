import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Users, 
  AlertCircle,
  CheckCircle2,
  Zap,
  Target
} from 'lucide-react';

interface PredictionData {
  time: string;
  predicted: number;
  actual: number;
  confidence: number;
}

interface RouteAnalysis {
  route: string;
  currentDemand: number;
  predictedPeak: string;
  peakDemand: number;
  efficiency: number;
  recommendation: string;
}

const MLPredictions: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [routeAnalyses, setRouteAnalyses] = useState<RouteAnalysis[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [modelAccuracy, setModelAccuracy] = useState(0);

  // Simulate ML model predictions
  useEffect(() => {
    const generatePredictions = () => {
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const data: PredictionData[] = hours.map(hour => {
        // Simulate realistic transit patterns
        let baseDemand = 20;
        
        // Morning peak (7-9 AM)
        if (hour >= 7 && hour <= 9) {
          baseDemand += Math.sin((hour - 7) * Math.PI / 2) * 180;
        }
        // Evening peak (17-19 PM)
        if (hour >= 17 && hour <= 19) {
          baseDemand += Math.sin((hour - 17) * Math.PI / 2) * 160;
        }
        // Mid-day moderate usage
        if (hour >= 11 && hour <= 15) {
          baseDemand += 60;
        }
        // Late night low usage
        if (hour >= 22 || hour <= 5) {
          baseDemand *= 0.3;
        }

        const predicted = Math.round(baseDemand + (Math.random() * 20 - 10));
        const actual = Math.round(predicted + (Math.random() * 30 - 15));
        const confidence = Math.min(95, 70 + Math.random() * 25);

        return {
          time: `${hour.toString().padStart(2, '0')}:00`,
          predicted,
          actual,
          confidence: Math.round(confidence)
        };
      });

      setPredictions(data);

      // Calculate model accuracy
      const accuracy = data.reduce((acc, point) => {
        const error = Math.abs(point.predicted - point.actual) / Math.max(point.actual, 1);
        return acc + (1 - Math.min(1, error));
      }, 0) / data.length * 100;
      
      setModelAccuracy(Math.round(accuracy));
    };

    const generateRouteAnalyses = () => {
      const routes: RouteAnalysis[] = [
        {
          route: 'Koridor 1',
          currentDemand: 847,
          predictedPeak: '08:30',
          peakDemand: 1240,
          efficiency: 87,
          recommendation: 'Add 2 extra buses during morning peak'
        },
        {
          route: 'Koridor 2', 
          currentDemand: 623,
          predictedPeak: '18:15',
          peakDemand: 920,
          efficiency: 92,
          recommendation: 'Maintain current schedule'
        },
        {
          route: 'Koridor 3',
          currentDemand: 456,
          predictedPeak: '07:45',
          peakDemand: 780,
          efficiency: 78,
          recommendation: 'Optimize route timing by 5 minutes'
        },
        {
          route: 'Koridor 4',
          currentDemand: 389,
          predictedPeak: '17:30',
          peakDemand: 650,
          efficiency: 84,
          recommendation: 'Consider frequency adjustment'
        }
      ];

      setRouteAnalyses(routes);
    };

    // Simulate loading time
    setTimeout(() => {
      generatePredictions();
      generateRouteAnalyses();
      setIsLoading(false);
    }, 2000);
  }, []);

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-transit-green';
    if (efficiency >= 75) return 'text-transit-orange';
    return 'text-red-500';
  };

  const currentHour = new Date().getHours();
  const currentPrediction = predictions.find(p => p.time === `${currentHour.toString().padStart(2, '0')}:00`);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4">
            <Brain className="w-3 h-3 mr-1" />
            AI-Powered Analytics
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Smart Demand Forecasting
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Machine learning models predict passenger demand, optimize routes, and prevent overcrowding in real-time.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 text-primary">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg">Training ML models...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Model Performance Summary */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <Card className="p-6 text-center shadow-soft">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-8 h-8 text-transit-green" />
                </div>
                <div className="text-2xl font-bold text-foreground">{modelAccuracy}%</div>
                <div className="text-sm text-muted-foreground">Model Accuracy</div>
              </Card>
              
              <Card className="p-6 text-center shadow-soft">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="w-8 h-8 text-transit-blue" />
                </div>
                <div className="text-2xl font-bold text-foreground">{currentPrediction?.predicted || 0}</div>
                <div className="text-sm text-muted-foreground">Current Hour Prediction</div>
              </Card>
              
              <Card className="p-6 text-center shadow-soft">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-8 h-8 text-transit-orange" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {Math.round(predictions.reduce((acc, p) => acc + p.predicted, 0) / predictions.length)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Daily Demand</div>
              </Card>
              
              <Card className="p-6 text-center shadow-soft">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-8 h-8 text-transit-green" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {currentPrediction?.confidence || 0}%
                </div>
                <div className="text-sm text-muted-foreground">Prediction Confidence</div>
              </Card>
            </div>

            {/* Demand Prediction Chart */}
            <Card className="p-6 mb-12 shadow-elegant">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">24-Hour Demand Forecast</h3>
                <Badge variant="outline" className="bg-transit-green/10 text-transit-green border-transit-green/20">
                  Real-time ML
                </Badge>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={predictions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="time" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="predicted"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.2)"
                      name="Predicted Demand"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="hsl(var(--transit-orange))"
                      strokeWidth={2}
                      name="Actual Demand"
                      dot={{ r: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Route Analysis */}
            <Card className="p-6 shadow-elegant">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Route Performance Analysis</h3>
                <Button variant="outline" size="sm">
                  <Brain className="w-4 h-4 mr-2" />
                  Retrain Model
                </Button>
              </div>

              <div className="grid gap-6">
                {routeAnalyses.map((route, index) => (
                  <div key={index} className="border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-transit-blue"></div>
                        <h4 className="font-semibold text-foreground">{route.route}</h4>
                        <Badge variant="outline">Live</Badge>
                      </div>
                      <div className={`font-semibold ${getEfficiencyColor(route.efficiency)}`}>
                        {route.efficiency}% Efficiency
                      </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Current Demand</div>
                        <div className="text-xl font-bold text-foreground">{route.currentDemand}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Predicted Peak</div>
                        <div className="text-xl font-bold text-foreground">{route.predictedPeak}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Peak Demand</div>
                        <div className="text-xl font-bold text-foreground">{route.peakDemand}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Efficiency</div>
                        <Progress value={route.efficiency} className="h-2 mt-2" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium">AI Recommendation:</span>
                      <span className="text-sm text-muted-foreground">{route.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </section>
  );
};

export default MLPredictions;