// GTFS Data Service for Transjakarta
// Handles loading and managing GTFS data for the frontend

export interface GTFSRoute {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_desc: string;
  route_type: number;
  route_color: string;
  route_text_color: string;
}

export interface GTFSStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  stop_desc: string;
  zone_id: string;
}

export interface GTFSShape {
  route_id: string;
  shape_id: string;
  coordinates: [number, number][];
  color: string;
}

export interface PredictionData {
  timestamp: string;
  time_horizon_minutes: number;
  stops: StopPrediction[];
  routes: RoutePrediction[];
}

export interface StopPrediction {
  stop_id: string;
  predictions: {
    crowding: {
      current: 'low' | 'medium' | 'high';
      predicted_15min: 'low' | 'medium' | 'high';
      predicted_30min: 'low' | 'medium' | 'high';
      confidence: number;
    };
    bus_count: {
      current: number;
      predicted_15min: number;
      predicted_30min: number;
      confidence: number;
    };
    lateness: {
      current: number;
      predicted_15min: number;
      predicted_30min: number;
      confidence: number;
    };
  };
}

export interface RoutePrediction {
  route_id: string;
  predictions: {
    total_buses: {
      current: number;
      predicted_15min: number;
      predicted_30min: number;
      confidence: number;
    };
    average_delay: {
      current: number;
      predicted_15min: number;
      predicted_30min: number;
      confidence: number;
    };
    crowding_score: {
      current: number;
      predicted_15min: number;
      predicted_30min: number;
      confidence: number;
    };
  };
}

class GTFSService {
  private routes: GTFSRoute[] = [];
  private stops: GTFSStop[] = [];
  private shapes: GTFSShape[] = [];
  private predictions: PredictionData | null = null;
  private isLoaded = false;

  async loadGTFSData(): Promise<void> {
    try {
      // Load routes
      const routesResponse = await fetch('/gtfs/routes.json');
      const routesData = await routesResponse.json();
      this.routes = routesData.routes;

      // Load stops
      const stopsResponse = await fetch('/gtfs/stops.json');
      const stopsData = await stopsResponse.json();
      this.stops = stopsData.stops;

      // Load shapes
      const shapesResponse = await fetch('/gtfs/shapes.json');
      const shapesData = await shapesResponse.json();
      this.shapes = shapesData.shapes;

      // Load predictions
      const predictionsResponse = await fetch('/gtfs/predictions.json');
      const predictionsData = await predictionsResponse.json();
      this.predictions = predictionsData.predictions;

      this.isLoaded = true;
      console.log('GTFS data loaded successfully');
    } catch (error) {
      console.error('Error loading GTFS data:', error);
      throw error;
    }
  }

  getRoutes(): GTFSRoute[] {
    if (!this.isLoaded) {
      throw new Error('GTFS data not loaded. Call loadGTFSData() first.');
    }
    return this.routes;
  }

  getStops(): GTFSStop[] {
    if (!this.isLoaded) {
      throw new Error('GTFS data not loaded. Call loadGTFSData() first.');
    }
    return this.stops;
  }

  getShapes(): GTFSShape[] {
    if (!this.isLoaded) {
      throw new Error('GTFS data not loaded. Call loadGTFSData() first.');
    }
    return this.shapes;
  }

  getPredictions(): PredictionData | null {
    if (!this.isLoaded) {
      throw new Error('GTFS data not loaded. Call loadGTFSData() first.');
    }
    return this.predictions;
  }

  getRouteById(routeId: string): GTFSRoute | undefined {
    return this.routes.find(route => route.route_id === routeId);
  }

  getStopById(stopId: string): GTFSStop | undefined {
    return this.stops.find(stop => stop.stop_id === stopId);
  }

  getShapeByRouteId(routeId: string): GTFSShape | undefined {
    return this.shapes.find(shape => shape.route_id === routeId);
  }

  getStopsByZone(zoneId: string): GTFSStop[] {
    return this.stops.filter(stop => stop.zone_id === zoneId);
  }

