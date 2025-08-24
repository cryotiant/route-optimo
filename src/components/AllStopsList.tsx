import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Search, 
  Filter,
  Users,
  Clock,
  TrendingUp
} from 'lucide-react';
import { transjakartaJSONService } from '@/lib/transjakarta-json-service';
import { transjakartaCSVService } from '@/lib/transjakarta-csv-service';

interface BusStop {
  id: string;
  name: string;
  coordinates: [number, number];
  crowdingLevel: 'low' | 'medium' | 'high' | 'unknown';
  waitingPassengers: number;
  nextBusArrival: string;
  zone: string;
  description: string;
}

const AllStopsList: React.FC = () => {
  const [stops, setStops] = useState<BusStop[]>([]);
  const [filteredStops, setFilteredStops] = useState<BusStop[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [crowdingFilter, setCrowdingFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [selectedTimeHorizon, setSelectedTimeHorizon] = useState<'current' | '15min' | '30min'>('current');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    // Fetch predictions from ML output
    fetch('/gtfs/predictions.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.predictions && data.predictions.stops) {
          setPredictions(data.predictions.stops);
        }
      })
      .catch(() => setPredictions([]));
  }, []);

  useEffect(() => {
    const loadStops = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
                 // Try to load Transjakarta JSON data first
         let dataStops: any[] = [];
         try {
           await transjakartaJSONService.loadData();
           dataStops = transjakartaJSONService.getStopsByCorridor("2");
           console.log('Loaded stops from JSON service:', dataStops.length);
         } catch (jsonError) {
           console.log('JSON service failed, trying CSV service...');
         }
         
         // If no stops from JSON, try CSV service
         if (dataStops.length === 0) {
           try {
             await transjakartaCSVService.loadCSVData();
             const csvStops = transjakartaCSVService.getStops();
             console.log('Loaded stops from CSV service:', csvStops.length);
             
             if (csvStops.length > 0) {
               dataStops = csvStops.map(stop => ({
                 id: stop.id,
                 name: stop.name,
                 location: { lng: stop.location.lng, lat: stop.location.lat },
                 crowding: stop.crowding,
                 waiting_passengers: stop.waiting_passengers,
                 prediction: stop.prediction,
                 zone: stop.zone,
                 description: stop.description
               }));
             }
           } catch (csvError) {
             console.error('CSV service also failed:', csvError);
           }
         }
         
         const convertedStops: BusStop[] = dataStops.map(stop => ({
           id: stop.id,
           name: stop.name,
           coordinates: [stop.location.lng, stop.location.lat] as [number, number],
           crowdingLevel: stop.crowding,
           waitingPassengers: stop.waiting_passengers,
           nextBusArrival: stop.prediction,
           zone: stop.zone,
           description: stop.description
         }));
         
         // Sort stops by route order (Pulogadung to Monas)
         const stopOrder = ["S001", "S002", "S003", "S004", "S005", "S006", "S007", "S008", "S009", "S010", "S011", "S012", "S013"];
         convertedStops.sort((a, b) => {
           const aIndex = stopOrder.indexOf(a.id);
           const bIndex = stopOrder.indexOf(b.id);
           return aIndex - bIndex;
         });
        
                 if (convertedStops.length === 0) {
           console.warn('No stops loaded, using fallback data');
           // Use fallback data if no stops are loaded
           const fallbackStops: BusStop[] = [
             {
               id: 'S001',
               name: 'Pulogadung',
               coordinates: [106.8270, -6.2088] as [number, number],
               crowdingLevel: 'high',
               waitingPassengers: 95,
               nextBusArrival: '1 min',
               zone: 'East Jakarta',
               description: 'Terminal Pulogadung - Eastern terminus of Corridor 2'
             },
             {
               id: 'S002',
               name: 'TU Gas',
               coordinates: [106.8236, -6.2001] as [number, number],
               crowdingLevel: 'medium',
               waitingPassengers: 65,
               nextBusArrival: '3 min',
               zone: 'East Jakarta',
               description: 'TU Gas stop - connecting to industrial area'
             },
             {
               id: 'S003',
               name: 'Velodrome',
               coordinates: [106.8226, -6.1956] as [number, number],
               crowdingLevel: 'medium',
               waitingPassengers: 75,
               nextBusArrival: '5 min',
               zone: 'East Jakarta',
               description: 'Velodrome sports complex area'
             },
             {
               id: 'S013',
               name: 'Monumen Nasional',
               coordinates: [106.8226, -6.1754] as [number, number],
               crowdingLevel: 'high',
               waitingPassengers: 120,
               nextBusArrival: '1 min',
               zone: 'Central Jakarta',
               description: 'Monumen Nasional - central landmark and western terminus'
             }
           ];
           setStops(fallbackStops);
           setFilteredStops(fallbackStops);
         } else {
           setStops(convertedStops);
           setFilteredStops(convertedStops);
         }
      } catch (error) {
        console.error('Failed to load stops:', error);
        setError('Failed to load stop data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStops();

    // Listen for stop selection events from the map
    const handleStopSelected = (event: CustomEvent) => {
      setSelectedStopId(event.detail.stopId);
      // Scroll to the selected stop
      const stopElement = document.getElementById(`stop-${event.detail.stopId}`);
      if (stopElement) {
        stopElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        stopElement.classList.add('ring-2', 'ring-transit-green', 'ring-opacity-50');
        setTimeout(() => {
          stopElement.classList.remove('ring-2', 'ring-transit-green', 'ring-opacity-50');
        }, 3000);
      }
    };

    window.addEventListener('stopSelected', handleStopSelected as EventListener);

    return () => {
      window.removeEventListener('stopSelected', handleStopSelected as EventListener);
    };
  }, []);

  useEffect(() => {
    let filtered = stops;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(stop => 
        (stop.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (stop.zone?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    // Apply crowding filter
    if (crowdingFilter !== 'all') {
      filtered = filtered.filter(stop => (stop.crowdingLevel ?? 'unknown') === crowdingFilter);
    }

    setFilteredStops(filtered);
  }, [stops, searchTerm, crowdingFilter]);

  const getCrowdingBadge = (level: string) => {
    const variants = {
      low: 'bg-transit-green/20 text-transit-green border-transit-green/30',
      medium: 'bg-transit-orange/20 text-transit-orange border-transit-orange/30', 
      high: 'bg-red-500/20 text-red-500 border-red-500/30',
      unknown: 'bg-gray-500/20 text-gray-500 border-gray-500/30'
    };
    return variants[level as keyof typeof variants] || variants.unknown;
  };

  const getPredictionForStop = (stopId: string) => {
    // Try to find ML prediction for this stop
    const pred = predictions.find((p: any) => (p.stop_id || p.stopId || '').toLowerCase() === stopId.toLowerCase());
    if (pred && pred.predictions) {
      return { predictions: pred.predictions };
    }
    // Fallback to previous logic
    const stop = transjakartaJSONService.getStopById(stopId);
    if (!stop) return null;
    return {
      predictions: {
        crowding: {
          current: stop.crowding,
          predicted_15min: transjakartaJSONService.getCrowdingPrediction(stopId, 'next_15min'),
          predicted_30min: transjakartaJSONService.getCrowdingPrediction(stopId, 'next_30min'),
          confidence: 0.85
        },
        bus_count: {
          current: stop.service_lines.length,
          predicted_15min: stop.service_lines.length,
          predicted_30min: stop.service_lines.length,
          confidence: 0.9
        },
        lateness: {
          current: 0,
          predicted_15min: 0,
          predicted_30min: 0,
          confidence: 0.8
        }
      }
    };
  };

  const handleStopClick = (stopId: string) => {
    setSelectedStopId(stopId);
    // Emit event for map to highlight this stop
    const event = new CustomEvent('stopHighlighted', { detail: { stopId } });
    window.dispatchEvent(event);
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-transit-green mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-foreground">Loading stops...</h2>
          <p className="text-muted-foreground">Please wait while we fetch the latest data.</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-red-800 mb-2">Error Loading Data</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4">Corridor 2 Stops</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            TransJakarta Corridor 2 Stop Directory
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete directory of Corridor 2 stops from Pulogadung to Monumen Nasional.
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8 shadow-soft">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search stops by name or zone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={crowdingFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCrowdingFilter('all')}
              >
                All
              </Button>
              <Button
                variant={crowdingFilter === 'high' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCrowdingFilter('high')}
                className="text-red-500"
              >
                High Crowding
              </Button>
              <Button
                variant={crowdingFilter === 'medium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCrowdingFilter('medium')}
                className="text-orange-500"
              >
                Medium
              </Button>
              <Button
                variant={crowdingFilter === 'low' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCrowdingFilter('low')}
                className="text-green-500"
              >
                Low
              </Button>
            </div>

            <div className="flex gap-2">
              {(['current', '15min', '30min'] as const).map((horizon) => (
                <Button
                  key={horizon}
                  variant={selectedTimeHorizon === horizon ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeHorizon(horizon)}
                >
                  {horizon === 'current' ? 'Now' : horizon}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card key="total-stops" className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{stops.length}</div>
            <div className="text-sm text-muted-foreground">Corridor 2 Stops</div>
          </Card>
          <Card key="high-crowding" className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">
              {stops.filter(s => (s.crowdingLevel ?? 'unknown') === 'high').length}
            </div>
            <div className="text-sm text-muted-foreground">High Crowding</div>
          </Card>
          <Card key="medium-crowding" className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">
              {stops.filter(s => (s.crowdingLevel ?? 'unknown') === 'medium').length}
            </div>
            <div className="text-sm text-muted-foreground">Medium Crowding</div>
          </Card>
          <Card key="low-crowding" className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {stops.filter(s => (s.crowdingLevel ?? 'unknown') === 'low').length}
            </div>
            <div className="text-sm text-muted-foreground">Low Crowding</div>
          </Card>
        </div>

        {/* Stops List */}
        <div className="grid gap-4">
          {filteredStops.map((stop) => {
            const prediction = getPredictionForStop(stop.id);
            const timeKey = selectedTimeHorizon === 'current' ? 'current' : 
                           selectedTimeHorizon === '15min' ? 'predicted_15min' : 'predicted_30min';
            
            return (
              <Card 
                key={stop.id} 
                id={`stop-${stop.id}`}
                className={`p-6 shadow-soft hover:shadow-elegant transition-shadow cursor-pointer ${
                  selectedStopId === stop.id ? 'ring-2 ring-transit-green ring-opacity-50' : ''
                }`}
                onClick={() => handleStopClick(stop.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">{stop.name}</h3>
                      <Badge className={getCrowdingBadge(stop.crowdingLevel ?? 'unknown')}>
                        {(stop.crowdingLevel ?? 'unknown')} crowding
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Zone:</span>
                        <span className="ml-2 font-medium">{stop.zone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Waiting:</span>
                        <span className="ml-2 font-medium">{stop.waitingPassengers || 0} passengers</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next Bus:</span>
                        <span className="ml-2 font-medium text-transit-green">{stop.nextBusArrival || 'N/A'}</span>
                      </div>
                                             <div>
                         <span className="text-muted-foreground">Corridor:</span>
                         <div className="flex flex-wrap gap-1 mt-1">
                           <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                             Corridor 2
                           </Badge>
                         </div>
                       </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-2">{stop.description || 'No description available'}</p>
                  </div>

                  {/* Predictions */}
                  {prediction && prediction.predictions ? (
                    <div className="md:w-64">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Predictions ({selectedTimeHorizon})</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Crowding:</span>
                          <Badge variant="outline" className={`ml-1 ${getCrowdingBadge(prediction.predictions?.crowding?.[timeKey] ?? 'unknown')}`}> 
                            {(prediction.predictions?.crowding?.[timeKey] ?? 'unknown')}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Buses:</span>
                          <span className="ml-1 font-medium">{prediction.predictions?.bus_count?.[timeKey] ?? 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="md:w-64">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Predictions</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        No prediction data available for this stop.
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {filteredStops.length === 0 && (
          <Card className="p-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No stops found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </Card>
        )}
      </div>
    </section>
  );
};

export default AllStopsList;
