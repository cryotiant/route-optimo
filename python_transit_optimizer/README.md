# TransJakarta Bus Optimization System

A comprehensive Python-based system for optimizing TransJakarta bus allocations using real GTFS data, synthetic demand modeling, and Integer Linear Programming.

## 🚌 Overview

This system combines real-world transit data with advanced optimization techniques to:
- Download and process TransJakarta GTFS data automatically
- Generate realistic passenger demand and traffic flow patterns
- Forecast passenger demand using moving averages (ML-ready architecture)
- Optimize bus allocation using Integer Linear Programming
- Simulate system performance and calculate key performance indicators
- Export results in multiple formats with visualizations

## 📁 Project Structure

```
python_transit_optimizer/
├── config.py              # All configurable parameters
├── data_loader.py          # GTFS data downloading and processing
├── data_synthesizer.py     # Synthetic passenger and traffic data generation
├── forecast.py             # Demand forecasting (placeholder for ML models)
├── optimizer.py            # Integer Linear Programming optimization
├── simulator.py            # Event-based transit system simulation
├── main.py                 # Main pipeline orchestrator
├── requirements.txt        # Python dependencies
├── README.md              # This file
└── results/               # Output directory (created automatically)
    ├── data/              # CSV exports
    ├── plots/             # Visualization plots
    └── optimization_summary.json  # JSON summary
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Internet connection (for GTFS data download)

### Installation

1. Clone or download the project files
2. Install dependencies:
```bash
pip install -r requirements.txt
```

### Running the System

Execute the complete pipeline:
```bash
python main.py
```

This will:
1. Download latest TransJakarta GTFS data (cached locally)
2. Generate synthetic passenger demand and traffic data
3. Run demand forecasting
4. Optimize bus allocations using ILP
5. Simulate system performance
6. Export results to CSV, JSON, and generate plots

## ⚙️ Configuration

All parameters are configurable in `config.py`:

### Key Settings
```python
# Analysis scope
MAX_ROUTES = 5              # Number of routes to analyze (set None for all)
ANALYSIS_DAYS = 1           # Days to simulate
TIME_SLOT_MINUTES = 15      # Time slot duration

# Fleet configuration
TOTAL_FLEET_SIZE = 100      # Available buses
BUS_CAPACITY = 80           # Passengers per bus

# Data generation
PASSENGER_DEMAND_MEAN = 25  # Average passengers per stop per slot
RANDOM_SEED = 42            # For reproducible results

# Output options
EXPORT_CSV = True           # Export detailed CSV files
EXPORT_JSON = True          # Export JSON summary
GENERATE_PLOTS = True       # Generate visualization plots
```

### Customizing Parameters

To modify the analysis:

1. **Change fleet size**: Edit `TOTAL_FLEET_SIZE` in config.py
2. **Analyze more routes**: Increase `MAX_ROUTES` (None for all routes)
3. **Longer simulation**: Increase `ANALYSIS_DAYS`
4. **Different demand patterns**: Modify `PASSENGER_DEMAND_MEAN` and `PASSENGER_DEMAND_STD`
5. **Cost parameters**: Adjust `OPERATING_COST_PER_BUS_HOUR` and `OVERLOAD_PENALTY`

## 📊 Output Files

The system generates comprehensive outputs in the `results/` directory:

### JSON Summary (`optimization_summary.json`)
```json
{
  "routes": {
    "route_id": {
      "time_slots": {
        "0": {"buses": 3, "capacity": 240, "demand": 180},
        "1": {"buses": 2, "capacity": 160, "demand": 120}
      }
    }
  },
  "buses_allocated": {"route_id": {"0": 3, "1": 2}},
  "KPIs": {
    "avg_load_factor": 0.743,
    "fleet_utilization": 0.87,
    "percent_overloaded_trips": 8.7
  }
}
```

### CSV Files
- `synthetic_passenger_demand.csv` - Generated demand data
- `synthetic_traffic_flow.csv` - Traffic conditions between stops
- `forecast_route_forecasts.csv` - Demand predictions by route
- `optimization_bus_allocations.csv` - Optimized bus assignments
- `simulation_simulation_events.csv` - Detailed simulation events

### Visualization Plots
- `demand_capacity_analysis.png` - Demand vs capacity by route
- `service_quality_kpis.png` - Key performance indicators dashboard

## 🔧 Advanced Usage

### Running Individual Modules

Test specific components:

```bash
# Test data loading
python data_loader.py

# Test synthetic data generation
python data_synthesizer.py

# Test optimization only
python optimizer.py

