import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, User, GitBranch } from 'lucide-react';
import axios from 'axios';

export default function Navbar({ user, setUser }) {
  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:8000/api/auth/github');
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:8000/api/auth/logout');
      setUser(null);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <nav className="p-8 flex justify-between items-center max-w-7xl mx-auto relative z-10">
      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.href = '/'}>
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20 group-hover:rotate-12 transition-transform">B</div>
        <span className="text-2xl font-bold tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Binarybombers</span>
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <div className="flex items-center gap-4 glass p-1.5 pr-4 rounded-full border-white/10">
            <img src={user.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full border border-white/20" />
            <span className="text-sm font-bold text-gray-200">{user.username}</span>
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 px-6 py-2.5 glass rounded-full text-sm font-bold hover:bg-white/10 transition-all hover:scale-105 border-white/20"
          >
            <GitBranch className="w-4 h-4" />
            SIGN IN WITH GITHUB
          </button>
        )}
      </div>
    </nav>
  );
}
