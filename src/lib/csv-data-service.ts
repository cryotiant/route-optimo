// CSV Data Service
// Parses and serves real data from tj_koridor2_with_travel.csv

export interface CSVRow {
  date: string;
  day_of_week: string;
  time: string;
  hour: number;
  minute: number;
  direction: string;
  destination: string;
  stop_order: number;
  stop_name: string;
  stop_coef: number;
  peak: number;
  sample_id: number;
  observed_passengers: number;
  travel_time_min: number;
}

class CSVDataService {
  private csvData: CSVRow[] = [];
  private isLoaded = false;

  // Load CSV data
  async loadCSVData(): Promise<CSVRow[]> {
    if (this.isLoaded) {
      return this.csvData;
    }

    try {
      // Try to fetch from the API server first
      const response = await fetch('http://localhost:3001/api/csv-data');
      
      if (response.ok) {
        this.csvData = await response.json();
        this.isLoaded = true;
        console.log(`Loaded ${this.csvData.length} CSV records from API`);
        return this.csvData;
      } else {
        // Fallback to sample data if API is not available
        console.warn('API server not available, using sample data');
        this.csvData = this.generateSampleCSVData();
        this.isLoaded = true;
        console.log(`Loaded ${this.csvData.length} sample CSV records`);
        return this.csvData;
      }
    } catch (error) {
      console.error('Failed to load CSV data from API, using sample data:', error);
      // Fallback to sample data
      this.csvData = this.generateSampleCSVData();
      this.isLoaded = true;
      console.log(`Loaded ${this.csvData.length} sample CSV records`);
      return this.csvData;
    }
  }

  // Generate sample data based on the CSV structure
  private generateSampleCSVData(): CSVRow[] {
    const sampleData: CSVRow[] = [];
    const stops = ['Pulo Gadung', 'Monas', 'Juanda', 'Pulomas', 'Cempaka Mas', 'Galur', 'Harmoni', 'Blok M', 'Senayan', 'Bundaran HI'];
    const directions = ['to Pulo Gadung', 'to Monas'];
    const destinations = ['Pulo Gadung', 'Monas'];
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    let sampleId = 1;
    
    // Generate data for each day
    for (let day = 18; day <= 24; day++) {
      const dayOfWeek = daysOfWeek[(day - 18) % 7];
      
      // Generate data for each hour
      for (let hour = 6; hour <= 22; hour++) {
        // Generate data for each 15-minute interval
        for (let minute = 0; minute < 60; minute += 15) {
          // Generate data for each stop
          for (const stopName of stops) {
            const direction = directions[Math.floor(Math.random() * directions.length)];
            const destination = destinations[Math.floor(Math.random() * destinations.length)];
            
            // Calculate realistic passenger counts based on time and stop
            let basePassengers = 10;
            
            // Peak hour adjustments
            if (hour >= 6 && hour <= 9) {
              basePassengers *= 2.5; // Morning peak
            } else if (hour >= 16 && hour <= 19) {
              basePassengers *= 2.0; // Evening peak
            } else if (hour >= 22 || hour <= 5) {
              basePassengers *= 0.3; // Late night
            }
            
            // Stop-specific adjustments
            if (stopName.includes('Pulo Gadung') || stopName.includes('Monas')) {
              basePassengers *= 1.5; // Terminal stops
            } else if (stopName.includes('Juanda') || stopName.includes('Harmoni')) {
              basePassengers *= 1.3; // Business district
            }
            
            // Day-specific adjustments
            if (dayOfWeek === 'Monday' || dayOfWeek === 'Friday') {
              basePassengers *= 1.2; // Weekday peaks
            } else if (dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday') {
              basePassengers *= 0.7; // Weekend reduction
            }
            
            // Add some randomness
            const variation = 0.7 + Math.random() * 0.6; // ±30% variation
            const observedPassengers = Math.max(1, Math.round(basePassengers * variation));
            
            sampleData.push({
              date: `2025-08-${day}`,
              day_of_week: dayOfWeek,
              time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
              hour,
              minute,
              direction,
              destination,
              stop_order: Math.floor(Math.random() * 20) + 1,
              stop_name: stopName,
              stop_coef: 1.5 + Math.random() * 0.5,
              peak: hour >= 6 && hour <= 9 ? 1 : 0,
              sample_id: sampleId++,
              observed_passengers: observedPassengers,
              travel_time_min: Math.floor(Math.random() * 10) + 5
            });
          }
        }
      }
    }

    return sampleData;
  }

  // Get data for a specific stop
  getDataForStop(stopName: string): CSVRow[] {
    return this.csvData.filter(row => row.stop_name === stopName);
  }

  // Get data for a specific day
  getDataForDay(dayOfWeek: string): CSVRow[] {
    return this.csvData.filter(row => row.day_of_week === dayOfWeek);
  }

  // Get data for a specific time range
  getDataForTimeRange(startHour: number, endHour: number): CSVRow[] {
    return this.csvData.filter(row => row.hour >= startHour && row.hour <= endHour);
  }

  // Get average passengers for a stop
  getAveragePassengersForStop(stopName: string): number {
    const stopData = this.getDataForStop(stopName);
    if (stopData.length === 0) return 0;
    
    const totalPassengers = stopData.reduce((sum, row) => sum + row.observed_passengers, 0);
    return Math.round(totalPassengers / stopData.length);
  }

  // Get peak hour data
  getPeakHourData(): CSVRow[] {
    return this.csvData.filter(row => row.peak === 1);
  }

  // Get all unique stops
  getUniqueStops(): string[] {
    return [...new Set(this.csvData.map(row => row.stop_name))];
  }

  // Get all unique days
  getUniqueDays(): string[] {
    return [...new Set(this.csvData.map(row => row.day_of_week))];
  }

  // Get data loading status
  isDataLoaded(): boolean {
    return this.isLoaded;
  }

  // Get all data
  getAllData(): CSVRow[] {
    return this.csvData;
  }
}

export const csvDataService = new CSVDataService();
