import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateWebsite(userPrompt) {
  const systemInstruction = 
    'You are an expert frontend developer and web designer.\n' +
    'Task: Generate a full single-file HTML webpage based on the user prompt.\n' +
    'Requirements:\n' +
    '1. Include Tailwind CSS CDN inside the <head> tag.\n' +
    '2. Use modern colors, clean typography, and a fully responsive layout.\n' +
    '3. Build a complete layout with sections like Hero, Features, Testimonials, and Footer.\n' +
    '4. Return ONLY valid, raw HTML code. Do NOT wrap it in Markdown code blocks, and do not add any explanations.';

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: userPrompt,
    config: { systemInstruction }
  });

  return response.text;
}