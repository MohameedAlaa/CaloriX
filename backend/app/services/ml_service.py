import json
import logging
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.metrics.pairwise import euclidean_distances

logger = logging.getLogger(__name__)

class MLService:
    """Singleton service to handle loading models and ML inference."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Load ML models, scalers, label encoders, and dataset."""
        logger.info("Initializing ML models and loading dataset...")
        
        ml_dir = Path(__file__).parent.parent / "ml"
        
        # Load Metadata
        try:
            with open(ml_dir / "metadata.json", "r", encoding="utf-8") as f:
                self.metadata = json.load(f)
            self.feature_columns = self.metadata.get("feature_columns", [])
        except Exception as e:
            logger.error(f"Failed to load metadata.json: {e}")
            raise

        # Load models
        try:
            self.classifier = joblib.load(ml_dir / "random_forest_classifier.pkl")
            self.scaler = joblib.load(ml_dir / "feature_scaler.pkl")
            self.label_encoder = joblib.load(ml_dir / "label_encoder.pkl")
        except Exception as e:
            logger.error(f"Failed to load ML models: {e}")
            raise

        # Load dataset
        try:
            self.dataset = pd.read_csv(ml_dir / "nutrition_dataset_10000.csv")
            
            # Pre-scale the dataset features for faster similarity search
            if not self.dataset.empty:
                features_df = self.dataset[self.feature_columns].fillna(0)
                self.scaled_dataset_features = self.scaler.transform(features_df)
            else:
                self.scaled_dataset_features = np.array([])
        except Exception as e:
            logger.error(f"Failed to load dataset: {e}")
            raise
            
        logger.info("ML Service initialized successfully.")

    def predict(self, features_dict: dict) -> str:
        """Predict food category based on features."""
        # Convert input dictionary to a 2D array in the correct feature order
        feature_values = [[features_dict.get(col, 0.0) for col in self.feature_columns]]
        
        # Scale
        scaled_features = self.scaler.transform(feature_values)
        
        # Predict
        prediction_idx = self.classifier.predict(scaled_features)[0]
        
        # Decode
        label = self.label_encoder.inverse_transform([prediction_idx])[0]
        return label

    def get_similar_foods(self, features_dict: dict, top_k: int = 5) -> list:
        """Find the top K most similar foods in the dataset."""
        if self.dataset.empty or len(self.scaled_dataset_features) == 0:
            return []

        # Predict the category for the input features
        predicted_category = self.predict(features_dict)

        # Filter dataset indices that match the predicted category
        category_mask = self.dataset['category'] == predicted_category
        category_indices = np.where(category_mask)[0]

        # Extract features in correct order for the input
        feature_values = [[features_dict.get(col, 0.0) for col in self.feature_columns]]
        scaled_input = self.scaler.transform(feature_values)

        # Determine which features to compare against
        # Fallback to global similarity if not enough items in the category
        if len(category_indices) < top_k:
            target_features = self.scaled_dataset_features
            target_indices = np.arange(len(self.dataset))
        else:
            target_features = self.scaled_dataset_features[category_indices]
            target_indices = category_indices

        # Calculate Euclidean distances
        distances = euclidean_distances(target_features, scaled_input).flatten()

        # Get indices of top K smallest distances
        if len(distances) > top_k:
            local_top_k_indices = np.argpartition(distances, top_k)[:top_k]
            local_top_k_indices = local_top_k_indices[np.argsort(distances[local_top_k_indices])]
        else:
            local_top_k_indices = np.argsort(distances)
        
        # Map local indices back to global dataset indices
        global_top_k_indices = target_indices[local_top_k_indices]
        
        results = []
        for local_idx, global_idx in zip(local_top_k_indices, global_top_k_indices):
            row = self.dataset.iloc[global_idx]
            food_name = row.get("food_name", f"Food Item #{global_idx}")
            category = row.get("category", None)
            
            # Extract features for the result
            food_features = {col: float(row.get(col, 0.0)) for col in self.feature_columns}
            
            results.append({
                "food_name": str(food_name),
                "distance": float(distances[local_idx]),
                "category": str(category) if category else None,
                "features": food_features
            })
            
        return results

    def search_foods(self, query: str, limit: int = 10) -> list:
        """Search foods by name in the dataset."""
        if self.dataset.empty or not query:
            return []

        mask = self.dataset["food_name"].str.contains(query, case=False, na=False)
        matches = self.dataset[mask].head(limit)
        
        results = []
        for _, row in matches.iterrows():
            results.append({
                "food_name": str(row.get("food_name", "")),
                "category": str(row.get("category", "")),
                "calories": float(row.get("calories", 0)),
                "protein_g": float(row.get("protein_g", 0)),
                "carbs_g": float(row.get("carbs_g", 0)),
                "fat_g": float(row.get("fat_g", 0)),
                "serving_size_g": float(row.get("serving_size_g", 0)),
            })
        return results

# Instantiate the singleton instance so it's loaded upon import
ml_service = MLService()
