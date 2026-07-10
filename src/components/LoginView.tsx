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
    <div className="min-h-screen flex bg-surface">
      {/* Left side: Professional Branding */}
      <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-12 text-on-primary">
        {/* Background Image & Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('/images/medical_bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-primary/85 z-0" />
        
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary-fixed/20 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/30 rounded-full blur-[100px] pointer-events-none z-0" />
        
        <div className="z-10 flex items-center gap-3">
          <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-on-primary">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tight">PharmaFlow</h1>
        </div>

        <div className="z-10 max-w-md">
          <h2 className="text-4xl font-bold mb-6 leading-tight">Elevate your HCP relationships.</h2>
          <p className="text-primary-fixed-dim text-lg">
            A comprehensive clinical CRM designed for modern medical affairs teams. Track interactions, schedule follow-ups, and manage directory access seamlessly.
          </p>
        </div>
        
        <div className="z-10">
          <p className="text-sm text-primary-fixed-dim font-medium">© 2026 PharmaFlow Inc. All rights reserved.</p>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Subtle background for mobile mostly */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] pointer-events-none lg:hidden" />
        
        <div className="z-10 w-full max-w-md">
          <div className="flex items-center gap-3 mb-10 justify-start lg:hidden">
            <div className="p-2.5 bg-primary rounded-xl text-on-primary">
              <Sparkles size={24} />
            </div>
            <h1 className="text-2xl font-black text-primary tracking-tight">PharmaFlow</h1>
          </div>

          <h2 className="text-3xl font-bold text-on-surface mb-2">Welcome back</h2>
          <p className="text-base text-on-surface-variant mb-10">Log in to manage your HCP relationships.</p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container text-sm font-bold border border-error/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-on-surface ml-1">Email</label>
              <input 
                type="email" 
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-5 py-4 bg-white rounded-xl border border-outline-variant/30 text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-on-surface ml-1">Password</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-5 py-4 bg-white rounded-xl border border-outline-variant/30 text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface shadow-sm"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="mt-6 bg-primary text-on-primary font-bold py-4 px-6 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-base shadow-md"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
              {!isLoading && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="mt-10">
            <p className="text-sm text-on-surface-variant font-medium">
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
    </div>
  );
}
