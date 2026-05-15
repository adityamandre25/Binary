import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, History, ExternalLink, ArrowRight, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import axios from 'axios';

const RepoCard = ({ repo, onAnalyze }) => (
  <div className="p-5 glass-card border-white/5 hover:border-cyan-500/30 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h4 className="font-bold text-white text-lg group-hover:text-cyan-400 transition-colors">{repo.name}</h4>
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{repo.language}</span>
      </div>
      <GitBranch className="text-gray-600 group-hover:text-cyan-500/50 transition-colors" />
    </div>
    <div className="flex gap-2">
      <button 
        onClick={() => onAnalyze(repo.url)}
        className="flex-1 bg-white/5 hover:bg-cyan-500/10 text-white text-xs font-bold py-2 rounded-lg transition-all border border-white/5 hover:border-cyan-500/20"
      >
        ANALYSIS
      </button>
      <a 
        href={repo.url} target="_blank" rel="noreferrer"
        className="px-3 bg-white/5 hover:bg-white/10 flex items-center justify-center rounded-lg border border-white/5"
      >
        <ExternalLink className="w-3 h-3 text-gray-400" />
      </a>
    </div>
  </div>
);

const HistoryItem = ({ item }) => {
  const verdict = item.results.agent5?.verdict;
  const timestamp = new Date(item.timestamp).toLocaleString();

  return (
    <div className="flex items-center gap-6 p-4 glass rounded-xl border-white/5 hover:bg-white/5 transition-colors">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${verdict === 'PASS' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
        {verdict === 'PASS' ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-gray-200 truncate">{item.repo_url}</h4>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-1">
          <Clock className="w-3 h-3" />
          {timestamp}
        </div>
      </div>
      <div className="text-right">
        <div className={`text-[10px] font-black uppercase tracking-widest ${verdict === 'PASS' ? 'text-green-500' : 'text-red-500'}`}>
          {verdict || 'UNKNOWN'}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard({ user, onAnalyze }) {
  const [repos, setRepos] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repoRes, historyRes] = await Promise.all([
          axios.get('http://localhost:8000/api/user/repos'),
          axios.get('http://localhost:8000/api/user/history', { withCredentials: true })
        ]);
        setRepos(repoRes.data);
        setHistory(historyRes.data);
      } catch (err) {
        console.error("Fetch data failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-8 pb-32"
    >
      <header className="mb-12">
        <h2 className="text-4xl font-black tracking-tighter text-white uppercase mb-2">Operation Dashboard</h2>
        <p className="text-gray-500 font-medium italic">Welcome back, Agent {user.username}. Select a target for detonation.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Recent Repos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-cyan-500 uppercase tracking-[0.3em]">Recent Repositories</h3>
            <div className="h-[1px] flex-1 bg-white/5 ml-6" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {repos.map(repo => (
              <RepoCard key={repo.name} repo={repo} onAnalyze={onAnalyze} />
            ))}
          </div>
        </div>

        {/* History */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-purple-500 uppercase tracking-[0.3em]">Neural History</h3>
            <div className="h-[1px] flex-1 bg-white/5 ml-6" />
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {history.length > 0 ? (
              history.map((item, idx) => (
                <HistoryItem key={idx} item={item} />
              ))
            ) : (
              <div className="text-center py-12 glass rounded-2xl border-white/5">
                <p className="text-xs text-gray-600 uppercase font-bold tracking-widest">No Previous Logs Found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
