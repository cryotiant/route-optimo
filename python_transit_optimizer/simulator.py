"""
Event-based simulation module for TransJakarta system.
Validates optimized schedules and computes service KPIs.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
import config


class TransitSimulator:
    """
    Event-based simulator for transit system performance.
    """
    
    def __init__(self, gtfs_data: Dict[str, pd.DataFrame], 
                 optimization_results: Dict,
                 synthetic_data: Dict[str, pd.DataFrame]):
        """
        Initialize simulator with GTFS data and optimization results.
        
        Args:
            gtfs_data: Dictionary containing GTFS DataFrames
            optimization_results: Results from optimization module
            synthetic_data: Dictionary containing synthetic traffic and passenger data
        """
        self.gtfs_data = gtfs_data
        self.optimization_results = optimization_results
        self.synthetic_data = synthetic_data
        
        # Extract key data
        self.bus_allocations = optimization_results.get('bus_allocations', pd.DataFrame())
        self.traffic_data = synthetic_data.get('traffic_flow', pd.DataFrame())
        self.passenger_demand = synthetic_data.get('passenger_demand', pd.DataFrame())
        
        # Simulation results
        self.simulation_events = []
        self.kpis = {}
        
    def simulate_bus_operations(self) -> Dict:
        """
        Simulate bus operations based on optimization results.
        
        Returns:
            Dictionary containing simulation results and KPIs
        """
        print("Running transit simulation...")
        
        if len(self.bus_allocations) == 0:
            print("Warning: No bus allocations to simulate")
            return {'status': 'No Data', 'kpis': {}}
        
        # Initialize simulation
        self.simulation_events = []
        
        # Simulate each route-slot combination
        for _, allocation in self.bus_allocations.iterrows():
            route_id = allocation['route_id']
            time_slot = allocation['time_slot']
            buses_allocated = allocation['buses_allocated']
            
            if buses_allocated > 0:
                self._simulate_route_slot(route_id, time_slot, buses_allocated, allocation)
        
        # Calculate KPIs
        self.kpis = self._calculate_kpis()
        
        results = {
            'status': 'Completed',
            'simulation_events': pd.DataFrame(self.simulation_events),
            'kpis': self.kpis
        }
        
        print("Transit simulation completed")
        return results
    
    def _simulate_route_slot(self, route_id: str, time_slot: int, 
                           buses_allocated: int, allocation_row: pd.Series):
        """
        Simulate operations for a specific route and time slot.
        
        Args:
            route_id: Route identifier
            time_slot: Time slot number
            buses_allocated: Number of buses allocated
            allocation_row: Full allocation row with demand and capacity info
        """
        # Get route stops from GTFS data
        route_stops = self._get_route_stops(route_id)
        if len(route_stops) == 0:
            return
        
        # Calculate headway (time between buses)
        headway_minutes = config.TIME_SLOT_MINUTES / buses_allocated
        
        # Simulate each bus for this route-slot
        for bus_number in range(buses_allocated):
            departure_time = time_slot * config.TIME_SLOT_MINUTES + (bus_number * headway_minutes)
            self._simulate_bus_trip(route_id, bus_number, departure_time, route_stops, allocation_row)
    
    def _get_route_stops(self, route_id: str) -> List[str]:
        """
        Get ordered list of stops for a route.
        
        Args:
            route_id: Route identifier
        
        Returns:
            List of stop IDs in order
        """
        if 'trips' not in self.gtfs_data or 'stop_times' not in self.gtfs_data:
            return []
        
        # Get a representative trip for this route
        route_trips = self.gtfs_data['trips'][self.gtfs_data['trips']['route_id'] == route_id]
        if len(route_trips) == 0:
            return []
        
        sample_trip = route_trips.iloc[0]['trip_id']
        
        # Get stops for this trip
        trip_stops = self.gtfs_data['stop_times'][
            self.gtfs_data['stop_times']['trip_id'] == sample_trip
        ].sort_values('stop_sequence')
        
        return trip_stops['stop_id'].tolist()
    
    def _simulate_bus_trip(self, route_id: str, bus_number: int, 
                          departure_time: float, route_stops: List[str],
                          allocation_row: pd.Series):
        """
        Simulate a single bus trip along a route.
        
        Args:
            route_id: Route identifier
            bus_number: Bus number for this trip
            departure_time: Departure time in minutes from start of day
            route_stops: List of stops in order
            allocation_row: Allocation data with demand and capacity info
        """
        current_time = departure_time
        passengers_on_board = 0
        max_passengers = 0
        total_boarding = 0
        total_alighting = 0
        overloaded_segments = 0
        
        # Get time slot for traffic data lookup
        time_slot = int(departure_time // config.TIME_SLOT_MINUTES)
        
        # Simulate travel between each pair of consecutive stops
        for i in range(len(route_stops)):
            stop_id = route_stops[i]
            
            # Passenger boarding/alighting at this stop
            if i == 0:
                # First stop - only boarding
                boarding = self._get_passenger_boarding(stop_id, time_slot)
                alighting = 0
            elif i == len(route_stops) - 1:
                # Last stop - only alighting
                boarding = 0
                alighting = passengers_on_board  # All passengers alight
            else:
                # Intermediate stop
                boarding = self._get_passenger_boarding(stop_id, time_slot)
                alighting = max(0, int(passengers_on_board * np.random.uniform(0.1, 0.3)))
            
            # Update passenger counts
            passengers_on_board = max(0, passengers_on_board - alighting + boarding)
            max_passengers = max(max_passengers, passengers_on_board)
            total_boarding += boarding
            total_alighting += alighting
            
            # Check for overloading
            is_overloaded = passengers_on_board > config.BUS_CAPACITY
            if is_overloaded:
                overloaded_segments += 1
            
            # Calculate dwell time at stop
            dwell_time = self._calculate_dwell_time(boarding, alighting)
            current_time += dwell_time
            
            # Record stop event
            self.simulation_events.append({
                'route_id': route_id,
                'bus_number': bus_number,
                'stop_id': stop_id,
                'stop_sequence': i,
                'arrival_time': current_time - dwell_time,
                'departure_time': current_time,
                'passengers_boarding': boarding,
                'passengers_alighting': alighting,
                'passengers_on_board': passengers_on_board,
                'is_overloaded': is_overloaded,
                'dwell_time': dwell_time,
                'load_factor': passengers_on_board / config.BUS_CAPACITY
            })
            
            # Travel to next stop (if not the last stop)
            if i < len(route_stops) - 1:
                next_stop = route_stops[i + 1]
                travel_time = self._get_travel_time(stop_id, next_stop, time_slot)
                current_time += travel_time
        
        # Record trip summary
        trip_duration = current_time - departure_time
        avg_load_factor = max_passengers / config.BUS_CAPACITY if config.BUS_CAPACITY > 0 else 0
        
        self.simulation_events.append({
            'route_id': route_id,
            'bus_number': bus_number,
            'trip_type': 'TRIP_SUMMARY',
            'departure_time': departure_time,
            'arrival_time': current_time,
            'trip_duration': trip_duration,
            'total_boarding': total_boarding,
            'total_alighting': total_alighting,
            'max_passengers': max_passengers,
            'avg_load_factor': avg_load_factor,
            'overloaded_segments': overloaded_segments,
            'stops_served': len(route_stops)
        })
    
    def _get_passenger_boarding(self, stop_id: str, time_slot: int) -> int:
        """
        Get passenger boarding count at a stop for a time slot.
        
        Args:
            stop_id: Stop identifier
            time_slot: Time slot number
        
        Returns:
            Number of passengers boarding
        """
        if len(self.passenger_demand) == 0:
            return np.random.poisson(5)  # Default random boarding
        
        # Look up demand for this stop and time slot
        stop_demand = self.passenger_demand[
            (self.passenger_demand['stop_id'] == stop_id) & 
            (self.passenger_demand['time_slot'] == time_slot)
        ]
        
        if len(stop_demand) > 0:
            base_demand = stop_demand.iloc[0]['passenger_demand']
            # Add some randomness - assume this bus gets a fraction of total demand
            boarding = max(0, int(base_demand * np.random.uniform(0.1, 0.4)))
            return boarding
        
        return max(0, int(np.random.poisson(5)))
    
    def _get_travel_time(self, from_stop: str, to_stop: str, time_slot: int) -> float:
        """
        Get travel time between two stops for a time slot.
        
        Args:
            from_stop: Origin stop ID
            to_stop: Destination stop ID  
            time_slot: Time slot number
        
        Returns:
            Travel time in minutes
        """
        if len(self.traffic_data) == 0:
            return np.random.uniform(2, 8)  # Default travel time
        
        # Look up traffic data
        traffic_info = self.traffic_data[
            (self.traffic_data['from_stop_id'] == from_stop) &
            (self.traffic_data['to_stop_id'] == to_stop) &
            (self.traffic_data['time_slot'] == time_slot)
        ]
        
        if len(traffic_info) > 0:
            travel_time = traffic_info.iloc[0]['travel_time_minutes']
            # Add some randomness
            return max(0.5, travel_time * np.random.uniform(0.8, 1.2))
        
        return np.random.uniform(2, 8)
    
    def _calculate_dwell_time(self, boarding: int, alighting: int) -> float:
        """
        Calculate dwell time at stop based on passenger movements.
        
        Args:
            boarding: Number of passengers boarding
            alighting: Number of passengers alighting
        
        Returns:
            Dwell time in minutes
        """
        # Base dwell time + time for passenger movements
        base_time = 0.5  # 30 seconds minimum
        passenger_time = (boarding + alighting) * 0.1  # 6 seconds per passenger
        
        return base_time + passenger_time
    
    def _calculate_kpis(self) -> Dict:
        """
        Calculate key performance indicators from simulation results.
        
        Returns:
            Dictionary of KPIs
        """
        if len(self.simulation_events) == 0:
            return {}
        
        events_df = pd.DataFrame(self.simulation_events)
        
        # Separate stop events and trip summaries
        stop_events = events_df[events_df['trip_type'].isna()]
        trip_summaries = events_df[events_df['trip_type'] == 'TRIP_SUMMARY']
        
        kpis = {}
        
        # Basic statistics
        kpis['total_trips_simulated'] = len(trip_summaries)
        kpis['total_stops_served'] = len(stop_events)
        kpis['unique_routes'] = events_df['route_id'].nunique()
        
        if len(trip_summaries) > 0:
            # Trip-level KPIs
            kpis['avg_trip_duration'] = round(trip_summaries['trip_duration'].mean(), 2)
            kpis['avg_passengers_per_trip'] = round(trip_summaries['total_boarding'].mean(), 1)
            kpis['avg_load_factor'] = round(trip_summaries['avg_load_factor'].mean(), 3)
            
            # Service quality KPIs
            overloaded_trips = trip_summaries[trip_summaries['overloaded_segments'] > 0]
            kpis['percent_overloaded_trips'] = round(len(overloaded_trips) / len(trip_summaries) * 100, 1)
            
            kpis['max_load_factor'] = round(trip_summaries['avg_load_factor'].max(), 3)
            kpis['total_passenger_km'] = round(trip_summaries['total_boarding'].sum(), 0)
        
        if len(stop_events) > 0:
            # Stop-level KPIs
            kpis['avg_boarding_per_stop'] = round(stop_events['passengers_boarding'].mean(), 1)
            kpis['avg_dwell_time'] = round(stop_events['dwell_time'].mean(), 2)
            
            # Overloading analysis
            overloaded_stops = stop_events[stop_events['is_overloaded'] == True]
            kpis['percent_overloaded_stops'] = round(len(overloaded_stops) / len(stop_events) * 100, 1)
            
            # Service frequency (estimated average wait time)
            if len(trip_summaries) > 0:
                total_service_hours = trip_summaries['trip_duration'].sum() / 60
                total_routes_served = trip_summaries['route_id'].nunique()
                if total_routes_served > 0:
                    avg_headway = (config.ANALYSIS_DAYS * 24) / (len(trip_summaries) / total_routes_served)
                    kpis['estimated_avg_wait_time'] = round(avg_headway / 2, 1)  # Half of headway
        
        # Fleet utilization
        if 'summary' in self.optimization_results:
            opt_summary = self.optimization_results['summary']
            kpis['fleet_utilization'] = opt_summary.get('fleet_utilization', 0)
            kpis['total_bus_hours_scheduled'] = opt_summary.get('total_bus_hours', 0)
        
        print(f"Calculated {len(kpis)} KPIs from simulation")
        return kpis


def run_transit_simulation(gtfs_data: Dict[str, pd.DataFrame],
                          optimization_results: Dict,
                          synthetic_data: Dict[str, pd.DataFrame]) -> Dict:
    """
    Main function to run transit simulation.
    
    Args:
        gtfs_data: Dictionary containing GTFS DataFrames
        optimization_results: Results from optimization module
        synthetic_data: Dictionary containing synthetic data
    
    Returns:
        Simulation results and KPIs
    """
    print("Running transit system simulation...")
    
    try:
        simulator = TransitSimulator(gtfs_data, optimization_results, synthetic_data)
        results = simulator.simulate_bus_operations()
        
        print("Transit simulation completed")
        return results
        
    except Exception as e:
        print(f"Error in simulation: {e}")
        return {'status': 'Error', 'error': str(e), 'kpis': {}}


if __name__ == "__main__":
    # Test simulation with sample data
    from data_loader import load_transjakarta_data
    from data_synthesizer import generate_all_synthetic_data
    from forecast import run_demand_forecast
    from optimizer import run_bus_optimization
    
    try:
        gtfs_data = load_transjakarta_data()
        synthetic_data = generate_all_synthetic_data(gtfs_data)
        forecast_data = run_demand_forecast(gtfs_data, synthetic_data)
        optimization_results = run_bus_optimization(gtfs_data, forecast_data)
        
        simulation_results = run_transit_simulation(gtfs_data, optimization_results, synthetic_data)
        
        # Print KPIs
        if 'kpis' in simulation_results:
            print("\nSimulation KPIs:")
            for kpi_name, kpi_value in simulation_results['kpis'].items():
                print(f"  {kpi_name}: {kpi_value}")
        
        # Show sample events
        if 'simulation_events' in simulation_results:
            events = simulation_results['simulation_events']
            if len(events) > 0:
                print(f"\nSample simulation events (first 5):")
                print(events.head().to_string())
    
    except Exception as e:
        print(f"Error in simulation test: {e}")