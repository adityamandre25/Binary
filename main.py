import os
import json
import time
import sqlite3
from flask import Flask, Response, request, send_from_directory, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv

from Backend.Agents.log_analysis_agent import analyze_log
from Backend.Agents.clasification_agent import classify_error
from Backend.Agents.root_cause_agent import find_root_cause
from Backend.Agents.patch_agent import generate_patch
from Backend.Agents.validaion_agent import validate_fix
from Backend.docker_runner import clone_and_run

load_dotenv()

app = Flask(__name__, static_folder='React-Frontend/dist', static_url_path='')
app.secret_key = 'binarybombers_secret_key'
CORS(app, supports_credentials=True)

DB_PATH = 'binarybombers.db'

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

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# --- AUTH ENDPOINTS ---

@app.route('/api/auth/github', methods=['POST'])
def mock_github_auth():
    # In a real app, this would exchange code for token
    # For now, we simulate a successful login
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
    
    session['user_id'] = user_id
    session['username'] = user_data['username']
    
    return jsonify({"success": True, "user": user_data})

@app.route('/api/auth/me')
def get_me():
    if 'user_id' not in session:
        return jsonify({"logged_in": False}), 401
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT github_id, username, avatar_url FROM users WHERE id = ?", (session['user_id'],))
    user = c.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            "logged_in": True,
            "user": {"github_id": user[0], "username": user[1], "avatar_url": user[2]}
        })
    return jsonify({"logged_in": False}), 401

@app.route('/api/auth/logout')
def logout():
    session.clear()
    return jsonify({"success": True})

# --- DATA ENDPOINTS ---

@app.route('/api/user/repos')
def get_user_repos():
    # Mock repositories - in a real app, fetch from GitHub API using user's token
    mock_repos = [
        {"name": "broken-react-app", "url": "https://github.com/example/broken-react-app", "language": "JavaScript"},
        {"name": "failed-python-api", "url": "https://github.com/example/failed-python-api", "language": "Python"},
        {"name": "docker-build-fail", "url": "https://github.com/example/docker-build-fail", "language": "Dockerfile"},
        {"name": "legacy-auth-system", "url": "https://github.com/example/legacy-auth-system", "language": "Java"}
    ]
    return jsonify(mock_repos)

@app.route('/api/user/history')
def get_user_history():
    if 'user_id' not in session:
        return jsonify([]), 401
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT repo_url, timestamp, results FROM history WHERE user_id = ? ORDER BY timestamp DESC", 
              (session['user_id'],))
    rows = c.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        history.append({
            "repo_url": row[0],
            "timestamp": row[1],
            "results": json.loads(row[2])
        })
    return jsonify(history)

# --- ANALYSIS ENDPOINT ---

@app.route('/api/analyze', methods=['GET'])
def analyze():
    repo_url = request.args.get('repo_url')
    user_id = session.get('user_id') # Can be None if not logged in
    
    if not repo_url:
        return jsonify({"error": "Missing repo_url parameter"}), 400

    def generate():
        final_results = {}
        try:
            yield f"data: {json.dumps({'step': 'init', 'message': f'Cloning {repo_url} and running Docker...'})}\n\n"
            
            raw_log = clone_and_run(repo_url)
            
            yield f"data: {json.dumps({'step': 'agent1', 'message': 'Agent 1 — Analyzing logs...'})}\n\n"
            agent1 = analyze_log(raw_log)
            final_results['agent1'] = agent1
            yield f"data: {json.dumps({'step': 'agent1_done', 'data': agent1})}\n\n"
            time.sleep(1)

            yield f"data: {json.dumps({'step': 'agent2', 'message': 'Agent 2 — Classifying failure...'})}\n\n"
            agent2 = classify_error(agent1)
            final_results['agent2'] = agent2
            yield f"data: {json.dumps({'step': 'agent2_done', 'data': agent2})}\n\n"
            time.sleep(1)

            yield f"data: {json.dumps({'step': 'agent3', 'message': 'Agent 3 — Finding root cause...'})}\n\n"
            agent3 = find_root_cause(agent1, agent2)
            final_results['agent3'] = agent3
            yield f"data: {json.dumps({'step': 'agent3_done', 'data': agent3})}\n\n"
            time.sleep(1)

            yield f"data: {json.dumps({'step': 'agent4', 'message': 'Agent 4 — Generating patch...'})}\n\n"
            agent4 = generate_patch(agent1, agent2, agent3)
            final_results['agent4'] = agent4
            yield f"data: {json.dumps({'step': 'agent4_done', 'data': agent4})}\n\n"
            time.sleep(1)

            yield f"data: {json.dumps({'step': 'agent5', 'message': 'Agent 5 — Validating fix...'})}\n\n"
            agent5 = validate_fix(agent1, agent3, agent4)
            final_results['agent5'] = agent5
            yield f"data: {json.dumps({'step': 'agent5_done', 'data': agent5})}\n\n"

            # Save to history if user is logged in
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

    return Response(generate(), mimetype='text/event-stream')

if __name__ == "__main__":
    print("Starting Binarybombers Node on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)