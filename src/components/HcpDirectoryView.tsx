import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Maximize2, MessageSquare, Calendar, ClipboardCheck, Plus, Star, Building, ShieldCheck } from 'lucide-react';
import { HCP, ViewType } from '../types';

interface HcpDirectoryViewProps {
  hcps: HCP[];
  onAddHcp: (newHcp: HCP) => void;
  onSelectHcpToLog: (hcp: HCP) => void;
}

export default function HcpDirectoryView({
  hcps,
  onAddHcp,
  onSelectHcpToLog
}: HcpDirectoryViewProps) {
  const [selectedHcp, setSelectedHcp] = useState<HCP | undefined>(hcps[0] || undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('All');
  const [facilityFilter, setFacilityFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Modals for adding HCP
  const [showAddHcpModal, setShowAddHcpModal] = useState(false);
  const [newHcpName, setNewHcpName] = useState('');
  const [newHcpSpecialty, setNewHcpSpecialty] = useState('Oncology Specialist');
  const [newHcpFacility, setNewHcpFacility] = useState("");
  const [newHcpTier, setNewHcpTier] = useState('Tier 1');
  const [newHcpLocation, setNewHcpLocation] = useState('Austin, TX');
  const [newHcpRegion, setNewHcpRegion] = useState('');

  // Auto-detect Region based on user's Geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (lat >= 24) {
            setNewHcpRegion('North Region (India)');
          } else if (lat <= 20) {
            setNewHcpRegion('South Region (India)');
          } else if (lng >= 80) {
            setNewHcpRegion('East Region (India)');
          } else {
            setNewHcpRegion('West Region (India)');
          }
        },
        (error) => {
          console.warn('Geolocation failed or denied, defaulting region.', error);
          setNewHcpRegion('West Region (India)');
        },
        { timeout: 10000 }
      );
    } else {
      setNewHcpRegion('West Region (India)');
    }
  }, []);

  // Specialties & Facilities lists
  const specialties = ['All', 'Oncology Specialist', 'Cardiology', 'General Surgery', 'Clinical Immunology', 'Neurology Specialist'];
  const facilities = ['All', "St. Mary's General", 'City Heart Center', 'University Research', 'Westside Wellness', 'Metropolitan Health'];

  // Filter logic
  const filteredHcps = hcps.filter(hcp => {
    const matchesSearch = hcp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          hcp.facility.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = specialtyFilter === 'All' || hcp.specialty === specialtyFilter;
    const matchesFacility = facilityFilter === 'All' || hcp.facility.includes(facilityFilter);
    return matchesSearch && matchesSpecialty && matchesFacility;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredHcps.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHcps = filteredHcps.slice(startIndex, startIndex + itemsPerPage);

  // Form submission for adding HCP
  const handleAddHcpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHcpName) return;

    // Generate initials
    const initials = newHcpName.split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'HP';

    const newCreatedHcp: HCP = {
      id: `hcp-${Date.now()}`,
      name: newHcpName,
      title: newHcpSpecialty,
      facility: newHcpFacility,
      tier: newHcpTier,
      lastActivity: 'New HCP Added',
      initials: initials,
      specialty: newHcpSpecialty,
      location: newHcpLocation,
      loyalty: 'Medium',
      lastCallDays: 0,
      engagement: 'Medium',
      rxPotential: 'Top 15%',
      sentiment: 'Neutral',
      sentimentDetails: 'Newly registered Health Care Professional. Pre-engagement profiles loaded.',
      recentTopics: ['Initial Profile Registration'],
      region: newHcpRegion || 'Unspecified Region'
    };

    onAddHcp(newCreatedHcp);
    setSelectedHcp(newCreatedHcp);
    
    // Reset Form
    setNewHcpName('');
    setNewHcpLocation('Austin, TX');
    setShowAddHcpModal(false);
    alert(`Success! ${newCreatedHcp.name} added to the PharmaFlow Healthcare Provider Directory.`);
  };

  return (
    <div className="flex-grow flex flex-col h-[calc(100vh-73px)] overflow-hidden bg-surface">
      {/* Dynamic Sub-header */}
      <div className="flex items-center justify-between gap-4 flex-wrap px-8 py-3 bg-surface/35 backdrop-blur-md z-30 border-b border-outline-variant/10 shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4 text-xs text-on-surface-variant font-medium">
            <span className="font-bold text-primary text-sm font-sans whitespace-nowrap">{hcps.length} Professionals</span>
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant shrink-0"></span>
            <span className="whitespace-nowrap">Updated 2h ago</span>
          </div>
        </div>

        {/* Integrated Floating Filter Panel */}
        <div className="flex items-center gap-3 bg-white/70 p-1.5 rounded-2xl border border-white/50 shadow-sm">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-1.5 w-40 bg-transparent border-none text-xs focus:ring-0 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
              placeholder="Quick search..."
            />
          </div>
          
          <div className="h-6 w-px bg-outline-variant/30"></div>

          {/* Specialty Filter Dropdown */}
          <div className="relative flex items-center">
            <Filter size={15} className="text-on-surface-variant mr-1" />
            <select
              value={specialtyFilter}
              onChange={(e) => {
                setSpecialtyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none py-1 text-xs text-on-surface-variant font-bold focus:ring-0 focus:outline-none cursor-pointer pr-5"
            >
              {specialties.map(spec => (
                <option key={spec} value={spec} className="text-on-surface bg-white">{spec === 'All' ? 'All Specialties' : spec}</option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-outline-variant/30"></div>

          {/* Facility Filter Dropdown */}
          <div className="relative flex items-center">
            <Building size={15} className="text-on-surface-variant mr-1" />
            <select
              value={facilityFilter}
              onChange={(e) => {
                setFacilityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none py-1 text-xs text-on-surface-variant font-bold focus:ring-0 focus:outline-none cursor-pointer pr-5"
            >
              {facilities.map(fac => (
                <option key={fac} value={fac} className="text-on-surface bg-white">{fac === 'All' ? 'All Facilities' : fac}</option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-outline-variant/30"></div>

          {/* Add Button */}
          <button
            onClick={() => setShowAddHcpModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
          >
            <Plus size={14} className="stroke-[2.5px] shrink-0" />
            <span>Add HCP</span>
          </button>
        </div>
      </div>

      {/* Main Table Layout Panel */}
      <div className="flex-grow flex overflow-hidden px-10 pb-4 gap-6 pt-3">
        
        {/* Left Side: Table List of HCPs */}
        <section className="flex-1 flex flex-col overflow-hidden pr-2">
            
          {/* Table Header Row */}
          <div className="flex items-center px-6 py-2.5 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest border-b border-outline-variant/20 gap-4 shrink-0">
            <div className="w-14 shrink-0"></div>
            <div className="flex-grow grid grid-cols-12 gap-4 items-center">
              <div className="col-span-5">Professional</div>
              <div className="col-span-4">Facility & Tier</div>
              <div className="col-span-3">Last Activity</div>
            </div>
          </div>

          {/* Table Body Rows */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pt-2 custom-scrollbar">
            {paginatedHcps.map((hcp) => {
                const isSelected = selectedHcp?.id === hcp.id;
                return (
                  <div
                    key={hcp.id}
                    onClick={() => setSelectedHcp(hcp)}
                    className={`flex items-center gap-4 px-5 py-2.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-white border-primary shadow-sm ring-1 ring-primary/10'
                        : 'bg-white/40 hover:bg-white/90 border-transparent hover:border-outline-variant/20'
                    }`}
                  >
                    {/* Selected Indicator Left Line */}
                    {isSelected && <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-md"></div>}

                    {/* Initials Avatar */}
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-secondary font-bold text-sm shrink-0 shadow-sm">
                      {hcp.initials}
                    </div>

                    {/* HCP Core Details */}
                    <div className="flex-grow grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-5">
                        <h4 className="font-bold text-on-surface text-sm leading-tight">{hcp.name}</h4>
                        <p className="text-xs text-primary font-medium font-sans mt-1">{hcp.title}</p>
                      </div>
                      
                      <div className="col-span-4 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                          <Building size={14} className="text-on-surface-variant/70" />
                          <span>{hcp.facility}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/70 font-sans">
                          <Star size={10} className="fill-primary/20 text-primary" />
                          <span>{hcp.tier}</span>
                        </div>
                      </div>

                      <div className="col-span-3 flex justify-between items-center">
                        <span className={`text-xs font-sans font-medium ${
                          hcp.lastActivity.includes('Inactive') ? 'text-error font-bold' : 'text-on-surface-variant'
                        }`}>
                          {hcp.lastActivity}
                        </span>
                        {isSelected && (
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHcp(hcp);
                              onSelectHcpToLog(hcp);
                            }}
                            className="text-xs text-primary font-bold hover:underline"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}

              {paginatedHcps.length === 0 && (
                <div className="text-center py-12 text-sm text-on-surface-variant bg-white/40 rounded-2xl border border-dashed border-outline-variant/30">
                  No Health Care Professionals match your active search or filter.
                </div>
              )}
            </div>

          {/* Table Minimal Pagination */}
          <div className="flex items-center justify-center gap-4 py-4 mt-2 border-t border-outline-variant/10 shrink-0">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-outline-variant/35 rounded-full text-on-surface-variant hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-on-surface">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-outline-variant/35 rounded-full text-on-surface-variant hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight size={16} />
            </button>
          </div>

        </section>

        {/* Right Side: Focus View Sidebar */}
        <aside className="w-72 flex flex-col shrink-0 pb-2">
          {selectedHcp ? (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3.5 border border-outline-variant/10 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 bg-primary text-white rounded-full text-[10px] font-bold uppercase tracking-wider">Target HCP</span>
              <button 
                onClick={() => alert(`Expanding ${selectedHcp.name} full clinical profile dossier...`)}
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                <Maximize2 size={16} />
              </button>
            </div>

            {/* Quick Profile Panel */}
            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-secondary font-extrabold text-xl shadow-inner border-2 border-white mb-1.5">
                {selectedHcp.initials}
              </div>
              <h3 className="text-sm font-bold text-on-surface tracking-tight">{selectedHcp.name}</h3>
              <p className="text-[10px] text-on-surface-variant font-sans mt-0.5">{selectedHcp.specialty}</p>
            </div>

            {/* Loyalty & Engagement Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface-container-low p-2.5 rounded-xl text-center shadow-inner">
                <p className="text-[9px] text-on-surface-variant font-medium uppercase tracking-wider mb-0.5">Engagement</p>
                <p className="text-xs font-bold text-primary">{selectedHcp.engagement}</p>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-xl text-center shadow-inner">
                <p className="text-[9px] text-on-surface-variant font-medium uppercase tracking-wider mb-0.5">Rx Potential</p>
                <p className="text-xs font-bold text-primary">{selectedHcp.rxPotential}</p>
              </div>
            </div>

            {/* Engagement Timeline details */}
            <div className="flex flex-col gap-2">
              <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/10 pb-1.5">Recent Engagement</h5>
              
              <div className="flex gap-2.5">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-6 h-6 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                    <MessageSquare size={12} />
                  </div>
                  <div className="w-px h-6 bg-outline-variant/30 mt-1"></div>
                </div>
                <div className="pt-0.5">
                  <p className="text-[11px] font-bold text-on-surface leading-snug">Scientific Discussion</p>
                  <p className="text-[9px] text-on-surface-variant mt-0.5 font-sans">Nov 12 • Product Feedback</p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-6 h-6 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                    <Calendar size={12} />
                  </div>
                </div>
                <div className="pt-0.5">
                  <p className="text-[11px] font-bold text-on-surface leading-snug">Medical Conference</p>
                  <p className="text-[9px] text-on-surface-variant mt-0.5 font-sans">Oct 24 • Key Speaker</p>
                </div>
              </div>
            </div>

            {/* CRM Call to Actions */}
            <div className="flex flex-col gap-2 pt-1">
                <button 
                  onClick={() => onSelectHcpToLog(selectedHcp)}
                  className="flex-1 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ClipboardCheck size={14} />
                  <span>Log Interaction</span>
                </button>
              <button
                onClick={() => {
                  alert(`Scheduling next Follow-up for ${selectedHcp.name} in calendar logs.`);
                }}
                className="w-full py-2 border border-outline-variant text-on-surface-variant hover:bg-surface-container rounded-lg text-xs font-bold transition-all"
              >
                Schedule Follow-up
              </button>
            </div>

          </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center h-64 text-center">
              <p className="text-sm text-on-surface-variant font-medium">No HCP selected or available</p>
            </div>
          )}
        </aside>

      </div>

      {/* Add New HCP Modal Popup */}
      {showAddHcpModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-outline-variant/20 p-6 w-full max-w-md animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-primary mb-1">Add Healthcare Professional</h3>
            <p className="text-xs text-on-surface-variant/80 mb-4">Register a new clinic doctor or researcher into PharmaFlow Clinical CRM.</p>
            
            <form onSubmit={handleAddHcpSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arthur Pendelton"
                  value={newHcpName}
                  onChange={(e) => setNewHcpName(e.target.value)}
                  className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Specialty</label>
                  <select
                    value={newHcpSpecialty}
                    onChange={(e) => setNewHcpSpecialty(e.target.value)}
                    className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
                  >
                    {specialties.filter(s => s !== 'All').map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Hospital / Facility Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. St. Mary's General"
                    value={newHcpFacility}
                    onChange={(e) => setNewHcpFacility(e.target.value)}
                    className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Tier Ranking</label>
                  <select
                    value={newHcpTier}
                    onChange={(e) => setNewHcpTier(e.target.value)}
                    className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
                  >
                    <option value="Tier 1">Tier 1 (High Priority)</option>
                    <option value="Tier 2">Tier 2 (Medium Priority)</option>
                    <option value="Tier 3">Tier 3 (General)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={newHcpLocation}
                    onChange={(e) => setNewHcpLocation(e.target.value)}
                    className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Detected Region</label>
                <div className="w-full p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs text-on-surface font-bold opacity-80 select-none">
                  {newHcpRegion || 'Detecting location...'}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddHcpModal(false)}
                  className="px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary font-bold rounded-xl text-xs shadow-md"
                >
                  Add Professional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
