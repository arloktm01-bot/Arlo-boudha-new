import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion } from 'motion/react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Wait a tick for auth state to update before navigating
      setTimeout(() => {
        navigate('/admin');
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setLoading(false);
    }
  };

  const inputClass = "w-full border-b border-black/20 py-3 bg-transparent focus:outline-none focus:border-black transition-colors rounded-none text-[#141414] font-medium placeholder-[#141414]/30";
  const labelClass = "block text-[10px] font-bold uppercase tracking-[0.2em] text-[#141414]/50 mb-1";

  return (
    <div className="pt-32 pb-24 px-4 min-h-screen flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-black uppercase tracking-tighter mb-4 text-[#141414]">Account Login</h1>
          <p className="text-[#141414]/50 text-sm font-medium italic">Welcome back to Arlo Boudha.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 font-medium text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Email Address</label>
            <input 
              type="email" 
              required 
              className={inputClass} 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="hello@example.com"
            />
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <input 
              type="password" 
              required 
              className={inputClass} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-black/5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#141414]/50 mb-4">Don't have an account?</p>
          <Link 
            to="/signup" 
            className="inline-block border-b border-[#141414] pb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#141414] hover:text-[#141414]/70 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
