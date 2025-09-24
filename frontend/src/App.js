import React, { useState, useRef, useEffect } from 'react'; // Import useEffect
import axios from 'axios';
import Modal from './Modal';
import './App.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- FULL LIST OF SUGGESTIONS ---
const allGoalOptions = [
  'Build Muscle', 'Lose Weight', 'Increase Strength', 'Cardio Endurance', 'Improve Flexibility', 'Body Recomposition', 'General Fitness', 'Athletic Performance', 'Hypertrophy', 'Powerlifting', 'Functional Fitness', 'Core Strength', 'Improve Posture', 'Toning', 'HIIT Training', 'Yoga', 'Pilates', 'Circuit Training', 'CrossFit', 'Bodybuilding', 'Weightlifting', 'Calisthenics', 'Plyometrics', 'Agility Training', 'Balance Training',
];

const allEquipmentOptions = [
  'Dumbbells', 'Barbell', 'Bodyweight', 'Kettlebells', 'Resistance Bands', 'Squat Rack', 'Bench', 'Pull-up Bar', 'Cable Machine', 'Leg Press Machine', 'Treadmill', 'Stationary Bike', 'Rowing Machine', 'Medicine Ball', 'None', 'Yoga Mat', 'Foam Roller', 'Jump Rope', 'StairMaster', 'Elliptical Machine', 'Smith Machine', 'Dip Station', 'Ab Wheel', 'TRX Straps', 'Hex Bar',
];

const VISIBLE_OPTIONS_COUNT = 15; // How many options to show at once

function App() {
  const [formData, setFormData] = useState({
    goal: 'Build Muscle',
    equipment: 'Dumbbells',
    days: 3,
  });
  const [modalType, setModalType] = useState(null);
  
  // --- New state for the VISIBLE suggestions ---
  const [visibleGoals, setVisibleGoals] = useState([]);
  const [visibleEquipment, setVisibleEquipment] = useState([]);
  
  const [workoutPlan, setWorkoutPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copyText, setCopyText] = useState('Copy');
  const planRef = useRef(null);

  // --- Effect to initialize the visible lists ---
  useEffect(() => {
    setVisibleGoals(allGoalOptions.slice(0, VISIBLE_OPTIONS_COUNT));
    setVisibleEquipment(allEquipmentOptions.slice(0, VISIBLE_OPTIONS_COUNT));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // --- This function now handles both selecting and refreshing the list ---
  const handleSelect = (type, option) => {
    // Add the selected option to the form input
    const currentVal = formData[type];
    const newVal = currentVal ? `${currentVal}, ${option}` : option;
    setFormData({ ...formData, [type]: newVal });

    // Refresh the list of suggestions
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

   const generatePlan = async () => {
    setLoading(true);
    setError('');
    setWorkoutPlan('');

    try {
      const response = await fetch('http://localhost:8080/api/v1/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setWorkoutPlan((prevPlan) => prevPlan + chunk);
      }
    } catch (err) {
      setError('Failed to generate workout plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // --- UPDATED: handleSubmit now just calls the reusable function ---
  const handleSubmit = (e) => {
    e.preventDefault();
    generatePlan();
  };
  
  const handleCopy = () => {
    // We now get the text directly from the ref to ensure we don't copy button text
    const planText = planRef.current?.innerText;
    if (planText) {
      navigator.clipboard.writeText(planText);
      setCopyText('Copied!');
      setTimeout(() => setCopyText('Copy'), 2000);
    }
  };

  const handleDownloadPdf = () => {
    const planText = planRef.current?.innerText;
    if (!planText) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const usableWidth = pageWidth - margin * 2;
    let y = margin + 10;

    pdf.setFontSize(18);
    pdf.text("Your AI Workout Plan", pageWidth / 2, y, { align: 'center' });
    y += 10;
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;

    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(planText, usableWidth);
    
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


  return (
    <div className="app-container">
      <Modal
        isOpen={modalType === 'goal'}
        onClose={() => setModalType(null)}
        title="Select Fitness Goal(s)"
        options={visibleGoals} // Use the visible list from state
        onSelect={(option) => handleSelect('goal', option)}
      />

      <Modal
        isOpen={modalType === 'equipment'}
        onClose={() => setModalType(null)}
        title="Select Available Equipment"
        options={visibleEquipment} // Use the visible list from state
        onSelect={(option) => handleSelect('equipment', option)}
      />

      <h1 className="app-title">AI Workout Coach</h1>
      <p className="app-subtitle">Generate your personalized workout plan with AI.</p>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="goal">Fitness Goal</label>
            <input type="text" name="goal" id="goal" value={formData.goal} onChange={handleChange} placeholder="e.g., Build Muscle" />
            <button type="button" className="picker-button" onClick={() => setModalType('goal')}>Choose from list</button>
          </div>

          <div className="form-group">
            <label htmlFor="equipment">Equipment</label>
            <input type="text" name="equipment" id="equipment" value={formData.equipment} onChange={handleChange} placeholder="e.g., Dumbbells, Bodyweight" />
            <button type="button" className="picker-button" onClick={() => setModalType('equipment')}>Choose from list</button>
          </div>

          <div className="form-group grid-span-full">
            <label>Days per week</label>
            <div className="day-selector">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`day-button ${formData.days == day ? 'active' : ''}`}
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

      {workoutPlan && (
        <div className="workout-plan">
          <div className="plan-header">
            <h2>Your Custom Workout Plan</h2>
            <div className="plan-actions">
              <button onClick={generatePlan} className="button">Regenerate</button>
              <button onClick={handleCopy} className="button">{copyText}</button>
              <button onClick={handleDownloadPdf} className="button button-primary">Download PDF</button>
            </div>
          </div>
          <pre ref={planRef}>
            {workoutPlan
              .split('\n')
              .map(line => line.trim())
              .join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;