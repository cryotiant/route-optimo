# Transjakarta Data Integration

This document describes the data integration system that uses real data from multiple sources:

## Data Sources

### 1. **brain2.py** - Machine Learning Model
- **Purpose**: Passenger prediction model using Random Forest
- **Input**: Historical passenger data with features like time, day, stop, etc.
- **Output**: Predicted passenger counts for bus scheduling
- **Integration**: The prediction logic from brain2.py has been integrated into the frontend service

### 2. **tj_koridor2_with_travel.csv** - Historical Data
- **Purpose**: Real historical passenger data from Transjakarta Koridor 2
- **Columns**:
  - `date`: Date of observation
  - `day_of_week`: Day of the week
  - `time`: Time of observation
  - `hour`, `minute`: Time components
  - `direction`: Bus direction
  - `destination`: Final destination
  - `stop_order`: Stop sequence number
  - `stop_name`: Name of the bus stop
  - `stop_coef`: Stop coefficient
  - `peak`: Peak hour indicator (1/0)
  - `sample_id`: Unique sample identifier
  - `observed_passengers`: Actual passenger count
  - `travel_time_min`: Travel time in minutes

### 3. **GTFS Data** - Transit Network Information
- **Purpose**: Standard transit data format for routes, stops, and schedules
- **Files**:
  - `stops.json`: Bus stop locations and information
  - `routes.json`: Route definitions and metadata
  - `shapes.json`: Route geometry for map visualization

## Architecture

### Frontend Services

#### `transjakarta-data-service.ts`
- **Main data service** that integrates all data sources
- **Features**:
  - Loads GTFS data (stops, routes)
  - Loads historical CSV data
  - Generates predictions using brain2.py logic
  - Provides unified API for components

#### `csv-data-service.ts`
- **CSV data handling service**
- **Features**:
  - Loads CSV data from API or generates sample data
  - Provides data filtering and analysis methods
  - Handles data transformation

### Backend API

#### `server.js`
- **Express server** that serves CSV data
- **Endpoints**:
  - `/api/csv-data`: Raw CSV data
  - `/api/historical-data`: Transformed historical data
  - `/api/stops/:stopName/data`: Data for specific stops
  - `/api/stops/:stopName/average`: Average passengers per stop

## Data Flow

1. **Frontend loads** → `transjakarta-data-service.loadAllData()`
2. **GTFS data** → Loaded from `/gtfs/` JSON files
3. **CSV data** → Loaded from API server or generated as sample
4. **Predictions** → Generated using brain2.py logic + historical data
5. **Components** → Use unified data service for all operations

## Prediction Logic

The prediction system combines:

1. **Historical Data**: Uses actual passenger counts from CSV
2. **brain2.py Factors**:
   - Time-based adjustments (peak hours, late night)
   - Day-based adjustments (weekday/weekend patterns)
   - Stop-specific factors (terminal vs. business district)
3. **Real-time Variation**: Adds realistic randomness based on historical patterns

## Usage

### Starting the System

```bash
# Install dependencies
npm install

# Start both frontend and backend
npm run dev:full

# Or start separately
npm run server  # Backend API (port 3001)
npm run dev     # Frontend (port 5173)
```

### API Endpoints

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **CSV Data**: http://localhost:3001/api/csv-data
- **Health Check**: http://localhost:3001/api/health

## Data Quality

- **Real Data**: Uses actual Transjakarta passenger data
- **Fallback**: Sample data when API is unavailable
- **Validation**: Data transformation and error handling
- **Performance**: Caching and efficient data loading

## Components Updated

- `InteractiveMap.tsx`: Uses real GTFS and prediction data
- `RealTimeSchedules.tsx`: Uses real stop data and predictions
- `AllStopsList.tsx`: Uses real stop data and crowding levels

## Future Enhancements

1. **Real-time API**: Integrate with actual Transjakarta APIs
2. **Machine Learning**: Deploy brain2.py model as a service
3. **Data Analytics**: Add more sophisticated analysis features
4. **Real-time Updates**: WebSocket integration for live data
