import os
import json
import asyncio
import sqlite3
from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional

from Agents.log_analysis_agent import analyze_log
from Agents.clasification_agent import classify_error
from Agents.root_cause_agent import find_root_cause
from Agents.patch_agent import generate_patch
from Agents.validaion_agent import validate_fix
from docker_runner import clone_and_run

load_dotenv()

app = FastAPI()

# Security: In a real app, use a proper session management library
# For this demo, we'll use a simple cookie-based mock
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5175", "http://127.0.0.1:5175"], # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = '../binarybombers.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (id INTEGER PRIMARY KEY, github_id TEXT, username TEXT, avatar_url TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS history 
                 (id INTEGER PRIMARY KEY, user_id INTEGER, repo_url TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, 
                  results TEXT)''')
    conn.commit()
    conn.close()

init_db()

class User(BaseModel):
    github_id: str
    username: str
    avatar_url: str

def get_current_user_id(request: Request):
    user_id = request.cookies.get("user_id")
    return int(user_id) if user_id else None

# --- AUTH ENDPOINTS ---

@app.post("/api/auth/github")
async def mock_github_auth(response: Response):
    user_data = {
        "github_id": "12345",
        "username": "BinaryExplorer",
        "avatar_url": "https://avatars.githubusercontent.com/u/9919?v=4"
    }
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE github_id = ?", (user_data['github_id'],))
    user = c.fetchone()
    
    if not user:
        c.execute("INSERT INTO users (github_id, username, avatar_url) VALUES (?, ?, ?)",
                  (user_data['github_id'], user_data['username'], user_data['avatar_url']))
        user_id = c.lastrowid
    else:
        user_id = user[0]
    
    conn.commit()
    conn.close()
    
    response.set_cookie(key="user_id", value=str(user_id), httponly=True, samesite="lax")
    return {"success": True, "user": user_data}

@app.get("/api/auth/me")
async def get_me(user_id: Optional[int] = Depends(get_current_user_id)):
    if not user_id:
        return {"logged_in": False}
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT github_id, username, avatar_url FROM users WHERE id = ?", (user_id,))
    user = c.fetchone()
    conn.close()
    
    if user:
        return {
            "logged_in": True,
            "user": {"github_id": user[0], "username": user[1], "avatar_url": user[2]}
        }
    return {"logged_in": False}

@app.get("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie("user_id")
    return {"success": True}

# --- DATA ENDPOINTS ---

@app.get("/api/user/repos")
async def get_user_repos():
    mock_repos = [
        {"name": "broken-react-app", "url": "https://github.com/example/broken-react-app", "language": "JavaScript"},
        {"name": "failed-python-api", "url": "https://github.com/example/failed-python-api", "language": "Python"},
        {"name": "docker-build-fail", "url": "https://github.com/example/docker-build-fail", "language": "Dockerfile"},
        {"name": "legacy-auth-system", "url": "https://github.com/example/legacy-auth-system", "language": "Java"}
    ]
    return mock_repos

@app.get("/api/user/history")
async def get_user_history(user_id: Optional[int] = Depends(get_current_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT repo_url, timestamp, results FROM history WHERE user_id = ? ORDER BY timestamp DESC", 
              (user_id,))
    rows = c.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        history.append({
            "repo_url": row[0],
            "timestamp": row[1],
            "results": json.loads(row[2])
        })
    return history

# --- ANALYSIS ENDPOINT (SSE) ---

@app.get("/api/analyze")
async def analyze(repo_url: str, user_id: Optional[int] = Depends(get_current_user_id)):
    async def event_generator():
        final_results = {}
        try:
            yield f"data: {json.dumps({'step': 'init', 'message': f'Cloning {repo_url} and running Docker...'})}\n\n"
            
            # Running synchronous code in a thread to not block the event loop
            raw_log = await asyncio.to_thread(clone_and_run, repo_url)
            
            yield f"data: {json.dumps({'step': 'agent1', 'message': 'Agent 1 — Analyzing logs...'})}\n\n"
            agent1 = await asyncio.to_thread(analyze_log, raw_log)
            final_results['agent1'] = agent1
            yield f"data: {json.dumps({'step': 'agent1_done', 'data': agent1})}\n\n"
            await asyncio.sleep(1)

            yield f"data: {json.dumps({'step': 'agent2', 'message': 'Agent 2 — Classifying failure...'})}\n\n"
            agent2 = await asyncio.to_thread(classify_error, agent1)
            final_results['agent2'] = agent2
            yield f"data: {json.dumps({'step': 'agent2_done', 'data': agent2})}\n\n"
            await asyncio.sleep(1)

            yield f"data: {json.dumps({'step': 'agent3', 'message': 'Agent 3 — Finding root cause...'})}\n\n"
            agent3 = await asyncio.to_thread(find_root_cause, agent1, agent2)
            final_results['agent3'] = agent3
            yield f"data: {json.dumps({'step': 'agent3_done', 'data': agent3})}\n\n"
            await asyncio.sleep(1)

            yield f"data: {json.dumps({'step': 'agent4', 'message': 'Agent 4 — Generating patch...'})}\n\n"
            agent4 = await asyncio.to_thread(generate_patch, agent1, agent2, agent3)
            final_results['agent4'] = agent4
            yield f"data: {json.dumps({'step': 'agent4_done', 'data': agent4})}\n\n"
            await asyncio.sleep(1)

            yield f"data: {json.dumps({'step': 'agent5', 'message': 'Agent 5 — Validating fix...'})}\n\n"
            agent5 = await asyncio.to_thread(validate_fix, agent1, agent3, agent4)
            final_results['agent5'] = agent5
            yield f"data: {json.dumps({'step': 'agent5_done', 'data': agent5})}\n\n"

            if user_id:
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute("INSERT INTO history (user_id, repo_url, results) VALUES (?, ?, ?)",
                          (user_id, repo_url, json.dumps(final_results)))
                conn.commit()
                conn.close()

            yield f"data: {json.dumps({'step': 'complete', 'message': 'Diagnosis complete!'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'step': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
