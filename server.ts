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

// Helper wrapper to call Gemini API with retry capability
async function callGeminiWithRetry(fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`Gemini API call failed with error: ${error.message || error}. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callGeminiWithRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

// Local fallback task parser in case of complete API outage
function fallbackParseTasks(inputText: string, referenceTime: string) {
  const tasksList: any[] = [];
  const parts = inputText.split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);
  
  const refDate = referenceTime ? new Date(referenceTime) : new Date();
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  for (const part of parts) {
    let title = part;
    let targetDate = new Date(refDate);
    let urgency: 'high' | 'medium' | 'low' = 'medium';
    let urgencyReason = "Estimated urgency based on deadline heuristics.";

    const lowerPart = part.toLowerCase();

    if (lowerPart.includes("today")) {
      urgency = 'high';
      urgencyReason = "Due today! Start immediately to secure your peace of mind.";
    } else if (lowerPart.includes("tomorrow")) {
      targetDate.setDate(targetDate.getDate() + 1);
      urgency = 'high';
      urgencyReason = "Due tomorrow. Complete this early to avoid late-night stress.";
    } else {
      let foundDay = false;
      for (let i = 0; i < 7; i++) {
        if (lowerPart.includes(daysOfWeek[i])) {
          const currentDayIndex = refDate.getDay();
          const targetDayIndex = i;
          let daysDiff = targetDayIndex - currentDayIndex;
          if (daysDiff <= 0) daysDiff += 7;
          targetDate.setDate(targetDate.getDate() + daysDiff);
          foundDay = true;
          
          if (daysDiff <= 1) {
            urgency = 'high';
            urgencyReason = `Due in under 24 hours. Put this at the very top of your list!`;
          } else if (daysDiff <= 3) {
            urgency = 'medium';
            urgencyReason = `Due in ${daysDiff} days. Steady, focused progress is key.`;
          } else {
            urgency = 'low';
            urgencyReason = `Due in ${daysDiff} days. Secure an early win today!`;
          }
          break;
        }
      }
      if (!foundDay) {
        targetDate.setDate(targetDate.getDate() + 1);
        urgency = 'medium';
        urgencyReason = "Scheduled with urgent priority. Tackle this step-by-step.";
      }
    }

    let hours = 23;
    let minutes = 59;
    const timeMatch = lowerPart.match(/(\d+)\s*(pm|am)/);
    if (timeMatch) {
      let h = parseInt(timeMatch[1]);
      const ampm = timeMatch[2];
      if (ampm === 'pm' && h < 12) h += 12;
      if (ampm === 'am' && h === 12) h = 0;
      hours = h;
      minutes = 0;
    }

    targetDate.setHours(hours, minutes, 0, 0);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const formattedDeadline = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())} ${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}`;

    // Clean title of keywords
    title = title
      .replace(/today/gi, '')
      .replace(/tomorrow/gi, '')
      .replace(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/gi, '')
      .replace(/\d+\s*(am|pm)/gi, '')
      .replace(/\bby\b/gi, '')
      .replace(/\bat\b/gi, '')
      .replace(/\bfor\b/gi, '')
      .replace(/\bon\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (title.length === 0) {
      title = "Quick Task";
    }

    let actionable = false;
    let actionType = "none";
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("email") || lowerTitle.includes("mail")) {
      actionable = true;
      actionType = "email";
    } else if (lowerTitle.includes("call") || lowerTitle.includes("phone")) {
      actionable = true;
      actionType = "call";
    } else if (lowerTitle.includes("notify") || lowerTitle.includes("ask") || lowerTitle.includes("message") || lowerTitle.includes("slack") || lowerTitle.includes("tell")) {
      actionable = true;
      actionType = "notification";
    }

    tasksList.push({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      deadline: formattedDeadline,
      urgency,
      urgencyReason,
      actionable,
      actionType,
      subTasks: []
    });
  }

  return { tasks: tasksList, isFallback: true };
}

