import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  MapPin, 
  Bus, 
  AlertTriangle,
  CheckCircle,
  Zap,
  Navigation,
  Users,
  Timer
} from 'lucide-react';

interface BusArrival {
  busId: string;
  route: string;
  scheduledTime: string;
  estimatedTime: string;
  actualTime?: string;
  delay: number;
  occupancy: number;
  capacity: number;
  confidence: number;
  status: 'scheduled' | 'approaching' | 'arrived' | 'delayed';
}

interface StopSchedule {
  stopId: string;
  stopName: string;
  arrivals: BusArrival[];
  averageWaitTime: number;
  crowdingLevel: 'low' | 'medium' | 'high';
}

const RealTimeSchedules: React.FC = () => {
  const [selectedStop, setSelectedStop] = useState<string>('BS001');
  const [schedules, setSchedules] = useState<StopSchedule[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [query, setQuery] = useState('');

  // Generate realistic schedule data
  useEffect(() => {
    const generateScheduleData = () => {
      const currentTime = new Date();
      const stops: StopSchedule[] = [
        {
          stopId: 'BS001',
          stopName: 'Halte Bundaran HI',
          averageWaitTime: 8.5,
          crowdingLevel: 'high',
          arrivals: []
        },
        {
          stopId: 'BS002',
          stopName: 'Halte Monas',
          averageWaitTime: 12.3,
          crowdingLevel: 'medium',
          arrivals: []
        },
        {
          stopId: 'BS003',
          stopName: 'Halte Senayan',
          averageWaitTime: 6.2,
          crowdingLevel: 'high',
          arrivals: []
        },
        {
          stopId: 'BS004',
          stopName: 'Halte Blok M',
          averageWaitTime: 9.8,
          crowdingLevel: 'medium',
          arrivals: []
        },
        {
          stopId: 'BS005',
          stopName: 'Halte Kuningan',
          averageWaitTime: 11.1,
          crowdingLevel: 'low',
          arrivals: []
        },
        {
          stopId: 'BS006',
          stopName: 'Halte Kota',
          averageWaitTime: 10.4,
          crowdingLevel: 'medium',
          arrivals: []
        }
      ];

      // Generate arrivals for each stop
      stops.forEach(stop => {
        const arrivals: BusArrival[] = [];
        
        for (let i = 0; i < 8; i++) {
          const scheduledMinutes = 5 + (i * 12) + Math.random() * 4;
          const scheduledTime = new Date(currentTime.getTime() + scheduledMinutes * 60000);
          
          // Calculate realistic delays based on traffic and crowding
          const baseDelay = stop.crowdingLevel === 'high' ? 3 : 
                           stop.crowdingLevel === 'medium' ? 1 : 0;
          const delay = Math.round(baseDelay + (Math.random() * 6 - 2));
          
          const estimatedTime = new Date(scheduledTime.getTime() + delay * 60000);
          
          // Determine status based on time
          let status: BusArrival['status'] = 'scheduled';
          if (scheduledMinutes <= 2) {
            status = 'approaching';
          } else if (scheduledMinutes <= 0) {
            status = delay > 2 ? 'delayed' : 'arrived';
          } else if (delay > 5) {
            status = 'delayed';
          }

          const routes = ['Koridor 1', 'Koridor 2', 'Koridor 3', 'Koridor 4'];
          const route = routes[i % routes.length];
          
          const occupancy = Math.round(30 + Math.random() * 120);
          const capacity = 150;
          const confidence = Math.round(85 + Math.random() * 15);

          arrivals.push({
            busId: `BUS${String(i + 1).padStart(3, '0')}`,
            route,
            scheduledTime: scheduledTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            estimatedTime: estimatedTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            delay,
            occupancy,
            capacity,
            confidence,
            status
          });
        }

        stop.arrivals = arrivals.sort((a, b) => {
          const timeA = new Date(`2024-01-01 ${a.estimatedTime}`).getTime();
          const timeB = new Date(`2024-01-01 ${b.estimatedTime}`).getTime();
          return timeA - timeB;
        });
      });

      setSchedules(stops);
      setLastUpdated(new Date());
    };

    generateScheduleData();

    // Auto-update every 30 seconds if enabled
    const interval = autoUpdate ? setInterval(generateScheduleData, 30000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoUpdate]);

  const selectedStopData = schedules.find(s => s.stopId === selectedStop);
  const filteredStops = schedules.filter(s =>
    s.stopName.toLowerCase().includes(query.toLowerCase()) ||
    s.stopId.toLowerCase().includes(query.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approaching':
        return <Navigation className="w-4 h-4 text-transit-green" />;
      case 'arrived':
        return <CheckCircle className="w-4 h-4 text-transit-green" />;
      case 'delayed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string, delay: number) => {
    switch (status) {
      case 'approaching':
        return <Badge className="bg-transit-green/20 text-transit-green border-transit-green/30">Approaching</Badge>;
      case 'arrived':
        return <Badge className="bg-transit-green/20 text-transit-green border-transit-green/30">Arrived</Badge>;
      case 'delayed':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Delayed +{delay}min</Badge>;
      default:
        return <Badge variant="outline">On Schedule</Badge>;
    }
  };

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const rate = occupancy / capacity;
    if (rate > 0.9) return 'text-red-500';
    if (rate > 0.7) return 'text-transit-orange';
    return 'text-transit-green';
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4">
            <Zap className="w-3 h-3 mr-1" />
            Live Schedule Crowding
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Stop Schedules & Crowding
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Search any stop to view upcoming arrivals and crowding levels.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Stop Selection */}
          <div>
            <Card className="p-6 shadow-soft">
              <h3 className="font-semibold text-foreground mb-4">Select Stop</h3>
              <Input
                placeholder="Search by name or ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mb-3"
              />
              <div className="space-y-2 max-h-[420px] overflow-auto">
                {filteredStops.map((stop) => (
                  <button
                    key={stop.stopId}
                    onClick={() => setSelectedStop(stop.stopId)}
                    className={`w-full p-3 text-left rounded-lg border transition-colors ${
                      selectedStop === stop.stopId
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border hover:bg-secondary/50'
                    }`}
                  >
                    <div className="font-medium">{stop.stopName}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Timer className="w-3 h-3" />
                      Avg wait: {stop.averageWaitTime}min
                    </div>
                  </button>
                ))}
                {filteredStops.length === 0 && (
                  <div className="text-sm text-muted-foreground">No stops found</div>
                )}
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-6 mt-6 shadow-soft">
              <h4 className="font-semibold text-foreground mb-4">Network Status</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">On Time</span>
                  <span className="font-medium text-transit-green">87%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Average Delay</span>
                  <span className="font-medium">2.3 min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Buses</span>
                  <span className="font-medium">143</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Schedule Display */}
          <div className="lg:col-span-3">
            <Card className="p-6 shadow-elegant">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {selectedStopData?.stopName}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={autoUpdate ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoUpdate(!autoUpdate)}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {autoUpdate ? 'Auto' : 'Manual'}
                  </Button>
                </div>
              </div>

              {selectedStopData && (
                <>
                  {/* Stop Info */}
                  <div className="grid md:grid-cols-3 gap-4 mb-6 p-4 bg-secondary/30 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {selectedStopData.averageWaitTime}min
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Wait Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {selectedStopData.arrivals.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Next Arrivals</div>
                    </div>
                    <div className="text-center">
                      <Badge className={`text-sm ${
                        selectedStopData.crowdingLevel === 'high' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                        selectedStopData.crowdingLevel === 'medium' ? 'bg-transit-orange/20 text-transit-orange border-transit-orange/30' :
                        'bg-transit-green/20 text-transit-green border-transit-green/30'
                      }`}>
                        {selectedStopData.crowdingLevel} crowding
                      </Badge>
                    </div>
                  </div>

                  {/* Arrival List */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground mb-4">Upcoming Arrivals</h4>
                    {selectedStopData.arrivals.slice(0, 6).map((arrival, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(arrival.status)}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{arrival.route}</span>
                                <span className="text-sm text-muted-foreground">({arrival.busId})</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Scheduled: {arrival.scheduledTime}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {/* Estimated Time */}
                          <div className="text-center">
                            <div className="font-bold text-foreground text-lg">
                              {arrival.estimatedTime}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {arrival.confidence}% confidence
                            </div>
                          </div>

                          {/* Occupancy */}
                          <div className="text-center min-w-24">
                            <div className={`font-medium ${getOccupancyColor(arrival.occupancy, arrival.capacity)}`}>
                              {Math.round((arrival.occupancy / arrival.capacity) * 100)}%
                            </div>
                            <Progress 
                              value={(arrival.occupancy / arrival.capacity) * 100} 
                              className="h-2 w-16 mt-1" 
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                              {arrival.occupancy}/{arrival.capacity}
                            </div>
                          </div>

                          {/* Status */}
                          <div>
                            {getStatusBadge(arrival.status, arrival.delay)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Alert Box */}
                  <div className="mt-6 p-4 bg-transit-blue/10 border border-transit-blue/20 rounded-lg">
                    <div className="flex items-center gap-2 text-transit-blue mb-2">
                      <Zap className="w-4 h-4" />
                      <span className="font-medium">AI Schedule Optimization Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Real-time adjustments being made based on traffic conditions and passenger demand.
                      Next optimization update in 3 minutes.
                    </p>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RealTimeSchedules;