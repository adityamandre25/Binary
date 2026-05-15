import os
from dotenv import load_dotenv
from Agents.log_analysis_agent import analyze_log
from Agents.docker_runner import clone_and_run

load_dotenv()

def main():
    print("=== AutoPilot CI ===\n")

    repo_url = input("Enter GitHub repo URL: ").strip()

    print("\n[Cloning repo and running Docker...]\n")
    raw_log = clone_and_run(repo_url)

    print("\n[Docker finished. Sending logs to Agent 1 — Gemini...]\n")
    result = analyze_log(raw_log)

    print("=" * 50)
    print("AGENT 1 OUTPUT")
    print("=" * 50)
    print(f"Failed Step  : {result['failed_step']}")
    print(f"Exit Code    : {result['exit_code']}")
    print(f"Summary      : {result['error_summary']}")
    print(f"\nKey Error Lines:")
    for line in result['error_lines']:
        print(f"  → {line}")
    print("=" * 50)

    shared_context = {
        "repo_url": repo_url,
        "agent1_output": result
    }

    return shared_context

if __name__ == "__main__":
    main()