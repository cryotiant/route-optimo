import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import json
import os

# 1. Load the data and drop irrelevant columns
# 'date' and 'time' are string-based and not useful for the model.
# 'sample_id' is a unique identifier and has no predictive power.
try:
    df = pd.read_csv('tj_koridor2_with_travel.csv')
    df = df.drop(columns=['date', 'time', 'sample_id'])
except FileNotFoundError:
    print("Error: The file 'tj_koridor2_with_travel.csv' was not found.")
    print("Please make sure the file is in the same directory as the script.")
    exit()

# 2. Separate features (X) and target (Y)
Y = df['observed_passengers']
X = df.drop(columns=['observed_passengers'])

# 3. Define categorical and numerical features
categorical_cols = ['day_of_week', 'direction', 'destination', 'stop_name']
numerical_cols = ['hour', 'minute', 'stop_order', 'stop_coef', 'peak', 'travel_time_min']

# 4. Set up the data preprocessing pipeline
# StandardScaler for numerical features and OneHotEncoder for categorical features.
# A ColumnTransformer applies these transformations to the specified columns.
preprocessor = ColumnTransformer(
    transformers=[
        ('numerical_transformer', StandardScaler(), numerical_cols),
        ('categorical_transformer', OneHotEncoder(handle_unknown='ignore'), categorical_cols)
    ]
)

# 5. Create the full machine learning pipeline
# This pipeline combines the preprocessing and the Random Forest model.
model_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
])

# 6. Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, Y, test_size=0.2, random_state=42)

# 7. Train the full pipeline
model_pipeline.fit(X_train, y_train)

# 8. Make predictions and evaluate the model's performance
predictions = model_pipeline.predict(X_test)
mse = mean_squared_error(y_test, predictions)
print(f'Model Evaluation:')
print(f'Mean Squared Error: {mse}')
print("-" * 30)

# 9. Use the trained model to make predictions for a specific day
# This demonstrates how to use the model for a real-world scenario.
print("Bus Schedule Prediction:")
print("-" * 30)

# Create a DataFrame for a specific day's schedule
# The model will use these values to make new predictions.
schedule_data = []
for hour in range(6, 23):  # From 6 AM to 10 PM
    for minute in [0, 15, 30, 45]:
        new_row = {
            'day_of_week': 'Monday',
            'direction': 'to Pulo Gadung',
            'destination': 'Pulo Gadung',
            'stop_name': 'Pulo Gadung',
            'hour': hour,
            'minute': minute,
            'stop_order': 16,
            'stop_coef': 1.7,
            'peak': 1 if hour >= 6 and hour <= 9 else 0, # Example logic for peak hours
            'travel_time_min': 7,
        }
        schedule_data.append(new_row)

schedule_df = pd.DataFrame(schedule_data)

# Make predictions and add them to the schedule DataFrame
schedule_predictions = model_pipeline.predict(schedule_df)
schedule_df['predicted_passengers'] = schedule_predictions.round().astype(int)

# --- Build predictions for each stop ---
stops_predictions = []
for stop_name in schedule_df['stop_name'].unique():
    stop_rows = schedule_df[schedule_df['stop_name'] == stop_name]
    last_row = stop_rows.iloc[-1]
    passengers = int(last_row['predicted_passengers'])
    # Simple crowding logic
    if passengers > 60:
        crowding = 'high'
    elif passengers > 30:
        crowding = 'medium'
    else:
        crowding = 'low'
    stops_predictions.append({
        "stop_id": stop_name.replace(' ', '_').upper(),
        "predictions": {
            "crowding": {
                "current": crowding,
                "predicted_15min": crowding,
                "predicted_30min": crowding
            },
            "bus_count": {
                "current": 1,
                "predicted_15min": 1,
                "predicted_30min": 1
            }
        }
    })

output = {
    "predictions": {
        "timestamp": pd.Timestamp.now().isoformat(),
        "time_horizon_minutes": 30,
        "stops": stops_predictions
    }
}
os.makedirs("public/gtfs", exist_ok=True)
with open("public/gtfs/predictions.json", "w") as f:
    json.dump(output, f, indent=2)
print("Predictions written to public/gtfs/predictions.json")

# 10. Print the predicted bus schedule
print("Today is Monday, August 25, 2025")
print("\nThe bus required based on the prediction of passenger number would be leaving the terminal in:\n")

for index, row in schedule_df.iterrows():
    time_str = f"{row['hour']:02d}:{row['minute']:02d}"
    passengers = row['predicted_passengers']

    # Determine bus size based on predicted passenger count
    bus_size = 'small bus'
    if passengers > 30:
        bus_size = 'large bus'
    elif passengers >= 10:
        bus_size = 'normal bus'

    print(f"Time: {time_str} -> Predicted Passengers: {passengers} ({bus_size})")