import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { login, clearError } from '../store/authSlice';
import { Sparkles, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onGoToSignup: () => void;
}

export default function LoginView({ onGoToSignup }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(login({ email, password }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="z-10 w-full max-w-md bg-white p-8 rounded-[2rem] border border-outline-variant/20 shadow-xl">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="p-2.5 bg-primary rounded-xl text-on-primary">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tight">PharmaFlow</h1>
        </div>

        <h2 className="text-xl font-bold text-on-surface mb-2 text-center">Welcome back</h2>
        <p className="text-sm text-on-surface-variant mb-6 text-center">Log in to manage your HCP relationships</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-xs font-bold text-center border border-error/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface ml-1">Email</label>
            <input 
              type="email" 
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 bg-surface rounded-xl border border-outline-variant/30 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface ml-1">Password</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-3 bg-surface rounded-xl border border-outline-variant/30 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-4 bg-primary text-on-primary font-bold py-3.5 px-6 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-on-surface-variant font-medium">
            Don't have an account?{' '}
            <button 
              onClick={onGoToSignup}
              className="text-primary font-bold hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
