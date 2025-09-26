
import React, { useState, useEffect } from 'react'; // React hooks for state and lifecycle stuff.
import axios from 'axios'; // library for making API requests.
import Modal from './Modal'; // custom modal component for picking options
import './App.css'; 
import jsPDF from 'jspdf'; // library for generating a PDF of the workout plan


// goals user can pick from.
const allGoalOptions = [
  'Build Muscle', 'Lose Weight', 'Increase Strength', 'Cardio Endurance', 'Improve Flexibility', 'Body Recomposition', 'General Fitness', 'Athletic Performance', 'Hypertrophy', 'Powerlifting', 'Functional Fitness', 'Core Strength', 'Improve Posture', 'Toning', 'HIIT Training', 'Yoga', 'Pilates', 'Circuit Training', 'CrossFit', 'Bodybuilding', 'Weightlifting', 'Calisthenics', 'Plyometrics', 'Agility Training', 'Balance Training',
];
// equipment.
const allEquipmentOptions = [
  'Dumbbells', 'Barbell', 'Bodyweight', 'Kettlebells', 'Resistance Bands', 'Squat Rack', 'Bench', 'Pull-up Bar', 'Cable Machine', 'Leg Press Machine', 'Treadmill', 'Stationary Bike', 'Rowing Machine', 'Medicine Ball', 'None', 'Yoga Mat', 'Foam Roller', 'Jump Rope', 'StairMaster', 'Elliptical Machine', 'Smith Machine', 'Dip Station', 'Ab Wheel', 'TRX Straps', 'Hex Bar',
];
// the amount of visible options for the user at a time.
const VISIBLE_OPTIONS_COUNT = 15;

/**
 * Function takes the raw text response from the AI
 * (which is just a big string) and turns it into a structured object
 */
const parseWorkoutPlan = (text) => {
  // If we get an empty string, just send back an empty array as theres no point in processing.
  if (!text.trim()) return [];
  
  
  // We're splitting the text into chunks for each day.
  // The regex looks for "Day " followed by a number to know where a new day starts.
  const dayBlocks = text.trim().split(/\s*(?=Day \d+)/).filter(Boolean);

  let exerciseIdCounter = 0; // unique key for each exercise for React's rendering.
  // Now, let's go through each day block and pull out the details.
  return dayBlocks.map(block => {
    const lines = block.trim().split('\n');
    const dayTitle = lines.shift() || ''; // The first line is always the title, like "Day 1: Chest & Triceps".
    
    // The rest of the lines are exercises, which we identify because they start with a bullet point '•'.
    const exercises = lines.filter(line => line.trim().startsWith('•')).map(exerciseText => ({
      id: exerciseIdCounter++, // Give it a unique ID
      text: exerciseText.trim() // And the actual exercise text.
    }));

    // Return a nice, clean object for this day.
    return { dayTitle, exercises };
  });
};