  getPredictionForStop(stopId: string): StopPrediction | undefined {
    return this.predictions?.stops.find(stop => stop.stop_id === stopId);
  }

  getPredictionForRoute(routeId: string): RoutePrediction | undefined {
    return this.predictions?.routes.find(route => route.route_id === routeId);
  }

  getHighCrowdingStops(): GTFSStop[] {
    if (!this.predictions) return [];
    
    const highCrowdingStopIds = this.predictions.stops
      .filter(stop => stop.predictions.crowding?.current === 'high')
      .map(stop => stop.stop_id);
    
    return this.stops.filter(stop => highCrowdingStopIds.includes(stop.stop_id));
  }

  getDelayedRoutes(): GTFSRoute[] {
    if (!this.predictions) return [];
    
    const delayedRouteIds = this.predictions.routes
      .filter(route => route.predictions.average_delay.current > 5)
      .map(route => route.route_id);
    
    return this.routes.filter(route => delayedRouteIds.includes(route.route_id));
  }

  // Get stops within a bounding box
  getStopsInBounds(
    north: number, 
    south: number, 
    east: number, 
    west: number
  ): GTFSStop[] {
    return this.stops.filter(stop => 
      stop.stop_lat <= north && 
      stop.stop_lat >= south && 
      stop.stop_lon <= east && 
      stop.stop_lon >= west
    );
  }

  // Get routes that pass through a specific area
  getRoutesInArea(centerLat: number, centerLon: number, radiusKm: number): GTFSRoute[] {
    const routesInArea: GTFSRoute[] = [];
    
    for (const shape of this.shapes) {
      const hasStopInArea = shape.coordinates.some(coord => {
        const distance = this.calculateDistance(
          centerLat, centerLon, coord[1], coord[0]
        );
        return distance <= radiusKm;
      });
      
      if (hasStopInArea) {
        const route = this.getRouteById(shape.route_id);
        if (route) {
          routesInArea.push(route);
        }
      }
    }
    
    return routesInArea;
  }

  // Calculate distance between two points in kilometers
  private calculateDistance(
    lat1: number, lon1: number, lat2: number, lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Get real-time status for a stop
  getStopStatus(stopId: string): {
    crowding: 'low' | 'medium' | 'high';
    waitingPassengers: number;
    nextBusArrival: string;
  } | null {
    const prediction = this.getPredictionForStop(stopId);
    if (!prediction) return null;

    const crowding = prediction.predictions.crowding?.current ?? 'unknown';
    const busCount = prediction.predictions.bus_count?.current ?? 0;
    const lateness = prediction.predictions.lateness?.current ?? 0;

    // Estimate waiting passengers based on crowding level
    const waitingPassengers = crowding === 'high' ? 40 + Math.random() * 20 :
                              crowding === 'medium' ? 20 + Math.random() * 20 :
                              5 + Math.random() * 15;

    // Estimate next bus arrival based on bus count and lateness
    const baseArrival = busCount > 0 ? 3 + Math.random() * 5 : 8 + Math.random() * 10;
    const adjustedArrival = Math.max(1, baseArrival + lateness);
    const nextBusArrival = `${Math.round(adjustedArrival)} min`;

    return {
      crowding,
      waitingPassengers: Math.round(waitingPassengers),
      nextBusArrival
    };
  }

  // Get real-time status for a bus
  getBusStatus(routeId: string): {
    capacity: number;
    occupancy: number;
    delay: number;
    speed: number;
  } | null {
    const prediction = this.getPredictionForRoute(routeId);
    if (!prediction) return null;

    const delay = prediction.predictions.average_delay?.current ?? 0;
    const crowdingScore = prediction.predictions.crowding_score?.current ?? 0;
    
    const capacity = 150; // Standard Transjakarta bus capacity
    const occupancy = Math.round(capacity * crowdingScore);
    const speed = Math.max(10, 35 - Math.abs(delay) * 2); // Speed decreases with delay

    return {
      capacity,
      occupancy,
      delay,
      speed
    };
  }
}

// Export singleton instance
export const gtfsService = new GTFSService();