# Test simulation
python simulator.py
```

### Integrating Real Data

To replace synthetic data with real sources:

1. **Passenger demand**: Modify `data_synthesizer.py` to read smartcard/ticketing data
2. **Traffic data**: Replace synthetic traffic with GPS/AVL vehicle tracking
3. **ML forecasting**: Implement advanced models in `forecast.py`

### Optimization Tuning

Key optimization parameters in `config.py`:
- `OVERLOAD_PENALTY`: Higher values prioritize passenger comfort
- `OPERATING_COST_PER_BUS_HOUR`: Affects cost-service trade-offs
- `MIN_HEADWAY_MINUTES`/`MAX_HEADWAY_MINUTES`: Service frequency constraints

## 📈 Sample Results

For a typical 5-route, 1-day analysis:

```
OPTIMIZATION RESULTS:
  Total bus hours: 245.5
  Fleet utilization: 87%
  Routes served: 5
  Overloaded passengers: 12.3
  Average load factor: 74.3%

SIMULATION KPIs:
  Trips simulated: 156
  Average trip duration: 18.4 min
  Overloaded trips: 8.7%
  Estimated wait time: 7.8 min
```

## 🛠️ Technical Details

### Optimization Model (ILP)

**Objective Function:**
Minimize: `bus_cost + overload_penalty`

**Decision Variables:**
- `buses[route, timeslot]`: Number of buses assigned
- `overload[route, timeslot]`: Passengers exceeding capacity

**Key Constraints:**
- Fleet size: Total buses ≤ available fleet
- Service capacity: Bus capacity + overload ≥ passenger demand  
- Headway limits: Min/max service frequency bounds

### Simulation Model

Event-based simulation tracking:
- Bus movements along routes using GTFS stop sequences
- Passenger boarding/alighting at each stop
- Travel times based on synthetic traffic conditions
- Load factors and overcrowding detection
- Service reliability metrics

## 🔄 Data Pipeline

1. **GTFS Download**: Automated download from TransJakarta API with local caching
2. **Data Synthesis**: Realistic demand patterns with rush-hour peaks and traffic congestion
3. **Demand Forecasting**: Moving average baseline (extensible to ML models)
4. **Optimization**: CBC solver via PuLP for optimal bus allocation
5. **Simulation**: Discrete event simulation for performance validation
6. **Export**: Multi-format output generation with visualizations

## 📋 Data Requirements

### Required Data (Automatic)
- TransJakarta GTFS feed (routes, stops, trips, stop_times)

### Synthetic Data Generated
- Passenger demand per stop per time slot
- Vehicle travel times between stops  
- Traffic congestion factors by time of day

### Optional Real Data Integration
- Smartcard/ticketing transaction data
- GPS/AVL vehicle position traces
- Historical ridership statistics
- Special events calendar

## 🚨 Troubleshooting

### Common Issues

1. **GTFS Download Failure**
   - Check internet connection
   - Verify TransJakarta GTFS URL is accessible
   - System will use cached data if available

2. **Optimization Infeasible**
   - Increase `TOTAL_FLEET_SIZE` in config.py
   - Reduce `MAX_ROUTES` for smaller problem size
   - Check `OVERLOAD_PENALTY` isn't too restrictive

3. **Memory Issues**
   - Reduce `MAX_ROUTES` and `ANALYSIS_DAYS`
   - Increase `TIME_SLOT_MINUTES` for fewer time slots

4. **No Plots Generated**
   - Install matplotlib: `pip install matplotlib`
   - Check `GENERATE_PLOTS = True` in config.py

### Performance Optimization

- **Faster execution**: Reduce `MAX_ROUTES` to 3-5 for testing
- **More detailed analysis**: Set `MAX_ROUTES = None` to analyze all routes
- **Memory optimization**: Increase `TIME_SLOT_MINUTES` to 30 or 60

## 📚 Dependencies

- **requests**: GTFS data download
- **pandas**: Data manipulation and analysis
- **numpy**: Numerical computations and random data generation
- **pulp**: Integer Linear Programming solver interface
- **matplotlib**: Plotting and visualization

## 🔮 Future Enhancements

1. **Machine Learning Integration**
   - Replace moving average with LSTM/GRU demand forecasting
   - Implement passenger flow prediction using historical patterns

2. **Real-time Integration**
   - Connect to live GPS/AVL feeds
   - Dynamic re-optimization based on current conditions

3. **Advanced Optimization**
   - Multi-objective optimization (cost vs. service quality)
   - Stochastic programming for demand uncertainty
   - Vehicle routing with depot assignments

4. **Expanded Simulation**
   - Detailed passenger journey modeling
   - Driver shift scheduling integration
   - Maintenance and refueling constraints

## 👥 Contributing

This system is designed to be modular and extensible. To contribute:

1. Fork the repository
2. Create feature branch
3. Add unit tests for new functionality
4. Submit pull request with detailed description

## 📄 License

Open source - feel free to use and modify for research and operational purposes.

---

**Ready to optimize your transit system? Run `python main.py` and see the results! 🚀**