from google import genai
import json
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

def generate_patch(agent1_output: dict, agent2_output: dict, agent3_output: dict) -> dict:

    prompt = """You are a senior software engineer generating a fix for a CI/CD failure.
You will receive the failure analysis and root cause.
Generate a concrete fix and return a JSON object with exactly these fields:
{
  "fix_description": "one sentence describing what needs to be changed",
  "fix_type": "one of: code_change, config_change, dependency_update, env_variable, docker_fix",
  "fix_steps": ["step 1", "step 2", "step 3"],
  "code_snippet": "the exact code or command to run, or null if not applicable"
}
Rules:
- fix_steps must be clear actionable steps a developer can follow
- code_snippet should be the exact fix — a diff, command, or code block
- Return ONLY the JSON. No markdown. No backticks. No explanation.

Root cause: """ + agent3_output["root_cause"] + """
Affected file: """ + agent3_output["affected_file"] + """
Explanation: """ + agent3_output["explanation"] + """
Failure category: """ + agent2_output["failure_category"]

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
            "fix_description": "Could not generate fix",
            "fix_type": "unknown",
            "fix_steps": [],
            "code_snippet": None
        }

    return result