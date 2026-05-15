import subprocess
import os
import shutil

def clone_and_run(repo_url: str) -> str:

    clone_dir = "temp_repo"

    if os.path.exists(clone_dir):
        shutil.rmtree(clone_dir)

    print(f"Cloning {repo_url}...")
    clone_result = subprocess.run(
        ["git", "clone", repo_url, clone_dir],
        capture_output=True,
        text=True
    )

    if clone_result.returncode != 0:
        return f"ERROR: Git clone failed\n{clone_result.stderr}"

    print("Running npm install inside Docker...")

    docker_command = [
        "docker", "run", "--rm",
        "-v", f"{os.path.abspath(clone_dir)}:/app",
        "-w", "/app",
        "node:18-alpine",
        "npm", "install"
    ]

    result = subprocess.run(
        docker_command,
        capture_output=True,
        text=True
    )

    raw_log = result.stdout + "\n" + result.stderr

    shutil.rmtree(clone_dir)

    return raw_log