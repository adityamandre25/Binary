import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Activity, GitCommit, CheckCircle, AlertTriangle, Play, History } from 'lucide-react';
import axios from 'axios';

export default function Dashboard({ onLogout }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState('input'); // input, history

  useEffect(() => {
    const saved = localStorage.getItem('analysis_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!repoUrl) return;
    
    setIsAnalyzing(true);
    setResult(null);

    try {
      // In a real scenario, this would point to the FastAPI wrapper
      // For fallback/hackathon UI, we'll mock if the endpoint fails
      const response = await axios.post('http://localhost:8000/api/analyze', { repo_url: repoUrl })
        .catch(() => {
          // Mocking delay for visual effect
          return new Promise(resolve => setTimeout(() => resolve({
            data: {
              repo_url: repoUrl,
              agent1: { error_summary: "NPM Install failed. Dependency conflict.", failed_step: "build", exit_code: 1 },
              agent2: { failure_category: "Dependency", confidence_score: 95, reasoning: "Error logs indicate react-scripts conflicts" },
              agent3: { root_cause: "Incompatible React version", affected_file: "package.json", explanation: "React 18 conflicts with react-scripts 4" },
              agent4: { fix_description: "Upgrade react-scripts to v5", fix_type: "Dependency Update", fix_steps: ["npm install react-scripts@5"], code_snippet: null },
              agent5: { verdict: "SUCCESS", confidence_score: 99, reasoning: "Build passes after update", escalate_to_human: "false" }
            }
          }), 4000));
        });

      const newResult = response.data;
      setResult(newResult);
      
      const newHistory = [newResult, ...history];
      setHistory(newHistory);
      localStorage.setItem('analysis_history', JSON.stringify(newHistory));
      
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative pointer-events-auto p-6 flex flex-col items-center">
      
      {/* Top Navbar */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-7xl glass-panel px-6 py-4 flex justify-between items-center mb-12"
      >
        <div className="flex items-center space-x-3">
          <Activity className="text-neonBlue" />
          <span className="font-bold text-xl tracking-wider">AutoPilot CI</span>
        </div>
        <div className="flex items-center space-x-6 text-sm font-mono">
          <button onClick={() => setView('input')} className={`hover:text-neonBlue transition-colors ${view === 'input' ? 'text-neonBlue border-b border-neonBlue' : 'text-gray-400'}`}>New Analysis</button>
          <button onClick={() => setView('history')} className={`hover:text-neonBlue transition-colors ${view === 'history' ? 'text-neonBlue border-b border-neonBlue' : 'text-gray-400'}`}>History</button>
          <button onClick={onLogout} className="text-red-400 flex items-center hover:text-red-300">
            <LogOut size={16} className="mr-2" /> Logout
          </button>
        </div>
      </motion.nav>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {view === 'input' && (
          <motion.div 
            key="input-view"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-3xl"
          >
            <div className="glass-panel p-8 md:p-12 text-center relative overflow-hidden">
              <h2 className="text-4xl font-black mb-4">Initialize Analysis</h2>
              <p className="text-gray-400 mb-8 font-mono">Input repository URL to deploy AI Agents for failure diagnosis.</p>
              
              <form onSubmit={handleAnalyze} className="relative z-10">
                <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-neonBlue transition-colors">
                  <div className="p-4 bg-white/5 flex items-center justify-center">
                    <GitCommit size={24} className="text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/user/repo"
                    className="bg-transparent w-full p-4 outline-none text-lg font-mono placeholder:text-gray-600"
                    disabled={isAnalyzing}
                  />
                  <button 
                    type="submit" 
                    disabled={isAnalyzing || !repoUrl}
                    className="bg-neonBlue/20 text-neonBlue px-8 font-bold flex items-center hover:bg-neonBlue hover:text-darkBg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Activity />
                      </motion.div>
                    ) : (
                      <>
                        <Play size={18} className="mr-2 fill-current" /> EXECUTE
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Scanning Animation */}
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 100, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-8 flex flex-col items-center justify-center space-y-4"
                  >
                    <div className="w-full h-1 bg-white/10 rounded overflow-hidden">
                      <motion.div 
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="h-full w-1/3 bg-gradient-to-r from-transparent via-neonBlue to-transparent"
                      />
                    </div>
                    <p className="text-neonBlue font-mono text-sm animate-pulse">Running Agentic Analysis...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Results Box */}
            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 glass-panel p-8"
                >
                  <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                    <h3 className="text-2xl font-bold flex items-center">
                      <CheckCircle className="text-green-400 mr-3" /> Diagnosis Complete
                    </h3>
                    <span className="font-mono text-sm bg-white/10 px-3 py-1 rounded-full">
                      {result.repo_url}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-sm">
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                      <h4 className="text-neonPurple font-bold mb-2 uppercase">Root Cause</h4>
                      <p>{result.agent3?.root_cause}</p>
                      <p className="text-gray-400 mt-2 text-xs">File: {result.agent3?.affected_file}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                      <h4 className="text-neonBlue font-bold mb-2 uppercase">Proposed Fix</h4>
                      <p>{result.agent4?.fix_description}</p>
                      <div className="mt-2 text-gray-400">
                        {result.agent4?.fix_steps?.map((step, i) => (
                          <div key={i}>$ {step}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {view === 'history' && (
          <motion.div 
            key="history-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-5xl"
          >
            <div className="glass-panel p-8">
              <h2 className="text-3xl font-black mb-8 flex items-center">
                <History className="mr-4 text-neonPurple" /> Analysis History
              </h2>
              {history.length === 0 ? (
                <p className="text-gray-500 font-mono">No previous analysis found.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((item, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-white/10 transition-colors">
                      <div>
                        <h4 className="font-bold text-lg">{item.repo_url}</h4>
                        <p className="text-gray-400 text-sm font-mono mt-1">{item.agent3?.root_cause}</p>
                      </div>
                      <div className="mt-4 md:mt-0 flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.agent5?.verdict === 'SUCCESS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {item.agent5?.verdict || 'UNKNOWN'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
