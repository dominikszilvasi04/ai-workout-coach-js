import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    goal: '', // Changed to empty string for text input
    equipment: '', // Changed to empty string for text input
    days: 3,
  });
  const [workoutPlan, setWorkoutPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setWorkoutPlan('');

    try {
      const response = await axios.post('http://localhost:8080/api/v1/generate-workout', formData);
      setWorkoutPlan(response.data.plan);
    } catch (err) {
      setError('Failed to generate workout plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">AI Workout Coach</h1>
      <p className="app-subtitle">Generate your personalized workout plan with AI.</p>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          {/* --- GOAL INPUT --- */}
          <div className="form-group">
            <label htmlFor="goal">Fitness Goal</label>
            <input
              type="text"
              name="goal"
              id="goal"
              value={formData.goal}
              onChange={handleChange}
              placeholder="e.g., Build Muscle"
              list="goal-suggestions" // Link to the datalist
            />
            <datalist id="goal-suggestions">
              <option value="Build Muscle" />
              <option value="Lose Weight" />
              <option value="Cardio Endurance" />
              <option value="Increase Strength" />
            </datalist>
          </div>

          {/* --- EQUIPMENT INPUT --- */}
          <div className="form-group">
            <label htmlFor="equipment">Equipment</label>
            <input
              type="text"
              name="equipment"
              id="equipment"
              value={formData.equipment}
              onChange={handleChange}
              placeholder="e.g., Dumbbells, Bodyweight"
              list="equipment-suggestions" // Link to the datalist
            />
            <datalist id="equipment-suggestions">
              <option value="Dumbbells" />
              <option value="Barbell" />
              <option value="Bodyweight" />
              <option value="Kettlebells" />
              <option value="None" />
            </datalist>
          </div>

          {/* --- DAYS INPUT (Unchanged) --- */}
          <div className="form-group">
            <label htmlFor="days">Days per week</label>
            <input type="number" name="days" id="days" value={formData.days} min="1" max="7" onChange={handleChange} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="generate-button">
          {loading ? 'Generating...' : 'Generate Plan'}
        </button>
      </form>

      {error && <p className="app-subtitle" style={{color: '#f87171'}}>{error}</p>}

      {workoutPlan && (
        <div className="workout-plan">
          <h2>Your Custom Workout Plan</h2>
          <pre>{workoutPlan.trim()}</pre>
        </div>
      )}
    </div>
  );
}

export default App;