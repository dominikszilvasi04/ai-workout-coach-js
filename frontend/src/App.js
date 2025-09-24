import React, { useState } from 'react';
import axios from 'axios';
import Modal from './Modal'; // Import our new Modal component
import './App.css';

// --- Suggestion Lists ---
const goalOptions = [
  'Build Muscle', 'Lose Weight', 'Increase Strength', 'Cardio Endurance', 'Improve Flexibility',
  'Body Recomposition', 'General Fitness', 'Athletic Performance', 'Hypertrophy', 'Powerlifting',
  'Functional Fitness', 'Core Strength', 'Improve Posture', 'Toning', 'HIIT Training'
];

const equipmentOptions = [
  'Dumbbells', 'Barbell', 'Bodyweight', 'Kettlebells', 'Resistance Bands', 'Squat Rack',
  'Bench', 'Pull-up Bar', 'Cable Machine', 'Leg Press Machine', 'Treadmill', 'Stationary Bike',
  'Rowing Machine', 'Medicine Ball', 'None'
];

function App() {
  const [formData, setFormData] = useState({
    goal: 'Build Muscle',
    equipment: 'Dumbbells',
    days: 3,
  });
  // State to manage which modal is open ('goal', 'equipment', or null)
  const [modalType, setModalType] = useState(null);
  
  const [workoutPlan, setWorkoutPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // This function handles adding selections from the modal
  const handleSelect = (type, option) => {
    const currentVal = formData[type];
    // If the input is empty, just add the option. Otherwise, add a comma first.
    const newVal = currentVal ? `${currentVal}, ${option}` : option;
    setFormData({ ...formData, [type]: newVal });
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
      {/* This is our Goal Modal, it only shows when modalType is 'goal' */}
      <Modal
        isOpen={modalType === 'goal'}
        onClose={() => setModalType(null)}
        title="Select Fitness Goal(s)"
        options={goalOptions}
        onSelect={(option) => handleSelect('goal', option)}
      />

      {/* This is our Equipment Modal, it only shows when modalType is 'equipment' */}
      <Modal
        isOpen={modalType === 'equipment'}
        onClose={() => setModalType(null)}
        title="Select Available Equipment"
        options={equipmentOptions}
        onSelect={(option) => handleSelect('equipment', option)}
      />

      <h1 className="app-title">AI Workout Coach</h1>
      <p className="app-subtitle">Generate your personalized workout plan with AI.</p>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          {/* --- GOAL INPUT --- */}
          <div className="form-group">
            <label htmlFor="goal">Fitness Goal</label>
            <input type="text" name="goal" id="goal" value={formData.goal} onChange={handleChange} placeholder="e.g., Build Muscle" />
            <button type="button" className="picker-button" onClick={() => setModalType('goal')}>Choose from list</button>
          </div>

          {/* --- EQUIPMENT INPUT --- */}
          <div className="form-group">
            <label htmlFor="equipment">Equipment</label>
            <input type="text" name="equipment" id="equipment" value={formData.equipment} onChange={handleChange} placeholder="e.g., Dumbbells, Bodyweight" />
            <button type="button" className="picker-button" onClick={() => setModalType('equipment')}>Choose from list</button>
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