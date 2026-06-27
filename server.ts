import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize the official @google/genai client on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Endpoint to parse raw tasks/deadlines plain-text into structured objects
app.post("/api/tasks/parse", async (req, res) => {
  try {
    const { inputText, referenceTime } = req.body;
    if (!inputText) {
      return res.status(400).json({ error: "Input text is required" });
    }

    const prompt = `You are 'Last-Minute Life Saver' task parser.
The user enters tasks and deadlines in plain language, potentially in one go.
Your job is to parse this input text into structured task objects.
Reference Time (Current User Time): ${referenceTime}

Input text to parse:
"${inputText}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You extract tasks and deadlines from plain text input.
Rules:
1. Resolve relative dates/times ('Friday', 'tomorrow 3pm', 'today', 'next monday') based on the Reference Time. Format resolved deadlines as 'YYYY-MM-DD HH:mm'. If no specific time of day is mentioned, default to '23:59'.
2. Urgency Evaluation:
   - 'high': Deadline is less than 24 hours away, or is high-stakes.
   - 'medium': Deadline is 1 to 3 days away.
   - 'low': Deadline is more than 3 days away.
3. Urgency Reason: Write a short (1 sentence), punchy, empathetic, and encouraging tip or justification explaining why it's rated that way and how the user can start immediately to beat the deadline.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "The task name or short description" },
                  deadline: { type: Type.STRING, description: "The resolved absolute date and time for the deadline in 'YYYY-MM-DD HH:mm' format" },
                  urgency: { type: Type.STRING, description: "Urgency evaluation: must be one of 'high', 'medium', or 'low'" },
                  urgencyReason: { type: Type.STRING, description: "A short, motivating reason/tip (1 sentence)" }
                },
                required: ["title", "deadline", "urgency", "urgencyReason"]
              }
            }
          },
          required: ["tasks"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response text from Gemini API");
    }

    const parsedData = JSON.parse(textOutput);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error parsing tasks:", error);
    res.status(500).json({ error: error.message || "Failed to parse tasks" });
  }
});

// Endpoint to plan user's day as a step-by-step vertical timeline
app.post("/api/tasks/plan", async (req, res) => {
  try {
    const { tasks, currentTime } = req.body;

    const prompt = `You are 'Last-Minute Life Saver' AI companion. Your goal is to help the user actually complete their pending tasks before their deadlines by planning a realistic, step-by-step, time-blocked schedule for the remainder of their day.

User's Pending Tasks:
${JSON.stringify(tasks, null, 2)}

Current Local Time: ${currentTime}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You create a step-by-step, realistic time-blocked schedule starting from the Current Local Time.
Rules:
1. Build action-oriented, bite-sized focus blocks (usually 30 to 90 minutes each) for the pending tasks, prioritizing 'high' urgency tasks first.
2. Be realistic: include necessary buffer times or breaks (e.g., 'Take a 10-minute walk', 'Lunch/Dinner break') so the user stays fresh.
3. For each block, if it maps directly to one of the user's pending tasks, include its exact task 'id' in associatedTaskId. If it's a break or general activity, set associatedTaskId to null.
4. Provide a punchy, highly motivating coachingMessage at the end.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  startTime: { type: Type.STRING, description: "Start time of the block in 'HH:mm' format" },
                  endTime: { type: Type.STRING, description: "End time of the block in 'HH:mm' format" },
                  title: { type: Type.STRING, description: "Title of the activity/task" },
                  description: { type: Type.STRING, description: "A highly actionable focus instruction for this time block (e.g., 'Draft first 2 slides. Silence phone.')" },
                  associatedTaskId: { type: Type.STRING, description: "The ID of the associated task, or null" }
                },
                required: ["startTime", "endTime", "title", "description"]
              }
            },
            coachingMessage: {
              type: Type.STRING,
              description: "A short, empathetic, motivating coaching message."
            }
          },
          required: ["schedule", "coachingMessage"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response text from Gemini API");
    }

    const parsedData = JSON.parse(textOutput);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error planning day:", error);
    res.status(500).json({ error: error.message || "Failed to plan day" });
  }
});

// Serve frontend assets
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();
