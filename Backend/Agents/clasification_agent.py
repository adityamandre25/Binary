from google import genai
import json
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

def classify_error(agent1_output: dict) -> dict:

    prompt = """You are a CI/CD failure classification expert.
You will receive a summary of a CI/CD failure.
Classify it and return a JSON object with exactly these fields:
{
  "failure_category": "one of: dependency_error, env_mismatch, test_failure, config_error, docker_error, unknown",
  "confidence_score": "a number from 1-100 showing how confident you are",
  "reasoning": "one sentence explaining why you chose this category"
}
Rules:
- Pick exactly one category from the list
- confidence_score must be a number not a string
- Return ONLY the JSON. No markdown. No backticks. No explanation.

Failure summary: """ + agent1_output["error_summary"] + """
Failed step: """ + agent1_output["failed_step"] + """
Error lines: """ + "\n".join(agent1_output["error_lines"])

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
            "failure_category": "unknown",
            "confidence_score": 0,
            "reasoning": "Could not parse Gemini response"
        }

    return result