import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GitMerge, Terminal, Zap, ShieldAlert } from 'lucide-react';

export default function Login({ onLogin }) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);

  const handleGithubLogin = () => {
    // Mock GitHub OAuth flow
    localStorage.setItem('github_user', JSON.stringify({
      username: 'binary-bomber',
      avatar: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
    }));
    onLogin();
  };

  return (
    <div ref={containerRef} className="h-[200vh] w-full flex flex-col relative pointer-events-auto">
      
      {/* Hero Section */}
      <div className="h-screen w-full flex flex-col items-center justify-center relative overflow-hidden">
        <motion.div 
          style={{ y: y1 }}
          className="z-10 flex flex-col items-center text-center px-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-6 flex items-center justify-center space-x-4"
          >
            <Terminal size={48} className="text-neonBlue" />
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonPurple">
              AutoPilot CI
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-lg md:text-2xl text-gray-400 max-w-2xl mb-12 font-mono"
          >
            Autonomous AI DevOps Agent. Diagnosing and repairing your broken pipelines in a completely immersive environment.
          </motion.p>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(0, 240, 255, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGithubLogin}
            className="glass-panel flex items-center space-x-3 px-8 py-4 text-xl font-bold transition-all duration-300 border hover:border-neonBlue cursor-pointer"
          >
            <GitMerge size={28} />
            <span>Authenticate with GitHub</span>
          </motion.button>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 z-10 text-gray-500 flex flex-col items-center"
        >
          <span className="text-sm font-mono uppercase tracking-widest mb-2">Scroll Down</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gray-500 to-transparent" />
        </motion.div>
      </div>

      {/* Feature Section with Parallax */}
      <div className="h-screen w-full flex items-center justify-center relative z-10 px-4 md:px-20">
        <motion.div style={{ y: y2 }} className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-6xl">
          <div className="glass-panel p-10 flex flex-col items-start transform -rotate-2 hover:rotate-0 transition-transform duration-500">
            <ShieldAlert size={40} className="text-neonPurple mb-6" />
            <h3 className="text-3xl font-bold mb-4">Intelligent Diagnosis</h3>
            <p className="text-gray-400">Our multi-agent system analyzes logs, classification data, and stack traces autonomously.</p>
          </div>
          <div className="glass-panel p-10 flex flex-col items-start transform rotate-2 hover:rotate-0 transition-transform duration-500 md:mt-24">
            <Zap size={40} className="text-neonBlue mb-6" />
            <h3 className="text-3xl font-bold mb-4">Auto-Repair Execution</h3>
            <p className="text-gray-400">Generates precise code patches and validates fixes in an isolated Docker runtime before escalating.</p>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