// Local fallback schedule builder in case of complete API outage
function fallbackPlanDay(tasks: any[], currentTime: string) {
  const schedule: any[] = [];
  let currentHour = 9;
  let currentMin = 0;

  if (currentTime && currentTime.includes(":")) {
    const parts = currentTime.split(":");
    currentHour = parseInt(parts[0]) || 9;
    currentMin = parseInt(parts[1]) || 0;
  }

  const addMinutes = (h: number, m: number, minsToAdd: number) => {
    let totalMins = h * 60 + m + minsToAdd;
    let newH = Math.floor(totalMins / 60) % 24;
    let newM = totalMins % 60;
    return [newH, newM];
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Prioritize high urgency tasks
  const sortedTasks = [...tasks].sort((a, b) => {
    const urgencyWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return (urgencyWeight[b.urgency] || 0) - (urgencyWeight[a.urgency] || 0);
  });

  for (const task of sortedTasks) {
    const startTimeStr = `${pad(currentHour)}:${pad(currentMin)}`;
    const [endH, endM] = addMinutes(currentHour, currentMin, 45);
    const endTimeStr = `${pad(endH)}:${pad(endM)}`;

    schedule.push({
      startTime: startTimeStr,
      endTime: endTimeStr,
      title: `Focus: ${task.title}`,
      description: `Work session. Silence alerts, use a countdown timer, and execute on the critical goals.`,
      associatedTaskId: task.id
    });

    currentHour = endH;
    currentMin = endM;
  }

  return {
    schedule,
    coachingMessage: "Ready for action! We constructed this timeline locally using high-priority focus blocks. You are fully equipped to crush this.",
    isFallback: true
  };
}

// Endpoint to parse raw tasks/deadlines plain-text into structured objects
app.post("/api/tasks/parse", async (req, res) => {
  const { inputText, referenceTime } = req.body;
  if (!inputText) {
    return res.status(400).json({ error: "Input text is required" });
  }

  try {
    const prompt = `You are 'PanicMate' task parser.
The user enters tasks and deadlines in plain language, potentially in one go.
Your job is to parse this input text into structured task objects.
Reference Time (Current User Time): ${referenceTime}

Input text to parse:
"${inputText}"`;

    // Attempt Gemini call with retries
    const response = await callGeminiWithRetry(async () => {
      return await ai.models.generateContent({
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
3. Urgency Reason: Write a short (1 sentence), punchy, empathetic, and encouraging tip or justification explaining why it's rated that way and how the user can start immediately to beat the deadline.
4. Outbound Communication Detection: Classify whether the task requires outbound communication (such as sending an email, requesting an extension, asking for help, notifying someone, or messaging someone on Slack/phone). Set 'actionable' to true if it does, and false otherwise. Classify the 'actionType' as 'email', 'call', 'notification', 'slack', etc., or 'none' if it is not a communication task.
5. 'Break It Down' Engine: Evaluate if the task is complex, large, or multi-step (e.g. studying, coding, writing papers, preparing presentations, organizing events). If it is, you must automatically break it down into an array of exactly 3 distinct, highly actionable, step-by-step micro-tasks. If the task is simple or doesn't need breaking down, return an empty array [].`,
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
                    urgencyReason: { type: Type.STRING, description: "A short, motivating reason/tip (1 sentence)" },
                    actionable: { type: Type.BOOLEAN, description: "True if the task requires outbound communication (e.g., emailing, asking for extension, notifying someone), false otherwise" },
                    actionType: { type: Type.STRING, description: "The type of action required (e.g. 'email', 'call', 'notification', 'slack', or 'none')" },
                    subTasks: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "An array of exactly 3 distinct, actionable, and specific micro-tasks to break down the main task if complex, large, or multi-step. Return an empty array [] if the task is simple or does not need breaking down."
                    }
                  },
                  required: ["title", "deadline", "urgency", "urgencyReason", "actionable", "actionType", "subTasks"]
                }
              }
            },
            required: ["tasks"]
          }
        }
      });
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response text from Gemini API");
    }

    const parsedData = JSON.parse(textOutput);
    res.json(parsedData);
  } catch (error: any) {
    console.warn("Using local fallback task parser due to Gemini API error:", error.message || error);
    // Graceful fallback parse instead of crashing or throwing 500
    const fallbackData = fallbackParseTasks(inputText, referenceTime);
    res.json(fallbackData);
  }
});

