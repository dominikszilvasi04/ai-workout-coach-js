// 1. Import all necessary packages
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
require('dotenv').config();

// 2. Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 3. Set up the Express app
const app = express(); // <<< THIS LINE WAS MOVED UP
const PORT = 8080;

// 4. Set up middleware (MUST be after `const app = express()`)
app.use(cors({
  origin: 'https://smartrepsai.netlify.app'
}));
app.use(express.json());

// 5. Define API endpoints
app.post('/api/v1/generate-workout', async (req, res) => {
  try {
    const { goal, equipment, days } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const prompt = `Generate a ${days}-day ${goal} workout plan using ${equipment}. Format exactly like this:
Day 1 (~total time):
• Exercise 4x12 – one short tip on proper form
• Exercise 3x15 – one short tip on proper form
Each day should have 4–5 exercises. Keep instructions concise and focused on form cues. Include an estimated total time for the day in parentheses. Use neat formatting. Do not add introductions or extra commentary.`;

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      res.write(content);
    }
    res.end();

  } catch (error) {
    console.error('--- STREAMING ERROR ---', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate workout plan.' });
    } else {
      res.end();
    }
  }
});

app.post('/api/v1/swap-exercise', async (req, res) => {
  try {
    const { exercise, equipment } = req.body;
    if (!exercise || !equipment) {
      return res.status(400).json({ error: 'Exercise and equipment are required.' });
    }

    const prompt = `Suggest one single alternative exercise for "${exercise}" using "${equipment}". The new exercise must target the same primary muscle group.
Provide ONLY the new exercise line in this exact format: • Exercise Name SetsxReps – Short Form Tip
Do not add any other text, introductions, or explanations.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    const newExercise = response.choices[0].message.content.trim();
    res.json({ newExercise });

  } catch (error) {
    console.error('--- SWAP EXERCISE ERROR ---', error);
    res.status(500).json({ error: 'Failed to swap exercise.' });
  }
});

// 6. Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});