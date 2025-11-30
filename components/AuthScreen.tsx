import React, { useState } from 'react';
import { ShieldCheck, Cpu, Terminal, ChevronRight } from 'lucide-react';

interface Props {
  onLogin: (email: string) => void;
}

export const AuthScreen: React.FC<Props> = ({ onLogin }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onLogin(email);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-cyan-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-emerald-500/10 mb-6">
             <Cpu size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">CryptoSage AI</h1>
          <p className="text-slate-400">Advanced Market Intelligence Terminal</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Terminal size={20} className="text-emerald-500" />
            Terminal Access
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Identity / Email ID
              </label>
              <input 
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              <span>Initialize Session</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/50">
             <div className="flex items-start gap-3 text-xs text-slate-500">
                <ShieldCheck size={16} className="text-emerald-500/50 flex-shrink-0 mt-0.5" />
                <p>
                  Secure environment. Your trading simulation data is persisted locally for this device ID.
                </p>
             </div>
          </div>
        </div>
        
        <p className="text-center mt-6 text-xs text-slate-600">
          v2.5.0 • Powered by Gemini 3 Pro
        </p>
      </div>
    </div>
  );
};