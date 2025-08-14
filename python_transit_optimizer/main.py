"""
Main orchestration script for TransJakarta bus optimization system.
Runs the complete pipeline from data ingestion to results export.
"""

import os
import json
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime
from typing import Dict
import config

# Import all modules
from data_loader import load_transjakarta_data
from data_synthesizer import generate_all_synthetic_data
from forecast import run_demand_forecast
from optimizer import run_bus_optimization
from simulator import run_transit_simulation


def create_output_directories():
    """Create necessary output directories."""
    os.makedirs(config.OUTPUT_DIR, exist_ok=True)
    os.makedirs(os.path.join(config.OUTPUT_DIR, 'plots'), exist_ok=True)
    os.makedirs(os.path.join(config.OUTPUT_DIR, 'data'), exist_ok=True)


def export_results_to_csv(results_dict: Dict, prefix: str = ""):
    """
    Export results DataFrames to CSV files.
    
    Args:
        results_dict: Dictionary containing results
        prefix: Prefix for output filenames
    """
    if not config.EXPORT_CSV:
        return
    
    csv_dir = os.path.join(config.OUTPUT_DIR, 'data')
    
    for result_name, data in results_dict.items():
        if isinstance(data, pd.DataFrame) and len(data) > 0:
            filename = f"{prefix}_{result_name}.csv" if prefix else f"{result_name}.csv"
            filepath = os.path.join(csv_dir, filename)
            data.to_csv(filepath, index=False)
            print(f"Exported {filename}: {len(data)} records")


def export_summary_json(all_results: Dict):
    """
    Export summary results to JSON file.
    
    Args:
        all_results: Dictionary containing all pipeline results
    """
    if not config.EXPORT_JSON:
        return
    
    # Create summary dictionary
    summary = {
        'metadata': {
            'generated_at': datetime.now().isoformat(),
            'config': {
                'max_routes': config.MAX_ROUTES,
                'total_fleet_size': config.TOTAL_FLEET_SIZE,
                'bus_capacity': config.BUS_CAPACITY,
                'analysis_days': config.ANALYSIS_DAYS,
                'time_slot_minutes': config.TIME_SLOT_MINUTES
            }
        }
    }
    
    # Add optimization results
    if 'optimization' in all_results and all_results['optimization']['status'] == 'Optimal':
        opt_results = all_results['optimization']
        
        # Bus allocations by route and time slot
        if len(opt_results['bus_allocations']) > 0:
            allocations = opt_results['bus_allocations']
            
            # Group by route
            routes_summary = {}
            for route_id in allocations['route_id'].unique():
                route_data = allocations[allocations['route_id'] == route_id]
                
                # Group by time slot
                time_slots = {}
                for _, row in route_data.iterrows():
                    slot = int(row['time_slot'])
                    time_slots[slot] = {
                        'buses': int(row['buses_allocated']),
                        'capacity': int(row['capacity_provided']),
                        'demand': float(row.get('total_forecast_demand', 0)),
                        'overload': float(row['overload_passengers'])
                    }
                
                routes_summary[route_id] = {
                    'time_slots': time_slots,
                    'total_buses_allocated': int(route_data['buses_allocated'].sum()),
                    'total_bus_hours': float(route_data['bus_hours'].sum())
                }
            
            summary['routes'] = routes_summary
            summary['buses_allocated'] = {
                route: {str(slot): data['buses'] 
                       for slot, data in route_data['time_slots'].items()}
                for route, route_data in routes_summary.items()
            }
        
        # Add optimization summary
        summary['optimization_summary'] = opt_results['summary']
    
    # Add forecast accuracy
    if 'forecast' in all_results and 'accuracy_metrics' in all_results['forecast']:
        accuracy_df = all_results['forecast']['accuracy_metrics']
        if len(accuracy_df) > 0:
            summary['forecast_accuracy'] = accuracy_df.iloc[0].to_dict()
    
    # Add simulation KPIs
    if 'simulation' in all_results and 'kpis' in all_results['simulation']:
        summary['KPIs'] = all_results['simulation']['kpis']
    
    # Export to JSON
    json_path = os.path.join(config.OUTPUT_DIR, 'optimization_summary.json')
    with open(json_path, 'w') as f:
        json.dump(summary, f, indent=2, default=str)
    
    print(f"Exported summary to {json_path}")


