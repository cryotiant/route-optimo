"""
Synthetic data generator for TransJakarta optimization system.
Creates realistic passenger demand and traffic flow data based on GTFS structure.
"""

import numpy as np
import pandas as pd
from typing import Dict, Tuple
import config


def generate_passenger_demand(gtfs_data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
    """
    Generate synthetic passenger demand data per stop per time slot.
    
    Args:
        gtfs_data: Dictionary containing GTFS DataFrames
    
    Returns:
        DataFrame with columns: stop_id, time_slot, passenger_demand
    """
    np.random.seed(config.RANDOM_SEED)
    
    stops = gtfs_data['stops']
    total_slots = config.SLOTS_PER_DAY * config.ANALYSIS_DAYS
    
    demand_data = []
    
    print(f"Generating passenger demand for {len(stops)} stops and {total_slots} time slots")
    
    for _, stop in stops.iterrows():
        stop_id = stop['stop_id']
        
        # Create demand pattern with peaks during rush hours
        for slot in range(total_slots):
            hour_of_day = (slot * config.TIME_SLOT_MINUTES / 60) % 24
            
            # Rush hour multiplier (higher demand at 7-9 AM and 5-7 PM)
            rush_multiplier = 1.0
            if 7 <= hour_of_day <= 9 or 17 <= hour_of_day <= 19:
                rush_multiplier = 2.5
            elif 10 <= hour_of_day <= 16:
                rush_multiplier = 1.2
            elif 20 <= hour_of_day <= 22:
                rush_multiplier = 1.3
            else:
                rush_multiplier = 0.3
            
            # Generate demand with normal distribution
            base_demand = config.PASSENGER_DEMAND_MEAN * rush_multiplier
            demand = max(0, np.random.normal(base_demand, config.PASSENGER_DEMAND_STD))
            
            demand_data.append({
                'stop_id': stop_id,
                'time_slot': slot,
                'hour_of_day': hour_of_day,
                'passenger_demand': round(demand)
            })
    
    demand_df = pd.DataFrame(demand_data)
    print(f"Generated {len(demand_df)} passenger demand records")
    return demand_df


def generate_trip_passenger_counts(gtfs_data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
    """
    Generate synthetic passenger counts per bus per trip.
    
    Args:
        gtfs_data: Dictionary containing GTFS DataFrames
    
    Returns:
        DataFrame with columns: trip_id, route_id, passenger_count, load_factor
    """
    np.random.seed(config.RANDOM_SEED + 1)
    
    trips = gtfs_data['trips']
    trip_passenger_data = []
    
    print(f"Generating trip passenger counts for {len(trips)} trips")
    
    for _, trip in trips.iterrows():
        trip_id = trip['trip_id']
        route_id = trip['route_id']
        
        # Simulate passenger count (percentage of bus capacity)
        load_factor = max(0.1, min(1.5, np.random.normal(0.7, 0.25)))
        passenger_count = round(load_factor * config.BUS_CAPACITY)
        
        trip_passenger_data.append({
            'trip_id': trip_id,
            'route_id': route_id,
            'passenger_count': passenger_count,
            'load_factor': load_factor,
            'is_overloaded': load_factor > 1.0
        })
    
    trip_df = pd.DataFrame(trip_passenger_data)
    print(f"Generated {len(trip_df)} trip passenger records")
    return trip_df


def generate_traffic_data(gtfs_data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
    """
    Generate synthetic traffic flow and travel time data between stops.
    
    Args:
        gtfs_data: Dictionary containing GTFS DataFrames
    
    Returns:
        DataFrame with columns: from_stop_id, to_stop_id, time_slot, travel_time_minutes, congestion_factor
    """
    np.random.seed(config.RANDOM_SEED + 2)
    
    # Get stop pairs from stop_times
    if 'stop_times' not in gtfs_data:
        print("Warning: No stop_times data available for traffic generation")
        return pd.DataFrame()
    
    stop_times = gtfs_data['stop_times'].sort_values(['trip_id', 'stop_sequence'])
    
    # Create consecutive stop pairs
    stop_pairs = []
    for trip_id in stop_times['trip_id'].unique():
        trip_stops = stop_times[stop_times['trip_id'] == trip_id].sort_values('stop_sequence')
        for i in range(len(trip_stops) - 1):
            from_stop = trip_stops.iloc[i]['stop_id']
            to_stop = trip_stops.iloc[i + 1]['stop_id']
            stop_pairs.append((from_stop, to_stop))
    
    # Remove duplicates
    stop_pairs = list(set(stop_pairs))
    
    traffic_data = []
    total_slots = config.SLOTS_PER_DAY * config.ANALYSIS_DAYS
    
    print(f"Generating traffic data for {len(stop_pairs)} stop pairs and {total_slots} time slots")
    
    for from_stop, to_stop in stop_pairs:
        # Assume average distance between stops is 1 km
        base_travel_time = 60 / config.TRAFFIC_BASE_SPEED_KMH  # minutes for 1 km
        
        for slot in range(total_slots):
            hour_of_day = (slot * config.TIME_SLOT_MINUTES / 60) % 24
            
            # Traffic congestion patterns
            if 7 <= hour_of_day <= 9 or 17 <= hour_of_day <= 19:
                # Rush hour - higher congestion
                congestion_range = (0.3, 0.7)  # Slower speeds
            elif 22 <= hour_of_day or hour_of_day <= 5:
                # Night time - less congestion
                congestion_range = (1.2, 1.5)  # Faster speeds
            else:
                # Regular hours
                congestion_range = (0.8, 1.2)
            
            congestion_factor = np.random.uniform(*congestion_range)
            travel_time = base_travel_time / congestion_factor
            
            traffic_data.append({
                'from_stop_id': from_stop,
                'to_stop_id': to_stop,
                'time_slot': slot,
                'hour_of_day': hour_of_day,
                'travel_time_minutes': round(travel_time, 2),
                'congestion_factor': round(congestion_factor, 3),
                'base_travel_time': round(base_travel_time, 2)
            })
    
    traffic_df = pd.DataFrame(traffic_data)
    print(f"Generated {len(traffic_df)} traffic records")
    return traffic_df


def generate_all_synthetic_data(gtfs_data: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
    """
    Generate all synthetic data components.
    
    Args:
        gtfs_data: Dictionary containing GTFS DataFrames
    
    Returns:
        Dictionary containing all synthetic data
    """
    print("Generating synthetic data...")
    
    synthetic_data = {
        'passenger_demand': generate_passenger_demand(gtfs_data),
        'trip_passengers': generate_trip_passenger_counts(gtfs_data),
        'traffic_flow': generate_traffic_data(gtfs_data)
    }
    
    print("Synthetic data generation completed")
    return synthetic_data


if __name__ == "__main__":
    # Test with minimal GTFS data
    from data_loader import load_transjakarta_data
    
    try:
        gtfs_data = load_transjakarta_data()
        synthetic_data = generate_all_synthetic_data(gtfs_data)
        
        # Print summary
        for data_type, df in synthetic_data.items():
            print(f"{data_type}: {len(df)} records")
            if len(df) > 0:
                print(f"  Columns: {list(df.columns)}")
                print(f"  Sample data:\n{df.head()}\n")
                
    except Exception as e:
        print(f"Error in synthetic data generation test: {e}")