// Endpoint to plan user's day as a step-by-step vertical timeline
app.post("/api/tasks/plan", async (req, res) => {
  const { tasks, currentTime } = req.body;

  try {
    const prompt = `You are 'PanicMate' AI companion. Your goal is to help the user actually complete their pending tasks before their deadlines by planning a realistic, step-by-step, time-blocked schedule for the remainder of their day.

User's Pending Tasks:
${JSON.stringify(tasks, null, 2)}

Current Local Time: ${currentTime}`;

    // Attempt Gemini call with retries
    const response = await callGeminiWithRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `You create a step-by-step, realistic time-blocked schedule starting from the Current Local Time.
Rules:
1. STRICTLY ONLY return the user's actual tasks rearranged by optimal time and priority. DO NOT include, generate, or schedule any breaks, lunch, meals, or filler downtime. The schedule should only contain raw, active work sessions for the user's real pending tasks.
2. Build action-oriented, bite-sized focus blocks (usually 30 to 90 minutes each) for the pending tasks, prioritizing 'high' urgency tasks first.
3. For each block, it MUST map directly to one of the user's pending tasks. Include its exact task 'id' in associatedTaskId.
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
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response text from Gemini API");
    }

    const parsedData = JSON.parse(textOutput);
    res.json(parsedData);
  } catch (error: any) {
    console.warn("Using local fallback day planner due to Gemini API error:", error.message || error);
    // Graceful fallback plan instead of crashing or throwing 500
    const fallbackData = fallbackPlanDay(tasks, currentTime);
    res.json(fallbackData);
  }
});

// Endpoint to generate draft communication for an actionable task
app.post("/api/tasks/:id/draft", async (req, res) => {
  const { id } = req.params;
  const { title, description, urgencyReasoning, urgencyReason, deadline } = req.body;
  const reasoning = urgencyReasoning || urgencyReason || "";

  try {
    const prompt = `You are 'PanicMate' communication drafter.
Create a polished, highly professional, or context-appropriate draft (e.g. email, Slack message, or call script) to help the user address the deadline or request.

Task Context:
- ID: ${id}
- Title: ${title}
- Description/Notes: ${description || "No description provided"}
- Deadline: ${deadline || "Not specified"}
- Urgency Reason: ${reasoning}

Please draft a ready-to-send message. If the action is email-based, write a clear subject line and body. If it is a direct message or call script, write an appropriate heading/subject (like "[Slack Direct Message]" or "[Phone Script]") and the main message body. Make the tone polite, urgent but professional, taking responsibility if necessary, and proposing a clear action item.`;

    const response = await callGeminiWithRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You generate custom communication drafts. Output a JSON object containing a 'subject' string (e.g., email subject or message header) and a 'body' string containing the drafted message.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING, description: "The email subject line or message header" },
              body: { type: Type.STRING, description: "The complete body text of the message draft" }
            },
            required: ["subject", "body"]
          }
        }
      });
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response text from Gemini API");
    }

    const draftData = JSON.parse(textOutput);
    res.json(draftData);
  } catch (error: any) {
    console.warn("Using local fallback draft generator due to Gemini API error:", error.message || error);
    const isEmail = (title || "").toLowerCase().includes("email") || (title || "").toLowerCase().includes("mail");
    const subject = isEmail ? `Regarding: ${title}` : `[Action Draft] ${title}`;
    const body = `Hi there,\n\nI wanted to reach out regarding "${title}". The deadline is currently set for ${deadline || 'soon'}.\n\nCould we coordinate on this at your earliest convenience?\n\nBest regards,\n[Your Name]`;
    
    res.json({
      subject,
      body,
      isFallback: true
    });
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
