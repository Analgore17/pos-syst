
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private genAI: GoogleGenAI;

  constructor() {
    // Safety check: process.env is not available in standard browser bundles
    let apiKey = '';
    try {
      if (typeof process !== 'undefined' && process.env) {
        apiKey = process.env['API_KEY'] || '';
      }
    } catch (e) {
      console.warn('Environment variables not accessible');
    }
    
    // Initialize with safe key to prevent crash. API calls will fail gracefully if key is missing.
    this.genAI = new GoogleGenAI({ apiKey: apiKey });
  }

  async generateLineItems(promptText: string) {
    try {
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a cashier at Foresta Restaurant. Convert this order request into a list of menu items.
        User Order: "${promptText}"
        Rules:
        - Guess reasonable prices for an Indian Restaurant (e.g., Tea 20, Roti 25, Dal 180, Paneer 240) in INR.
        - Default quantity is 1 if not specified.
        - Return strictly JSON.
        `,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unitPrice: { type: Type.NUMBER }
              },
              required: ['description', 'quantity', 'unitPrice']
            }
          }
        }
      });
      
      const jsonText = response.text || '[]';
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Gemini API Error:', error);
      // Return empty array instead of throwing to prevent UI breakage
      return [];
    }
  }
}
