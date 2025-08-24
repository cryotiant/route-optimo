export interface CSVStop {
  stop_order: number;
  stop_name: string;
  direction: string;
  destination: string;
  observed_passengers: number;
  travel_time_min: number;
  peak: number;
}

export interface Corridor2Stop {
  id: string;
  name: string;
  order: number;
  direction: string;
  destination: string;
  avg_passengers: number;
  avg_travel_time: number;
  peak_hours: number;
  location: { lat: number; lng: number };
  crowding: 'low' | 'medium' | 'high';
  waiting_passengers: number;
  prediction: string;
  zone: string;
  description: string;
}

export interface Corridor2Route {
  id: string;
  name: string;
  short_name: string;
  color: string;
  text_color: string;
  corridor: string;
  stops: string[];
  coordinates: [number, number][];
}

class TransJakartaCSVService {
  private csvData: CSVStop[] = [];
  private isLoaded = false;

  async loadCSVData(): Promise<void> {
    try {
      const response = await fetch('/tj_koridor2_with_travel.csv');
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV data: ${response.status}`);
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n');
      const headers = lines[0].split(',');
      
      this.csvData = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',');
          return {
            stop_order: parseInt(values[7]) || 0,
            stop_name: values[8] || '',
            direction: values[5] || '',
            destination: values[6] || '',
            observed_passengers: parseInt(values[12]) || 0,
            travel_time_min: parseInt(values[13]) || 0,
            peak: parseInt(values[10]) || 0
          };
        })
        .filter(stop => stop.stop_name && stop.stop_order > 0);

      this.isLoaded = true;
      console.log('CSV data loaded successfully:', this.csvData.length, 'records');
    } catch (error) {
      console.error('Failed to load CSV data:', error);
      throw error;
    }
  }

  getStops(): Corridor2Stop[] {
    if (!this.isLoaded) {
      return [];
    }

    // Group stops by name and calculate averages
    const stopMap = new Map<string, CSVStop[]>();
    
    this.csvData.forEach(stop => {
      if (!stopMap.has(stop.stop_name)) {
        stopMap.set(stop.stop_name, []);
      }
      stopMap.get(stop.stop_name)!.push(stop);
    });

    // Convert to Corridor2Stop format
    const stops: Corridor2Stop[] = Array.from(stopMap.entries()).map(([name, records]) => {
      const avgPassengers = Math.round(records.reduce((sum, r) => sum + r.observed_passengers, 0) / records.length);
      const avgTravelTime = Math.round(records.reduce((sum, r) => sum + r.travel_time_min, 0) / records.length);
      const peakHours = records.filter(r => r.peak === 1).length;
      
      // Determine crowding level based on average passengers
      let crowding: 'low' | 'medium' | 'high' = 'low';
      if (avgPassengers > 30) crowding = 'high';
      else if (avgPassengers > 15) crowding = 'medium';

      // Generate coordinates based on stop order (approximate positions along Corridor 2)
      const order = Math.min(...records.map(r => r.stop_order));
      const lat = -6.2088 + (order - 1) * 0.003; // Approximate latitude progression
      const lng = 106.8270 - (order - 1) * 0.001; // Approximate longitude progression

      return {
        id: `S${String(order).padStart(3, '0')}`,
        name: name,
        order: order,
        direction: records[0].direction,
        destination: records[0].destination,
        avg_passengers: avgPassengers,
        avg_travel_time: avgTravelTime,
        peak_hours: peakHours,
        location: { lat, lng },
        crowding,
        waiting_passengers: avgPassengers + Math.floor(Math.random() * 20),
        prediction: `Next bus in ${Math.floor(Math.random() * 10) + 1} min`,
        zone: order <= 7 ? 'East Jakarta' : 'Central Jakarta',
        description: `${name} - Corridor 2 stop ${order}`
      };
    });

    // Sort by stop order
    stops.sort((a, b) => a.order - b.order);
    
    return stops;
  }

  getRoutes(): Corridor2Route[] {
    if (!this.isLoaded) {
      return [];
    }

    const stops = this.getStops();
    const coordinates: [number, number][] = stops.map(stop => [stop.location.lng, stop.location.lat]);

    return [{
      id: 'R002',
      name: 'Koridor 2',
      short_name: '2',
      color: 'FF8C00',
      text_color: 'FFFFFF',
      corridor: '2',
      stops: stops.map(s => s.id),
      coordinates
    }];
  }

  getLiveBuses() {
    // Generate some sample live bus data
    const stops = this.getStops();
    return [
      {
        id: 'BUS001',
        route: '2',
        coordinates: stops[2]?.location ? [stops[2].location.lng, stops[2].location.lat] : [106.8226, -6.1956],
        capacity: 150,
        occupancy: 120,
        delay: 2,
        speed: 28,
        route_color: 'FF8C00',
        next_stop: stops[3]?.id || 'S004',
        eta: '3 min'
      },
      {
        id: 'BUS002',
        route: '2',
        coordinates: stops[6]?.location ? [stops[6].location.lng, stops[6].location.lat] : [106.8186, -6.1766],
        capacity: 150,
        occupancy: 85,
        delay: 0,
        speed: 32,
        route_color: 'FF8C00',
        next_stop: stops[7]?.id || 'S007',
        eta: '1 min'
      },
      {
        id: 'BUS003',
        route: '2',
        coordinates: stops[9]?.location ? [stops[9].location.lng, stops[9].location.lat] : [106.8166, -6.1676],
        capacity: 150,
        occupancy: 95,
        delay: 1,
        speed: 30,
        route_color: 'FF8C00',
        next_stop: stops[10]?.id || 'S010',
        eta: '2 min'
      }
    ];
  }

  isDataLoaded(): boolean {
    return this.isLoaded;
  }
}

export const transjakartaCSVService = new TransJakartaCSVService();
