from google import genai
import json
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

client = genai.Client(api_key=api_key)

def analyze_log(raw_log: str) -> dict:

    prompt = """You are a CI/CD log analysis expert.
You will receive a raw terminal log from a Docker build or npm install.
Extract only what matters and return a JSON object with exactly these fields:
{
  "error_lines": ["line1", "line2", ...],
  "error_summary": "one plain English sentence describing what broke",
  "failed_step": "which step failed",
  "exit_code": "the exit code as a string"
}
Rules:
- error_lines: 5-10 lines max that actually explain the failure
- Look for: error, Error, ERROR, exit codes, stack traces, missing modules
- Ignore: progress bars, download percentages, warnings
- Return ONLY the JSON. No markdown. No backticks. No explanation.

Log:
""" + raw_log

    response = client.models.generate_content(
        model="gemini-2.0-flash-lite",
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
            "error_lines": [raw_response],
            "error_summary": "Could not parse Gemini response",
            "failed_step": "unknown",
            "exit_code": "unknown"
        }

    return result