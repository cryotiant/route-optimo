export interface TransJakartaStop {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  waiting_passengers: number;
  service_lines: string[];
  corridor: string;
  crowding: 'low' | 'medium' | 'high';
  prediction: string;
  zone: string;
  description: string;
}

export interface TransJakartaRoute {
  id: string;
  name: string;
  short_name: string;
  color: string;
  text_color: string;
  corridor: string;
  stops: string[];
  coordinates: [number, number][];
}

export interface LiveBus {
  id: string;
  route: string;
  coordinates: [number, number];
  capacity: number;
  occupancy: number;
  delay: number;
  speed: number;
  route_color: string;
  next_stop: string;
  eta: string;
}

export interface Predictions {
  crowding_forecast: {
    next_15min: Record<string, 'low' | 'medium' | 'high'>;
    next_30min: Record<string, 'low' | 'medium' | 'high'>;
  };
  bus_arrival_times: {
    next_15min: Record<string, string>;
    next_30min: Record<string, string>;
  };
}

export interface TransJakartaData {
  stops: TransJakartaStop[];
  routes: TransJakartaRoute[];
  live_buses: LiveBus[];
  predictions: Predictions;
}

class TransJakartaJSONService {
  private data: TransJakartaData | null = null;
  private isLoaded = false;

  async loadData(): Promise<void> {
    try {
      const response = await fetch('/transjakarta-data.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      this.data = await response.json();
      this.isLoaded = true;
      console.log('TransJakarta JSON data loaded successfully:', this.data);
    } catch (error) {
      console.error('Failed to load TransJakarta JSON data:', error);
      throw error;
    }
  }

  getStops(): TransJakartaStop[] {
    if (!this.isLoaded || !this.data) {
      throw new Error('Data not loaded. Call loadData() first.');
    }
    return this.data.stops;
  }

  getRoutes(): TransJakartaRoute[] {
    if (!this.isLoaded || !this.data) {
      throw new Error('Data not loaded. Call loadData() first.');
    }
    return this.data.routes;
  }

  getLiveBuses(): LiveBus[] {
    if (!this.isLoaded || !this.data) {
      throw new Error('Data not loaded. Call loadData() first.');
    }
    return this.data.live_buses;
  }

  getPredictions(): Predictions {
    if (!this.isLoaded || !this.data) {
      throw new Error('Data not loaded. Call loadData() first.');
    }
    return this.data.predictions;
  }

  getStopById(id: string): TransJakartaStop | undefined {
    if (!this.isLoaded || !this.data) {
      return undefined;
    }
    return this.data.stops.find(stop => stop.id === id);
  }

  getRouteById(id: string): TransJakartaRoute | undefined {
    if (!this.isLoaded || !this.data) {
      return undefined;
    }
    return this.data.routes.find(route => route.id === id);
  }

  getStopsByCrowding(crowding: 'low' | 'medium' | 'high'): TransJakartaStop[] {
    if (!this.isLoaded || !this.data) {
      return [];
    }
    return this.data.stops.filter(stop => stop.crowding === crowding);
  }

  getStopsByZone(zone: string): TransJakartaStop[] {
    if (!this.isLoaded || !this.data) {
      return [];
    }
    return this.data.stops.filter(stop => stop.zone === zone);
  }

  getStopsByServiceLine(serviceLine: string): TransJakartaStop[] {
    if (!this.isLoaded || !this.data) {
      return [];
    }
    return this.data.stops.filter(stop => stop.service_lines.includes(serviceLine));
  }

  getStopsByCorridor(corridor: string): TransJakartaStop[] {
    if (!this.isLoaded || !this.data) {
      return [];
    }
    return this.data.stops.filter(stop => stop.corridor === corridor);
  }

  getRoutesByCorridor(corridor: string): TransJakartaRoute[] {
    if (!this.isLoaded || !this.data) {
      return [];
    }
    return this.data.routes.filter(route => route.corridor === corridor);
  }

  getCrowdingPrediction(stopId: string, timeHorizon: 'next_15min' | 'next_30min'): 'low' | 'medium' | 'high' | 'unknown' {
    if (!this.isLoaded || !this.data) {
      return 'unknown';
    }
    return this.data.predictions.crowding_forecast[timeHorizon][stopId] || 'unknown';
  }

  getArrivalPrediction(stopId: string, timeHorizon: 'next_15min' | 'next_30min'): string {
    if (!this.isLoaded || !this.data) {
      return 'N/A';
    }
    return this.data.predictions.bus_arrival_times[timeHorizon][stopId] || 'N/A';
  }

  isDataLoaded(): boolean {
    return this.isLoaded;
  }
}

export const transjakartaJSONService = new TransJakartaJSONService();
