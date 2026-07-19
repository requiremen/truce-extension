import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fetch, { Headers, Request, Response } from 'node-fetch';

if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}

dotenv.config();

async function run() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-3.5-flash' });
    const result = await model.generateContent('Say hello world');
    console.log('Success:', result.response.text());
  } catch (error) {
    console.error('Gemini API Error:', error.message);
  }
}

run();
