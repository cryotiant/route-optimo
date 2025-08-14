"""
Integer Linear Programming optimizer for TransJakarta bus allocation.
Uses PuLP to optimize bus assignments per route per time slot.
"""

import pulp
import pandas as pd
import numpy as np
from typing import Dict, Tuple, List
import config


class BusAllocationOptimizer:
    """
    Integer Linear Programming optimizer for bus allocation.
    """
    
    def __init__(self, gtfs_data: Dict[str, pd.DataFrame], 
                 forecast_data: Dict[str, pd.DataFrame]):
        """
        Initialize optimizer with GTFS and forecast data.
        
        Args:
            gtfs_data: Dictionary containing GTFS DataFrames
            forecast_data: Dictionary containing demand forecast results
        """
        self.gtfs_data = gtfs_data
        self.forecast_data = forecast_data
        self.routes = gtfs_data['routes']['route_id'].tolist()
        self.time_slots = list(range(config.SLOTS_PER_DAY * config.ANALYSIS_DAYS))
        
        # Get route forecasts
        if 'route_forecasts' in forecast_data and len(forecast_data['route_forecasts']) > 0:
            self.route_demand = forecast_data['route_forecasts']
        else:
            print("Warning: No route forecast data available, using zero demand")
            self.route_demand = pd.DataFrame({
                'route_id': [],
                'time_slot': [],
                'total_forecast_demand': []
            })
        
        self.model = None
        self.bus_vars = {}
        self.overload_vars = {}
        
    def create_optimization_model(self) -> pulp.LpProblem:
        """
        Create the Integer Linear Programming model.
        
        Returns:
            PuLP optimization model
        """
        print("Creating optimization model...")
        
        # Create the model
        self.model = pulp.LpProblem("TransJakarta_Bus_Allocation", pulp.LpMinimize)
        
        # Decision variables: number of buses per route per time slot
        self.bus_vars = {}
        for route in self.routes:
            for slot in self.time_slots:
                var_name = f"buses_r{route}_t{slot}"
                self.bus_vars[(route, slot)] = pulp.LpVariable(
                    var_name, lowBound=0, cat='Integer'
                )
        
        # Overload variables: passengers exceeding capacity
        self.overload_vars = {}
        for route in self.routes:
            for slot in self.time_slots:
                var_name = f"overload_r{route}_t{slot}"
                self.overload_vars[(route, slot)] = pulp.LpVariable(
                    var_name, lowBound=0, cat='Continuous'
                )
        
        # Objective function: minimize bus-hours + overload penalty
        bus_cost = pulp.lpSum([
            self.bus_vars[(route, slot)] * (config.TIME_SLOT_MINUTES / 60) * config.OPERATING_COST_PER_BUS_HOUR
            for route in self.routes for slot in self.time_slots
        ])
        
        overload_penalty = pulp.lpSum([
            self.overload_vars[(route, slot)] * config.OVERLOAD_PENALTY
            for route in self.routes for slot in self.time_slots
        ])
        
        self.model += bus_cost + overload_penalty, "Total_Cost"
        
        # Constraints
        self._add_fleet_constraints()
        self._add_capacity_constraints()
        self._add_headway_constraints()
        
        print(f"Model created with {len(self.bus_vars)} bus variables and {len(self.overload_vars)} overload variables")
        
        return self.model
    
    def _add_fleet_constraints(self):
        """Add fleet size constraints."""
        # Total buses in service at any time slot cannot exceed fleet size
        for slot in self.time_slots:
            self.model += (
                pulp.lpSum([self.bus_vars[(route, slot)] for route in self.routes]) 
                <= config.TOTAL_FLEET_SIZE,
                f"Fleet_Constraint_Slot_{slot}"
            )
    
    def _add_capacity_constraints(self):
        """Add capacity vs demand constraints."""
        # For each route-slot with demand, ensure capacity meets demand or track overload
        demand_dict = {}
        if len(self.route_demand) > 0:
            for _, row in self.route_demand.iterrows():
                key = (row['route_id'], int(row['time_slot']))
                demand_dict[key] = row['total_forecast_demand']
        
        for route in self.routes:
            for slot in self.time_slots:
                demand = demand_dict.get((route, slot), 0)
                
                if demand > 0:
                    # Capacity = buses * bus_capacity
                    # Demand = capacity + overload
                    self.model += (
                        self.bus_vars[(route, slot)] * config.BUS_CAPACITY + 
                        self.overload_vars[(route, slot)] >= demand,
                        f"Capacity_r{route}_t{slot}"
                    )
    
    def _add_headway_constraints(self):
        """Add minimum and maximum headway constraints."""
        # Minimum buses based on maximum headway
        # Maximum buses based on minimum headway
        
        for route in self.routes:
            for slot in self.time_slots:
                # Minimum service: at least one bus every MAX_HEADWAY minutes
                min_buses = max(1, config.TIME_SLOT_MINUTES // config.MAX_HEADWAY_MINUTES)
                
                # Maximum service: at most one bus every MIN_HEADWAY minutes
                max_buses = config.TIME_SLOT_MINUTES // config.MIN_HEADWAY_MINUTES
                
                # Only apply if there's demand for this route-slot
                has_demand = False
                if len(self.route_demand) > 0:
                    route_slot_demand = self.route_demand[
                        (self.route_demand['route_id'] == route) & 
                        (self.route_demand['time_slot'] == slot)
                    ]
                    has_demand = len(route_slot_demand) > 0 and route_slot_demand['total_forecast_demand'].iloc[0] > 0
                
                if has_demand:
                    # Minimum service constraint
                    self.model += (
                        self.bus_vars[(route, slot)] >= min_buses,
                        f"MinService_r{route}_t{slot}"
                    )
                    
                    # Maximum service constraint
                    if max_buses > 0:
                        self.model += (
                            self.bus_vars[(route, slot)] <= max_buses,
                            f"MaxService_r{route}_t{slot}"
                        )
    
    def solve_optimization(self) -> Dict:
        """
        Solve the optimization problem.
        
        Returns:
            Dictionary with optimization results
        """
        print("Solving optimization problem...")
        
        if self.model is None:
            self.create_optimization_model()
        
        # Solve the model
        solver = pulp.PULP_CBC_CMD(msg=0)  # Silent solver
        self.model.solve(solver)
        
        # Check solution status
        status = pulp.LpStatus[self.model.status]
        print(f"Optimization status: {status}")
        
        if status != 'Optimal':
            print("Warning: Optimization did not find optimal solution")
            return {'status': status, 'objective_value': None}
        
        # Extract results
        results = self._extract_results()
        
        return results
    
    def _extract_results(self) -> Dict:
        """Extract and format optimization results."""
        objective_value = pulp.value(self.model.objective)
        
        # Extract bus allocations
        bus_allocations = []
        total_bus_hours = 0
        
        for route in self.routes:
            for slot in self.time_slots:
                buses = int(pulp.value(self.bus_vars[(route, slot)]) or 0)
                overload = pulp.value(self.overload_vars[(route, slot)]) or 0
                
                if buses > 0 or overload > 0:
                    bus_hours = buses * (config.TIME_SLOT_MINUTES / 60)
                    total_bus_hours += bus_hours
                    
                    bus_allocations.append({
                        'route_id': route,
                        'time_slot': slot,
                        'hour_of_day': (slot * config.TIME_SLOT_MINUTES / 60) % 24,
                        'buses_allocated': buses,
                        'overload_passengers': round(overload, 1),
                        'bus_hours': round(bus_hours, 2),
                        'capacity_provided': buses * config.BUS_CAPACITY
                    })
        
        # Add demand information
        allocation_df = pd.DataFrame(bus_allocations)
        if len(allocation_df) > 0 and len(self.route_demand) > 0:
            allocation_df = allocation_df.merge(
                self.route_demand[['route_id', 'time_slot', 'total_forecast_demand']],
                on=['route_id', 'time_slot'],
                how='left'
            )
            allocation_df['total_forecast_demand'] = allocation_df['total_forecast_demand'].fillna(0)
        else:
            allocation_df['total_forecast_demand'] = 0
        
        # Calculate summary statistics
        total_overload = allocation_df['overload_passengers'].sum() if len(allocation_df) > 0 else 0
        avg_load_factor = 0
        if len(allocation_df) > 0 and allocation_df['capacity_provided'].sum() > 0:
            avg_load_factor = allocation_df['total_forecast_demand'].sum() / allocation_df['capacity_provided'].sum()
        
        # Calculate fleet utilization
        max_buses_used = 0
        if len(allocation_df) > 0:
            slot_totals = allocation_df.groupby('time_slot')['buses_allocated'].sum()
            max_buses_used = slot_totals.max() if len(slot_totals) > 0 else 0
        
        fleet_utilization = max_buses_used / config.TOTAL_FLEET_SIZE if config.TOTAL_FLEET_SIZE > 0 else 0
        
        results = {
            'status': 'Optimal',
            'objective_value': round(objective_value, 2),
            'bus_allocations': allocation_df,
            'summary': {
                'total_bus_hours': round(total_bus_hours, 2),
                'total_overload_passengers': round(total_overload, 1),
                'max_buses_used': max_buses_used,
                'fleet_utilization': round(fleet_utilization, 3),
                'average_load_factor': round(avg_load_factor, 3),
                'routes_served': len(allocation_df['route_id'].unique()) if len(allocation_df) > 0 else 0,
                'active_time_slots': len(allocation_df['time_slot'].unique()) if len(allocation_df) > 0 else 0
            }
        }
        
        print(f"Optimization completed:")
        print(f"  Total bus hours: {results['summary']['total_bus_hours']}")
        print(f"  Maximum buses used: {results['summary']['max_buses_used']}/{config.TOTAL_FLEET_SIZE}")
        print(f"  Fleet utilization: {results['summary']['fleet_utilization']:.1%}")
        print(f"  Total overload: {results['summary']['total_overload_passengers']} passengers")
        
        return results


def run_bus_optimization(gtfs_data: Dict[str, pd.DataFrame], 
                        forecast_data: Dict[str, pd.DataFrame]) -> Dict:
    """
    Main function to run bus allocation optimization.
    
    Args:
        gtfs_data: Dictionary containing GTFS DataFrames
        forecast_data: Dictionary containing demand forecast results
    
    Returns:
        Optimization results dictionary
    """
    print("Running bus allocation optimization...")
    
    try:
        # Create and run optimizer
        optimizer = BusAllocationOptimizer(gtfs_data, forecast_data)
        results = optimizer.solve_optimization()
        
        print("Bus allocation optimization completed")
        return results
        
    except Exception as e:
        print(f"Error in optimization: {e}")
        return {'status': 'Error', 'error': str(e)}


if __name__ == "__main__":
    # Test optimization with sample data
    from data_loader import load_transjakarta_data
    from data_synthesizer import generate_all_synthetic_data
    from forecast import run_demand_forecast
    
    try:
        gtfs_data = load_transjakarta_data()
        synthetic_data = generate_all_synthetic_data(gtfs_data)
        forecast_data = run_demand_forecast(gtfs_data, synthetic_data)
        
        optimization_results = run_bus_optimization(gtfs_data, forecast_data)
        
        # Print results summary
        if optimization_results['status'] == 'Optimal':
            print("\nOptimization Results Summary:")
            for key, value in optimization_results['summary'].items():
                print(f"  {key}: {value}")
                
            # Show sample allocations
            allocations = optimization_results['bus_allocations']
            if len(allocations) > 0:
                print(f"\nSample allocations (first 10):")
                print(allocations.head(10).to_string())
        
    except Exception as e:
        print(f"Error in optimization test: {e}")