import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { updateUserProfile } from '../store/authSlice';
import { User, Save, Briefcase, MapPin, Bell, Shield } from 'lucide-react';

export default function SettingsView() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const error = useSelector((state: RootState) => state.auth.error);

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [role, setRole] = useState(user?.user_metadata?.role || 'Medical Science Liaison');
  const [territory, setTerritory] = useState('Northeast Region');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [digest, setDigest] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    const resultAction = await dispatch(updateUserProfile({ fullName })); // Ignoring mock fields for API
    if (updateUserProfile.fulfilled.match(resultAction)) {
      setSuccessMsg('Profile and preferences updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="flex-grow flex flex-col h-[calc(100vh-73px)] overflow-y-auto bg-surface p-10 custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 flex items-center justify-between">
          <div className="flex flex-col gap-2 max-w-xl">
            <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full w-fit">Account Settings</span>
            <h3 className="text-xl font-bold text-primary mt-1">Profile & Preferences</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Manage your personal information, role details, and adjust CRM notification preferences.
            </p>
          </div>
          <div className="p-4 bg-primary text-on-primary rounded-2xl hidden md:flex items-center justify-center">
            <User size={24} className="stroke-[2.5px]" />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-error-container text-on-error-container text-sm font-bold border border-error/20 flex items-center gap-2">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-secondary-container text-on-secondary-container text-sm font-bold border border-secondary/20 flex items-center gap-2">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 w-full">
          
          {/* Left Column: Profile Info */}
          <div className="flex-1 bg-white rounded-2xl border border-outline-variant/30 p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-4 pb-4 border-b border-outline-variant/15">
              <div className="w-14 h-14 bg-primary-container rounded-full flex items-center justify-center text-primary ring-4 ring-primary/5">
                <User size={24} className="stroke-[2px]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">Personal Information</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface ml-1 uppercase tracking-wider text-on-surface-variant">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                  <input 
                    type="text" 
                    placeholder="e.g. Dr. Sarah Chen"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-surface rounded-xl border border-outline-variant/30 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface ml-1 uppercase tracking-wider text-on-surface-variant">Professional Role</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                  <input 
                    type="text" 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-surface rounded-xl border border-outline-variant/30 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface ml-1 uppercase tracking-wider text-on-surface-variant">Assigned Territory</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                  <input 
                    type="text" 
                    value={territory}
                    onChange={(e) => setTerritory(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-surface rounded-xl border border-outline-variant/30 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Preferences */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-8 shadow-sm flex flex-col gap-6 flex-1">
              <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/15">
                <Bell size={20} className="text-primary" />
                <h4 className="text-sm font-bold text-on-surface">Notification Preferences</h4>
              </div>

              <div className="flex flex-col gap-4">
                <label className="flex items-center justify-between cursor-pointer p-4 bg-surface rounded-xl border border-outline-variant/20 hover:border-primary/30 transition-all">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-on-surface">Email Alerts</span>
                    <span className="text-xs text-on-surface-variant">Receive alerts for high-priority follow-ups</span>
                  </div>
                  <input type="checkbox" checked={emailNotifs} onChange={(e) => setEmailNotifs(e.target.checked)} className="w-5 h-5 accent-primary rounded cursor-pointer" />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-4 bg-surface rounded-xl border border-outline-variant/20 hover:border-primary/30 transition-all">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-on-surface">Daily Digest</span>
                    <span className="text-xs text-on-surface-variant">Summary of territory interaction metrics</span>
                  </div>
                  <input type="checkbox" checked={digest} onChange={(e) => setDigest(e.target.checked)} className="w-5 h-5 accent-primary rounded cursor-pointer" />
                </label>
              </div>

              <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/15 mt-4">
                <Shield size={20} className="text-primary" />
                <h4 className="text-sm font-bold text-on-surface">Security & Privacy</h4>
              </div>
              
              <button type="button" className="text-left text-sm font-bold text-primary hover:underline w-fit">
                Change Password
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-primary text-on-primary font-bold py-4 px-6 rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isLoading ? 'Saving Changes...' : 'Save All Preferences'}
              {!isLoading && <Save size={18} />}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
