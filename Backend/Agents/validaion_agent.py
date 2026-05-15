from google import genai
import json
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

def validate_fix(agent1_output: dict, agent3_output: dict, agent4_output: dict) -> dict:

    prompt = """You are a senior QA engineer validating whether a proposed fix will resolve a CI/CD failure.
Analyze the fix against the root cause and return a JSON object with exactly these fields:
{
  "verdict": "PASS or FAIL",
  "confidence_score": "a number from 1-100",
  "reasoning": "2-3 sentences explaining why this fix will or will not work",
  "escalate_to_human": "true or false — true if confidence is below 60"
}
Rules:
- verdict must be exactly PASS or FAIL
- escalate_to_human must be true if confidence_score is below 60
- Return ONLY the JSON. No markdown. No backticks. No explanation.

Original error: """ + agent1_output["error_summary"] + """
Root cause: """ + agent3_output["root_cause"] + """
Proposed fix: """ + agent4_output["fix_description"] + """
Fix steps: """ + "\n".join(agent4_output["fix_steps"])

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    raw_response = response.text.strip()

    if raw_response.startswith("```"):
        raw_response = raw_response.split("```")[1]
        if raw_response.startswith("json"):
            raw_response = raw_response[4:]
    raw_response = raw_response.strip()

    try:
        result = json.loads(raw_response)
    except json.JSONDecodeError:
        result = {
            "verdict": "FAIL",
            "confidence_score": 0,
            "reasoning": "Could not parse Gemini response",
            "escalate_to_human": "true"
        }

    return result