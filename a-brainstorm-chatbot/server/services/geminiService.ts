import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const getManagerResponse = async (prompt: string) => {
  // TODO: Implement manager agent logic
  return ['Angle 1', 'Angle 2', 'Angle 3'];
};

export const getWorkerResponse = async (prompt: string) => {
  // TODO: Implement worker agent logic
  return `Response to ${prompt}`;
};
