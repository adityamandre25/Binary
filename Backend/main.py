import os
from dotenv import load_dotenv
from Agents.log_analysis_agent import analyze_log
from Agents.clasification_agent import classify_error
from Agents.root_cause_agent import find_root_cause
from Agents.patch_agent import generate_patch
from Agents.validaion_agent import validate_fix
from docker_runner import clone_and_run

load_dotenv()

def main():
    print("=== AutoPilot CI ===\n")

    repo_url = input("Enter GitHub repo URL: ").strip()

    print("\n[Cloning repo and running Docker...]\n")
    raw_log = clone_and_run(repo_url)

    print("[Agent 1 — Analyzing logs...]\n")
    agent1 = analyze_log(raw_log)
    print(f"  Summary      : {agent1['error_summary']}")
    print(f"  Failed Step  : {agent1['failed_step']}")
    print(f"  Exit Code    : {agent1['exit_code']}\n")

    print("[Agent 2 — Classifying failure...]\n")
    agent2 = classify_error(agent1)
    print(f"  Category     : {agent2['failure_category']}")
    print(f"  Confidence   : {agent2['confidence_score']}%")
    print(f"  Reasoning    : {agent2['reasoning']}\n")

    print("[Agent 3 — Finding root cause...]\n")
    agent3 = find_root_cause(agent1, agent2)
    print(f"  Root Cause   : {agent3['root_cause']}")
    print(f"  Affected File: {agent3['affected_file']}")
    print(f"  Explanation  : {agent3['explanation']}\n")

    print("[Agent 4 — Generating patch...]\n")
    agent4 = generate_patch(agent1, agent2, agent3)
    print(f"  Fix          : {agent4['fix_description']}")
    print(f"  Fix Type     : {agent4['fix_type']}")
    print(f"  Steps:")
    for step in agent4['fix_steps']:
        print(f"    → {step}")
    if agent4['code_snippet']:
        print(f"  Code:\n{agent4['code_snippet']}\n")

    print("[Agent 5 — Validating fix...]\n")
    agent5 = validate_fix(agent1, agent3, agent4)
    print(f"  Verdict      : {agent5['verdict']}")
    print(f"  Confidence   : {agent5['confidence_score']}%")
    print(f"  Reasoning    : {agent5['reasoning']}")
    if agent5['escalate_to_human'] == "true":
        print("\n  ⚠️  ESCALATING TO HUMAN — confidence too low")

    print("\n" + "=" * 50)
    print("DIAGNOSIS COMPLETE")
    print("=" * 50)

    shared_context = {
        "repo_url": repo_url,
        "agent1": agent1,
        "agent2": agent2,
        "agent3": agent3,
        "agent4": agent4,
        "agent5": agent5
    }

    return shared_context

if __name__ == "__main__":
    main()