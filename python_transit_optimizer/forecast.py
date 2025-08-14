"""
Demand forecasting module for TransJakarta optimization system.
Implements simple moving average forecast as placeholder for ML models.
"""

import pandas as pd
import numpy as np
from typing import Dict, Tuple
import config


def moving_average_forecast(demand_data: pd.DataFrame) -> pd.DataFrame:
    """
    Implement simple moving average forecast for passenger demand.
    
    Args:
        demand_data: DataFrame with passenger demand per stop per time slot
    
    Returns:
        DataFrame with forecasted demand for next time slots
    """
    print("Running moving average demand forecast...")
    
    forecasts = []
    
    # Group by stop_id to forecast each stop separately
    for stop_id in demand_data['stop_id'].unique():
        stop_data = demand_data[demand_data['stop_id'] == stop_id].sort_values('time_slot')
        
        # Calculate moving average for each time slot
        for current_slot in range(config.FORECAST_WINDOW_SLOTS, len(stop_data)):
            # Get historical window
            history_window = stop_data.iloc[current_slot - config.FORECAST_WINDOW_SLOTS:current_slot]
            
            # Calculate moving average
            forecast_demand = history_window['passenger_demand'].mean()
            
            # Add seasonal adjustment based on hour of day
            current_hour = (current_slot * config.TIME_SLOT_MINUTES / 60) % 24
            seasonal_factor = get_seasonal_adjustment(current_hour)
            
            adjusted_forecast = max(0, forecast_demand * seasonal_factor)
            
            forecasts.append({
                'stop_id': stop_id,
                'time_slot': current_slot,
                'hour_of_day': current_hour,
                'forecast_demand': round(adjusted_forecast, 1),
                'historical_avg': round(forecast_demand, 1),
                'seasonal_factor': round(seasonal_factor, 3)
            })
    
    forecast_df = pd.DataFrame(forecasts)
    print(f"Generated {len(forecast_df)} demand forecasts")
    
    return forecast_df


def get_seasonal_adjustment(hour_of_day: float) -> float:
    """
    Get seasonal adjustment factor based on hour of day.
    
    Args:
        hour_of_day: Hour of day (0-24)
    
    Returns:
        Seasonal adjustment factor
    """
    # Morning rush (7-9 AM): high demand
    if 7 <= hour_of_day <= 9:
        return 1.3
    # Evening rush (17-19 PM): high demand  
    elif 17 <= hour_of_day <= 19:
        return 1.4
    # Midday (10-16): moderate demand
    elif 10 <= hour_of_day <= 16:
        return 1.1
    # Evening (20-22): moderate demand
    elif 20 <= hour_of_day <= 22:
        return 1.0
    # Night/early morning: low demand
    else:
        return 0.6


def aggregate_demand_by_route(gtfs_data: Dict[str, pd.DataFrame], 
                             forecast_data: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate forecasted demand by route and time slot.
    
    Args:
        gtfs_data: Dictionary containing GTFS DataFrames
        forecast_data: DataFrame with forecasted demand per stop
    
    Returns:
        DataFrame with aggregated demand per route per time slot
    """
    print("Aggregating demand by route...")
    
    # Get stops per route from stop_times and trips
    if 'stop_times' not in gtfs_data or 'trips' not in gtfs_data:
        print("Warning: Missing stop_times or trips data for route aggregation")
        return pd.DataFrame()
    
    # Create mapping of stops to routes
    stop_times = gtfs_data['stop_times']
    trips = gtfs_data['trips']
    
    # Join to get route_id for each stop
    stop_route_mapping = stop_times.merge(
        trips[['trip_id', 'route_id']], 
        on='trip_id'
    )[['stop_id', 'route_id']].drop_duplicates()
    
    # Join forecast data with route mapping
    route_demand = forecast_data.merge(stop_route_mapping, on='stop_id')
    
    # Aggregate by route and time slot
    route_aggregated = route_demand.groupby(['route_id', 'time_slot', 'hour_of_day']).agg({
        'forecast_demand': 'sum',
        'historical_avg': 'sum'
    }).reset_index()
    
    route_aggregated.columns = ['route_id', 'time_slot', 'hour_of_day', 
                               'total_forecast_demand', 'total_historical_demand']
    
    print(f"Aggregated demand for {route_aggregated['route_id'].nunique()} routes")
    
    return route_aggregated


def calculate_forecast_accuracy(actual_data: pd.DataFrame, 
                              forecast_data: pd.DataFrame) -> Dict[str, float]:
    """
    Calculate forecast accuracy metrics (MAE, RMSE, MAPE).
    
    Args:
        actual_data: DataFrame with actual passenger demand
        forecast_data: DataFrame with forecasted demand
    
    Returns:
        Dictionary with accuracy metrics
    """
    # Merge actual and forecast data
    comparison = actual_data.merge(
        forecast_data, 
        on=['stop_id', 'time_slot'], 
        suffixes=('_actual', '_forecast')
    )
    
    if len(comparison) == 0:
        print("Warning: No overlapping data for accuracy calculation")
        return {'mae': 0, 'rmse': 0, 'mape': 0}
    
    actual_values = comparison['passenger_demand']
    forecast_values = comparison['forecast_demand']
    
    # Calculate metrics
    mae = np.mean(np.abs(actual_values - forecast_values))
    rmse = np.sqrt(np.mean((actual_values - forecast_values) ** 2))
    
    # MAPE (avoid division by zero)
    mape_values = np.abs((actual_values - forecast_values) / (actual_values + 1)) * 100
    mape = np.mean(mape_values)
    
    metrics = {
        'mae': round(mae, 2),
        'rmse': round(rmse, 2),
        'mape': round(mape, 2),
        'sample_size': len(comparison)
    }
    
    print(f"Forecast accuracy - MAE: {metrics['mae']}, RMSE: {metrics['rmse']}, MAPE: {metrics['mape']}%")
    
    return metrics


def run_demand_forecast(gtfs_data: Dict[str, pd.DataFrame], 
                       synthetic_data: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
    """
    Main function to run demand forecasting pipeline.
    
    Args:
        gtfs_data: Dictionary containing GTFS DataFrames
        synthetic_data: Dictionary containing synthetic data
    
    Returns:
        Dictionary containing forecast results
    """
    print("Running demand forecast pipeline...")
    
    demand_data = synthetic_data['passenger_demand']
    
    # Generate forecasts
    forecasts = moving_average_forecast(demand_data)
    
    # Aggregate by route
    route_forecasts = aggregate_demand_by_route(gtfs_data, forecasts)
    
    # Calculate accuracy (using synthetic data as "actual")
    accuracy = calculate_forecast_accuracy(demand_data, forecasts)
    
    forecast_results = {
        'stop_forecasts': forecasts,
        'route_forecasts': route_forecasts,
        'accuracy_metrics': pd.DataFrame([accuracy])
    }
    
    print("Demand forecasting completed")
    
    return forecast_results


if __name__ == "__main__":
    # Test forecasting with sample data
    from data_loader import load_transjakarta_data
    from data_synthesizer import generate_all_synthetic_data
    
    try:
        gtfs_data = load_transjakarta_data()
        synthetic_data = generate_all_synthetic_data(gtfs_data)
        forecast_results = run_demand_forecast(gtfs_data, synthetic_data)
        
        # Print summary
        for result_type, data in forecast_results.items():
            if isinstance(data, pd.DataFrame):
                print(f"{result_type}: {len(data)} records")
                if len(data) > 0:
                    print(f"  Columns: {list(data.columns)}")
                    print(f"  Sample:\n{data.head()}\n")
    
    except Exception as e:
        print(f"Error in forecast test: {e}")