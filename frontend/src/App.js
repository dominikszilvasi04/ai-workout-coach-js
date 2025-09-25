import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import Modal from './Modal';
import './App.css';
import jsPDF from 'jspdf';


const allGoalOptions = [
  'Build Muscle', 'Lose Weight', 'Increase Strength', 'Cardio Endurance', 'Improve Flexibility', 'Body Recomposition', 'General Fitness', 'Athletic Performance', 'Hypertrophy', 'Powerlifting', 'Functional Fitness', 'Core Strength', 'Improve Posture', 'Toning', 'HIIT Training', 'Yoga', 'Pilates', 'Circuit Training', 'CrossFit', 'Bodybuilding', 'Weightlifting', 'Calisthenics', 'Plyometrics', 'Agility Training', 'Balance Training',
];
const allEquipmentOptions = [
  'Dumbbells', 'Barbell', 'Bodyweight', 'Kettlebells', 'Resistance Bands', 'Squat Rack', 'Bench', 'Pull-up Bar', 'Cable Machine', 'Leg Press Machine', 'Treadmill', 'Stationary Bike', 'Rowing Machine', 'Medicine Ball', 'None', 'Yoga Mat', 'Foam Roller', 'Jump Rope', 'StairMaster', 'Elliptical Machine', 'Smith Machine', 'Dip Station', 'Ab Wheel', 'TRX Straps', 'Hex Bar',
];
const VISIBLE_OPTIONS_COUNT = 15;

const parseWorkoutPlan = (text) => {
  if (!text.trim()) return [];
  
  
  const dayBlocks = text.trim().split(/\s*(?=Day \d+)/).filter(Boolean);

  let exerciseIdCounter = 0;
  return dayBlocks.map(block => {
    const lines = block.trim().split('\n');
    const dayTitle = lines.shift() || ''; // Take the first line as the title
    
    // The rest of the lines are exercises
    const exercises = lines.filter(line => line.trim().startsWith('•')).map(exerciseText => ({
      id: exerciseIdCounter++,
      text: exerciseText.trim()
    }));

    return { dayTitle, exercises };
  });
};

