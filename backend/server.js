// 1. Import necessary packages
const express = require('express');
const OpenAI = require('openai'); // Import the OpenAI library
const cors = require('cors');
require('dotenv').config();

// 2. Initialize the OpenAI client with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 3. Set up the Express app
const app = express();
const PORT = 8080;

// 4. Set up middleware
app.use(cors());
app.use(express.json());

// 5. Define the API endpoint
app.post('/api/v1/generate-workout', async (req, res) => {
  try {
    const { goal, equipment, days } = req.body;

    // Basic validation
    if (!goal || !equipment || !days) {
      return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    const prompt = `Generate a ${days}-day ${goal} workout plan using ${equipment}. Format exactly like this:
    Day 1 (~total time):
    • Exercise 4x12 – one short tip on proper form
    • Exercise 3x15 – one short tip on proper form
    • Exercise 3x12 – one short tip on proper form
    Each day should have 4–5 exercises. Keep instructions very concise, focused only on form cues. Include an estimated total time for the day in parentheses next to the day. Use consistent, neat formatting with each exercise on a new line. Do not add introductions, explanations, or extra commentary.`;
    // 6. Make the API call to OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // 7. Send the generated text back to our frontend
    const generatedText = response.choices[0].message.content;
    res.json({ plan: generatedText.trim() });

  } catch (error) {
    console.error('--- OPENAI API ERROR ---');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    res.status(500).json({ error: 'Failed to generate workout plan.' });
  }
});

// 8. Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});