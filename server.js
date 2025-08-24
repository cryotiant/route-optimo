import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static('public'));

// API endpoint to serve CSV data
app.get('/api/csv-data', (req, res) => {
  const results = [];
  
  fs.createReadStream('tj_koridor2_with_travel.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      res.json(results);
    })
    .on('error', (error) => {
      console.error('Error reading CSV:', error);
      res.status(500).json({ error: 'Failed to read CSV data' });
    });
});

// API endpoint to serve historical data
app.get('/api/historical-data', (req, res) => {
  const results = [];
  
  fs.createReadStream('tj_koridor2_with_travel.csv')
    .pipe(csv())
    .on('data', (data) => {
      // Transform CSV data to match our HistoricalData interface
      results.push({
        date: data.date,
        dayOfWeek: data.day_of_week,
        time: data.time,
        hour: parseInt(data.hour),
        minute: parseInt(data.minute),
        direction: data.direction,
        destination: data.destination,
        stopOrder: parseInt(data.stop_order),
        stopName: data.stop_name,
        stopCoef: parseFloat(data.stop_coef),
        peak: parseInt(data.peak),
        sampleId: parseInt(data.sample_id),
        observedPassengers: parseInt(data.observed_passengers),
        travelTimeMin: parseInt(data.travel_time_min)
      });
    })
    .on('end', () => {
      res.json(results);
    })
    .on('error', (error) => {
      console.error('Error reading CSV:', error);
      res.status(500).json({ error: 'Failed to read historical data' });
    });
});

// API endpoint to get data for a specific stop
app.get('/api/stops/:stopName/data', (req, res) => {
  const stopName = req.params.stopName;
  const results = [];
  
  fs.createReadStream('tj_koridor2_with_travel.csv')
    .pipe(csv())
    .on('data', (data) => {
      if (data.stop_name === stopName) {
        results.push({
          date: data.date,
          dayOfWeek: data.day_of_week,
          time: data.time,
          hour: parseInt(data.hour),
          minute: parseInt(data.minute),
          direction: data.direction,
          destination: data.destination,
          stopOrder: parseInt(data.stop_order),
          stopName: data.stop_name,
          stopCoef: parseFloat(data.stop_coef),
          peak: parseInt(data.peak),
          sampleId: parseInt(data.sample_id),
          observedPassengers: parseInt(data.observed_passengers),
          travelTimeMin: parseInt(data.travel_time_min)
        });
      }
    })
    .on('end', () => {
      res.json(results);
    })
    .on('error', (error) => {
      console.error('Error reading CSV:', error);
      res.status(500).json({ error: 'Failed to read stop data' });
    });
});

// API endpoint to get average passengers for a stop
app.get('/api/stops/:stopName/average', (req, res) => {
  const stopName = req.params.stopName;
  const results = [];
  
  fs.createReadStream('tj_koridor2_with_travel.csv')
    .pipe(csv())
    .on('data', (data) => {
      if (data.stop_name === stopName) {
        results.push(parseInt(data.observed_passengers));
      }
    })
    .on('end', () => {
      if (results.length > 0) {
        const average = results.reduce((sum, passengers) => sum + passengers, 0) / results.length;
        res.json({ 
          stopName, 
          averagePassengers: Math.round(average),
          totalRecords: results.length 
        });
      } else {
        res.json({ 
          stopName, 
          averagePassengers: 0,
          totalRecords: 0 
        });
      }
    })
    .on('error', (error) => {
      console.error('Error reading CSV:', error);
      res.status(500).json({ error: 'Failed to calculate average' });
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CSV data available at: http://localhost:${PORT}/api/csv-data`);
  console.log(`Historical data available at: http://localhost:${PORT}/api/historical-data`);
});
