# GTFS Data for Transjakarta

This folder contains GTFS (General Transit Feed Specification) data for Transjakarta bus routes.

## Data Structure

- `routes.json` - Bus routes with route IDs, names, and descriptions
- `stops.json` - Bus stops with coordinates and names
- `trips.json` - Trip schedules and route assignments
- `stop_times.json` - Stop arrival/departure times
- `shapes.json` - Route geometries for map visualization

## Data Source

Data is sourced from Transjakarta's official GTFS feed: https://gtfs.transjakarta.co.id/files/file_gtfs.zip

## Usage

The frontend map components use this data to display:
- Real Transjakarta bus routes
- Bus stop locations
- Route geometries on the map
- Trip schedules and predictions

## Update Frequency

GTFS data should be updated regularly to reflect:
- New routes and stops
- Schedule changes
- Service modifications
