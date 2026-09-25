import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini client on server side as required by guidelines
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface Venue {
  id: string;
  name: string;
  price: number;
  capacity: number;
  available: boolean;
}

interface PlanRequest {
  eventName: string;
  budget: number;
  venues: Venue[];
  isDisruption?: boolean;
  cancelledVenueName?: string;
}

app.post('/api/plan', async (req, res) => {
  try {
    const { eventName, budget, venues, isDisruption, cancelledVenueName } = req.body as PlanRequest;

    if (!venues || !Array.isArray(venues)) {
      return res.status(400).json({ error: 'Valid venues array is required.' });
    }

    if (!ai) {
      throw new Error('GEMINI_API_KEY is not configured on the server. Please check the Secrets panel.');
    }

    // Filter available venues
    const availableVenues = venues.filter((v) => v.available);
    const affordableAvailable = availableVenues.filter((v) => v.price <= budget);

    const promptContext = `
You are the autonomous reasoning engine of an AI planning agent named "Ripple".
Your task: Pick exactly ONE venue for the event that strictly fits within the budget.

EVENT SPECIFICATION:
- Event Name: "${eventName || 'Tech Fest Inauguration'}"
- Maximum Budget: ₹${budget} (INR)

ALL VENUES IN SYSTEM:
${venues
  .map(
    (v) =>
      `- "${v.name}": Price: ₹${v.price}, Capacity: ${v.capacity} pax, Currently Available: ${v.available ? 'YES' : 'NO'}`
  )
  .join('\n')}

CURRENT OPERATING CONTEXT:
${
  isDisruption
    ? `🚨 CRITICAL DISRUPTION DETECTED: The previously confirmed venue "${cancelledVenueName}" was abruptly cancelled!
Do NOT restart from scratch. Adapt and re-plan in real time by selecting the optimal replacement from the remaining available venues strictly within the ₹${budget} budget.`
    : `Standard initial planning cycle. Select the optimal available venue that does not exceed the ₹${budget} budget.`
}

DECISION CRITERIA:
1. The selected venue MUST have Available: YES.
2. The selected venue's price MUST be <= ₹${budget}.
3. Explain why this venue was chosen over others in exactly one concise sentence (e.g., balancing capacity, budget headroom, and suitability).
4. Provide a realistic step-by-step reasoning trace (3 to 4 sequential trace thoughts showing candidate filtering, trade-off analysis, and final commitment).

You must respond with valid JSON adhering to the schema.
`;

    let response;
    let attempts = 0;
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: promptContext,
          config: {
            systemInstruction:
              'You are an autonomous AI event planning agent. Always adhere strictly to the budget constraint and availability flag. Output only structured JSON.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                selectedVenue: {
                  type: Type.STRING,
                  description: 'The exact name of the chosen venue.',
                },
                reason: {
                  type: Type.STRING,
                  description: 'One short sentence explaining why this venue was picked.',
                },
                trace: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                  description: 'Step-by-step reasoning thoughts showing constraint evaluation and trade-offs.',
                },
              },
              required: ['selectedVenue', 'reason'],
            },
          },
        });
        if (response?.text) break;
      } catch (err: any) {
        lastError = err;
        // Try fallback model if 429 or 503
        continue;
      }
    }

    if (!response?.text) {
      if (lastError) throw lastError;
      throw new Error('Gemini model returned an empty response.');
    }

    const responseText = response.text;
    const parsed = JSON.parse(responseText);

    // Validate that the returned venue exists and is available
    const matchedVenue = venues.find(
      (v) => v.name.toLowerCase().trim() === (parsed.selectedVenue || '').toLowerCase().trim()
    );

    // If model hallucinated an unavailable or nonexistent venue, ensure we catch or reconcile
    if (!matchedVenue || !matchedVenue.available || matchedVenue.price > budget) {
      // Find valid fallback
      const validFallback = affordableAvailable[0];
      if (validFallback) {
        return res.json({
          selectedVenue: validFallback.name,
          reason: parsed.reason || `Chosen as best available match within ₹${budget} budget.`,
          trace: [
            ...(parsed.trace || []),
            `Reconciliation: Locked verified candidate "${validFallback.name}" (₹${validFallback.price}, ${validFallback.capacity} seats).`,
          ],
        });
      }
    }

    return res.json({
      selectedVenue: matchedVenue ? matchedVenue.name : parsed.selectedVenue,
      reason: parsed.reason,
      trace: parsed.trace || [],
    });
  } catch (error: any) {
    console.error('Agent planning error:', error);
    let readableError = error?.message || 'Unknown error in agent reasoning engine';
    try {
      const parsedErr = JSON.parse(readableError);
      if (parsedErr?.error?.message) {
        readableError = `[API ${parsedErr.error.code || 500}] ${parsedErr.error.message}`;
      }
    } catch {
      // not json string
    }
    return res.status(500).json({
      error: readableError,
      stack: error?.stack,
    });
  }
});

// Dev vs Prod Vite handling
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Ripple Server] Active on http://0.0.0.0:${PORT}`);
});