function App() {
  const [formData, setFormData] = useState({
    goal: ['Build Muscle'], // Corrected: goal is an array
    equipment: ['Dumbbells', 'Bodyweight'],
    days: 3,
  });
  const [modalType, setModalType] = useState(null);
  const [visibleGoals, setVisibleGoals] = useState([]);
  const [visibleEquipment, setVisibleEquipment] = useState([]);
  const [customGoal, setCustomGoal] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');
  const [workoutPlan, setWorkoutPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copyText, setCopyText] = useState('Copy');

  useEffect(() => {
    setVisibleGoals(allGoalOptions.slice(0, VISIBLE_OPTIONS_COUNT));
    setVisibleEquipment(allEquipmentOptions.slice(0, VISIBLE_OPTIONS_COUNT));
  }, []);

  const handleSelect = (type, option) => {
    const currentVal = formData[type];
    // This logic now works for both goals and equipment
    if (!currentVal.includes(option)) {
      setFormData(prev => ({ ...prev, [type]: [...currentVal, option] }));
    }

    // Refresh the visible list
    if (type === 'goal') {
      const remainingGoals = allGoalOptions.filter(g => !visibleGoals.includes(g));
      const nextGoal = remainingGoals.length > 0 ? remainingGoals[0] : allGoalOptions[Math.floor(Math.random() * allGoalOptions.length)];
      setVisibleGoals(prev => [...prev.filter(p => p !== option), nextGoal]);
    } else if (type === 'equipment') {
      const remainingEquip = allEquipmentOptions.filter(e => !visibleEquipment.includes(e));
      const nextEquip = remainingEquip.length > 0 ? remainingEquip[0] : allEquipmentOptions[Math.floor(Math.random() * allEquipmentOptions.length)];
      setVisibleEquipment(prev => [...prev.filter(p => p !== option), nextEquip]);
    }
  };

  // --- Added handlers for custom goals ---
  const handleAddCustomGoal = (e) => {
    if (e.key === 'Enter' && customGoal.trim() !== '') {
      e.preventDefault();
      handleSelect('goal', customGoal.trim());
      setCustomGoal('');
    }
  };
  const handleRemoveGoal = (itemToRemove) => {
    setFormData(prev => ({ ...prev, goal: prev.goal.filter(item => item !== itemToRemove) }));
  };

  const handleAddCustomEquipment = (e) => {
    if (e.key === 'Enter' && customEquipment.trim() !== '') {
      e.preventDefault();
      handleSelect('equipment', customEquipment.trim());
      setCustomEquipment('');
    }
  };
  const handleRemoveEquipment = (itemToRemove) => {
    setFormData(prev => ({ ...prev, equipment: prev.equipment.filter(item => item !== itemToRemove) }));
  };

  const generatePlan = async () => {
    setLoading(true);
    setError('');
    setWorkoutPlan([]);
    let fullTextResponse = "";
    
    const payload = {
      ...formData,
      goal: formData.goal.join(', '),
      equipment: formData.equipment.join(', '),
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/generate-workout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullTextResponse += chunk;
        setWorkoutPlan(parseWorkoutPlan(fullTextResponse));
      }
    } catch (err) {
      setError('Failed to generate workout plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    generatePlan();
  };
  
  const handleCopy = () => {
  let textToCopy = "Your Custom Workout Plan\n\n";
  workoutPlan.forEach(day => {
    textToCopy += day.dayTitle + '\n';
    day.exercises.forEach(ex => {
      textToCopy += ex.text + '\n';
    });
    textToCopy += '\n';
  });

  navigator.clipboard.writeText(textToCopy);
  setCopyText('Copied!');
  setTimeout(() => setCopyText('Copy'), 2000);
};

const handleDownloadPdf = () => {
  let textForPdf = "Your Custom Workout Plan\n\n";
    workoutPlan.forEach(day => {
      textForPdf += day.dayTitle + '\n';
      day.exercises.forEach(ex => {
        textForPdf += ex.text + '\n';
      });
      textForPdf += '\n';
    });
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const margin = 15;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;
  let y = margin;

  pdf.setFontSize(10);
  const lines = pdf.splitTextToSize(textForPdf, usableWidth);
  
  lines.forEach(line => {
    if (y + 5 > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += 5;
  });

  pdf.save('ai-workout-plan.pdf');
};

const handleSwapExercise = async (dayIndex, exerciseId) => {
  const exerciseToSwap = workoutPlan[dayIndex].exercises.find(ex => ex.id === exerciseId);
  if (!exerciseToSwap) return;
  
  const originalText = exerciseToSwap.text;
  setWorkoutPlan(prevPlan => {
      const newPlan = JSON.parse(JSON.stringify(prevPlan));
      newPlan[dayIndex].exercises.find(ex => ex.id === exerciseId).text = "• Swapping...";
      return newPlan;
  });

  try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/swap-exercise`, {
          exercise: originalText.replace('•', '').split('–')[0].trim(),
          equipment: formData.equipment.join(', ')
      });
      
      setWorkoutPlan(prevPlan => {
          const newPlan = JSON.parse(JSON.stringify(prevPlan));
          newPlan[dayIndex].exercises.find(ex => ex.id === exerciseId).text = response.data.newExercise;
          return newPlan;
      });
  } catch (err) {
      console.error("Failed to swap exercise", err);
      setWorkoutPlan(prevPlan => { // Revert on failure
          const newPlan = JSON.parse(JSON.stringify(prevPlan));
          newPlan[dayIndex].exercises.find(ex => ex.id === exerciseId).text = originalText;
          return newPlan;
      });
  }
};


  return (
    <div className="app-container">
      <Modal
        isOpen={modalType === 'goal'}
        onClose={() => setModalType(null)}
        title="Select Fitness Goal(s)"
        options={visibleGoals}
        onSelect={(option) => handleSelect('goal', option)}
      />
      <Modal
        isOpen={modalType === 'equipment'}
        onClose={() => setModalType(null)}
        title="Select Available Equipment"
        options={visibleEquipment}
        onSelect={(option) => handleSelect('equipment', option)}
      />

      <h1 className="app-title">AI Workout Coach</h1>
      <p className="app-subtitle">Generate your personalized workout plan with AI.</p>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          {/* --- Corrected Goal Selector UI --- */}
          <div className="form-group grid-span-full">
            <label>Fitness Goal(s)</label>
            <div className="tag-selector">
              <div className="tags-container">
                {formData.goal.map(item => (
                  <div key={item} className="tag">
                    {item}
                    <button type="button" onClick={() => handleRemoveGoal(item)}>&times;</button>
                  </div>
                ))}
              </div>
              <div className="tag-input-group">
                <input
                  type="text"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  onKeyDown={handleAddCustomGoal}
                  placeholder="Type custom goal and press Enter..."
                />
                <button type="button" className="picker-button" onClick={() => setModalType('goal')}>Add from List</button>
              </div>
            </div>
          </div>

          <div className="form-group grid-span-full">
            <label>Equipment</label>
            <div className="tag-selector">
              <div className="tags-container">
                {formData.equipment.map(item => (
                  <div key={item} className="tag">
                    {item}
                    <button type="button" onClick={() => handleRemoveEquipment(item)}>&times;</button>
                  </div>
                ))}
              </div>
              <div className="tag-input-group">
                <input
                  type="text"
                  value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value)}
                  onKeyDown={handleAddCustomEquipment}
                  placeholder="Type custom equipment and press Enter..."
                />
                <button type="button" className="picker-button" onClick={() => setModalType('equipment')}>Add from List</button>
              </div>
            </div>
          </div>

          <div className="form-group grid-span-full">
            <label>Days per week</label>
            <div className="day-selector">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`day-button ${formData.days === day ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, days: day })}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button type="submit" disabled={loading} className="generate-button">
          {loading ? 'Generating...' : 'Generate Plan'}
        </button>
      </form>

      {error && <p className="app-subtitle" style={{color: '#f87171'}}>{error}</p>}

      {workoutPlan.length > 0 && (
  <div className="workout-plan">
    <div className="plan-header">
      <h2>Your Custom Workout Plan</h2>
      <div className="plan-actions">
        <button onClick={generatePlan} className="button">Regenerate</button>
        <button onClick={handleCopy} className="button">{copyText}</button>
        <button onClick={handleDownloadPdf} className="button button-primary">Download PDF</button>
      </div>
    </div>
    
    {workoutPlan.map((day, dayIndex) => (
      <div key={day.dayTitle || dayIndex} className="day-plan">
        <h3>{day.dayTitle}</h3>
        <ul>
          {day.exercises.map((exercise) => (
            <li key={exercise.id}>
              <span>{exercise.text}</span>
              <button className="swap-button" title="Swap exercise" onClick={() => handleSwapExercise(dayIndex, exercise.id)}>
                🔄
              </button>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
  )}
    </div>
  );
}

export default App;