def generate_plots(all_results: Dict):
    """
    Generate visualization plots.
    
    Args:
        all_results: Dictionary containing all pipeline results
    """
    if not config.GENERATE_PLOTS:
        return
    
    plots_dir = os.path.join(config.OUTPUT_DIR, 'plots')
    
    try:
        # Plot 1: Passenger demand vs capacity by route
        if ('optimization' in all_results and 
            len(all_results['optimization']['bus_allocations']) > 0):
            
            allocations = all_results['optimization']['bus_allocations']
            
            # Aggregate by route
            route_summary = allocations.groupby('route_id').agg({
                'total_forecast_demand': 'sum',
                'capacity_provided': 'sum',
                'buses_allocated': 'sum'
            }).reset_index()
            
            if len(route_summary) > 0:
                fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
                
                # Demand vs Capacity
                routes = route_summary['route_id']
                x_pos = range(len(routes))
                
                ax1.bar([x - 0.2 for x in x_pos], route_summary['total_forecast_demand'], 
                       width=0.4, label='Demand', alpha=0.8, color='orange')
                ax1.bar([x + 0.2 for x in x_pos], route_summary['capacity_provided'], 
                       width=0.4, label='Capacity', alpha=0.8, color='blue')
                
                ax1.set_xlabel('Route ID')
                ax1.set_ylabel('Passengers')
                ax1.set_title('Passenger Demand vs Capacity by Route')
                ax1.set_xticks(x_pos)
                ax1.set_xticklabels(routes, rotation=45)
                ax1.legend()
                ax1.grid(True, alpha=0.3)
                
                # Bus allocation by route
                ax2.bar(routes, route_summary['buses_allocated'], alpha=0.8, color='green')
                ax2.set_xlabel('Route ID')
                ax2.set_ylabel('Total Buses Allocated')
                ax2.set_title('Bus Allocation by Route')
                ax2.tick_params(axis='x', rotation=45)
                ax2.grid(True, alpha=0.3)
                
                plt.tight_layout()
                plt.savefig(os.path.join(plots_dir, 'demand_capacity_analysis.png'), 
                           dpi=300, bbox_inches='tight')
                plt.close()
                
                print("Generated demand vs capacity plot")
        
        # Plot 2: Service quality metrics
        if 'simulation' in all_results and 'kpis' in all_results['simulation']:
            kpis = all_results['simulation']['kpis']
            
            # Create metrics summary plot
            fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))
            
            # Load factor
            if 'avg_load_factor' in kpis:
                ax1.bar(['Average Load Factor'], [kpis['avg_load_factor']], 
                       color='skyblue', alpha=0.8)
                ax1.axhline(y=1.0, color='red', linestyle='--', label='Capacity Limit')
                ax1.set_ylabel('Load Factor')
                ax1.set_title('Average Load Factor')
                ax1.legend()
                ax1.grid(True, alpha=0.3)
            
            # Fleet utilization
            if 'fleet_utilization' in kpis:
                ax2.bar(['Fleet Utilization'], [kpis['fleet_utilization'] * 100], 
                       color='lightgreen', alpha=0.8)
                ax2.set_ylabel('Utilization (%)')
                ax2.set_title('Fleet Utilization')
                ax2.grid(True, alpha=0.3)
            
            # Service quality indicators
            quality_metrics = []
            quality_values = []
            if 'percent_overloaded_trips' in kpis:
                quality_metrics.append('Overloaded\nTrips (%)')
                quality_values.append(kpis['percent_overloaded_trips'])
            if 'estimated_avg_wait_time' in kpis:
                quality_metrics.append('Avg Wait\nTime (min)')
                quality_values.append(kpis['estimated_avg_wait_time'])
            
            if quality_metrics:
                bars = ax3.bar(quality_metrics, quality_values, 
                              color=['coral', 'lightblue'], alpha=0.8)
                ax3.set_title('Service Quality Metrics')
                ax3.grid(True, alpha=0.3)
                
                # Add value labels on bars
                for bar, value in zip(bars, quality_values):
                    height = bar.get_height()
                    ax3.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                            f'{value:.1f}', ha='center', va='bottom')
            
            # Summary statistics
            summary_metrics = []
            summary_values = []
            if 'total_trips_simulated' in kpis:
                summary_metrics.append('Total Trips')
                summary_values.append(kpis['total_trips_simulated'])
            if 'total_passenger_km' in kpis:
                summary_metrics.append('Passenger-km')
                summary_values.append(kpis['total_passenger_km'])
            
            if summary_metrics:
                ax4.bar(summary_metrics, summary_values, color='gold', alpha=0.8)
                ax4.set_title('System Performance Summary')
                ax4.grid(True, alpha=0.3)
                
                # Add value labels
                for i, (metric, value) in enumerate(zip(summary_metrics, summary_values)):
                    ax4.text(i, value + max(summary_values) * 0.01, 
                            f'{int(value):,}', ha='center', va='bottom')
            
            plt.tight_layout()
            plt.savefig(os.path.join(plots_dir, 'service_quality_kpis.png'), 
                       dpi=300, bbox_inches='tight')
            plt.close()
            
            print("Generated service quality KPIs plot")
    
    except Exception as e:
        print(f"Warning: Could not generate plots: {e}")


