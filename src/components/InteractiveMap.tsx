import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Bus, 
  Users, 
  AlertTriangle,
  Navigation,
  Clock
} from 'lucide-react';

interface BusStop {
  id: string;
  name: string;
  coordinates: [number, number];
  crowdingLevel: 'low' | 'medium' | 'high';
  waitingPassengers: number;
  nextBusArrival: string;
}

interface LiveBus {
  id: string;
  route: string;
  coordinates: [number, number];
  capacity: number;
  occupancy: number;
  delay: number;
  speed: number;
}

const InteractiveMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [selectedBus, setSelectedBus] = useState<LiveBus | null>(null);
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [liveBuses, setLiveBuses] = useState<LiveBus[]>([]);

  // Generate realistic transit data
  useEffect(() => {
    // Generate bus stops across Jakarta
    const generatedStops: BusStop[] = [
      {
        id: 'BS001',
        name: 'Halte Bundaran HI',
        coordinates: [106.8236, -6.1957],
        crowdingLevel: 'high',
        waitingPassengers: 45,
        nextBusArrival: '3 min'
      },
      {
        id: 'BS002', 
        name: 'Halte Monas',
        coordinates: [106.8270, -6.1751],
        crowdingLevel: 'medium',
        waitingPassengers: 28,
        nextBusArrival: '7 min'
      },
      {
        id: 'BS003',
        name: 'Halte Senayan',
        coordinates: [106.8019, -6.2297],
        crowdingLevel: 'high',
        waitingPassengers: 52,
        nextBusArrival: '2 min'
      },
      {
        id: 'BS004',
        name: 'Halte Blok M',
        coordinates: [106.7973, -6.2441],
        crowdingLevel: 'medium',
        waitingPassengers: 31,
        nextBusArrival: '5 min'
      },
      {
        id: 'BS005',
        name: 'Halte Kuningan',
        coordinates: [106.8317, -6.2382],
        crowdingLevel: 'low',
        waitingPassengers: 12,
        nextBusArrival: '12 min'
      }
    ];

    // Generate live buses
    const generatedBuses: LiveBus[] = [
      {
        id: 'BUS001',
        route: 'Koridor 1',
        coordinates: [106.8200, -6.1900],
        capacity: 150,
        occupancy: 127,
        delay: -2,
        speed: 35
      },
      {
        id: 'BUS002',
        route: 'Koridor 2',
        coordinates: [106.8150, -6.2100],
        capacity: 150,
        occupancy: 89,
        delay: 5,
        speed: 28
      },
      {
        id: 'BUS003',
        route: 'Koridor 1',
        coordinates: [106.8050, -6.2300],
        capacity: 150,
        occupancy: 134,
        delay: 8,
        speed: 15
      }
    ];

    setBusStops(generatedStops);
    setLiveBuses(generatedBuses);
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map centered on Jakarta (no token required with MapLibre)
    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [106.8270, -6.2088],
        zoom: 11,
        pitch: 30,
      });

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    } catch (e) {
      console.error('Failed to initialize MapLibre map:', e);
      return;
    }

    // Add bus stops when map loads
    map.current.on('load', () => {
      // Add only high-crowding bus stops
      busStops.filter(s => s.crowdingLevel === 'high').forEach((stop) => {
        const crowdingColor = '#EF4444';

        const markerDiv = document.createElement('div');
        markerDiv.className = 'bus-stop-marker';
        markerDiv.style.cssText = `
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: ${crowdingColor};
          border: 3px solid white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s;
        `;

        markerDiv.addEventListener('mouseenter', () => {
          markerDiv.style.transform = 'scale(1.2)';
        });
        
        markerDiv.addEventListener('mouseleave', () => {
          markerDiv.style.transform = 'scale(1)';
        });

        new maplibregl.Marker({ element: markerDiv })
          .setLngLat(stop.coordinates)
          .addTo(map.current!);

        markerDiv.addEventListener('click', () => {
          setSelectedStop(stop);
          setSelectedBus(null);
        });
      });

      // Add live buses
      liveBuses.forEach((bus) => {
        const busMarkerDiv = document.createElement('div');
        busMarkerDiv.className = 'bus-marker';
        const occupancyRate = bus.occupancy / bus.capacity;
        const busColor = occupancyRate > 0.9 ? '#EF4444' : occupancyRate > 0.7 ? '#F59E0B' : '#10B981';
        
        busMarkerDiv.innerHTML = `
          <div style="
            width: 24px;
            height: 24px;
            background-color: ${busColor};
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            🚌
          </div>
        `;

        const busMarker = new maplibregl.Marker({ element: busMarkerDiv })
          .setLngLat(bus.coordinates)
          .addTo(map.current!);

        busMarkerDiv.addEventListener('click', () => {
          setSelectedBus(bus);
          setSelectedStop(null);
        });
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [busStops, liveBuses]);

  const getCrowdingBadge = (level: string) => {
    const variants = {
      low: 'bg-transit-green/20 text-transit-green border-transit-green/30',
      medium: 'bg-transit-orange/20 text-transit-orange border-transit-orange/30', 
      high: 'bg-red-500/20 text-red-500 border-red-500/30'
    };
    return variants[level as keyof typeof variants] || variants.low;
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4">Live Crowding Map</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Crowded Routes & Stops Now
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            View routes and stops experiencing high crowding in real time.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map Container */}
          <div className="lg:col-span-2">
            <Card className="p-6 shadow-elegant">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Live Map</h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-transit-green/10 text-transit-green border-transit-green/20">
                    <Navigation className="w-3 h-3 mr-1" />
                    Live Tracking
                  </Badge>
                </div>
              </div>
              
              <div ref={mapContainer} className="w-full h-96 rounded-lg overflow-hidden border" />
              
              {/* Map Legend */}
              <div className="flex flex-wrap gap-4 mt-4 p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm">High Crowding</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚌</span>
                  <span className="text-sm">Live Buses</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Selected Stop/Bus Info */}
            {selectedStop && (
              <Card className="p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedStop.name}
                  </h4>
                  <Badge className={getCrowdingBadge(selectedStop.crowdingLevel)}>
                    {selectedStop.crowdingLevel} crowding
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Waiting Passengers</span>
                    <span className="font-medium">{selectedStop.waitingPassengers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Next Bus</span>
                    <span className="font-medium text-transit-green">{selectedStop.nextBusArrival}</span>
                  </div>
                </div>
              </Card>
            )}

            {selectedBus && (
              <Card className="p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Bus className="w-4 h-4" />
                    {selectedBus.id}
                  </h4>
                  <Badge variant="outline">{selectedBus.route}</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Occupancy</span>
                    <span className="font-medium">
                      {selectedBus.occupancy}/{selectedBus.capacity} 
                      ({Math.round((selectedBus.occupancy/selectedBus.capacity)*100)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Schedule</span>
                    <span className={`font-medium ${selectedBus.delay > 0 ? 'text-red-500' : 'text-transit-green'}`}>
                      {selectedBus.delay > 0 ? `+${selectedBus.delay}` : selectedBus.delay} min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Speed</span>
                    <span className="font-medium">{selectedBus.speed} km/h</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Network Overview */}
            <Card className="p-6 shadow-soft">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Network Overview
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Buses</span>
                  <span className="font-medium">{liveBuses.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">High Crowding Stops</span>
                  <span className="font-medium text-red-500">
                    {busStops.filter(s => s.crowdingLevel === 'high').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Delay</span>
                  <span className="font-medium">
                    {Math.round(liveBuses.reduce((acc, bus) => acc + bus.delay, 0) / liveBuses.length)} min
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Passengers</span>
                  <span className="font-medium">
                    {liveBuses.reduce((acc, bus) => acc + bus.occupancy, 0) + 
                     busStops.reduce((acc, stop) => acc + stop.waitingPassengers, 0)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveMap;