import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion } from 'motion/react';

export function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/operation-not-allowed') {
        setError('Authentication failed. Please ensure that Email/Password authentication is enabled in your Firebase Console.');
      } else {
        setError(err.message || 'Failed to create an account');
      }
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
          <h1 className="text-4xl font-heading font-black uppercase tracking-tighter mb-4 text-[#141414]">Create Account</h1>
          <p className="text-[#141414]/50 text-sm font-medium italic">Join the Arlo Boudha community.</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-8">
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

          <div>
            <label className={labelClass}>Confirm Password</label>
            <input 
              type="password" 
              required 
              className={inputClass} 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-black/5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#141414]/50 mb-4">Already have an account?</p>
          <Link 
            to="/login" 
            className="inline-block border-b border-[#141414] pb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#141414] hover:text-[#141414]/70 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
