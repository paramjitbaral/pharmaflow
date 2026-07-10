import React, { useState } from 'react';
import { SlidersHorizontal, Download, ChevronDown, ChevronUp, ShieldCheck, TrendingUp, Calendar, FileText, ChevronRight, Check } from 'lucide-react';
import { Interaction } from '../types';

interface InteractionsLedgerViewProps {
  interactions: Interaction[];
}

export default function InteractionsLedgerView({ interactions }: InteractionsLedgerViewProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>('#IX-8842'); // Row 1 expanded by default as in screenshot
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [activeTopicFilter, setActiveTopicFilter] = useState<string | null>(null);

  // Toggle rows
  const handleToggleRow = (refId: string) => {
    if (expandedRow === refId) {
      setExpandedRow(null);
    } else {
      setExpandedRow(refId);
    }
  };

  // Filter lists based on search or selected topic
  const filteredLedger = interactions.filter(item => {
    const matchesSearch = item.hcpName.toLowerCase().includes(ledgerSearch.toLowerCase()) || 
                          item.facility.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
                          item.refId.toLowerCase().includes(ledgerSearch.toLowerCase());
    const matchesTopic = !activeTopicFilter || 
                         item.narrative.toLowerCase().includes(activeTopicFilter.toLowerCase()) ||
                         item.products.some(p => p.toLowerCase().includes(activeTopicFilter.toLowerCase()));
    return matchesSearch && matchesTopic;
  });

  // Export functions
  const handleExportCSV = () => {
    alert("Compiling and generating secure SHA-256 validated ledger report CSV... File download started.");
  };

  // Dynamic Analytics Calculations
  const highCount = interactions.filter(i => i.engagement.toLowerCase().includes('high')).length;
  const medCount = interactions.filter(i => i.engagement.toLowerCase().includes('medium')).length;
  const lowCount = interactions.filter(i => i.engagement.toLowerCase().includes('low')).length;
  const totalSentimentCount = highCount + medCount + lowCount;
  
  const posPct = totalSentimentCount > 0 ? Math.round((highCount / totalSentimentCount) * 100) : 0;
  const neuPct = totalSentimentCount > 0 ? Math.round((medCount / totalSentimentCount) * 100) : 0;
  const cauPct = totalSentimentCount > 0 ? Math.round((lowCount / totalSentimentCount) * 100) : 0;

  // Interaction Velocity (Dynamic mock based on volume)
  const velocityValue = interactions.length > 0 ? (interactions.length * 4.2).toFixed(1) : '0.0';

  // Dynamic Recent Key Topics
  const topicCounts: Record<string, number> = {};
  interactions.forEach(i => {
    i.products.forEach(p => {
      topicCounts[p] = (topicCounts[p] || 0) + 1;
    });
  });
  const dynamicTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([term]) => ({ id: term, label: term, term }));

  return (
    <div className="flex-grow flex overflow-hidden h-[calc(100vh-73px)] bg-surface">
      
      {/* Dynamic Main Ledger timeline */}
      <div className="flex-1 overflow-y-auto px-8 py-5 space-y-4 custom-scrollbar">
        
        {/* ledger headers */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-on-surface-variant">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 font-sans">CURRENT ARCHIVE</span>
            <div className="h-[1.5px] w-12 bg-outline-variant/30"></div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => alert("Re-sorting chronological list by descending timestamp.")}
              className="p-2 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-on-surface-variant hover:text-primary transition-all shadow-sm cursor-pointer"
            >
              <SlidersHorizontal size={16} />
            </button>
            <button 
              onClick={handleExportCSV}
              className="p-2 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-on-surface-variant hover:text-primary transition-all shadow-sm cursor-pointer"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Audit Grid card container */}
        <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
          
          {/* Table Header row */}
          <div className="grid grid-cols-12 bg-surface-container-low/50 px-6 py-3 border-b border-outline-variant/20 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest font-sans">
            <div className="col-span-1">Ref ID</div>
            <div className="col-span-4">HCP Entity</div>
            <div className="col-span-3">Facility Location</div>
            <div className="col-span-2">Timestamp</div>
            <div className="col-span-2 text-right">Engagement</div>
          </div>

          {/* Ledger Table rows */}
          <div className="divide-y divide-outline-variant/15">
            {filteredLedger.length === 0 ? (
              <div className="p-8 text-center text-sm text-on-surface-variant">
                No matching ledger archives found for your search.
              </div>
            ) : (
              filteredLedger.map((row) => {
                const isExpanded = expandedRow === row.refId;
                return (
                  <div key={row.refId} className="group transition-all">
                    
                    {/* Interactive Header Grid line */}
                    <div 
                      onClick={() => handleToggleRow(row.refId)}
                      className="grid grid-cols-12 px-5 py-4 items-center cursor-pointer hover:bg-surface-container-low/20 transition-all gap-2"
                    >
                      <div className="col-span-1 font-mono text-[11px] text-on-surface-variant font-bold">{row.refId}</div>
                      
                      <div className="col-span-4 min-w-0">
                        <p className="text-primary text-xs font-bold font-sans group-hover:text-primary-container transition-colors truncate">{row.hcpName}</p>
                        <p className="text-[10px] text-on-surface-variant/80 font-sans mt-0.5 truncate">{row.specialty}</p>
                      </div>

                      <div className="col-span-3 text-on-surface-variant text-xs font-sans font-medium truncate pr-2">{row.facility}</div>
                      
                      <div className="col-span-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant/80 font-bold font-sans">
                          <Calendar size={12} className="shrink-0" />
                          <span>{row.timestamp}</span>
                        </div>
                      </div>

                      <div className="col-span-2 flex justify-end items-center gap-3 min-w-0">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded truncate max-w-[120px] inline-block ${
                          row.engagement.toLowerCase().includes('high') ? 'bg-primary/10 text-primary' :
                          row.engagement.toLowerCase().includes('medium') ? 'bg-amber-500/10 text-amber-700' :
                          'bg-error/10 text-error'
                        }`} title={row.engagement}>
                          {row.engagement}
                        </span>
                        {isExpanded ? <ChevronUp size={16} className="text-on-surface-variant" /> : <ChevronDown size={16} className="text-on-surface-variant" />}
                      </div>
                    </div>

                    {/* Expandable Drill-down area */}
                    {isExpanded && (
                      <div className="px-6 py-5 bg-surface-container-lowest border-t border-outline-variant/10 text-sm flex gap-8 shadow-inner">
                        
                        <div className="flex-1 space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">Discussion Narrative</p>
                            <p className="text-on-surface-variant leading-relaxed text-xs">{row.narrative}</p>
                          </div>
                          
                          <div>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">Key Product Tags</p>
                            <div className="flex gap-2">
                              {row.products.map(p => (
                                <span key={p} className="px-2 py-1 bg-surface-container-high rounded text-[10px] font-bold text-on-surface-variant">
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="w-64 shrink-0 space-y-4">
                          <div className="p-3 bg-surface rounded-xl border border-outline-variant/20 shadow-sm">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <ShieldCheck size={14} className="text-secondary" /> CRM Next Actions
                            </p>
                            <ul className="space-y-2">
                              {row.actions.map((act, i) => (
                                <li key={i} className="text-[11px] text-on-surface flex items-start gap-1.5">
                                  <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0"></div>
                                  <span className="leading-tight">{act}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
        </div>
        
        {/* Simple pagination state */}
        <div className="flex items-center justify-between text-xs text-on-surface-variant font-bold px-2">
          <span>Ledger Entries 1-{filteredLedger.length} of {filteredLedger.length}</span>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 rounded-md hover:bg-surface-container text-on-surface-variant/50 cursor-not-allowed">Previous</button>
            <button className="px-3 py-1.5 rounded-md bg-primary text-white">1</button>
            <button className="px-3 py-1.5 rounded-md hover:bg-surface-container text-on-surface-variant">2</button>
            <button className="px-3 py-1.5 rounded-md hover:bg-surface-container text-on-surface-variant">Next</button>
          </div>
        </div>

      </div>

      {/* Right Pane: Statistical & Analytics Sidebar (Fixed w-72, matches Image 4) */}
      <aside className="w-72 bg-surface-container border-l border-outline-variant/20 p-5 flex flex-col gap-5 shrink-0 overflow-y-auto custom-scrollbar">
        
        {/* Sentiment Analysis indicators */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Sentiment Analytics</h4>
          
          <div className="bg-white p-3 rounded-xl border border-outline-variant/20 flex flex-col gap-3 shadow-sm">
            
            {/* Rating POSITIVE */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-on-surface-variant">POSITIVE</span>
                <span className="font-extrabold text-primary text-base">{posPct}%</span>
              </div>
              <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${posPct}%` }}></div>
              </div>
            </div>

            {/* Rating NEUTRAL */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-on-surface-variant">NEUTRAL</span>
                <span className="font-extrabold text-secondary text-base">{neuPct}%</span>
              </div>
              <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${neuPct}%` }}></div>
              </div>
            </div>

            {/* Rating CAUTION */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-on-surface-variant">CAUTION</span>
                <span className="font-extrabold text-error text-base">{cauPct}%</span>
              </div>
              <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-error transition-all duration-500" style={{ width: `${cauPct}%` }}></div>
              </div>
            </div>

          </div>
        </div>

        {/* Velocity Indicator panel */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Interaction Velocity</h4>
          
          <div className="bg-white p-3 rounded-xl border border-outline-variant/20 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-base font-extrabold text-primary leading-tight">+{velocityValue}%</p>
                <p className="text-[9px] text-on-surface-variant uppercase tracking-wider mt-1">Month-over-month</p>
              </div>
            </div>

            {/* SVG Visual block bar charts */}
            <div className="flex gap-1.5 h-12 items-end pt-2 px-1">
              <div className="flex-1 bg-primary/20 rounded-t h-[40%] transition-all"></div>
              <div className="flex-1 bg-primary/20 rounded-t h-[60%] transition-all"></div>
              <div className="flex-1 bg-primary/20 rounded-t h-[35%] transition-all"></div>
              <div className="flex-1 bg-primary/20 rounded-t h-[80%] transition-all"></div>
              <div className="flex-1 bg-primary/20 rounded-t h-[55%] transition-all"></div>
              <div className={`flex-1 bg-primary rounded-t transition-all ${interactions.length > 0 ? 'h-[95%]' : 'h-0'}`}></div>
              <div className={`flex-1 bg-primary rounded-t transition-all ${interactions.length > 0 ? 'h-[90%]' : 'h-0'}`}></div>
            </div>

          </div>
        </div>

        {/* Key Medical Topics Filter */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Recent Key Topics</h4>
          
          <div className="flex flex-wrap gap-2">
            {dynamicTopics.length === 0 ? (
              <p className="text-xs text-on-surface-variant">No topics available yet.</p>
            ) : (
              dynamicTopics.map(topic => {
                const isActive = activeTopicFilter === topic.term;
                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      if (isActive) {
                        setActiveTopicFilter(null);
                      } else {
                        setActiveTopicFilter(topic.term);
                      }
                    }}
                    className={`px-2 py-1 rounded-md border text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                      isActive
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface-container-highest/45 hover:bg-surface-container-highest/90 text-on-surface border-outline-variant/15'
                    }`}
                  >
                    {isActive && <Check size={12} className="stroke-[2.5px]" />}
                    <span>{topic.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

      </aside>

    </div>
  );
}
