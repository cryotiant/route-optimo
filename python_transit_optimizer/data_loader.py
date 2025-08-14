"""
GTFS data loader for TransJakarta optimization system.
Handles downloading, caching, and parsing GTFS data.
"""

import os
import zipfile
import requests
import pandas as pd
from pathlib import Path
from typing import Dict, Optional
import config


def download_gtfs_data() -> str:
    """
    Download GTFS zip file from TransJakarta and cache locally.
    
    Returns:
        str: Path to the downloaded zip file
    """
    # Create cache directory
    os.makedirs(config.GTFS_CACHE_DIR, exist_ok=True)
    
    zip_path = os.path.join(config.GTFS_CACHE_DIR, "transjakarta_gtfs.zip")
    
    # Check if file already exists and is recent (less than 1 day old)
    if os.path.exists(zip_path):
        file_age_hours = (pd.Timestamp.now() - pd.Timestamp.fromtimestamp(os.path.getmtime(zip_path))).total_seconds() / 3600
        if file_age_hours < 24:
            print(f"Using cached GTFS file: {zip_path}")
            return zip_path
    
    print(f"Downloading GTFS data from {config.GTFS_URL}")
    try:
        response = requests.get(config.GTFS_URL, timeout=30)
        response.raise_for_status()
        
        with open(zip_path, 'wb') as f:
            f.write(response.content)
        
        print(f"GTFS data downloaded to {zip_path}")
        return zip_path
    
    except Exception as e:
        print(f"Error downloading GTFS data: {e}")
        # If download fails and cached file exists, use it
        if os.path.exists(zip_path):
            print("Using existing cached file due to download failure")
            return zip_path
        raise


def extract_gtfs_data(zip_path: str) -> str:
    """
    Extract GTFS zip file to extraction directory.
    
    Args:
        zip_path: Path to the GTFS zip file
    
    Returns:
        str: Path to the extraction directory
    """
    extract_dir = config.GTFS_EXTRACT_DIR
    os.makedirs(extract_dir, exist_ok=True)
    
    print(f"Extracting GTFS data to {extract_dir}")
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)
    
    return extract_dir


def load_gtfs_files(extract_dir: str) -> Dict[str, pd.DataFrame]:
    """
    Load GTFS files into pandas DataFrames.
    
    Args:
        extract_dir: Directory containing extracted GTFS files
    
    Returns:
        Dict containing DataFrames for each GTFS file
    """
    gtfs_files = [
        'agency.txt', 'routes.txt', 'trips.txt', 'stops.txt', 
        'stop_times.txt', 'calendar.txt', 'calendar_dates.txt',
        'frequencies.txt'  # Optional
    ]
    
    gtfs_data = {}
    
    for file_name in gtfs_files:
        file_path = os.path.join(extract_dir, file_name)
        
        if os.path.exists(file_path):
            try:
                df = pd.read_csv(file_path)
                table_name = file_name.replace('.txt', '')
                gtfs_data[table_name] = df
                print(f"Loaded {table_name}: {len(df)} records")
            except Exception as e:
                print(f"Warning: Could not load {file_name}: {e}")
        else:
            print(f"Warning: {file_name} not found in GTFS data")
    
    return gtfs_data


def filter_routes(gtfs_data: Dict[str, pd.DataFrame], max_routes: Optional[int] = None) -> Dict[str, pd.DataFrame]:
    """
    Filter GTFS data to include only specified number of routes.
    
    Args:
        gtfs_data: Dictionary of GTFS DataFrames
        max_routes: Maximum number of routes to include (None for all)
    
    Returns:
        Filtered GTFS data
    """
    if max_routes is None:
        return gtfs_data
    
    # Get top N routes by number of trips
    routes = gtfs_data['routes'].copy()
    trips = gtfs_data['trips'].copy()
    
    # Count trips per route
    trip_counts = trips.groupby('route_id').size().sort_values(ascending=False)
    selected_routes = trip_counts.head(max_routes).index.tolist()
    
    # Filter all tables
    filtered_data = gtfs_data.copy()
    
    # Filter routes
    filtered_data['routes'] = routes[routes['route_id'].isin(selected_routes)]
    
    # Filter trips
    filtered_data['trips'] = trips[trips['route_id'].isin(selected_routes)]
    
    # Filter stop_times based on filtered trips
    if 'stop_times' in filtered_data:
        trip_ids = filtered_data['trips']['trip_id'].unique()
        filtered_data['stop_times'] = gtfs_data['stop_times'][
            gtfs_data['stop_times']['trip_id'].isin(trip_ids)
        ]
    
    print(f"Filtered to {len(selected_routes)} routes with {len(filtered_data['trips'])} trips")
    return filtered_data


def load_transjakarta_data() -> Dict[str, pd.DataFrame]:
    """
    Main function to load and process TransJakarta GTFS data.
    
    Returns:
        Dictionary of processed GTFS DataFrames
    """
    try:
        # Download GTFS data
        zip_path = download_gtfs_data()
        
        # Extract GTFS data
        extract_dir = extract_gtfs_data(zip_path)
        
        # Load GTFS files
        gtfs_data = load_gtfs_files(extract_dir)
        
        # Filter to specified number of routes
        filtered_data = filter_routes(gtfs_data, config.MAX_ROUTES)
        
        print("GTFS data loaded successfully")
        return filtered_data
        
    except Exception as e:
        print(f"Error loading GTFS data: {e}")
        raise


if __name__ == "__main__":
    # Test the data loader
    data = load_transjakarta_data()
    
    # Print summary
    for table_name, df in data.items():
        print(f"{table_name}: {len(df)} records")