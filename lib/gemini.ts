import type { Persona } from "./types";

const MODEL_NAME = process.env.MODEL_NAME ?? "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

const personaPrompts: Record<Exclude<Persona, "user">, string> = {
  optimist:
    "You are Optimist, a positive brainstorming partner. Provide enthusiastic but concise ideas (max 3 sentences).",
  pessimist:
    "You are Pessimist, focusing on risks and downsides. Share thoughtful cautions (max 3 sentences).",
  realist:
    "You are Realist, pragmatic and balanced. Give actionable considerations (max 3 sentences)."
};

export async function generatePersonaReplies(
  prompt: string
): Promise<Array<{ persona: Exclude<Persona, "user">; content: string }>> {
  const entries = Object.entries(personaPrompts) as Array<
    [Exclude<Persona, "user">, string]
  >;

  if (!API_KEY) {
    return entries.map(([persona]) => ({
      persona,
      content: `${capitalize(persona)} thinks: ${prompt.slice(0, 80)}...`
    }));
  }

  const results = await Promise.allSettled(
    entries.map(([persona, systemPrompt]) =>
      callGemini({ persona, prompt, systemPrompt })
    )
  );

  const replies = results.map((result, index) => {
    const persona = entries[index][0];

    if (result.status === "fulfilled" && result.value.trim().length > 0) {
      return { persona, content: result.value };
    }

    const reason =
      result.status === "fulfilled"
        ? "empty response"
        : result.reason instanceof Error
          ? result.reason.message
          : String(result.reason ?? "unknown error");

    console.warn(
      "Gemini reply unavailable, using fallback",
      JSON.stringify({ persona, reason }, null, 2)
    );

    return {
      persona,
      content: `${capitalize(persona)} thinks: ${prompt.slice(0, 80)}...`
    };
  });

  return replies;
}

async function callGemini({
  persona,
  prompt,
  systemPrompt
}: {
  persona: Exclude<Persona, "user">;
  prompt: string;
  systemPrompt: string;
}): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: `${systemPrompt}\n\nOriginal prompt: ${prompt}` }
          ]
        }
      ],
      generationConfig: {
        temperature: persona === "pessimist" ? 0.4 : 0.7,
        maxOutputTokens: 200,
        topP: 0.9
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status})`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini response missing text");
  }
  return text.trim();
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