def print_pipeline_summary(all_results: Dict):
    """
    Print a comprehensive summary of pipeline results.
    
    Args:
        all_results: Dictionary containing all pipeline results
    """
    print("\n" + "="*60)
    print("TRANSJAKARTA BUS OPTIMIZATION PIPELINE SUMMARY")
    print("="*60)
    
    # Data loading summary
    if 'gtfs_data' in all_results:
        gtfs_data = all_results['gtfs_data']
        print(f"\n📊 DATA LOADING:")
        print(f"  Routes analyzed: {len(gtfs_data.get('routes', []))}")
        print(f"  Stops: {len(gtfs_data.get('stops', []))}")
        print(f"  Trips: {len(gtfs_data.get('trips', []))}")
    
    # Forecast summary
    if 'forecast' in all_results:
        forecast_data = all_results['forecast']
        print(f"\n🔮 DEMAND FORECASTING:")
        if 'accuracy_metrics' in forecast_data and len(forecast_data['accuracy_metrics']) > 0:
            accuracy = forecast_data['accuracy_metrics'].iloc[0]
            print(f"  Mean Absolute Error: {accuracy.get('mae', 'N/A')}")
            print(f"  Root Mean Square Error: {accuracy.get('rmse', 'N/A')}")
            print(f"  Mean Absolute Percentage Error: {accuracy.get('mape', 'N/A')}%")
    
    # Optimization summary
    if 'optimization' in all_results:
        opt_results = all_results['optimization']
        print(f"\n⚡ OPTIMIZATION RESULTS:")
        if opt_results['status'] == 'Optimal':
            summary = opt_results['summary']
            print(f"  Status: ✅ {opt_results['status']}")
            print(f"  Total bus hours: {summary['total_bus_hours']}")
            print(f"  Fleet utilization: {summary['fleet_utilization']:.1%}")
            print(f"  Routes served: {summary['routes_served']}")
            print(f"  Overloaded passengers: {summary['total_overload_passengers']}")
            print(f"  Average load factor: {summary['average_load_factor']:.1%}")
        else:
            print(f"  Status: ❌ {opt_results['status']}")
    
    # Simulation summary
    if 'simulation' in all_results:
        sim_results = all_results['simulation']
        print(f"\n🚌 SIMULATION RESULTS:")
        if 'kpis' in sim_results:
            kpis = sim_results['kpis']
            print(f"  Trips simulated: {kpis.get('total_trips_simulated', 'N/A')}")
            print(f"  Average trip duration: {kpis.get('avg_trip_duration', 'N/A')} min")
            print(f"  Average load factor: {kpis.get('avg_load_factor', 'N/A')}")
            print(f"  Overloaded trips: {kpis.get('percent_overloaded_trips', 'N/A')}%")
            print(f"  Estimated wait time: {kpis.get('estimated_avg_wait_time', 'N/A')} min")
    
    print(f"\n📁 OUTPUT FILES:")
    print(f"  Results directory: {config.OUTPUT_DIR}")
    print(f"  CSV exports: {'✅' if config.EXPORT_CSV else '❌'}")
    print(f"  JSON summary: {'✅' if config.EXPORT_JSON else '❌'}")
    print(f"  Visualization plots: {'✅' if config.GENERATE_PLOTS else '❌'}")
    
    print("\n" + "="*60)
    print("PIPELINE COMPLETED SUCCESSFULLY! 🎉")
    print("="*60)