function App() {
  // STATE MANAGEMENT 
  // Keep track of everything that can change in app.

  // formData holds all the user's selections.
  const [formData, setFormData] = useState({
    goal: ['Build Muscle'], // Default goals,equipment,days.
    equipment: ['Dumbbells', 'Bodyweight'],
    days: 3, 
  });
  // modalType tracks which modal (if any) is currently open: 'goal', 'equipment', or null.
  const [modalType, setModalType] = useState(null);
  // These two states hold the options that are currently visible in the modals.
  const [visibleGoals, setVisibleGoals] = useState([]);
  const [visibleEquipment, setVisibleEquipment] = useState([]);
  // These handle the text the user types into the input fields.
  const [customGoal, setCustomGoal] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');
  // This is where we'll store the actual workout plan.
  const [workoutPlan, setWorkoutPlan] = useState([]);
  // A simple boolean to know if we're currently waiting for the AI to respond.
  const [loading, setLoading] = useState(false);
  // If something goes wrong, we'll store the error message here.
  const [error, setError] = useState('');
  // Just for a little UX flair on the copy button.
  const [copyText, setCopyText] = useState('Copy');

  // This useEffect hook runs only once, right when the component first loads.
  useEffect(() => {
    setVisibleGoals(allGoalOptions.slice(0, VISIBLE_OPTIONS_COUNT));
    setVisibleEquipment(allEquipmentOptions.slice(0, VISIBLE_OPTIONS_COUNT));
  }, []); // The empty array [] means "only run this on mount".

  /**
   * Handles what happens when a user clicks an option from the modal.
   * It's generic
   */
  const handleSelect = (type, option) => {
    const currentVal = formData[type];
    // We only add the option if it's not already in their selected list.
    if (!currentVal.includes(option)) {
      setFormData(prev => ({ ...prev, [type]: [...currentVal, option] }));
    }

    // After selecting an option, replace it
    // in the visible list with a new one.
    if (type === 'goal') {
      const remainingGoals = allGoalOptions.filter(g => !visibleGoals.includes(g));
      // If there are still unseen goals, grab the next one. If not, just pick one at random to keep the list full.
      const nextGoal = remainingGoals.length > 0 ? remainingGoals[0] : allGoalOptions[Math.floor(Math.random() * allGoalOptions.length)];
      setVisibleGoals(prev => [...prev.filter(p => p !== option), nextGoal]);
    } else if (type === 'equipment') {
      const remainingEquip = allEquipmentOptions.filter(e => !visibleEquipment.includes(e));
      const nextEquip = remainingEquip.length > 0 ? remainingEquip[0] : allEquipmentOptions[Math.floor(Math.random() * allEquipmentOptions.length)];
      setVisibleEquipment(prev => [...prev.filter(p => p !== option), nextEquip]);
    }
  };

  // Handlers for custom goals and equipment

  // This function adds a custom goal when the user hits 'Enter'.
  const handleAddCustomGoal = (e) => {
    // Check for the 'Enter' key and make sure the input isn't just empty spaces.
    if (e.key === 'Enter' && customGoal.trim() !== '') {
      e.preventDefault(); // Prevents the form from submitting accidentally.
      handleSelect('goal', customGoal.trim()); // Reuse our handleSelect logic.
      setCustomGoal(''); // Clear the input field.
    }
  };
  // And this one removes a goal when the user clicks the little 'x' on a tag.
  const handleRemoveGoal = (itemToRemove) => {
    setFormData(prev => ({ ...prev, goal: prev.goal.filter(item => item !== itemToRemove) }));
  };

  // Same logic as above, but for handling custom equipment.
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

  /**
   * This async function sends the user's data to our backend API
   * and processes the streaming response from the AI.
   */
  const generatePlan = async () => {
    setLoading(true); // Show the loading spinner.
    setError(''); // Clear any previous errors.
    setWorkoutPlan([]); // Clear the old plan.
    let fullTextResponse = ""; // We'll build up the full response here.
    
    // We need to format our data slightly for the API, turning the arrays into comma-separated strings.
    const payload = {
      ...formData,
      goal: formData.goal.join(', '),
      equipment: formData.equipment.join(', '),
    };

    try {
      // using fetch API to make the request.
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/generate-workout`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Network response was not ok');

      // Update the UI as the AI is "typing" its response
      const reader = response.body.getReader();
      const decoder = new TextDecoder(); // To turn the stream's data chunks into text.
      while (true) {
        const { done, value } = await reader.read(); // Read the next chunk.
        if (done) break; // If the stream is finished, we're done.
        const chunk = decoder.decode(value);
        fullTextResponse += chunk; // Add the chunk to our full response string.
        setWorkoutPlan(parseWorkoutPlan(fullTextResponse)); // Parse the current text and update the UI!
      }
    } catch (err) {
      // If anything goes wrong, we'll show an error message.
      setError('Failed to generate workout plan. Please try again.');
    } finally {
      // loading is done no matter if it failed or succeeded.
      setLoading(false);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault(); // Standard practice to stop the page from reloading.
    generatePlan();
  };
  
  /**
   * Copies the generated workout plan to the user's clipboard as plain text.
   */
  const handleCopy = () => {
    // First, format the plan from our structured object back into a readable string.
    let textToCopy = "Your Custom Workout Plan\n\n";
    workoutPlan.forEach(day => {
      textToCopy += day.dayTitle + '\n';
      day.exercises.forEach(ex => {
        textToCopy += ex.text + '\n';
      });
      textToCopy += '\n';
    });

    // Use the browser's built-in Clipboard API to copy the text.
    navigator.clipboard.writeText(textToCopy);
    // Give the user some visual feedback.
    setCopyText('Copied!');
    setTimeout(() => setCopyText('Copy'), 2000); // Change it back to "Copy" after 2 seconds.
  };

  /**
   * Creates and triggers a download for a PDF version of the workout plan.
   */
  const handleDownloadPdf = () => {
    // Just like with the copy function, we format the plan into a string first.
    let textForPdf = "Your Custom Workout Plan\n\n";
      workoutPlan.forEach(day => {
        textForPdf += day.dayTitle + '\n';
        day.exercises.forEach(ex => {
          textForPdf += ex.text + '\n';
        });
        textForPdf += '\n';
      });
    
    // Create a new jsPDF instance. 'p' for portrait, 'mm' for millimeters, 'a4' for paper size.
    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const usableWidth = pageWidth - margin * 2;
    let y = margin; // This 'y' variable keeps track of vertical position on the page.

    pdf.setFontSize(10);
    // This handy method splits our long string into an array of lines that will fit within our page width.
    const lines = pdf.splitTextToSize(textForPdf, usableWidth);
    
    // Loop through each line and add it to the PDF.
    lines.forEach(line => {
      // If we're about to write off the bottom of the page...
      if (y + 5 > pageHeight - margin) {
        pdf.addPage(); // ...add a new page...
        y = margin; // ...and reset our vertical position to the top margin.
      }
      pdf.text(line, margin, y); // Write the line of text.
      y += 5; // Move down for the next line.
    });

    // Finally, save the generated PDF.
    pdf.save('ai-workout-plan.pdf');
  };

  /**
   * Handles the API call to swap a single exercise for a new one.
   */
  const handleSwapExercise = async (dayIndex, exerciseId) => {
    // First, find the specific exercise object we're trying to swap.
    const exerciseToSwap = workoutPlan[dayIndex].exercises.find(ex => ex.id === exerciseId);
    if (!exerciseToSwap) return; // Just in case cant find it.
    
    const originalText = exerciseToSwap.text;
    // For instant user feedback, we'll immediately change the text to "Swapping...".
    // We make a copy of the state to avoid a fail.
    setWorkoutPlan(prevPlan => {
        const newPlan = JSON.parse(JSON.stringify(prevPlan));
        newPlan[dayIndex].exercises.find(ex => ex.id === exerciseId).text = "• Swapping...";
        return newPlan;
    });

    try {
        // Now, make the API call using axios here.
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/swap-exercise`, {
            // We need to send the name of the exercise and the user's available equipment.
            exercise: originalText.replace('•', '').split('–')[0].trim(), // A bit of cleanup to get just the exercise name.
            equipment: formData.equipment.join(', ')
        });
        
        // On success, we update the plan with the new exercise from the API response.
        setWorkoutPlan(prevPlan => {
            const newPlan = JSON.parse(JSON.stringify(prevPlan));
            newPlan[dayIndex].exercises.find(ex => ex.id === exerciseId).text = response.data.newExercise;
            return newPlan;
        });
    } catch (err) {
        console.error("Failed to swap exercise", err);
        // If the API call fails, we should revert the text back to what it was originally.
        setWorkoutPlan(prevPlan => {
            const newPlan = JSON.parse(JSON.stringify(prevPlan));
            newPlan[dayIndex].exercises.find(ex => ex.id === exerciseId).text = originalText;
            return newPlan;
        });
    }
  };


  // JSX
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

      <h1 className="app-title">SmartReps</h1>
      <p className="app-subtitle">Generate your personalized workout plan with AI.</p>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          {/* This is the input section for fitness goals. */}
          <div className="form-group grid-span-full">
            <label>Fitness Goal(s)</label>
            <div className="tag-selector">
              {/* We map over the selected goals and display them as "tags". */}
              <div className="tags-container">
                {formData.goal.map(item => (
                  <div key={item} className="tag">
                    {item}
                    <button type="button" onClick={() => handleRemoveGoal(item)}>&times;</button>
                  </div>
                ))}
              </div>
              {/* This group contains the text input for custom goals and the button to open the modal. */}
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

          {/* This section for equipment is structured exactly the same as the goals one. */}
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

          {/* And here's the selector for how many days a week to work out. */}
          <div className="form-group grid-span-full">
            <label>Days per week</label>
            <div className="day-selector">
              {/* We just map over an array of numbers to create the buttons. */}
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <button
                  key={day}
                  type="button" 
                  className={`day-button ${formData.days === day ? 'active' : ''}`} // The 'active' class highlights the selected day.
                  onClick={() => setFormData({ ...formData, days: day })}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button type="submit" disabled={loading} className="generate-button">
          {/* A nice touch: the button text changes while loading. */}
          {loading ? 'Generating...' : 'Generate Plan'}
        </button>
      </form>

      {/* This is called conditional rendering. The error message only shows up if error has a value. */}
      {error && <p className="app-subtitle" style={{color: '#f87171'}}>{error}</p>}

      {/* The entire workout plan section is also conditionally rendered. It only appears if we have a plan. */}
      {workoutPlan.length > 0 && (
        <div className="workout-plan">
          <div className="plan-header">
            <h2>Your Custom Workout Plan</h2>
            {/* Action buttons for the generated plan */}
            <div className="plan-actions">
              <button onClick={generatePlan} className="button">Regenerate</button>
              <button onClick={handleCopy} className="button">{copyText}</button>
              <button onClick={handleDownloadPdf} className="button button-primary">Download PDF</button>
            </div>
          </div>
          
          {/* We map over each day in our workout plan object... */}
          {workoutPlan.map((day, dayIndex) => (
            <div key={day.dayTitle || dayIndex} className="day-plan">
              <h3>{day.dayTitle}</h3>
              <ul>
                {/* ...and then map over the exercises for that day. */}
                {day.exercises.map((exercise) => (
                  <li key={exercise.id}>
                    <span>{exercise.text}</span>
                    {/* The swap button calls our handler with the necessary indexes to find the right exercise. */}
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