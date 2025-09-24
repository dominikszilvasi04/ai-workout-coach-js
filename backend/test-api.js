const axios = require('axios');
require('dotenv').config();

// This is the function we want to test
async function testHuggingFaceApi() {
  const apiKey = process.env.HUGGING_FACE_API_KEY;
  const apiUrl = 'https://api-inference.huggingface.co/models/gpt2';
  const prompt = 'The capital of Ireland is';

  console.log('--- Starting API Test ---');
  console.log('Using API URL:', apiUrl);

  if (!apiKey) {
    console.error('🔴 ERROR: HUGGING_FACE_API_KEY not found in .env file!');
    return;
  }

  try {
    const response = await axios.post(
      apiUrl,
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    console.log('✅ SUCCESS: API call was successful!');
    console.log('Response Data:', response.data);

  } catch (error) {
    console.error('🔴 FAILED: API call failed!');
    if (error.response) {
      console.error('Status Code:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else {
      console.error('Error Message:', error.message);
    }
  } finally {
    console.log('--- Test Finished ---');
  }
}

// Run the test
testHuggingFaceApi();