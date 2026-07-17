import { useState, useEffect, useRef, useCallback } from "react";
import mealService from "../services/mealService";
import mlService from "../services/mlService";
import { Sparkles, Zap, PlusCircle, Beef, Wheat, Droplets } from "lucide-react";

export default function MealTracker() {
  const [targetDate, setTargetDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [data, setData] = useState({ summary: null, meals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Add Meal Form ──────────────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    food_name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    meal_type: "Breakfast",
    food_category: "",
    is_ai_predicted: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Autocomplete State ─────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // ── AI Prediction State ────────────────────────────────────────────
  const [predicting, setPredicting] = useState(false);

  // ── Similar Foods State ────────────────────────────────────────────
  const [similarFoods, setSimilarFoods] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [hasFetchedSimilar, setHasFetchedSimilar] = useState(false);

  // ── Fetch Meals ────────────────────────────────────────────────────
  useEffect(() => {
    fetchMeals();
  }, [targetDate]);

  // ── Close dropdown on outside click ────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchMeals = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await mealService.getMealsByDate(targetDate);
      setData(res);
    } catch {
      setError("Failed to load meals data.");
    } finally {
      setLoading(false);
    }
  };

  // ── Debounced food search ──────────────────────────────────────────
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setForm((prev) => ({ ...prev, food_name: value }));

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await mlService.searchFoods(value, 8);
        setSearchResults(res.results || []);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  // ── AI Predict Category ────────────────────────────────────────────
  const runAIPrediction = useCallback(async (features) => {
    setPredicting(true);
    try {
      const res = await mlService.predict(features);
      return res.predicted_category;
    } catch (err) {
      console.error("Prediction failed:", err);
      return null;
    } finally {
      setPredicting(false);
    }
  }, []);

  // ── Similar Foods ──────────────────────────────────────────────────
  const fetchSimilarFoods = async (features, foodName) => {
    setSimilarLoading(true);
    setSimilarFoods([]);
    setHasFetchedSimilar(false);
    try {
      const res = await mlService.getSimilarFoods(features, 4);
      // Filter out the food itself if it appears in the results
      const filtered = (res.results || []).filter(
        (r) => r.food_name.toLowerCase() !== foodName.toLowerCase()
      );
      setSimilarFoods(filtered.slice(0, 3));
    } catch (err) {
      console.error("Similar foods failed:", err);
      setSimilarFoods([]);
    } finally {
      setSimilarLoading(false);
      setHasFetchedSimilar(true);
    }
  };

  // ── Select food from autocomplete ──────────────────────────────────
  const handleSelectFood = async (food) => {
    // 1. Immediately set the form data with what we have
    const updatedForm = {
      ...form,
      food_name: food.food_name,
      calories: Math.round(food.calories),
      protein: Math.round(food.protein_g * 10) / 10,
      carbs: Math.round(food.carbs_g * 10) / 10,
      fat: Math.round(food.fat_g * 10) / 10,
      food_category: food.category || "",
      is_ai_predicted: false,
    };

    setForm(updatedForm);
    setSearchQuery(food.food_name);
    setShowDropdown(false);

    // Prepare features for both prediction and similarity
    const features = {
      protein_g: Number(updatedForm.protein) || 0,
      carbs_g: Number(updatedForm.carbs) || 0,
      fat_g: Number(updatedForm.fat) || 0,
      fiber_g: 0, sugar_g: 0, sodium_mg: 0,
      calories: Number(updatedForm.calories) || 0,
      glycemic_index: 0, serving_size_g: food.serving_size_g || 0,
      potassium_mg: 0, calcium_mg: 0, iron_mg: 0, magnesium_mg: 0,
      cholesterol_mg: 0, vitamin_a_mcg: 0, vitamin_c_mg: 0,
      vitamin_d_mcg: 0, vitamin_b12_mcg: 0, zinc_mg: 0,
      phosphorus_mg: 0, water_g: 0,
    };

    // 2. Trigger the ML prediction immediately after selection
    const predictedCategory = await runAIPrediction(features);

    // Update the form with the new category
    if (predictedCategory) {
      setForm((prev) => ({
        ...prev,
        food_category: predictedCategory,
        is_ai_predicted: true,
      }));
    }

    // 3. Trigger similar foods request immediately after prediction completes
    await fetchSimilarFoods(features, food.food_name);
  };

  // ── Form handlers ──────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "food_name" || name === "meal_type" || name === "food_category"
          ? value
          : value === ""
            ? ""
            : Number(value),
    }));
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!form.food_name || form.calories === "") return;

    // Auto-predict category if not set from the dataset
    if (!form.food_category) {
      const features = {
        protein_g: Number(form.protein) || 0,
        carbs_g: Number(form.carbs) || 0,
        fat_g: Number(form.fat) || 0,
        fiber_g: 0, sugar_g: 0, sodium_mg: 0,
        calories: Number(form.calories) || 0,
        glycemic_index: 0, serving_size_g: 0,
        potassium_mg: 0, calcium_mg: 0, iron_mg: 0, magnesium_mg: 0,
        cholesterol_mg: 0, vitamin_a_mcg: 0, vitamin_c_mg: 0,
        vitamin_d_mcg: 0, vitamin_b12_mcg: 0, zinc_mg: 0,
        phosphorus_mg: 0, water_g: 0,
      };
      const predictedCategory = await runAIPrediction(features);
      if (predictedCategory) {
        form.food_category = predictedCategory;
        form.is_ai_predicted = true;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      await mealService.addMeal({
        ...form,
        meal_date: targetDate,
      });
      setForm({
        food_name: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        meal_type: form.meal_type,
        food_category: "",
        is_ai_predicted: false,
      });
      setSearchQuery("");
      setSimilarFoods([]);
      setHasFetchedSimilar(false);
      setShowAddForm(false);
      fetchMeals();
    } catch {
      setError("Failed to add meal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeal = async (id) => {
    if (!window.confirm("Are you sure you want to delete this meal?")) return;
    try {
      await mealService.deleteMeal(id);
      fetchMeals();
    } catch {
      setError("Failed to delete meal.");
    }
  };

  // ── Quick-add from similar foods ───────────────────────────────────
  const handleQuickAdd = async (food) => {
    const cals = food.features?.calories || 0;
    const prot = food.features?.protein_g || 0;
    const carb = food.features?.carbs_g || 0;
    const ft = food.features?.fat_g || 0;
    setForm((prev) => ({
      ...prev,
      food_name: food.food_name,
      calories: Math.round(cals),
      protein: Math.round(prot * 10) / 10,
      carbs: Math.round(carb * 10) / 10,
      fat: Math.round(ft * 10) / 10,
      food_category: food.category || "",
      is_ai_predicted: false,
    }));
    setSearchQuery(food.food_name);
    
    // Automatically request new recommendations for the newly selected food
    const features = {
      protein_g: prot,
      carbs_g: carb,
      fat_g: ft,
      fiber_g: 0, sugar_g: 0, sodium_mg: 0,
      calories: cals,
      glycemic_index: 0, serving_size_g: food.features?.serving_size_g || 0,
      potassium_mg: 0, calcium_mg: 0, iron_mg: 0, magnesium_mg: 0,
      cholesterol_mg: 0, vitamin_a_mcg: 0, vitamin_c_mg: 0,
      vitamin_d_mcg: 0, vitamin_b12_mcg: 0, zinc_mg: 0,
      phosphorus_mg: 0, water_g: 0,
    };
    await fetchSimilarFoods(features, food.food_name);
  };

  const { summary, meals } = data;
  const mealGroups = ["Breakfast", "Lunch", "Dinner", "Snack"];

  // ── Category badge color ───────────────────────────────────────────
  const categoryColors = {
    Dairy: "bg-blue-500/15 text-blue-400",
    Egyptian: "bg-amber-500/15 text-amber-400",
    Fruit: "bg-pink-500/15 text-pink-400",
    Grains: "bg-yellow-500/15 text-yellow-400",
    Nuts: "bg-orange-500/15 text-orange-400",
    Protein: "bg-emerald-500/15 text-emerald-400",
    Vegetable: "bg-green-500/15 text-green-400",
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      {/* ── Header & Date Picker ────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meal Tracker</h1>
          <p className="mt-1 text-[var(--cx-text-muted)]">
            Log your food and track your daily nutrition.
          </p>
        </div>
        <div>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="cx-input bg-[var(--cx-surface)] text-lg font-medium shadow-sm"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500/30 border-t-primary-500" />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── Left Column: Meals List ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Today's Meals</h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="cx-btn-primary !py-2 !px-4 text-sm flex items-center gap-2"
              >
                {showAddForm ? "Close Form" : <><PlusCircle size={16} /> Add Meal</>}
              </button>
            </div>

            {/* ── Add Meal Form ─────────────────────────────────────── */}
            {showAddForm && (
              <div className="cx-card border-primary-500/40 bg-[var(--cx-surface)]">
                <h3 className="text-lg font-semibold mb-4">Add New Meal</h3>
                <form onSubmit={handleAddMeal} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Food Name Autocomplete */}
                    <div className="relative" ref={searchRef}>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--cx-text-muted)]">
                        Food Name
                      </label>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                        required
                        className="cx-input"
                        placeholder="Search 10,000+ foods..."
                        autoComplete="off"
                      />
                      {searchLoading && (
                        <div className="absolute right-3 top-[38px]">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500/30 border-t-primary-500" />
                        </div>
                      )}

                      {/* Dropdown */}
                      {showDropdown && searchResults.length > 0 && (
                        <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-[var(--cx-border)] bg-[var(--cx-surface-elevated)] shadow-xl">
                          {searchResults.map((food, i) => (
                            <li
                              key={i}
                              onClick={() => handleSelectFood(food)}
                              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-primary-500/10 transition-colors border-b border-[var(--cx-border)] last:border-b-0"
                            >
                              <div>
                                <p className="font-medium text-sm">{food.food_name}</p>
                                <p className="text-xs text-[var(--cx-text-muted)]">
                                  {Math.round(food.calories)} kcal · P {Math.round(food.protein_g)}g · C {Math.round(food.carbs_g)}g · F {Math.round(food.fat_g)}g
                                </p>
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColors[food.category] || "bg-gray-500/15 text-gray-400"}`}>
                                {food.category}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Meal Type */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--cx-text-muted)]">
                        Meal Type
                      </label>
                      <select
                        name="meal_type"
                        value={form.meal_type}
                        onChange={handleChange}
                        className="cx-input bg-[var(--cx-surface-elevated)]"
                      >
                        <option value="Breakfast">Breakfast</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Dinner">Dinner</option>
                        <option value="Snack">Snack</option>
                      </select>
                    </div>
                  </div>

                  {/* Macros Row */}
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--cx-text-muted)]">Calories</label>
                      <input type="number" name="calories" value={form.calories} onChange={handleChange} required className="cx-input" placeholder="kcal" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--cx-text-muted)]">Protein (g)</label>
                      <input type="number" name="protein" value={form.protein} onChange={handleChange} className="cx-input" placeholder="g" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--cx-text-muted)]">Carbs (g)</label>
                      <input type="number" name="carbs" value={form.carbs} onChange={handleChange} className="cx-input" placeholder="g" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--cx-text-muted)]">Fat (g)</label>
                      <input type="number" name="fat" value={form.fat} onChange={handleChange} className="cx-input" placeholder="g" />
                    </div>
                  </div>

                  {/* Category Row */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="mb-1.5 block text-sm font-medium text-[var(--cx-text-muted)]">
                        Food Category
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          name="food_category"
                          value={form.food_category}
                          onChange={handleChange}
                          className="cx-input flex-1"
                          placeholder="Auto-detected by AI..."
                          readOnly
                        />
                        {form.food_category && (
                          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${form.is_ai_predicted ? "bg-purple-500/15 text-purple-400" : categoryColors[form.food_category] || "bg-gray-500/15 text-gray-400"}`}>
                            {form.is_ai_predicted && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                              </svg>
                            )}
                            {form.is_ai_predicted ? "AI Predicted" : "From Dataset"}
                          </span>
                        )}
                        {!form.food_category && form.calories !== "" && (
                          <button
                            type="button"
                            onClick={async () => {
                              const features = {
                                protein_g: Number(form.protein) || 0,
                                carbs_g: Number(form.carbs) || 0,
                                fat_g: Number(form.fat) || 0,
                                fiber_g: 0, sugar_g: 0, sodium_mg: 0,
                                calories: Number(form.calories) || 0,
                                glycemic_index: 0, serving_size_g: 0,
                                potassium_mg: 0, calcium_mg: 0, iron_mg: 0, magnesium_mg: 0,
                                cholesterol_mg: 0, vitamin_a_mcg: 0, vitamin_c_mg: 0,
                                vitamin_d_mcg: 0, vitamin_b12_mcg: 0, zinc_mg: 0,
                                phosphorus_mg: 0, water_g: 0,
                              };
                              const predictedCategory = await runAIPrediction(features);
                              if (predictedCategory) {
                                setForm((prev) => ({
                                  ...prev,
                                  food_category: predictedCategory,
                                  is_ai_predicted: true,
                                }));
                              }
                            }}
                            disabled={predicting}
                            className="flex items-center gap-1.5 shrink-0 text-xs font-medium px-3 py-2 rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 transition-colors disabled:opacity-50"
                          >
                            {predicting ? "Predicting..." : <><Sparkles size={14} /> Auto-detect</>}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Similar Foods Recommendations ────────────────────── */}
                  {(similarFoods.length > 0 || similarLoading || hasFetchedSimilar) && (
                    <div className="mt-8">
                      <div className="flex flex-col mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl leading-none"></span>
                          <h4 className="font-bold text-base tracking-tight text-primary-50">AI Recommendations</h4>
                        </div>
                        <p className="text-xs text-[var(--cx-text-muted)] mt-1 ml-7">Based on food name, category, and nutritional similarity.</p>
                      </div>

                      {similarLoading ? (
                        <div className="flex items-center justify-center py-8 rounded-2xl bg-[var(--cx-surface-elevated)] border border-[var(--cx-border)]/50 backdrop-blur-sm">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500/30 border-t-primary-500" />
                          <span className="ml-3 text-sm font-medium text-[var(--cx-text-muted)]">Analyzing nutritional profile...</span>
                        </div>
                      ) : similarFoods.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 rounded-2xl bg-[var(--cx-surface-elevated)] border border-[var(--cx-border)]/50">
                          <p className="text-sm font-medium text-[var(--cx-text)]">No similar foods found.</p>
                          <p className="text-xs text-[var(--cx-text-muted)] mt-1">Try searching for another food.</p>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-1">
                          {similarFoods.map((food, i) => {
                            // Keep raw values for calculating accurate differences
                            const rawCals = food.features?.calories || 0;
                            const rawProt = food.features?.protein_g || 0;
                            const rawCarb = food.features?.carbs_g || 0;
                            const rawFat = food.features?.fat_g || 0;

                            const recCals = Math.round(rawCals);
                            const recProt = Math.round(rawProt);
                            const recCarb = Math.round(rawCarb);
                            const recFat = Math.round(rawFat);
                            
                            // Calculate differences (1 decimal place for macros, whole number for calories)
                            const diffCals = Math.round(rawCals - (Number(form.calories) || 0));
                            const diffProt = Math.round((rawProt - (Number(form.protein) || 0)) * 10) / 10;
                            const diffCarb = Math.round((rawCarb - (Number(form.carbs) || 0)) * 10) / 10;
                            const diffFat = Math.round((rawFat - (Number(form.fat) || 0)) * 10) / 10;

                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleQuickAdd(food)}
                                className="w-full text-left relative overflow-hidden rounded-xl border border-[var(--cx-border)] bg-[var(--cx-surface-elevated)]/40 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/10 hover:border-primary-500/50 hover:bg-[var(--cx-surface-elevated)] group cursor-pointer backdrop-blur-sm flex flex-col gap-3"
                              >
                                {/* Subtle background gradient on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-primary-500/0 to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                {/* Header */}
                                <div className="relative z-10 flex items-start justify-between gap-3 w-full">
                                  <h5 className="font-semibold text-sm text-[var(--cx-text)] group-hover:text-primary-400 transition-colors leading-tight pr-2">
                                    {food.food_name}
                                  </h5>
                                  {food.category && (
                                    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${categoryColors[food.category] || "bg-gray-500/15 text-gray-400"}`}>
                                      {food.category}
                                    </span>
                                  )}
                                </div>

                                {/* Nutrition Row */}
                                <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs bg-[var(--cx-surface)]/50 rounded-lg p-2.5 border border-[var(--cx-border)]/50">
                                  <div className="flex items-center gap-1.5 font-semibold text-[var(--cx-text)]">
                                    <span className="text-sm">🔥</span> {recCals} <span className="text-[var(--cx-text-muted)] font-normal">kcal</span>
                                  </div>
                                  <div className="w-px h-3 bg-[var(--cx-border)]"></div>
                                  <div className="flex items-center gap-1.5 font-semibold text-[var(--cx-text)]">
                                    <span className="text-sm">💪</span> {recProt}g <span className="text-[var(--cx-text-muted)] font-normal hidden sm:inline">Protein</span>
                                  </div>
                                  <div className="w-px h-3 bg-[var(--cx-border)]"></div>
                                  <div className="flex items-center gap-1.5 font-semibold text-[var(--cx-text)]">
                                    <span className="text-sm">🍞</span> {recCarb}g <span className="text-[var(--cx-text-muted)] font-normal hidden sm:inline">Carbs</span>
                                  </div>
                                  <div className="w-px h-3 bg-[var(--cx-border)]"></div>
                                  <div className="flex items-center gap-1.5 font-semibold text-[var(--cx-text)]">
                                    <span className="text-sm">🥑</span> {recFat}g <span className="text-[var(--cx-text-muted)] font-normal hidden sm:inline">Fat</span>
                                  </div>
                                </div>

                                {/* Why this recommendation? */}
                                <div className="relative z-10 mt-1">
                                  <p className="text-[10px] font-bold text-[var(--cx-text-muted)] uppercase tracking-wider mb-2">Why this recommendation?</p>
                                  <div className="flex flex-col gap-1.5 text-[11px] text-[var(--cx-text)]/90">
                                    <span className="flex items-center gap-2"><span className="text-primary-400 text-sm">✓</span> Similar nutrition profile</span>
                                    {form.category && food.category === form.category && (
                                      <span className="flex items-center gap-2"><span className="text-primary-400 text-sm">✓</span> Same category</span>
                                    )}
                                    {diffCals < 0 && Math.abs(diffCals) >= 10 && (
                                      <span className="flex items-center gap-2"><span className="text-emerald-400 text-sm">✓</span> Lower calories</span>
                                    )}
                                    {diffProt > 0 && Math.abs(diffProt) >= 2 && (
                                      <span className="flex items-center gap-2"><span className="text-emerald-400 text-sm">✓</span> Higher protein</span>
                                    )}
                                    {diffFat < 0 && Math.abs(diffFat) >= 2 && (
                                      <span className="flex items-center gap-2"><span className="text-emerald-400 text-sm">✓</span> Lower fat</span>
                                    )}
                                  </div>
                                </div>

                                {/* Nutrition Changes & Action */}
                                {(Math.abs(diffCals) >= 1 || Math.abs(diffProt) >= 0.1 || Math.abs(diffCarb) >= 0.1 || Math.abs(diffFat) >= 0.1) && (
                                  <div className="relative z-10 pt-3 border-t border-[var(--cx-border)]/50 mt-1 flex items-end justify-between">
                                    <div>
                                      <p className="text-[10px] font-bold text-[var(--cx-text-muted)] uppercase tracking-wider mb-2">Nutrition Changes</p>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {Math.abs(diffCals) >= 1 && (
                                          <span className={`text-[10px] font-semibold px-2 py-1 rounded flex items-center gap-1 shadow-sm ${diffCals > 0 ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                                            {diffCals > 0 ? "↑" : "↓"} {Math.abs(diffCals)} kcal
                                          </span>
                                        )}
                                        {Math.abs(diffProt) >= 0.1 && (
                                          <span className={`text-[10px] font-semibold px-2 py-1 rounded flex items-center gap-1 shadow-sm ${diffProt > 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"}`}>
                                            {diffProt > 0 ? "↑" : "↓"} {Math.abs(diffProt)} g Protein
                                          </span>
                                        )}
                                        {Math.abs(diffCarb) >= 0.1 && (
                                          <span className={`text-[10px] font-semibold px-2 py-1 rounded flex items-center gap-1 shadow-sm ${diffCarb > 0 ? "bg-[var(--cx-surface-elevated)] text-[var(--cx-text)] border border-[var(--cx-border)]" : "bg-[var(--cx-surface-elevated)] text-[var(--cx-text)] border border-[var(--cx-border)]"}`}>
                                            {diffCarb > 0 ? "↑" : "↓"} {Math.abs(diffCarb)} g Carbs
                                          </span>
                                        )}
                                        {Math.abs(diffFat) >= 0.1 && (
                                          <span className={`text-[10px] font-semibold px-2 py-1 rounded flex items-center gap-1 shadow-sm ${diffFat > 0 ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                                            {diffFat > 0 ? "↑" : "↓"} {Math.abs(diffFat)} g Fat
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="shrink-0">
                                      <span className="text-xs font-bold text-primary-400 bg-primary-500/10 border border-primary-500/20 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        Replace Food
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="cx-btn-primary !py-2 !px-6"
                    >
                      {submitting ? "Adding..." : "Save Meal"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Meal Groups ──────────────────────────────────────── */}
            <div className="space-y-6">
              {mealGroups.map((type) => {
                const groupMeals = meals.filter((m) => m.meal_type === type);
                if (groupMeals.length === 0) return null;

                const groupCals = groupMeals.reduce((acc, curr) => acc + curr.calories, 0);

                return (
                  <div key={type} className="cx-card p-0 overflow-hidden">
                    <div className="bg-[var(--cx-surface-elevated)] px-6 py-3 flex justify-between items-center border-b border-[var(--cx-border)]">
                      <h3 className="font-semibold">{type}</h3>
                      <span className="text-sm text-[var(--cx-text-muted)] font-medium">
                        {groupCals.toLocaleString()} kcal
                      </span>
                    </div>
                    <ul className="divide-y divide-[var(--cx-border)]">
                      {groupMeals.map((meal) => (
                        <li key={meal.id} className="px-6 py-4 flex items-center justify-between group hover:bg-[var(--cx-surface-elevated)]/50 transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{meal.food_name}</p>
                              {meal.food_category && (
                                <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${meal.is_ai_predicted ? "bg-purple-500/15 text-purple-400" : categoryColors[meal.food_category] || "bg-gray-500/15 text-gray-400"}`}>
                                  {meal.food_category}
                                  {meal.is_ai_predicted && <Zap size={10} />}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-4 mt-1 text-xs text-[var(--cx-text-muted)]">
                              <span>Protein: {meal.protein}g</span>
                              <span>Carbs: {meal.carbs}g</span>
                              <span>Fat: {meal.fat}g</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold">{meal.calories} kcal</span>
                            <button
                              onClick={() => handleDeleteMeal(meal.id)}
                              className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-300 p-1"
                              title="Delete Meal"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              {meals.length === 0 && !showAddForm && (
                <div className="cx-card text-center py-12 border-dashed">
                  <p className="text-[var(--cx-text-muted)]">No meals logged for this date.</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-4 cx-btn-ghost text-sm"
                  >
                    Add your first meal
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Summary Widgets ───────────────────────── */}
          <div className="space-y-6">

            {/* Calories Summary Widget */}
            <div className="cx-card bg-gradient-to-br from-[var(--cx-surface)] to-primary-500/5 border-primary-500/20">
              <h3 className="font-bold tracking-tight mb-6 text-lg">Daily Summary</h3>
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-[var(--cx-text-muted)] uppercase tracking-wider font-semibold mb-1">Consumed</p>
                    <p className="text-3xl font-extrabold text-[var(--cx-text)]">
                      {summary?.total_calories?.toLocaleString() || 0}
                      <span className="text-sm font-normal text-[var(--cx-text-muted)] ml-1">kcal</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--cx-text-muted)] uppercase tracking-wider font-semibold mb-1">Target</p>
                    <p className="text-xl font-bold text-primary-400">
                      {summary?.target_calories ? summary.target_calories.toLocaleString() : "---"}
                    </p>
                  </div>
                </div>
                {summary?.target_calories && (
                  <div className="pt-4 border-t border-[var(--cx-border)]">
                    <p className="text-xs text-[var(--cx-text-muted)] uppercase tracking-wider font-semibold mb-1">Remaining</p>
                    <p className={`text-2xl font-bold ${summary.remaining_calories < 0 ? "text-red-400" : "text-accent-400"}`}>
                      {summary.remaining_calories > 0 ? summary.remaining_calories.toLocaleString() : 0}
                      <span className="text-sm font-normal text-[var(--cx-text-muted)] ml-1">kcal</span>
                    </p>
                    {summary.remaining_calories < 0 && (
                      <p className="text-xs text-red-400 mt-1">Over target by {Math.abs(summary.remaining_calories).toLocaleString()} kcal</p>
                    )}
                  </div>
                )}
                {!summary?.target_calories && (
                  <div className="pt-4 border-t border-[var(--cx-border)]">
                    <p className="text-sm text-accent-400">Set up your profile to see targets.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Macro Progress Widget */}
            <div className="cx-card">
              <h3 className="font-bold tracking-tight mb-6 text-lg">Macronutrients</h3>
              <div className="space-y-6">
                {[
                  { label: "Protein", color: "bg-emerald-500", Icon: Beef, textColor: "text-emerald-500", key: "protein", targetKey: "target_protein" },
                  { label: "Carbs", color: "bg-blue-500", Icon: Wheat, textColor: "text-blue-500", key: "carbs", targetKey: "target_carbs" },
                  { label: "Fat", color: "bg-amber-500", Icon: Droplets, textColor: "text-amber-500", key: "fat", targetKey: "target_fat" },
                ].map(({ label, color, Icon, textColor, key, targetKey }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 font-semibold uppercase tracking-wider text-xs">
                        <Icon size={16} className={textColor} />
                        {label}
                      </span>
                      <span className="text-[var(--cx-text)] text-sm font-medium">
                        {summary?.[`total_${key}`] || 0}g{" "}
                        <span className="text-xs text-[var(--cx-text-muted)]">/ {summary?.[targetKey] || "-"}g</span>
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-[var(--cx-surface-elevated)] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                        style={{
                          width: summary?.[targetKey] ? `${Math.min(100, ((summary[`total_${key}`] || 0) / summary[targetKey]) * 100)}%` : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
