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

    const prompt = `You are an AI workout assistant. Generate a ${days}-day workout plan for the goal of '${goal}' with '${equipment}'.
    Your response must be concise and follow this exact format:
    Day X (~time):
    • Exercise SetsxReps – Tip
    Constraints: Each day must have 4-5 exercises. Tips must be very short form cues. Do not include any intro, summary, or conversational text.
    Start generating Day 1 immediately.`;

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