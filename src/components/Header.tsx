import React, { useState } from 'react';
import { Bell, Settings, Search, User, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { logout } from '../store/authSlice';
import { setCurrentView } from '../store/crmSlice';

interface HeaderProps {
  title: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  showSearch?: boolean;
}

export default function Header({
  title,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  showSearch = true,
}: HeaderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Get full name from Supabase user metadata, or fallback to email, or default to demo name if no user
  const displayName = user?.user_metadata?.full_name || user?.email || 'Dr. Sarah Chen';
  const displayRole = user?.user_metadata?.role || 'Medical Affairs';

  return (
    <>
      <header className="sticky top-0 z-40 flex justify-between items-center px-10 py-4 w-full bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/15 shrink-0">
        {/* View Title & Dynamic Search */}
        <div className="flex items-center gap-8 flex-1">
          <h2 className="text-xl font-bold text-primary tracking-tight font-sans">{title}</h2>
          {showSearch && onSearchChange && (
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" size={18} />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-sans"
                placeholder={searchPlaceholder}
              />
            </div>
          )}
        </div>

        {/* Utility Icons & Profile Section */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => alert("No new notifications at this time.")}
              className="p-2 text-on-surface-variant hover:bg-primary-container/10 rounded-full transition-all relative"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full animate-pulse"></span>
            </button>
          </div>

          {/* User Profile Info with Dropdown */}
          <div className="relative flex items-center gap-3 pl-6 border-l border-outline-variant/30">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-on-surface font-bold leading-none truncate max-w-[150px]">{displayName}</p>
              <p className="text-[11px] text-on-surface-variant font-medium mt-1 truncate max-w-[150px]">{displayRole}</p>
            </div>
            
            <div 
              className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center ring-2 ring-primary-fixed"
            >
              <User size={20} className="stroke-[2.5px]" />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
