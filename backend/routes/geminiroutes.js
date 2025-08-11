const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced summarize endpoint
router.post("/summarize", async (req, res) => {
  try {
    const { fileName, content } = req.body;
    
    const prompt = `Analyze the ${fileName} code below and provide:

1. A concise 2-3 sentence functional summary
2. Recommended testing framework (Jest, Mocha, pytest, etc.)
3. 3-5 specific test scenarios covering core functionality and edge cases
4. Estimated number of tests needed

Respond ONLY with a valid JSON object in this exact format:
{
  "summary": "...",
  "framework": "...",
  "testScenarios": ["...", "...", "..."],
  "estimatedTests": number
}

Do not include any extra text, comments, or markdown.

Code:\n\n${content}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse the response to extract JSON
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const jsonResponse = JSON.parse(text.slice(jsonStart, jsonEnd));

    res.json({
      summary: jsonResponse.summary,
      framework: jsonResponse.framework,
      testScenarios: jsonResponse.testScenarios,
      estimatedTests: jsonResponse.estimatedTests
    });

  } catch (err) {
    console.error("Gemini summarize error:", err);
    res.status(500).json({ error: "Failed to generate test summary" });
  }
});

// Enhanced test generation endpoint
router.post("/generate-tests", async (req, res) => {
  try {
    const { fileName, content, framework, testScenarios } = req.body;
    
    const prompt = `Generate complete test code for ${fileName} using ${framework} based on these scenarios:
${testScenarios.join('\n- ')}

Requirements:
1. Include all necessary imports and setup
2. Cover all specified scenarios
3. Add clear test descriptions
4. Include edge case handling
5. Output only the test code with no additional explanations

Original code:\n\n${content}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const testCode = result.response.text();

    res.json({ testCode });

  } catch (err) {
    console.error("Gemini test generation error:", err);
    res.status(500).json({ error: "Failed to generate test code" });
  }
});

module.exports = router;