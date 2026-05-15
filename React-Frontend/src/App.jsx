import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Zap, Shield, Search, ArrowRight, Play, Cpu, Code, Layers, Globe, Lock, Activity } from 'lucide-react';
import axios from 'axios';
import ThreeCanvas from './components/ThreeCanvas';
import AnalysisModal from './components/AnalysisModal';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="p-6 glass-card group hover:border-cyan-500/50 transition-colors"
  >
    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
      <Icon className="w-6 h-6 text-cyan-400" />
    </div>
    <h3 className="text-lg font-bold mb-2">{title}</h3>
    <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
  </motion.div>
);

const InfoSection = ({ title, subtitle, children, reverse = false }) => (
  <section className={`py-24 flex flex-col md:flex-row items-center gap-16 ${reverse ? 'md:flex-row-reverse' : ''}`}>
    <div className="flex-1">
      <h2 className="text-4xl font-bold mb-6 tracking-tighter">{title}</h2>
      <p className="text-gray-400 text-lg mb-8 leading-relaxed">{subtitle}</p>
      {children}
    </div>
    <div className="flex-1 w-full aspect-video glass-card flex items-center justify-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 group-hover:opacity-20 transition-opacity" />
      <Activity className="w-24 h-24 text-cyan-500/20 group-hover:text-cyan-500/40 transition-all group-hover:scale-110" />
    </div>
  </section>
);

function App() {
  const [user, setUser] = useState(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeRepo, setActiveRepo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/auth/me', { withCredentials: true });
        if (res.data.logged_in) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.log("Not logged in");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    handleAnalyze(repoUrl.trim());
  };

  const handleAnalyze = (url) => {
    setActiveRepo(url);
    setIsModalOpen(true);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen relative overflow-hidden selection:bg-cyan-500/30">
      <ThreeCanvas />

      <Navbar user={user} setUser={setUser} />

      <main className="relative z-10">
        {user ? (
          <Dashboard user={user} onAnalyze={handleAnalyze} />
        ) : (
          <div className="max-w-7xl mx-auto px-8">
            {/* Hero Section */}
            <section className="pt-20 pb-32">
              <div className="max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black mb-8 tracking-widest uppercase"
                >
                  <Zap className="w-3 h-3 fill-cyan-400" />
                  Next-Gen CI Diagnosis Engine
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-10"
                >
                  DETONATE <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">CI BOTTLENECKS.</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-gray-400 mb-14 max-w-2xl leading-relaxed font-medium"
                >
                  Binarybombers is an elite multi-agent AI system designed to dissect, diagnose, and repair failed Docker builds and npm deployments in real-time. Stop hunting through logs; start shipping code.
                </motion.p>

                <motion.form 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onSubmit={handleSubmit}
                  className="relative max-w-2xl group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-focus-within:opacity-70" />
                  <div className="relative flex p-2 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 group-focus-within:border-cyan-500/50 transition-all">
                    <div className="flex items-center pl-4 text-cyan-500/50">
                      <GitBranch className="w-6 h-6" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="github.com/org/failed-repo"
                      className="flex-1 bg-transparent border-none focus:ring-0 text-white px-5 py-4 text-lg placeholder:text-gray-600 font-medium"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                    />
                    <button 
                      type="submit"
                      className="bg-cyan-500 hover:bg-cyan-400 text-black px-10 py-4 rounded-xl font-black text-lg flex items-center gap-2 transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-95"
                    >
                      BOMB IT
                      <ArrowRight className="w-5 h-5 stroke-[3px]" />
                    </button>
                  </div>
                </motion.form>
              </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 border-t border-white/5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard 
                  icon={Search}
                  title="Forensic Log Analysis"
                  description="Our specialized log agent uses pattern recognition to skip irrelevant noise and pinpoint the exact frame of failure."
                />
                <FeatureCard 
                  icon={Cpu}
                  title="Cognitive Root Cause"
                  description="Deep contextual reasoning determines if your failure is a dependency conflict, environment mismatch, or syntax error."
                />
                <FeatureCard 
                  icon={Code}
                  title="Automated Remediation"
                  description="Receive production-ready patches and shell commands to fix your build instantly. No more trial and error."
                />
              </div>
            </section>

            {/* Detailed Sections */}
            <InfoSection 
              id="how-it-works"
              title="The Multi-Agent Pipeline"
              subtitle="Binarybombers employs a sequence of five autonomous agents that collaborate to solve your most complex CI issues."
            >
              <div className="space-y-6">
                <div className="flex gap-4 p-4 glass-card border-l-4 border-cyan-500">
                  <div className="font-black text-cyan-500">01</div>
                  <div>
                    <h4 className="font-bold text-white">Detection Agent</h4>
                    <p className="text-sm text-gray-400">Clones the environment and replicates the failure in an isolated sandbox.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 glass-card border-l-4 border-blue-500">
                  <div className="font-black text-blue-500">02</div>
                  <div>
                    <h4 className="font-bold text-white">Logic Agent</h4>
                    <p className="text-sm text-gray-400">Classifies the error type using a proprietary DevOps knowledge graph.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 glass-card border-l-4 border-purple-500">
                  <div className="font-black text-purple-500">03</div>
                  <div>
                    <h4 className="font-bold text-white">Patch Agent</h4>
                    <p className="text-sm text-gray-400">Generates code-level fixes validated against your specific environment.</p>
                  </div>
                </div>
              </div>
            </InfoSection>

            <InfoSection 
              id="security"
              title="Isolated. Secure. Fast."
              subtitle="Your code security is our priority. Every analysis run happens in a ephemeral, zero-trust environment."
              reverse
            >
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  Containerized Execution Sandboxes
                </li>
                <li className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-cyan-400" />
                  Zero Persistent Storage of Secrets
                </li>
                <li className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  Compatible with Public & Private Repos
                </li>
              </ul>
            </InfoSection>

            {/* Tech Stack */}
            <section className="py-24 text-center border-t border-white/5">
              <h2 className="text-sm font-black text-cyan-500 uppercase tracking-[0.3em] mb-12">Fueled By Innovation</h2>
              <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all">
                <div className="flex items-center gap-2 font-bold text-xl"><Cpu /> REACT</div>
                <div className="flex items-center gap-2 font-bold text-xl"><Layers /> THREE.JS</div>
                <div className="flex items-center gap-2 font-bold text-xl"><Zap /> GEMINI AI</div>
                <div className="flex items-center gap-2 font-bold text-xl"><Code /> FLASK</div>
              </div>
            </section>
          </div>
        )}
      </main>

      <AnalysisModal 
        isOpen={isModalOpen} 
        repoUrl={activeRepo} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-cyan-500 rounded flex items-center justify-center font-bold text-black text-[10px]">B</div>
            <span className="font-bold tracking-tighter uppercase text-sm">Binarybombers</span>
          </div>
          <div className="flex gap-8 text-xs text-gray-500 uppercase tracking-widest font-bold">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
          </div>
          <p className="text-xs text-gray-600 font-medium">
            © 2026 Binarybombers. Explosive Speed. Surgical Precision.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
