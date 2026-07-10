import { LayoutDashboard, FileEdit, Users, History, CalendarDays, Settings, LogOut, Plus, Activity } from 'lucide-react';
import { ViewType } from '../types';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { AppDispatch } from '../store/store';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onNewLogClick: () => void;
}

export default function Sidebar({ currentView, onViewChange, onNewLogClick }: SidebarProps) {
  const dispatch = useDispatch<AppDispatch>();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'log', label: 'Log Interaction', icon: FileEdit },
    { id: 'directory', label: 'HCP Directory', icon: Users },
    { id: 'interactions', label: 'Interactions', icon: History },
    { id: 'followups', label: 'Follow-ups', icon: CalendarDays },
  ] as const;

  return (
    <aside className="w-64 bg-surface-container-low border-r border-outline-variant/20 flex flex-col h-screen fixed left-0 top-0 z-50 p-6 gap-6 shadow-sm">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
          <Activity size={22} className="stroke-[2.5px]" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-primary tracking-tight uppercase leading-none">PharmaFlow</h1>
          <p className="text-[10px] font-bold text-on-surface-variant/70 tracking-widest uppercase mt-1">Clinical CRM</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-2 mt-4 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-primary-container/10 hover:text-primary font-medium'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'} />
              <span className="text-sm font-sans">{item.label}</span>
            </button>
          );
        })}

        {/* Floating Action Button */}
        <div className="mt-4 px-2">
          <button
            onClick={onNewLogClick}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:brightness-110 active:scale-98 transition-all"
          >
            <Plus size={18} className="stroke-[2.5px]" />
            <span className="text-sm">New Log</span>
          </button>
        </div>
      </nav>

      {/* Settings & Logout Footer */}
      <div className="flex flex-col gap-2 border-t border-outline-variant/20 pt-6 mt-auto">
        <button
          onClick={() => onViewChange('settings')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left w-full ${
            currentView === 'settings'
              ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm'
              : 'text-on-surface-variant hover:bg-primary-container/10 hover:text-primary font-medium'
          }`}
        >
          <Settings size={20} className={currentView === 'settings' ? 'stroke-[2.5px]' : 'stroke-[2px]'} />
          <span className="text-sm font-sans">Settings</span>
        </button>
          <button
            onClick={() => dispatch(logout())}
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-error-container/10 hover:text-error rounded-xl transition-all text-left w-full font-medium"
          >
            <LogOut size={20} />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
    </aside>
  );
}
