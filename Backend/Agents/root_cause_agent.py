from google import genai
import json
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

def find_root_cause(agent1_output: dict, agent2_output: dict) -> dict:

    prompt = """You are a senior DevOps engineer doing root cause analysis.
You will receive a CI/CD failure summary and its category.
Think step by step and return a JSON object with exactly these fields:
{
  "root_cause": "one clear sentence describing the exact root cause",
  "affected_file": "the file or dependency that caused the issue, or unknown",
  "explanation": "2-3 sentences explaining what went wrong and why"
}
Rules:
- Be specific — name the exact file, package, or config that broke
- Return ONLY the JSON. No markdown. No backticks. No explanation.

Failure category: """ + agent2_output["failure_category"] + """
Confidence: """ + str(agent2_output["confidence_score"]) + """
Error summary: """ + agent1_output["error_summary"] + """
Error lines:
""" + "\n".join(agent1_output["error_lines"])

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
            "root_cause": "Could not determine root cause",
            "affected_file": "unknown",
            "explanation": "Could not parse Gemini response"
        }

    return result