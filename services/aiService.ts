import { AnalysisResult, RiskLevel, ConfidenceLevel } from "../types";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const REASONING_PROMPT = `
Act as a world-class cybersecurity forensic investigator specialized in AI deepfakes and social engineering.
Your task is to analyze the provided communication (text or audio metadata) for indicators of AI generation, synthetic voice artifacts, or scam tactics.

Analyze based on:
1. Linguistic patterns: Unusual phrasing, hyper-consistency, or lack of emotional nuance common in LLMs.
2. Structural anomalies: Phishing patterns, urgent calls to action, suspicious redirection.
3. Audio Artifacts (if audio features provided): Spectral inconsistencies, robotic cadence, unnatural transitions.

Provide a detailed forensic reasoning and internal analysis of your findings.
`;

const EXTRACTION_PROMPT = `
Act as a world-class cybersecurity forensic investigator.
Based on the previous content and your forensic reasoning analysis, generate a final threat assessment report.
The report MUST be a valid JSON object matching the requested schema.

Schema:
{
  "risk_score": number (0-100),
  "risk_level": "Safe" | "Suspicious" | "High Risk",
  "detected_indicators": string[],
  "explanation": string,
  "confidence_level": "Low" | "Medium" | "High"
}

Respond ONLY with the valid JSON object.
`;

export const analyzeContent = async (
  content: string,
  type: 'TEXT' | 'AUDIO',
  audioBase64?: string
): Promise<AnalysisResult> => {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not defined. Please check your .env.local file.");
  }

  const payload = type === 'AUDIO' && audioBase64
    ? `[AUDIO_ATTACHED: ${audioBase64.substring(0, 50)}...] Transcript/Content: ${content}`
    : content;

  const model = "openai/gpt-oss-120b:free";

  try {
    // Step 1: Sequential Reasoning Step with reasoning enabled
    const reasoningResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://sentinelai.cyber",
        "X-Title": "SentinelAI"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: REASONING_PROMPT },
          { role: "user", content: payload }
        ],
        reasoning: { enabled: true }
      })
    });

    if (!reasoningResponse.ok) {
      const errorData = await reasoningResponse.json();
      throw new Error(`Reasoning Step Failed: ${errorData.error?.message || reasoningResponse.statusText}`);
    }

    const reasoningResult = await reasoningResponse.json();
    const assistantMessage = reasoningResult.choices[0].message;

    // Step 2: Final Structured Analysis (leveraging reasoning_details from Step 1)
    const analysisResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: REASONING_PROMPT },
          { role: "user", content: payload },
          {
            role: "assistant",
            content: assistantMessage.content,
            reasoning_details: assistantMessage.reasoning_details // Pass back unmodified for continuation
          },
          { role: "user", content: EXTRACTION_PROMPT }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.json();
      throw new Error(`Final Analysis Failed: ${errorData.error?.message || analysisResponse.statusText}`);
    }

    const finalData = await analysisResponse.json();
    const contentString = finalData.choices[0].message.content;

    try {
      const result = JSON.parse(contentString);
      // Validate risk_level matches the enum
      if (result.risk_level === 'High Risk') result.risk_level = RiskLevel.HIGH_RISK;
      else if (result.risk_level === 'Suspicious') result.risk_level = RiskLevel.SUSPICIOUS;
      else result.risk_level = RiskLevel.SAFE;

      return result as AnalysisResult;
    } catch (parseError) {
      console.error("Failed to parse AI JSON response:", contentString);
      throw new Error("AI returned malformed JSON analysis.");
    }
  } catch (err: any) {
    console.error("OpenRouter Integration Error:", err);
    throw err;
  }
};
