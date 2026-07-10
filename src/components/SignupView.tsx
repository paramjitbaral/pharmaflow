import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { signup, verifyOtp, clearError } from '../store/authSlice';
import { Sparkles, UserPlus, CheckCircle2 } from 'lucide-react';

interface SignupViewProps {
  onGoToLogin: () => void;
}

export default function SignupView({ onGoToLogin }: SignupViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otp, setOtp] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const handleOtpChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6);
      setOtp(digits);
      if (digits.length < 6) otpRefs.current[digits.length]?.focus();
      else otpRefs.current[5]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    let newOtp = otp.padEnd(6, ' ').split('');
    newOtp[index] = digit || ' ';
    setOtp(newOtp.join('').trimEnd());

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // If backspace is pressed on an empty box, go back
      otpRefs.current[index - 1]?.focus();
    }
  };
  
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const resultAction = await dispatch(signup({ fullName: name, email, password }));
    if (signup.fulfilled.match(resultAction)) {
      setShowOtpScreen(true);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    await dispatch(verifyOtp({ email, token: otp }));
    // If successful, isAuthenticated in authSlice becomes true, and App.tsx should redirect.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="z-10 w-full max-w-md bg-white p-8 rounded-[2rem] border border-outline-variant/20 shadow-xl">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="p-2.5 bg-primary rounded-xl text-on-primary">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tight">PharmaFlow</h1>
        </div>

        <h2 className="text-xl font-bold text-on-surface mb-2 text-center">
          {showOtpScreen ? 'Verify Your Email' : 'Create Account'}
        </h2>
        <p className="text-sm text-on-surface-variant mb-6 text-center">
          {showOtpScreen ? 'Enter the 6-digit code sent to your email.' : 'Join PharmaFlow to start managing HCPs'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-xs font-bold text-center border border-error/20">
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        )}

        {!showOtpScreen ? (
          <form onSubmit={handleSignupSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface ml-1">Full Name</label>
              <input 
                type="text" 
                required
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-4 py-3 bg-surface rounded-xl border border-outline-variant/30 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
              />
            </div>

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
              {isLoading ? 'Creating Account...' : 'Sign Up'}
              {!isLoading && <UserPlus size={18} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-on-surface ml-1 text-center">6-Digit Code</label>
              <div className="flex justify-between gap-2 mt-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    maxLength={6} // Allow paste
                    value={otp[index] && otp[index] !== ' ' ? otp[index] : ''}
                    onChange={(e) => handleOtpChange(index, e)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 bg-surface rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface text-center font-mono text-xl font-bold"
                  />
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || otp.length !== 6}
              className="mt-4 bg-primary text-on-primary font-bold py-3.5 px-6 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
              {!isLoading && <CheckCircle2 size={18} />}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-on-surface-variant font-medium">
            {showOtpScreen ? 'Need to use a different email?' : 'Already have an account?'}
            {' '}
            <button 
              onClick={showOtpScreen ? () => setShowOtpScreen(false) : onGoToLogin}
              className="text-primary font-bold hover:underline ml-1"
            >
              {showOtpScreen ? 'Go Back' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
