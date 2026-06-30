import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON payloads up to 15MB (needed for high-res base64 photo uploads)
  app.use(express.json({ limit: "15mb" }));

  // Initialize Gemini API client on the server
  let ai: GoogleGenAI | null = null;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("GoogleGenAI initialized successfully on Express server.");
    } catch (e) {
      console.error("Error initializing GoogleGenAI client:", e);
    }
  } else {
    console.warn("WARNING: GEMINI_API_KEY is not defined in the server environment variables.");
  }

  // API Route: Check API key status (to display helpful warning in frontend if key is missing)
  app.get("/api/config/status", (req, res) => {
    res.json({
      hasGeminiKey: Boolean(GEMINI_API_KEY && GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
    });
  });

  // API Route: AI-powered multi-modal civic issue validation & analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      const { imageBase64, location, description } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64 in request body." });
      }

      if (!ai) {
        return res.status(503).json({
          error: "Gemini API key is not configured.",
          message: "Please open Settings (⚙️ gear icon, top-right) → Secrets, and add your 'GEMINI_API_KEY' to enable automated issue analysis."
        });
      }

      // Extract MIME type dynamically if available, fallback to image/jpeg
      const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

      // Clean the base64 string to extract raw data bytes
      const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      
      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: base64Clean
        }
      };

      const prompt = `
You are an expert hyperlocal civic issue validation AI.
Your task is to analyze the uploaded image and the provided metadata to decide whether it depicts a real public municipal issue (e.g., potholes, clogged drainage, broken streetlights, illegal garbage dumping, pipe bursts, damaged parks/sidewalks, safety hazards) or an invalid/unrelated subject (e.g., selfies, personal documents, general indoor scenes, pets, general food, abstract graphics, etc.).

Metadata provided:
- Reported Location Name: ${location || "Unknown Location"}
- User's Added Description: ${description || "none provided"}

Please return a single JSON object. If the image does not show a valid public civic issue, set "isValidIssue" to false, and explain why in a friendly, polite tone in "rejectionReason" (e.g., "This image appears to be a personal selfie rather than a public civic issue. Please upload a clear photo of the hazard.").

If it is a valid civic issue:
- Set "isValidIssue" to true.
- Set "rejectionReason" to null.
- Classify the category into exactly one of: "pothole", "water_leak", "streetlight", "garbage", or "other".
- Score the severity from 1 (minor issue) to 5 (critical safety hazard).
- Provide a clear, 1-sentence explanation of why this severity was assigned in "severityReason".
- Route the issue to the appropriate responsible Municipal Department (e.g. "Roads Department", "Water Supply & Sewerage", "Electricity Board", "Sanitation & Health", "Other").
- Provide a professional, objective 2-sentence summary ("summary") describing the issue and its local community impact.

Stricly adhere to this JSON schema:
{
  "isValidIssue": boolean,
  "rejectionReason": string | null,
  "category": "pothole" | "water_leak" | "streetlight" | "garbage" | "other",
  "severity": number,
  "severityReason": string,
  "department": string,
  "summary": string
}
      `.trim();

      console.log("Dispatching multi-modal request to Gemini 2.5 Flash...");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          imagePart,
          { text: prompt }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValidIssue: { type: Type.BOOLEAN },
              rejectionReason: { type: Type.STRING },
              category: { type: Type.STRING },
              severity: { type: Type.INTEGER },
              severityReason: { type: Type.STRING },
              department: { type: Type.STRING },
              summary: { type: Type.STRING }
            },
            required: ["isValidIssue", "category", "severity", "severityReason", "department", "summary"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Received an empty response from Gemini.");
      }

      console.log("Successfully analyzed issue. AI output:", text);
      const parsed = JSON.parse(text.trim());
      res.json(parsed);

    } catch (err: any) {
      console.error("Error processing Gemini content generation:", err);
      res.status(500).json({
        error: "An error occurred during AI analysis.",
        details: err?.message || String(err)
      });
    }
  });

  // Serve static assets or mount Vite dev middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted on Express server.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static assets in production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start the Express server:", err);
});
