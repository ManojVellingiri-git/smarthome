import os
import math
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DATASET_PATH = os.path.join(DATA_DIR, "smart_home_weather_dataset.csv")
SAMPLE_TEMPLATE_PATH = os.path.join(DATA_DIR, "sample_template.csv")

def generate_smart_home_dataset(days: int = 90, seed: int = 42) -> str:
    os.makedirs(DATA_DIR, exist_ok=True)
    random.seed(seed)
    np.random.seed(seed)

    start_date = datetime.now() - timedelta(days=days)
    records = []
    
    weather_types = ['Clear/Sunny', 'Partly Cloudy', 'Rainy', 'Hot/Humid', 'Overcast', 'Thunderstorm']
    current_weather = 'Clear/Sunny'
    prev_energy = 1.15

    total_hours = days * 24

    for i in range(total_hours):
        current_time = start_date + timedelta(hours=i)
        hour = current_time.hour
        day_of_week = current_time.weekday() # 0-4 weekday, 5-6 weekend
        is_weekend = day_of_week >= 5

        # Weather transition (Markov-like persistence)
        if random.random() < 0.15:
            current_weather = random.choice(weather_types)

        # Diurnal outdoor temperature curve
        base_outdoor = 26.0 + 6.0 * math.sin(2 * math.pi * (hour - 9) / 24)
        if current_weather == 'Hot/Humid':
            base_outdoor += random.uniform(3.0, 6.0)
        elif current_weather in ['Rainy', 'Thunderstorm']:
            base_outdoor -= random.uniform(2.5, 5.0)
        outdoor_temp = round(base_outdoor + random.uniform(-1.0, 1.0), 1)

        # Humidity
        base_humidity = 60.0 - 15.0 * math.sin(2 * math.pi * (hour - 9) / 24)
        if current_weather in ['Rainy', 'Thunderstorm']:
            base_humidity += random.uniform(20.0, 30.0)
        elif current_weather == 'Hot/Humid':
            base_humidity += random.uniform(15.0, 25.0)
        humidity = round(np.clip(base_humidity + random.uniform(-3.0, 3.0), 28.0, 95.0), 1)

        # Wind speed (km/h)
        wind_speed = round(random.uniform(5.0, 28.0) if current_weather != 'Thunderstorm' else random.uniform(25.0, 52.0), 1)

        # Occupancy pattern
        if is_weekend:
            if 0 <= hour <= 7:
                occupancy = random.choice([2, 3, 4])
            elif 8 <= hour <= 12:
                occupancy = random.choice([2, 3, 4, 3])
            elif 13 <= hour <= 17:
                occupancy = random.choice([1, 2, 4])
            elif 18 <= hour <= 23:
                occupancy = random.choice([3, 4, 4, 5])
            else:
                occupancy = 2
        else:
            if 0 <= hour <= 6:
                occupancy = random.choice([2, 3, 4])
            elif 7 <= hour <= 8:
                occupancy = random.choice([2, 3])
            elif 9 <= hour <= 16:
                occupancy = random.choice([0, 0, 0, 1]) # Most at work/school
            elif 17 <= hour <= 22:
                occupancy = random.choice([2, 3, 4])
            else:
                occupancy = random.choice([2, 3])

        # AC Status (Correlated with outdoor heat, indoor comfort target ~22-23C and occupancy)
        if occupancy > 0 and (outdoor_temp >= 26.0 or (hour >= 21 and outdoor_temp >= 24.0)):
            ac_status = 1 if random.random() < 0.88 else 0
        elif occupancy > 0 and outdoor_temp > 23.0:
            ac_status = 1 if random.random() < 0.35 else 0
        else:
            ac_status = 0

        # Indoor temperature conditioned by AC and outside
        if ac_status == 1:
            indoor_temp = round(random.uniform(21.2, 23.8), 1)
        else:
            # Passive thermal inertia towards outdoor
            indoor_temp = round(21.5 + (outdoor_temp - 21.5) * 0.45 + (0.3 * occupancy) + random.uniform(-0.4, 0.4), 1)

        # Lighting status
        is_dark = (hour >= 18 or hour <= 6)
        if occupancy > 0 and is_dark:
            lights_status = 1 if random.random() < 0.92 else 0
        elif occupancy > 0 and current_weather in ['Overcast', 'Thunderstorm', 'Rainy'] and 9 <= hour <= 17:
            lights_status = 1 if random.random() < 0.55 else 0
        else:
            lights_status = 0

        # Physical energy modeling (kWh)
        baseload = 0.38 + random.uniform(-0.03, 0.04) # Fridge, standby electronics, IoT gateways
        
        # Cooling consumption
        cooling_kwh = 0.0
        if ac_status == 1:
            delta_t = max(0.0, outdoor_temp - indoor_temp)
            cooling_kwh = 1.15 + (delta_t * 0.09) + (occupancy * 0.05) + random.uniform(-0.06, 0.08)
        
        # Lighting consumption
        lighting_kwh = 0.0
        if lights_status == 1:
            lighting_kwh = 0.22 + (occupancy * 0.06) + random.uniform(-0.02, 0.03)

        # Misc appliance & entertainment (EV charging, cooking, washing machine, TV)
        appliance_kwh = occupancy * 0.14
        if 19 <= hour <= 21 and occupancy > 1:
            appliance_kwh += random.uniform(0.35, 0.90) # Dinner prep, TV, dishwasher
        if 1 <= hour <= 4 and random.random() < 0.25:
            appliance_kwh += random.uniform(1.2, 2.5) # EV Smart Overnight charge

        total_kwh = round(np.clip(baseload + cooling_kwh + lighting_kwh + appliance_kwh, 0.32, 5.85), 3)

        records.append({
            "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
            "indoor_temperature": indoor_temp,
            "outdoor_temperature": outdoor_temp,
            "humidity": humidity,
            "occupancy": occupancy,
            "ac_status": ac_status,
            "lights_status": lights_status,
            "weather_condition": current_weather,
            "wind_speed_kmh": wind_speed,
            "previous_energy_kwh": prev_energy,
            "energy_consumption_kwh": total_kwh
        })

        prev_energy = total_kwh

    df = pd.DataFrame(records)
    df.to_csv(DATASET_PATH, index=False)
    print(f"Generated {len(df)} rows of smart home dataset to {DATASET_PATH}")

    # Generate template CSV
    sample_df = df.head(30).copy()
    sample_df.to_csv(SAMPLE_TEMPLATE_PATH, index=False)
    print(f"Sample template written to {SAMPLE_TEMPLATE_PATH}")

    return DATASET_PATH

if __name__ == "__main__":
    generate_smart_home_dataset()
