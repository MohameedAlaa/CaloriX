import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler
from app.services.ml_service import ml_service

def train():
    print("Loading dataset via MLService...")
    df = ml_service.dataset
    if df.empty:
        print("Dataset is empty. Cannot train.")
        return
        
    print(f"Dataset loaded with {len(df)} records.")
    
    # 1. Text Features
    print("Extracting text features...")
    text_corpus = []
    for _, row in df.iterrows():
        text = f"{row.get('food_name', '')} {row.get('category', '')} {row.get('cuisine', '')}".strip()
        if not text:
            text = "Unknown"
        text_corpus.append(text)
        
    tfidf = TfidfVectorizer(stop_words='english', max_features=8000)
    text_features = tfidf.fit_transform(text_corpus).toarray()
    print(f"Text features shape: {text_features.shape}")
    
    # 2. Numeric Features
    print("Extracting numeric features...")
    numeric_columns = [
        'serving_size_g', 'calories', 'protein_g', 'carbs_g', 'fat_g', 
        'protein_density', 'fat_density', 'carb_density', 'calorie_density', 
        'protein_ratio', 'fat_ratio', 'carb_ratio', 'energy_density'
    ]
    
    scaler = StandardScaler()
    numeric_data = df[numeric_columns].fillna(0.0)
    scaled_numeric = scaler.fit_transform(numeric_data)
    
    # Apply a weight to numeric features so text features (TF-IDF) aren't completely overpowered.
    numeric_weight = 0.5
    scaled_numeric = scaled_numeric * numeric_weight
    print(f"Scaled numeric features shape: {scaled_numeric.shape}")
    
    # 3. Combine Features
    print("Combining features...")
    combined_features = np.hstack([scaled_numeric, text_features])
    print(f"Combined features shape: {combined_features.shape}")
    
    # 4. Train NearestNeighbors
    print("Training NearestNeighbors model...")
    nn_model = NearestNeighbors(n_neighbors=20, metric='euclidean', algorithm='brute', n_jobs=-1)
    nn_model.fit(combined_features)
    
    # 5. Save Model Artifacts
    columns_to_save = ["food_id", "food_name", "category", "cuisine", "is_vegan", "is_vegetarian", "is_halal"] + numeric_columns
    existing_cols = [col for col in columns_to_save if col in df.columns]
    
    recommender_data = {
        "nn_model": nn_model,
        "tfidf": tfidf,
        "scaler": scaler,
        "numeric_weight": numeric_weight,
        "numeric_columns": numeric_columns,
        "food_frame": df[existing_cols]
    }
    
    ml_dir = Path("app/ml")
    model_path = ml_dir / "food_recommender.pkl"
    print(f"Saving model to {model_path}...")
    joblib.dump(recommender_data, model_path)
    
    print("Done! Recommender trained successfully.")

if __name__ == "__main__":
    train()
