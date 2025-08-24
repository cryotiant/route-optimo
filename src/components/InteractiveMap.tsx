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
  Clock,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { transjakartaJSONService } from '@/lib/transjakarta-json-service';
import { transjakartaCSVService } from '@/lib/transjakarta-csv-service';
import type { TransJakartaStop, TransJakartaRoute, LiveBus, Predictions } from '@/lib/transjakarta-json-service';
import type { Corridor2Stop, Corridor2Route } from '@/lib/transjakarta-csv-service';

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

interface LiveBus {
  id: string;
  route: string;
  coordinates: [number, number];
  capacity: number;
  occupancy: number;
  delay: number;
  speed: number;
  routeColor: string;
}

interface RouteDisplay {
  route: {
    routeId: string;
    routeShortName: string;
    routeLongName: string;
    routeColor: string;
    routeTextColor: string;
  };
  shape: {
    route_id: string;
    shape_id: string;
    coordinates: [number, number][];
    color: string;
  };
  isVisible: boolean;
}

const InteractiveMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [selectedBus, setSelectedBus] = useState<LiveBus | null>(null);
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [liveBuses, setLiveBuses] = useState<LiveBus[]>([]);
  const [routes, setRoutes] = useState<RouteDisplay[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showPredictions, setShowPredictions] = useState(true);
  const [showAllStops, setShowAllStops] = useState(true);
  const [showRouteImage, setShowRouteImage] = useState(true);

  // Load Transjakarta data
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Starting to load Transjakarta JSON data...');
        await transjakartaJSONService.loadData();
        
        // Try to get Corridor 2 stops from JSON service first
        let stops = transjakartaJSONService.getStopsByCorridor("2");
        console.log('Loaded Corridor 2 stops from JSON:', stops.length);
        
        // If no stops from JSON, try CSV service
        if (stops.length === 0) {
          console.log('No stops from JSON, trying CSV service...');
          try {
            await transjakartaCSVService.loadCSVData();
            const csvStops = transjakartaCSVService.getStops();
            console.log('Loaded Corridor 2 stops from CSV:', csvStops.length);
            
            if (csvStops.length > 0) {
              // Convert CSV stops to BusStop format
              const convertedStops: BusStop[] = csvStops.map(stop => ({
                id: stop.id,
                name: stop.name,
                coordinates: [stop.location.lng, stop.location.lat] as [number, number],
                crowdingLevel: stop.crowding,
                waitingPassengers: stop.waiting_passengers,
                nextBusArrival: stop.prediction,
                zone: stop.zone,
                description: stop.description
              }));
              
              setBusStops(convertedStops);
              
              // Get routes from CSV
              const csvRoutes = transjakartaCSVService.getRoutes();
              const convertedRoutes: RouteDisplay[] = csvRoutes.map(route => ({
                route: {
                  routeId: route.id,
                  routeShortName: route.short_name,
                  routeLongName: route.name,
                  routeColor: route.color,
                  routeTextColor: route.text_color
                },
                shape: { 
                  route_id: route.id, 
                  shape_id: route.id, 
                  coordinates: route.coordinates, 
                  color: route.color 
                },
                isVisible: true
              }));
              
              setRoutes(convertedRoutes);
              
              // Get live buses from CSV
              const csvBuses = transjakartaCSVService.getLiveBuses();
              const convertedBuses: LiveBus[] = csvBuses.map(bus => ({
                id: bus.id,
                route: bus.route,
                coordinates: bus.coordinates,
                capacity: bus.capacity,
                occupancy: bus.occupancy,
                delay: bus.delay,
                speed: bus.speed,
                routeColor: bus.route_color
              }));
              
              setLiveBuses(convertedBuses);
              setIsDataLoaded(true);
              console.log('Data loaded successfully from CSV service');
              return;
            }
          } catch (csvError) {
            console.error('Failed to load CSV data:', csvError);
          }
        }
        
                 if (stops.length === 0) {
           console.warn('No Corridor 2 stops loaded from any source, using fallback data');
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
           
           // Create a simple route connecting the stops
           const fallbackRoute: RouteDisplay = {
             route: {
               routeId: 'R002',
               routeShortName: '2',
               routeLongName: 'Koridor 2',
               routeColor: 'FF8C00',
               routeTextColor: 'FFFFFF'
             },
             shape: {
               route_id: 'R002',
               shape_id: 'R002',
               coordinates: fallbackStops.map(stop => stop.coordinates),
               color: 'FF8C00'
             },
             isVisible: true
           };
           
           setBusStops(fallbackStops);
           setLiveBuses([]);
           setRoutes([fallbackRoute]);
           setIsDataLoaded(true);
           return;
         }
        
        // Convert stops to BusStop format and sort by route order
        const convertedStops: BusStop[] = stops.map(stop => {
          // Validate coordinates
          if (!stop.location || typeof stop.location.lng !== 'number' || typeof stop.location.lat !== 'number') {
            console.warn('Invalid coordinates for stop:', stop.id, stop.location);
            return null;
          }
          
          return {
            id: stop.id,
            name: stop.name,
            coordinates: [stop.location.lng, stop.location.lat] as [number, number],
            crowdingLevel: stop.crowding,
            waitingPassengers: stop.waiting_passengers,
            nextBusArrival: stop.prediction,
            zone: stop.zone,
            description: stop.description
          };
        }).filter(Boolean) as BusStop[];
        
        // Sort stops by route order (Pulogadung to Monas)
        const stopOrder = ["S001", "S002", "S003", "S004", "S005", "S006", "S007", "S008", "S009", "S010", "S011", "S012", "S013"];
        convertedStops.sort((a, b) => {
          const aIndex = stopOrder.indexOf(a.id);
          const bIndex = stopOrder.indexOf(b.id);
          return aIndex - bIndex;
        });
        
        console.log('Converted and sorted Corridor 2 stops:', convertedStops.length, convertedStops);

        // Get only Corridor 2 routes from JSON service
        const routes = transjakartaJSONService.getRoutesByCorridor("2");
        console.log('Loaded Corridor 2 routes:', routes.length, routes);
        const convertedRoutes: RouteDisplay[] = routes.map(route => {
          // Validate coordinates
          if (!route.coordinates || !Array.isArray(route.coordinates) || route.coordinates.length === 0) {
            console.warn('Invalid coordinates for route:', route.id, route.coordinates);
            return null;
          }
          
          return {
            route: {
              routeId: route.id,
              routeShortName: route.short_name,
              routeLongName: route.name,
              routeColor: route.color,
              routeTextColor: route.text_color
            },
            shape: { 
              route_id: route.id, 
              shape_id: route.id, 
              coordinates: route.coordinates, 
              color: route.color 
            },
            isVisible: true
          };
        }).filter(Boolean) as RouteDisplay[];
        console.log('Converted Corridor 2 routes:', convertedRoutes.length, convertedRoutes);

        // Get only Corridor 2 live buses from JSON service
        const liveBuses = transjakartaJSONService.getLiveBuses().filter(bus => bus.route === "2");
        const convertedBuses: LiveBus[] = liveBuses.map(bus => {
          // Validate coordinates
          if (!bus.coordinates || !Array.isArray(bus.coordinates) || bus.coordinates.length !== 2) {
            console.warn('Invalid coordinates for bus:', bus.id, bus.coordinates);
            return null;
          }
          
          return {
            id: bus.id,
            route: bus.route,
            coordinates: bus.coordinates,
            capacity: bus.capacity,
            occupancy: bus.occupancy,
            delay: bus.delay,
            speed: bus.speed,
            routeColor: bus.route_color
          };
        }).filter(Boolean) as LiveBus[];

        setBusStops(convertedStops);
        setLiveBuses(convertedBuses);
        setRoutes(convertedRoutes);
        setIsDataLoaded(true);
        console.log('Data loading completed successfully');
      } catch (error) {
        console.error('Failed to load Transjakarta data:', error);
        // Set a minimal state to prevent white screen
        setIsDataLoaded(true);
      }
    };

    loadData();

    // Listen for stop highlighting events from the stop list
    const handleStopHighlighted = (event: CustomEvent) => {
      const stopId = event.detail.stopId;
      const stop = busStops.find(s => s.id === stopId);
      if (stop && map.current) {
        // Fly to the stop location
        map.current.flyTo({
          center: stop.coordinates,
          zoom: 15,
          duration: 1000
        });
        // Highlight the stop marker
        setSelectedStop(stop);
        setSelectedBus(null);
      }
    };

    window.addEventListener('stopHighlighted', handleStopHighlighted as EventListener);

    return () => {
      window.removeEventListener('stopHighlighted', handleStopHighlighted as EventListener);
    };
  }, [busStops]);

  // Initialize map only once
  useEffect(() => {
    console.log('Initializing map...');
    if (!mapContainer.current) {
      console.log('No map container ref');
      return;
    }

    // Check if container has dimensions and is visible
    const container = mapContainer.current;
    const rect = container.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0 && 
                     window.getComputedStyle(container).display !== 'none' &&
                     window.getComputedStyle(container).visibility !== 'hidden';
    
    console.log('Container dimensions:', rect.width, 'x', rect.height, 'visible:', isVisible);
    
    if (!isVisible) {
      console.log('Container not visible, waiting...');
      // Wait for next frame to check again
      requestAnimationFrame(() => {
        if (mapContainer.current) {
          const newRect = mapContainer.current.getBoundingClientRect();
          const newIsVisible = newRect.width > 0 && newRect.height > 0 &&
                              window.getComputedStyle(mapContainer.current).display !== 'none' &&
                              window.getComputedStyle(mapContainer.current).visibility !== 'hidden';
          if (newIsVisible) {
            console.log('Container now visible, initializing map...');
            // Re-trigger this effect
            setTimeout(() => setSelectedStop(prev => prev), 100);
          }
        }
      });
      return;
    }

    // Initialize map centered on Jakarta
    try {
      console.log('Creating MapLibre map...');
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.stadiamaps.com/styles/osm_bright.json',
        center: [106.8200, -6.1900], // Center between Pulogadung and Monas
        zoom: 12,
        pitch: 30,
        attributionControl: false,
      });
      
             // Fallback style if the primary one fails
       map.current.on('error', (e) => {
         if (e.error && e.error.message.includes('style')) {
           console.log('Primary style failed, trying fallback...');
           map.current!.setStyle('https://basemaps.cartocdn.com/gl/positron-gl-style/style.json');
         }
       });

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      
             // Add event listeners for debugging
       map.current.on('load', () => {
         console.log('Map loaded successfully');
       });
       
       map.current.on('error', (e) => {
         console.error('Map error:', e);
       });
      
      console.log('Map created successfully');
      
      // Add resize observer to handle container size changes
      const resizeObserver = new ResizeObserver(() => {
        if (map.current) {
          map.current.resize();
        }
      });
      resizeObserver.observe(container);
      
    } catch (e) {
      console.error('Failed to initialize MapLibre map:', e);
      return;
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []); // Empty dependency array - only run once

  // Add data to map when it's loaded and map is ready
  useEffect(() => {
    console.log('Map data effect triggered:', { 
      hasMap: !!map.current, 
      isDataLoaded, 
      isStyleLoaded: map.current?.isStyleLoaded(),
      routesCount: routes.length,
      stopsCount: busStops.length,
      busesCount: liveBuses.length
    });
    
    if (!map.current || !isDataLoaded) return;
    
    // Wait for map to be fully loaded
    if (!map.current.isStyleLoaded()) {
      console.log('Map style not loaded yet, waiting...');
      map.current.once('styledata', () => {
        console.log('Map style loaded, re-triggering data effect');
        // Re-run this effect when style is loaded
        setTimeout(() => {
          if (map.current && isDataLoaded) {
            // Trigger re-render by updating a state
            setSelectedStop(prev => prev);
          }
        }, 100);
      });
      return;
    }
    
    // Additional check to ensure map is fully ready
    if (!map.current.isStyleLoaded() || !map.current.getSource) {
      console.log('Map not fully ready yet, waiting...');
      // Wait for map to be fully loaded
      map.current.once('load', () => {
        console.log('Map load event fired, re-triggering data effect');
        setTimeout(() => {
          if (map.current && isDataLoaded) {
            setSelectedStop(prev => prev);
          }
        }, 100);
      });
      return;
    }

    // Clear existing markers and sources
    const existingMarkers = document.querySelectorAll('.bus-stop-marker, .bus-marker, .route-label');
    existingMarkers.forEach(marker => marker.remove());

    // Remove existing sources and layers
    routes.forEach((routeDisplay) => {
      const routeId = `route-${routeDisplay.route.routeId}`;
      if (map.current!.getSource(routeId)) {
        map.current!.removeLayer(routeId);
        map.current!.removeSource(routeId);
      }
    });

    // Add route lines
    routes.forEach((routeDisplay) => {
      console.log('Adding route:', routeDisplay.route.routeId, 'with coordinates:', routeDisplay.shape.coordinates);
      if (routeDisplay.shape.coordinates.length > 1) {
        const routeId = `route-${routeDisplay.route.routeId}`;
        
        // Add route line
        map.current!.addSource(routeId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routeDisplay.shape.coordinates
            }
          }
        });

        map.current!.addLayer({
          id: routeId,
          type: 'line',
          source: routeId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': `#${routeDisplay.route.routeColor}`,
            'line-width': 4,
            'line-opacity': 0.8
          }
        });

        // Add route labels
        if (routeDisplay.shape.coordinates.length > 0) {
          const midPoint = routeDisplay.shape.coordinates[Math.floor(routeDisplay.shape.coordinates.length / 2)];
          if (midPoint) {
            const labelDiv = document.createElement('div');
            labelDiv.className = 'route-label';
            labelDiv.innerHTML = `
              <div style="
                background-color: #${routeDisplay.route.routeColor};
                color: #${routeColorToTextColor(routeDisplay.route.routeColor)};
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: bold;
                border: 1px solid white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              ">
                ${routeDisplay.route.routeShortName}
              </div>
            `;

            new maplibregl.Marker({ element: labelDiv })
              .setLngLat(midPoint)
              .addTo(map.current!);
          }
        }
      }
    });

    // Add bus stops
    console.log('Adding bus stops:', busStops.length);
    busStops.forEach((stop) => {
      console.log('Adding stop:', stop.name, 'at coordinates:', stop.coordinates);
      const crowdingColor = (stop.crowdingLevel ?? 'unknown') === 'high' ? '#EF4444' : 
                           (stop.crowdingLevel ?? 'unknown') === 'medium' ? '#F59E0B' : '#10B981';

      const markerDiv = document.createElement('div');
      markerDiv.className = 'bus-stop-marker';
      markerDiv.style.cssText = `
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: ${crowdingColor};
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
      `;

      markerDiv.addEventListener('mouseenter', () => {
        markerDiv.style.transform = 'scale(1.3)';
        markerDiv.style.zIndex = '1000';
      });
      
      markerDiv.addEventListener('mouseleave', () => {
        markerDiv.style.transform = 'scale(1)';
        markerDiv.style.zIndex = 'auto';
      });

      new maplibregl.Marker({ element: markerDiv })
        .setLngLat(stop.coordinates)
        .addTo(map.current!);

      markerDiv.addEventListener('click', () => {
        setSelectedStop(stop);
        setSelectedBus(null);
        // Emit custom event for stop selection
        const event = new CustomEvent('stopSelected', { detail: { stopId: stop.id } });
        window.dispatchEvent(event);
      });
    });

    // Add live buses
    console.log('Adding live buses:', liveBuses.length);
    liveBuses.forEach((bus) => {
      console.log('Adding bus:', bus.route, 'at coordinates:', bus.coordinates);
      const busMarkerDiv = document.createElement('div');
      busMarkerDiv.className = 'bus-marker';
      const occupancyRate = bus.occupancy / bus.capacity;
      const busColor = occupancyRate > 0.9 ? '#EF4444' : occupancyRate > 0.7 ? '#F59E0B' : '#10B981';
      
      busMarkerDiv.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          background-color: ${busColor};
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s;
        ">
          🚌
        </div>
      `;

      const busMarker = new maplibregl.Marker({ element: busMarkerDiv })
        .setLngLat(bus.coordinates)
        .addTo(map.current!);

      busMarkerDiv.addEventListener('mouseenter', () => {
        busMarkerDiv.style.transform = 'scale(1.2)';
        busMarkerDiv.style.zIndex = '1000';
      });
      
      busMarkerDiv.addEventListener('mouseleave', () => {
        busMarkerDiv.style.transform = 'scale(1)';
        busMarkerDiv.style.zIndex = 'auto';
      });

      busMarkerDiv.addEventListener('click', () => {
        setSelectedBus(bus);
        setSelectedStop(null);
      });
    });

  }, [isDataLoaded, busStops, liveBuses, routes]); // Only re-run when data changes

  const getCrowdingColor = (level: string) => {
    const variants = {
      high: '#EF4444',
      medium: '#F59E0B',
      low: '#10B981'
    };
    return variants[level as keyof typeof variants] || variants.low;
  };

  const routeColorToTextColor = (routeColor: string): string => {
    // Simple logic to determine if text should be black or white based on route color brightness
    // For now, return white for most colors, black for light colors
    const lightColors = ['FFD700', 'FFFF00', 'FFFFFF']; // Gold, Yellow, White
    return lightColors.includes(routeColor) ? '000000' : 'FFFFFF';
  };

  if (!isDataLoaded) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
                       <div className="text-center">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-transit-green mx-auto mb-4"></div>
               <p className="text-muted-foreground">Loading Corridor 2 data...</p>
               <p className="text-sm text-muted-foreground mt-2">Trying JSON and CSV sources...</p>
             </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
                 <div className="text-center mb-12">
           <Badge className="mb-4">Corridor 2 Route</Badge>
           <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
             TransJakarta Corridor 2: Pulogadung → Monumen Nasional
           </h2>
           <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
             View the complete Corridor 2 route with stops and crowding data from Pulogadung to Monumen Nasional.
           </p>
         </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Map Container */}
          <div className="lg:col-span-3">
            <Card className="p-6 shadow-elegant">
                             <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-semibold">
                   {showRouteImage ? 'Corridor 2 Route Image' : 'Corridor 2 Route Map'}
                 </h3>
                                 <div className="flex gap-2">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setShowAllStops(!showAllStops)}
                     className="flex items-center gap-2"
                   >
                     {showAllStops ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     {showAllStops ? 'High Crowding Only' : 'Show All Stops'}
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setShowPredictions(!showPredictions)}
                     className="flex items-center gap-2"
                   >
                     <TrendingUp className="w-4 h-4" />
                     {showPredictions ? 'Hide' : 'Show'} Predictions
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setShowRouteImage(!showRouteImage)}
                     className="flex items-center gap-2"
                   >
                     {showRouteImage ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                     {showRouteImage ? 'Show Map' : 'Show Route Image'}
                   </Button>
                   {showRouteImage && (
                     <span className="text-xs text-muted-foreground ml-2">Recommended</span>
                   )}
                 </div>
              </div>
              
                             {showRouteImage ? (
                 <div className="w-full rounded-lg overflow-hidden border">
                   <img 
                     src="/tije.webp" 
                     alt="TransJakarta Corridor 2 Route Map" 
                     className="w-full h-auto object-contain rounded-lg shadow-lg"
                     style={{ maxHeight: '600px' }}
                   />
                 </div>
               ) : (
                 <div 
                   ref={mapContainer} 
                   className="w-full h-96 rounded-lg overflow-hidden border relative" 
                   style={{ minHeight: '384px' }}
                 >
                   {!isDataLoaded && (
                     <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                       <div className="text-center">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-transit-green mx-auto mb-2"></div>
                         <p className="text-sm text-muted-foreground">Loading map...</p>
                       </div>
                     </div>
                   )}
                 </div>
               )}
              
                             {/* Map Legend */}
               <div className="flex flex-wrap gap-4 mt-4 p-4 bg-background/80 rounded-lg border shadow-sm">
                 <h4 className="w-full font-semibold text-sm mb-2">
                   {showRouteImage ? 'Route Image Legend' : 'Corridor 2 Map Legend'}
                 </h4>
                 
                 {showRouteImage && (
                   <div className="w-full text-sm text-muted-foreground mb-2">
                     Showing the complete Corridor 2 route image from Pulogadung to Monumen Nasional. This provides a clear overview of the entire route. Click "Show Map" to attempt interactive map view.
                   </div>
                 )}
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-red-500 border border-white"></div>
                   <span className="text-sm font-medium">High Crowding</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-orange-500 border border-white"></div>
                   <span className="text-sm font-medium">Medium Crowding</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-green-500 border border-white"></div>
                   <span className="text-sm font-medium">Low Crowding</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="text-lg">🚌</span>
                   <span className="text-sm font-medium">Corridor 2 Buses</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 bg-orange-500 rounded border border-white"></div>
                   <span className="text-sm font-medium">Corridor 2 Route</span>
                 </div>
               </div>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Selected Stop Info */}
            {selectedStop && (
              <Card className="p-4 shadow-soft">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-transit-green" />
                  <h4 className="font-semibold">{selectedStop.name}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Crowding:</span>
                    <Badge 
                      variant="outline" 
                      style={{ backgroundColor: getCrowdingColor(selectedStop?.crowdingLevel ?? 'unknown') }}
                    >
                      {(selectedStop?.crowdingLevel ?? 'unknown')}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Waiting Passengers:</span>
                    <span className="font-medium">{selectedStop.waitingPassengers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone:</span>
                    <span className="font-medium">{selectedStop.zone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Bus:</span>
                    <span className="font-medium">{selectedStop.nextBusArrival}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Selected Bus Info */}
            {selectedBus && (
              <Card className="p-4 shadow-soft">
                <div className="flex items-center gap-3 mb-3">
                  <Bus className="w-5 h-5 text-transit-green" />
                  <h4 className="font-semibold">Bus {selectedBus.route}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Occupancy:</span>
                    <span className="font-medium">{selectedBus.occupancy}/{selectedBus.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delay:</span>
                    <span className="font-medium">{selectedBus.delay} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Speed:</span>
                    <span className="font-medium">{selectedBus.speed} km/h</span>
                  </div>
                </div>
              </Card>
            )}

                         {/* Corridor 2 Overview */}
             <Card className="p-4 shadow-soft">
               <h4 className="font-semibold mb-3">Corridor 2 Overview</h4>
               <div className="space-y-3">
                 <div className="flex justify-between">
                   <span>Route:</span>
                   <span className="font-medium">Pulogadung → Monas</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Total Stops:</span>
                   <span className="font-medium">{busStops.length}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>High Crowding:</span>
                   <span className="font-medium text-red-500">
                     {busStops.filter(s => (s.crowdingLevel ?? 'unknown') === 'high').length}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span>Medium Crowding:</span>
                   <span className="font-medium text-orange-500">
                     {busStops.filter(s => (s.crowdingLevel ?? 'unknown') === 'medium').length}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span>Low Crowding:</span>
                   <span className="font-medium text-green-500">
                     {busStops.filter(s => (s.crowdingLevel ?? 'unknown') === 'low').length}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span>Active Buses:</span>
                   <span className="font-medium">{liveBuses.length}</span>
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
