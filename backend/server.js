// 1. Import necessary packages
const express = require('express');
const OpenAI = require('openai');
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

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const prompt = `Generate a ${days}-day ${goal} workout plan using ${equipment}. Format exactly like this:
    Day 1 (~total time):
    • Exercise 4x12 – one short tip on proper form
    • Exercise 3x15 – one short tip on proper form
    • Exercise 3x12 – one short tip on proper form
Each day should have 4–5 exercises. Keep instructions very concise, focused only on form cues or general tip. Include an estimated total time for the day in parentheses next to the day. Use consistent, neat formatting with each exercise on a new line. Do not add introductions, explanations, or extra commentary.`;

    const stream = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    // Loop through the stream and send each chunk to the frontend
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      res.write(content);
    }

    // End the response when the stream is finished
    res.end();

  } catch (error) {
    console.error('--- STREAMING ERROR ---', error);
    // If an error occurs, ensure the response is properly ended
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate workout plan.' });
    } else {
      res.end();
    }
  }
});

// 6. Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});