"""
Configuration file for TransJakarta bus optimization system.
All configurable parameters should be defined here.
"""

# GTFS Data Settings
GTFS_URL = "https://gtfs.transjakarta.co.id/files/file_gtfs.zip"
GTFS_CACHE_DIR = "data/gtfs_cache"
GTFS_EXTRACT_DIR = "data/gtfs_extracted"

# Analysis Settings
MAX_ROUTES = 5  # Limit number of routes to analyze for testing
RANDOM_SEED = 42  # For reproducible synthetic data generation
TIME_SLOT_MINUTES = 15  # Time slot duration in minutes
ANALYSIS_DAYS = 1  # Number of days to analyze
SLOTS_PER_DAY = 96  # 24 hours * 60 min / 15 min slots

# Fleet Configuration
TOTAL_FLEET_SIZE = 100  # Total number of buses available
BUS_CAPACITY = 80  # Passenger capacity per bus
OPERATING_COST_PER_BUS_HOUR = 50.0  # Cost in currency units

# Synthetic Data Parameters
PASSENGER_DEMAND_MEAN = 25  # Average passengers per stop per time slot
PASSENGER_DEMAND_STD = 10  # Standard deviation of passenger demand
TRAFFIC_BASE_SPEED_KMH = 15  # Base speed in km/h
TRAFFIC_CONGESTION_FACTOR_RANGE = (0.5, 1.5)  # Speed multiplier range

# Optimization Parameters
OVERLOAD_PENALTY = 1000  # Penalty for exceeding bus capacity
MIN_HEADWAY_MINUTES = 5  # Minimum time between buses on same route
MAX_HEADWAY_MINUTES = 60  # Maximum time between buses on same route

# Output Settings
OUTPUT_DIR = "results"
EXPORT_CSV = True
EXPORT_JSON = True
GENERATE_PLOTS = True

# Forecast Parameters
FORECAST_WINDOW_SLOTS = 4  # Number of historical slots for moving average