import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration

TOOLS = [
    FunctionDeclaration(
        name="add_meal",
        description="Log a new meal to the user's meal tracker.",
        parameters={
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "The name of the meal/food."},
                "meal_type": {"type": "string", "description": "Breakfast, Lunch, Dinner, or Snack"},
                "calories": {"type": "integer", "description": "Estimated calories"},
                "protein_g": {"type": "integer", "description": "Estimated protein in grams"},
                "carbs_g": {"type": "integer", "description": "Estimated carbs in grams"},
                "fat_g": {"type": "integer", "description": "Estimated fat in grams"}
            },
            "required": ["name", "meal_type", "calories", "protein_g", "carbs_g", "fat_g"]
        }
    ),
    FunctionDeclaration(
        name="delete_meal",
        description="Delete a meal by its ID.",
        parameters={
            "type": "object",
            "properties": {"meal_id": {"type": "integer", "description": "ID of the meal to delete."}},
            "required": ["meal_id"]
        }
    ),
    FunctionDeclaration(
        name="update_weight",
        description="Update the user's current weight in their profile.",
        parameters={
            "type": "object",
            "properties": {"weight_kg": {"type": "number", "description": "New weight in kg."}},
            "required": ["weight_kg"]
        }
    )
]

model = genai.GenerativeModel("gemini-2.5-flash", tools=TOOLS)
print('Created model:', type(model))
