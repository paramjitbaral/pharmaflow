import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from './store/store';
import { loadInitialData, addHcp, addScheduleItem, logInteraction, setCurrentView, setDirectorySearch, setInteractionsSearch, setPresetLogHcp } from './store/crmSlice';
import { logout } from './store/authSlice';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import LogInteractionView from './components/LogInteractionView';
import HcpDirectoryView from './components/HcpDirectoryView';
import InteractionsLedgerView from './components/InteractionsLedgerView';
import LoginView from './components/LoginView';
import SignupView from './components/SignupView';
import SettingsView from './components/SettingsView';

import { HCP, Interaction, ScheduleItem, ViewType } from './types';
import { CheckSquare, CalendarDays, Clock, ArrowRight, Sparkles, Check, Play, LogOut } from 'lucide-react';

export default function App() {
  const dispatch = useDispatch<AppDispatch>();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  const { 
    currentView, hcps, interactions, schedule, followups, 
    isLoading, directorySearch, interactionsSearch, presetLogHcp 
  } = useSelector((state: RootState) => state.crm);
  
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(loadInitialData());
    }
  }, [dispatch, isAuthenticated]);

  const handleAddHcp = (newHcp: HCP) => {
    dispatch(addHcp(newHcp));
  };

  const handleAddSchedule = (newSched: Omit<ScheduleItem, 'id'>) => {
    dispatch(addScheduleItem(newSched));
  };

  const handleSubmitLog = (newLog: Omit<Interaction, 'refId' | 'timestamp'>) => {
    return dispatch(logInteraction(newLog));
  };

  const handleSelectHcpToLog = (hcp: HCP) => {
    dispatch(setPresetLogHcp(hcp));
    dispatch(setCurrentView('log'));
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard';
      case 'log': return 'Log Interaction';
      case 'directory': return 'HCP Directory';
      case 'interactions': return 'Chronological Ledger';
      case 'followups': return 'Follow-ups';
      case 'settings': return 'Profile Settings';
      default: return 'PharmaFlow CRM';
    }
  };

  if (!isAuthenticated) {
    if (authMode === 'login') {
      return <LoginView onGoToSignup={() => setAuthMode('signup')} />;
    }
    return <SignupView onGoToLogin={() => setAuthMode('login')} />;
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-surface text-primary font-bold">Loading PharmaFlow Data...</div>;
  }

  return (
    <div className="flex bg-surface min-h-screen text-on-surface font-sans">
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => {
          dispatch(setPresetLogHcp(null));
          dispatch(setCurrentView(view));
        }}
        onNewLogClick={() => {
          dispatch(setPresetLogHcp(null));
          dispatch(setCurrentView('log'));
        }}
      />

      <main className="flex-1 lg:ml-64 flex flex-col h-screen overflow-hidden">
        <Header
          title={getViewTitle()}
          showSearch={currentView === 'directory' || currentView === 'interactions'}
          searchPlaceholder={currentView === 'directory' ? "Search HCP name or facility..." : "Audit interaction logs (#IX-XXXX)..."}
          searchValue={currentView === 'directory' ? directorySearch : interactionsSearch}
          onSearchChange={(val) => {
            if (currentView === 'directory') dispatch(setDirectorySearch(val));
            else if (currentView === 'interactions') dispatch(setInteractionsSearch(val));
          }}
        />

        <div className="flex-grow overflow-hidden relative">

          {currentView === 'dashboard' && (
            <DashboardView
              hcps={hcps}
              interactions={interactions}
              onViewActivityDetail={(hcp) => handleSelectHcpToLog(hcp)}
              schedule={schedule}
              followups={followups}
              onAddSchedule={handleAddSchedule}
              onNavigateToView={(view) => dispatch(setCurrentView(view as any))}
            />
          )}

          {currentView === 'log' && (
            <LogInteractionView
              hcps={presetLogHcp ? [presetLogHcp, ...hcps.filter(h => h.id !== presetLogHcp.id)] : hcps}
              onSubmitLog={handleSubmitLog}
            />
          )}

          {currentView === 'directory' && (
            <HcpDirectoryView
              hcps={directorySearch.trim() ? hcps.filter(h => h.name.toLowerCase().includes(directorySearch.toLowerCase()) || h.facility.toLowerCase().includes(directorySearch.toLowerCase())) : hcps}
              onAddHcp={handleAddHcp}
              onSelectHcpToLog={handleSelectHcpToLog}
            />
          )}

          {currentView === 'interactions' && (
            <InteractionsLedgerView
              interactions={interactionsSearch.trim() ? interactions.filter(i => i.hcpName.toLowerCase().includes(interactionsSearch.toLowerCase()) || i.refId.toLowerCase().includes(interactionsSearch.toLowerCase())) : interactions}
            />
          )}

          {currentView === 'followups' && (
            <div className="p-10 flex flex-col gap-6 overflow-y-auto custom-scrollbar h-[calc(100vh-73px)]">
              <div className="max-w-4xl mx-auto flex flex-col gap-6 w-full">
                
                {/* Intro Hero banner */}
                <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 flex items-center justify-between">
                  <div className="flex flex-col gap-2 max-w-xl">
                    <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full w-fit">Follow-ups Dashboard</span>
                    <h3 className="text-xl font-bold text-primary mt-1">Pending HCP Actions & Commitments</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      PharmaFlow AI tracking automatically flags patient adherence queries and formulary requests that require professional medical affairs follow-up callbacks or visits.
                    </p>
                  </div>
                  <div className="p-4 bg-primary text-on-primary rounded-2xl hidden md:block">
                    <CalendarDays size={24} className="stroke-[2.5px]" />
                  </div>
                </div>

                {/* Grid Lists of Pending actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Task list Column */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider">HCP Callbacks Pending</h4>
                    <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto no-scrollbar pb-2">
                      {followups.map((task, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 border border-outline-variant/15 flex justify-between items-start shadow-sm hover:shadow-md transition-all">
                          <div className="flex gap-3 items-start">
                            <div className="p-2 bg-surface rounded-xl text-primary mt-0.5 shrink-0 h-fit">
                              <CheckSquare size={16} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-on-surface">{task.hcp}</span>
                              <span className="text-[11px] text-on-surface-variant mt-0.5">{task.reason}</span>
                              <span className="text-[10px] text-on-surface-variant font-sans font-medium mt-2 flex items-center gap-1">
                                <Clock size={12} /> Due: {task.due}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            task.priority === 'High' ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-on-primary-fixed-variant'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strategic Milestones list */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Strategic Milestones</h4>
                    <div className="bg-white rounded-2xl p-6 border border-outline-variant/15 flex flex-col gap-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
                        <div>
                          <p className="text-xs font-bold text-on-surface">Directory Expansion</p>
                          <p className="text-[10px] text-on-surface-variant mt-1">Onboard and profile key healthcare professionals</p>
                        </div>
                        <span className="text-xs font-bold text-primary">{hcps.length} Professionals Active</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
                        <div>
                          <p className="text-xs font-bold text-on-surface">Interaction Tracking</p>
                          <p className="text-[10px] text-on-surface-variant mt-1">Log medical discussions and clinical activities</p>
                        </div>
                        <span className="text-xs font-bold text-secondary">{interactions.length} Logs Recorded</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-on-surface">Action Items Resolution</p>
                          <p className="text-[10px] text-on-surface-variant mt-1">Complete scheduled callbacks and follow-ups</p>
                        </div>
                        <span className={`text-xs font-bold ${followups.length > 0 ? 'text-error' : 'text-primary'}`}>
                          {followups.length} Actions Pending
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {currentView === 'settings' && (
            <SettingsView />
          )}
        </div>

      </main>

    </div>
  );
}
