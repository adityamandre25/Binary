import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, Terminal, Cpu, FileCode, Search, ShieldCheck, X } from 'lucide-react';

const StepIcon = ({ step, active, done }) => {
  if (done) return <CheckCircle2 className="w-5 h-5 text-cyan-400" />;
  if (active) return <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />;
  
  const icons = {
    init: <Terminal className="w-5 h-5" />,
    agent1: <Search className="w-5 h-5" />,
    agent2: <Cpu className="w-5 h-5" />,
    agent3: <AlertCircle className="w-5 h-5" />,
    agent4: <FileCode className="w-5 h-5" />,
    agent5: <ShieldCheck className="w-5 h-5" />,
  };
  return <div className="text-gray-500">{icons[step] || <Terminal className="w-5 h-5" />}</div>;
};

export default function AnalysisModal({ isOpen, repoUrl, onClose }) {
  const [steps, setSteps] = useState({
    init: { status: 'pending', message: 'Detonating isolated sandbox...' },
    agent1: { status: 'pending', message: 'Forensic Log Analysis Agent' },
    agent2: { status: 'pending', message: 'Binary Failure Classifier Agent' },
    agent3: { status: 'pending', message: 'Root Cause Extraction Agent' },
    agent4: { status: 'pending', message: 'Remediation & Patch Agent' },
    agent5: { status: 'pending', message: 'Final Payload Validation Agent' },
  });
  const [results, setResults] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !repoUrl) return;

    // Reset state for new run
    setResults({});
    setError(null);
    setSteps({
      init: { status: 'pending', message: 'Detonating isolated sandbox...' },
      agent1: { status: 'pending', message: 'Forensic Log Analysis Agent' },
      agent2: { status: 'pending', message: 'Binary Failure Classifier Agent' },
      agent3: { status: 'pending', message: 'Root Cause Extraction Agent' },
      agent4: { status: 'pending', message: 'Remediation & Patch Agent' },
      agent5: { status: 'pending', message: 'Final Payload Validation Agent' },
    });

    const eventSource = new EventSource(`http://localhost:8000/api/analyze?repo_url=${encodeURIComponent(repoUrl)}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.step === 'error') {
        setError(data.message);
        eventSource.close();
        return;
      }

      if (data.step === 'complete') {
        eventSource.close();
        return;
      }

      if (data.step.endsWith('_done')) {
        const stepName = data.step.replace('_done', '');
        setSteps(prev => ({
          ...prev,
          [stepName]: { ...prev[stepName], status: 'done' }
        }));
        setResults(prev => ({ ...prev, [stepName]: data.data }));
      } else {
        setSteps(prev => ({
          ...prev,
          [data.step]: { ...prev[data.step], status: 'active', message: data.message }
        }));
      }
    };

    eventSource.onerror = () => {
      setError("Connection to Binarybombers node lost.");
      eventSource.close();
    };

    return () => eventSource.close();
  }, [isOpen, repoUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-5xl max-h-[90vh] glass-card overflow-hidden flex flex-col border-white/10 shadow-[0_0_50px_rgba(6,182,212,0.1)]"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-start bg-gradient-to-r from-cyan-500/5 to-transparent">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Binarybombers Analysis</h2>
            </div>
            <p className="text-sm text-gray-500 font-mono truncate max-w-md">{repoUrl}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Progress List */}
          <div className="w-full md:w-1/3 p-8 border-r border-white/5 overflow-y-auto bg-black/20">
            <h3 className="text-[10px] font-black text-cyan-500/50 uppercase tracking-[0.3em] mb-8">Pipeline Sequence</h3>
            <div className="space-y-8">
              {Object.entries(steps).map(([key, step]) => (
                <div key={key} className={`flex items-start gap-4 transition-all duration-500 ${step.status === 'pending' ? 'opacity-20 grayscale' : 'opacity-100'}`}>
                  <div className="relative">
                    <StepIcon step={key} active={step.status === 'active'} done={step.status === 'done'} />
                    {key !== 'agent5' && (
                      <div className={`absolute top-8 left-1/2 -translate-x-1/2 w-[1px] h-8 ${step.status === 'done' ? 'bg-cyan-500/50' : 'bg-white/5'}`} />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-tight ${step.status === 'active' ? 'text-cyan-400' : 'text-white'}`}>{step.message}</h3>
                    {step.status === 'active' && <p className="text-[10px] text-cyan-500/60 font-mono mt-1">Executing AI logic...</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Result Panel */}
          <div className="flex-1 p-8 font-mono text-xs overflow-y-auto bg-black/40">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-gray-500 uppercase tracking-[0.3em] text-[10px]">Neural Output Stream</h3>
              {error && <div className="text-red-400 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> Error detected</div>}
            </div>
            
            <AnimatePresence>
              {error ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded bg-red-500/10 border border-red-500/20 text-red-400">
                  {error}
                </motion.div>
              ) : Object.keys(results).length === 0 ? (
                <div className="text-gray-700 flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center animate-spin">
                    <div className="w-1 h-1 rounded-full bg-cyan-500" />
                  </div>
                  Waiting for data stream...
                </div>
              ) : (
                <div className="space-y-10">
                  {Object.entries(results).map(([agent, data]) => (
                    <motion.div 
                      key={agent} 
                      initial={{ opacity: 0, x: 10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      className="group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500 text-[10px] font-black uppercase">{agent}</div>
                        <div className="h-[1px] flex-1 bg-white/5" />
                      </div>
                      
                      <div className="pl-4 border-l border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
                        {agent === 'agent1' && (
                          <div className="text-gray-300 space-y-2">
                            <p className="text-white font-bold">{data.error_summary}</p>
                            <div className="flex gap-4 opacity-70">
                              <span className="text-cyan-500">FAILED_STEP:</span>
                              <span className="text-gray-400">{data.failed_step}</span>
                            </div>
                          </div>
                        )}
                        {agent === 'agent2' && (
                          <div className="text-gray-300 space-y-2">
                            <p>FAILURE_CATEGORY: <span className="text-cyan-400 font-bold">{data.failure_category}</span></p>
                            <p>CONFIDENCE_LEVEL: {data.confidence_score}%</p>
                          </div>
                        )}
                        {agent === 'agent3' && (
                          <div className="text-gray-300 space-y-3">
                            <p className="text-white bg-white/5 p-2 rounded">{data.root_cause}</p>
                            <p className="text-gray-400 leading-relaxed italic">{data.explanation}</p>
                          </div>
                        )}
                        {agent === 'agent4' && (
                          <div className="text-gray-300 space-y-4">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                              <p className="text-green-400 font-bold">{data.fix_description}</p>
                            </div>
                            {data.code_snippet && (
                              <div className="relative group/code">
                                <div className="absolute -top-3 right-4 px-2 py-0.5 bg-gray-800 rounded text-[8px] text-gray-500 uppercase tracking-widest">Patch Code</div>
                                <pre className="bg-black/80 p-4 rounded-xl border border-white/10 overflow-x-auto text-[10px] text-cyan-300 leading-relaxed shadow-2xl">
                                  {data.code_snippet}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                        {agent === 'agent5' && (
                          <div className={`p-4 rounded-xl border flex items-start gap-4 ${data.verdict === 'PASS' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                            {data.verdict === 'PASS' ? <ShieldCheck className="w-8 h-8 text-green-400" /> : <AlertCircle className="w-8 h-8 text-red-400" />}
                            <div>
                              <p className={`font-black text-sm mb-1 ${data.verdict === 'PASS' ? 'text-green-400' : 'text-red-400'}`}>
                                SYSTEM VERDICT: {data.verdict}
                              </p>
                              <p className="text-gray-400 text-[10px]">{data.reasoning}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