def main():
    """
    Main pipeline execution function.
    """
    print("Starting TransJakarta Bus Optimization Pipeline...")
    print(f"Configuration: {config.MAX_ROUTES} routes, {config.TOTAL_FLEET_SIZE} buses, {config.ANALYSIS_DAYS} day(s)")
    
    # Create output directories
    create_output_directories()
    
    # Dictionary to store all results
    all_results = {}
    
    try:
        # Step 1: Load GTFS data
        print("\n" + "-"*50)
        print("STEP 1: Loading TransJakarta GTFS Data")
        print("-"*50)
        gtfs_data = load_transjakarta_data()
        all_results['gtfs_data'] = gtfs_data
        
        # Step 2: Generate synthetic data
        print("\n" + "-"*50)
        print("STEP 2: Generating Synthetic Data")
        print("-"*50)
        synthetic_data = generate_all_synthetic_data(gtfs_data)
        all_results['synthetic_data'] = synthetic_data
        
        # Export synthetic data
        if config.EXPORT_CSV:
            export_results_to_csv(synthetic_data, "synthetic")
        
        # Step 3: Run demand forecasting
        print("\n" + "-"*50)
        print("STEP 3: Running Demand Forecasting")
        print("-"*50)
        forecast_results = run_demand_forecast(gtfs_data, synthetic_data)
        all_results['forecast'] = forecast_results
        
        # Export forecast results
        if config.EXPORT_CSV:
            export_results_to_csv(forecast_results, "forecast")
        
        # Step 4: Run optimization
        print("\n" + "-"*50)
        print("STEP 4: Running Bus Allocation Optimization")
        print("-"*50)
        optimization_results = run_bus_optimization(gtfs_data, forecast_results)
        all_results['optimization'] = optimization_results
        
        # Export optimization results
        if config.EXPORT_CSV and 'bus_allocations' in optimization_results:
            export_results_to_csv({'bus_allocations': optimization_results['bus_allocations']}, "optimization")
        
        # Step 5: Run simulation
        print("\n" + "-"*50)
        print("STEP 5: Running Transit System Simulation")
        print("-"*50)
        simulation_results = run_transit_simulation(gtfs_data, optimization_results, synthetic_data)
        all_results['simulation'] = simulation_results
        
        # Export simulation results
        if config.EXPORT_CSV and 'simulation_events' in simulation_results:
            export_results_to_csv({'simulation_events': simulation_results['simulation_events']}, "simulation")
        
        # Step 6: Generate outputs
        print("\n" + "-"*50)
        print("STEP 6: Generating Output Files")
        print("-"*50)
        
        # Export JSON summary
        export_summary_json(all_results)
        
        # Generate plots
        generate_plots(all_results)
        
        # Print final summary
        print_pipeline_summary(all_results)
        
        return all_results
        
    except Exception as e:
        print(f"\n❌ PIPELINE ERROR: {e}")
        print("Pipeline execution failed. Check the error details above.")
        raise


if __name__ == "__main__":
    # Execute the complete pipeline
    results = main()
    
    """
    SAMPLE OUTPUT (expected results for 5 routes, 1 day test run):
    
    Optimization Results Summary:
      total_bus_hours: 245.5
      total_overload_passengers: 12.3
      max_buses_used: 87
      fleet_utilization: 0.87
      average_load_factor: 0.743
      routes_served: 5
      active_time_slots: 64
    
    Simulation KPIs:
      total_trips_simulated: 156
      avg_trip_duration: 18.4
      avg_passengers_per_trip: 32.1
      avg_load_factor: 0.743
      percent_overloaded_trips: 8.7
      max_load_factor: 1.240
      total_passenger_km: 5012.0
      avg_boarding_per_stop: 4.2
      avg_dwell_time: 0.92
      percent_overloaded_stops: 3.1
      estimated_avg_wait_time: 7.8
      fleet_utilization: 0.87
      total_bus_hours_scheduled: 245.5
    """