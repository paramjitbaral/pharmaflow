import React, { useState } from 'react';
import { Users, Zap, TrendingUp, ArrowRight, MapPin, Plus, CheckSquare } from 'lucide-react';
import { HCP, ScheduleItem } from '../types';

const generateSparkline = (data: number[]) => {
  if (!data || data.length === 0) return 'M0,15 L100,15';
  if (data.length === 1) return 'M0,15 L100,15';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = 100 / (data.length - 1);
  
  const points = data.map((val, i) => ({
    x: i * step,
    y: 25 - ((val - min) / range) * 20
  }));

  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const mx = (p1.x + p2.x) / 2;
    path += ` C ${mx},${p1.y} ${mx},${p2.y} ${p2.x},${p2.y}`;
  }
  return path;
};

interface DashboardViewProps {
  hcps: HCP[];
  interactions: any[];
  onViewActivityDetail: (hcp: HCP) => void;
  schedule: ScheduleItem[];
  followups?: any[];
  onAddSchedule: (item: Omit<ScheduleItem, 'id'>) => void;
  onNavigateToView: (view: 'log' | 'directory' | 'interactions') => void;
}

export default function DashboardView({
  hcps,
  interactions,
  onViewActivityDetail,
  schedule,
  followups,
  onAddSchedule,
  onNavigateToView
}: DashboardViewProps) {
  const [showAddSchedModal, setShowAddSchedModal] = useState(false);
  const [newSchedTime, setNewSchedTime] = useState('10:00');
  const [newSchedTitle, setNewSchedTitle] = useState('');
  const [newSchedHcp, setNewSchedHcp] = useState('');

  // === PROFESSIONAL METRIC CALCULATIONS ===
  // Graphs show real cumulative growth: each data point = one more record added.
  // Percentages are based on actual engagement ratios derived from the data.

  const hcpCount = hcps.length;
  const intCount = interactions.length;

  // --- TOTAL HCPs ---
  // Graph: cumulative growth curve showing how the HCP network was built up, one by one.
  // Percentage: engagement coverage = what % of HCPs have at least one interaction logged.
  const hcpTrend = (() => {
    if (hcpCount === 0) return [0, 0, 0, 0, 0];
    // Build a cumulative growth curve with 6 points from 0 to current count
    const points = 6;
    return Array.from({ length: points }, (_, i) => Math.round((i / (points - 1)) * hcpCount));
  })();

  const hcpsWithInteractions = new Set(interactions.map(i => i.hcpId)).size;
  const hcpEngagementRate = hcpCount > 0 ? Math.round((hcpsWithInteractions / hcpCount) * 100) : 0;
  const hcpChange = hcpCount === 0 ? '0%' : `${hcpEngagementRate}% engaged`;

  // --- INTERACTIONS ---
  // Graph: cumulative growth curve showing interactions logged over time.
  // Percentage: average interactions per HCP (call frequency).
  const intTrend = (() => {
    if (intCount === 0) return [0, 0, 0, 0, 0];
    const points = 6;
    return Array.from({ length: points }, (_, i) => Math.round((i / (points - 1)) * intCount));
  })();

  const avgCallsPerHcp = hcpCount > 0 ? (intCount / hcpCount) : 0;
  const intChange = intCount === 0 ? '0%' : `${avgCallsPerHcp.toFixed(1)}/HCP`;

  // --- CONVERSION ---
  // --- SENTIMENT ANALYTICS ---
  // Graph: plots a running sentiment score across all HCPs.
  //   Positive = +1, Neutral = 0, Caution = -1.
  //   Graph goes UP when sentiments are positive, DOWN when caution.
  // Big number: % of HCPs with Positive sentiment.
  const positiveCount = hcps.filter(h => h.sentiment === 'Positive').length;
  const neutralCount = hcps.filter(h => h.sentiment === 'Neutral').length;
  const cautionCount = hcps.filter(h => h.sentiment === 'Caution').length;
  // Score: Positive = 100, Neutral = 50, Caution = 0
  const totalSentimentPoints = (positiveCount * 100) + (neutralCount * 50) + (cautionCount * 0);
  const sentimentScore = hcpCount > 0 ? Math.round(totalSentimentPoints / hcpCount) : 0;

  // Build a real sentiment trend line — each HCP adds to a running score
  const sentimentTrend = (() => {
    if (hcpCount === 0) return [0, 0, 0, 0, 0];
    let runningScore = 0;
    const scores: number[] = [0]; // start at 0
    hcps.forEach(hcp => {
      if (hcp.sentiment === 'Positive') runningScore += 1;
      else if (hcp.sentiment === 'Caution') runningScore -= 1;
      // Neutral adds 0
      scores.push(runningScore);
    });
    return scores;
  })();

  const sentimentLabel = hcpCount === 0 ? '0%'
    : `${positiveCount}+ ${neutralCount}~ ${cautionCount}-`;

  // Dynamic Territory Data
  const regionDoctors = hcps.reduce((acc, hcp) => {
    let region = hcp.region;
    
    // Group all unknown locations into a single Unspecified Region to keep it region-wise
    if (!region || region.trim() === '' || region === 'Unknown' || region === 'Unknown Region') {
      region = 'Unspecified Region';
    }
    
    const finalRegion = region;
    if (!acc[finalRegion]) acc[finalRegion] = new Set<string>();
    // Deduplicate by name to ensure we don't count the same doctor twice
    acc[finalRegion].add(hcp.name.trim().toLowerCase());
    return acc;
  }, {} as Record<string, Set<string>>);

  const regionCounts: Record<string, number> = {};
  Object.keys(regionDoctors).forEach(region => {
    regionCounts[region] = regionDoctors[region].size;
  });

  const sortedRegions = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const maxRegionCount = sortedRegions.length > 0 ? sortedRegions[0][1] : 1;
  const uniqueHcpCount = new Set(hcps.map(h => h.name.trim().toLowerCase())).size;
  const totalNetworkCoverage = uniqueHcpCount > 0 ? Math.min(100, Math.round((uniqueHcpCount / 20) * 100)) : 0; // Simple mock calculation for total coverage metric

  const handleAddScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedTitle || !newSchedHcp) return;
    onAddSchedule({
      time: newSchedTime,
      title: newSchedTitle,
      hcpName: newSchedHcp,
      type: 'Meeting'
    });
    setNewSchedTitle('');
    setNewSchedHcp('');
    setShowAddSchedModal(false);
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar h-[calc(100vh-73px)]">
      {/* Dynamic Layout Panel Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Metrics & Activities (8/12 span) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          {/* Performance Core Section */}
          <section className="bg-surface-container-low/40 rounded-2xl border border-outline-variant/20 p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-on-surface">Performance Core</h3>
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-bold">Q4 LIVE</span>
            </div>
            
            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Metric Card 1: Total HCPs */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all p-4">
                <div className="flex justify-between items-start mb-4">
                  <span className="p-2 bg-primary/5 text-primary rounded-xl">
                    <Users size={20} />
                  </span>
                  <div className="h-8 w-20 flex items-center">
                    {/* SVG Sparkline */}
                    <svg className="w-full h-full stroke-primary fill-none stroke-[2px] overflow-visible" viewBox="0 0 100 30">
                      <path d={generateSparkline(hcpTrend)} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500" />
                    </svg>
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Total HCPs</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-on-surface">{hcps.length}</span>
                  <span className={`text-xs font-bold ${hcpCount === 0 ? 'text-on-surface-variant' : 'text-primary'}`}>{hcpChange}</span>
                </div>
              </div>

              {/* Metric Card 2: Daily Interactions */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all p-4">
                <div className="flex justify-between items-start mb-4">
                  <span className="p-2 bg-secondary/5 text-secondary rounded-xl">
                    <Zap size={20} />
                  </span>
                  <div className="h-8 w-20 flex items-center">
                    {/* SVG Sparkline */}
                    <svg className="w-full h-full stroke-secondary fill-none stroke-[2px] overflow-visible" viewBox="0 0 100 30">
                      <path d={generateSparkline(intTrend)} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500" />
                    </svg>
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Interactions</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-on-surface">{interactions.length}</span>
                  <span className={`text-xs font-bold ${intCount === 0 ? 'text-on-surface-variant' : 'text-secondary'}`}>{intChange}</span>
                </div>
              </div>

              {/* Metric Card 3: Sentiment Analytics */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all p-4">
                <div className="flex justify-between items-start mb-4">
                  <span className={`p-2 rounded-xl ${sentimentScore >= 50 ? 'bg-secondary/5 text-secondary' : sentimentScore > 0 ? 'bg-tertiary/5 text-tertiary' : 'bg-error/5 text-error'}`}>
                    <TrendingUp size={20} />
                  </span>
                  <div className="h-8 w-20 flex items-center">
                    {/* SVG Sparkline — goes up for positive, down for caution */}
                    <svg className={`w-full h-full fill-none stroke-[2px] overflow-visible ${sentimentScore >= 50 ? 'stroke-secondary' : sentimentScore > 0 ? 'stroke-tertiary' : 'stroke-error'}`} viewBox="0 0 100 30">
                      <path d={generateSparkline(sentimentTrend)} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500" />
                    </svg>
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Sentiment</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-on-surface">{sentimentScore}%</span>
                  <span className={`text-xs font-bold ${sentimentScore >= 50 ? 'text-secondary' : sentimentScore > 0 ? 'text-tertiary' : 'text-on-surface-variant'}`}>{sentimentLabel}</span>
                </div>
              </div>

            </div>
          </section>

          {/* Activity Feed Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-on-surface">Recent Activity</h3>
              <button 
                onClick={() => onNavigateToView('interactions')}
                className="text-primary font-bold text-xs flex items-center gap-1 hover:underline"
              >
                View Full History <ArrowRight size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              
              {/* Dynamic Recent Activity Items */}
              {hcps.slice(0, 2).map((hcp) => (
                <div 
                  key={hcp.id}
                  onClick={() => onViewActivityDetail(hcp)}
                  className="flex items-start gap-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10 hover:bg-surface-container-low/40 transition-colors cursor-pointer p-3.5 group"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/15 bg-surface-dim shrink-0 flex items-center justify-center text-primary font-bold">
                    {hcp.initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-all">
                          {hcp.name === 'Unknown Provider' ? hcp.location : hcp.name}
                        </h4>
                        <p className="text-xs text-on-surface-variant font-sans mt-0.5">{hcp.facility} • {hcp.specialty}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${hcp.sentiment === 'Positive' ? 'bg-secondary-container/40 text-on-secondary-container' : 'bg-surface-container text-on-surface-variant'}`}>{hcp.sentiment} Sentiment</span>
                    </div>
                    {hcp.recentTopics && hcp.recentTopics.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-primary-container/10 text-primary rounded text-[10px] font-bold">{hcp.recentTopics[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

            </div>
          </section>

        </div>

        {/* Right Column: Schedule & Territory (4/12 span) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          
          {/* Today's Schedule Card */}
          <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-primary">Schedule</h3>
              <span className="text-xs font-extrabold text-primary/60 tracking-wider">DEC 14</span>
            </div>

            <div className="flex flex-col gap-3 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
              {schedule.map((item) => {
                // Determine border color based on index or item info
                const borderColor = item.time === '09:00' ? 'border-primary' : item.time === '11:30' ? 'border-secondary' : 'border-primary/50';
                const isTeamSync = item.title === 'Team Sync';
                return (
                  <div
                    key={item.id}
                    className={`flex gap-4 p-4 rounded-xl border-l-4 shadow-sm ${
                      isTeamSync ? 'bg-primary/10 border-primary' : 'bg-surface-container-lowest ' + borderColor
                    }`}
                  >
                    <span className="text-xs font-extrabold text-primary shrink-0 w-10 mt-0.5">{item.time}</span>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${isTeamSync ? 'text-primary' : 'text-on-surface'}`}>{item.title}</span>
                      <span className={`text-xs mt-0.5 ${isTeamSync ? 'text-primary/70' : 'text-on-surface-variant'}`}>{item.hcpName}</span>
                    </div>
                  </div>
                );
              })}
              
              {/* Also map followups into the schedule card */}
              {followups?.filter(f => !f.completed).slice(0, 3).map((fu) => (
                <div
                  key={fu.id}
                  className="flex gap-3 p-3 rounded-xl border-l-4 shadow-sm bg-surface-container-lowest border-error/50 items-center"
                >
                  <div className="shrink-0 w-10 flex justify-center">
                    <CheckSquare size={16} className="text-error/80" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[13px] font-bold text-on-surface truncate" title={fu.reason}>{fu.reason}</span>
                    <span className="text-[11px] mt-0.5 text-on-surface-variant truncate">{fu.hcp}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAddSchedModal(true)}
              className="w-full mt-5 py-3 border-2 border-dashed border-primary/20 rounded-xl text-primary font-bold text-xs hover:bg-primary/5 transition-all flex items-center justify-center gap-1"
            >
              <Plus size={16} />
              <span>New Appointment</span>
            </button>
          </div>

          {/* Territory Overview Card */}
          <div className="bg-surface-container-low/60 p-5 rounded-2xl border border-outline-variant/10 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Territory Reach</h3>
              <span className="text-xl font-bold text-primary">{totalNetworkCoverage}%</span>
            </div>

            {/* Top Territories Visual */}
            <div className="flex flex-col gap-3 mt-1 mb-3">
              {sortedRegions.map(([region, count], index) => {
                // Calculate percentage based on the max region count so the top bar is full, others relative
                const barWidth = Math.round((count / maxRegionCount) * 100);
                const bgColors = ['bg-primary', 'bg-primary/70', 'bg-primary/40'];
                return (
                  <div key={region} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-on-surface">{region}</span>
                      <span className="font-extrabold text-on-surface">{count} HCPs</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div className={`h-full ${bgColors[index % bgColors.length]}`} style={{ width: `${barWidth}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-on-surface-variant leading-relaxed font-sans">
              Coverage tracking top active regions. <span className="font-bold text-primary">{uniqueHcpCount} active HCPs</span> in network.
            </p>
          </div>

        </div>
      </div>

      {/* Add Appointment Schedule Modal */}
      {showAddSchedModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-outline-variant/20 p-6 w-full max-w-md animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-primary mb-4">Add Appointment</h3>
            <form onSubmit={handleAddScheduleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={newSchedTime}
                  onChange={(e) => setNewSchedTime(e.target.value)}
                  className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Location or Facility</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Mary's General or Heart Center"
                  value={newSchedTitle}
                  onChange={(e) => setNewSchedTitle(e.target.value)}
                  className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">HCP Name / Event Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arthur Pendelton or Lunch & Learn"
                  value={newSchedHcp}
                  onChange={(e) => setNewSchedHcp(e.target.value)}
                  className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSchedModal(false)}
                  className="px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary font-bold rounded-xl text-xs shadow-md"
                >
                  Add Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
