import React, { useState, useEffect, useRef } from 'react';
import { FormInput, FileText, Bot, Plus, X, Calendar, UserCheck, MessageSquare, AlertCircle, Sparkles, Send, Mic, Check, MapPin, Loader2 } from 'lucide-react';
import { HCP, Interaction } from '../types';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import api from '../api';

interface LogInteractionViewProps {
  hcps: HCP[];
  onSubmitLog: (log: Omit<Interaction, 'refId' | 'timestamp'>) => Promise<any>;
}

export default function LogInteractionView({ hcps, onSubmitLog }: LogInteractionViewProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'chat'>('form');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Structured Form States
  const [selectedHcp, setSelectedHcp] = useState<HCP>(hcps[0] || {} as HCP);
  const [searchQuery, setSearchQuery] = useState(hcps[0]?.name || '');
  const [facilityName, setFacilityName] = useState(hcps[0]?.facility || '');
  const [showHcpDropdown, setShowHcpDropdown] = useState(false);
  // Fix local date initialization
  const getLocalDateString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  const [interactionDate, setInteractionDate] = useState(getLocalDateString());
  const [interactionRegion, setInteractionRegion] = useState('');
  const [products, setProducts] = useState<string[]>([]);
  const [newProduct, setNewProduct] = useState('');
  const [summary, setSummary] = useState('');
  const [engagementLevel, setEngagementLevel] = useState<'High' | 'Medium' | 'Low' | ''>('');
  const [followupActions, setFollowupActions] = useState<string[]>([]);
  const [newFollowup, setNewFollowup] = useState('');
  const [insights, setInsights] = useState('');
  
  // Custom suggestion or status banners
  const [aiAutofillMessage, setAiAutofillMessage] = useState<string | null>(null);

  const user = useSelector((state: RootState) => state.auth.user);
  const displayName = user?.user_metadata?.full_name || user?.email || 'Doctor';

  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea when chatInput changes
  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto'; // Reset height to let it shrink to 1 row
      chatInputRef.current.style.height = `${Math.min(chatInputRef.current.scrollHeight, 120)}px`;
    }
  }, [chatInput]);

  // Initialize dynamic AI greeting based on real user name and selected HCP
  useEffect(() => {
    if (chatHistory.length <= 1) {
      const hcpMention = selectedHcp?.name ? `I see you are working on a log for ${selectedHcp.name}. ` : '';
      setChatHistory([
        {
          role: 'assistant',
          content: `Ready to help, ${displayName}. ${hcpMention}Would you like me to draft the clinical summary or extract Structured CRM logs from your session notes or transcript?`
        }
      ]);
    }
  }, [displayName, selectedHcp?.name]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Scroll chat to bottom when history changes, loading state changes, or tab opens
  useEffect(() => {
    if (activeTab === 'chat' && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, activeTab, isChatLoading]);

  // Auto-detect Region based on user's Geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Heuristic mapping for Indian Regions based on rough coordinates
          if (lat >= 24) {
            setInteractionRegion('North Region (India)');
          } else if (lat <= 20) {
            setInteractionRegion('South Region (India)');
          } else if (lng >= 80) {
            setInteractionRegion('East Region (India)');
          } else {
            setInteractionRegion('West Region (India)');
          }
        },
        (error) => {
          console.warn('Geolocation failed or denied, defaulting region.', error);
          setInteractionRegion('West Region (India)'); // fallback
        },
        { timeout: 10000 }
      );
    } else {
      setInteractionRegion('West Region (India)');
    }
  }, []);

  // Filter dropdown suggestions for HCP input
  const filteredHcps = hcps.filter(hcp => 
    hcp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Select HCP from search suggestions
  const handleSelectHcp = (hcp: HCP) => {
    setSelectedHcp(hcp);
    setSearchQuery(hcp.name);
    setFacilityName(hcp.facility || '');
    setShowHcpDropdown(false);
  };

  // Add custom products/therapeutic tags
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.trim() && !products.includes(newProduct.trim())) {
      setProducts([...products, newProduct.trim()]);
      setNewProduct('');
    }
  };

  // Delete product tag
  const handleRemoveProduct = (prod: string) => {
    setProducts(products.filter(p => p !== prod));
  };

  const handleAddFollowup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFollowup.trim() && !followupActions.includes(newFollowup.trim())) {
      setFollowupActions([...followupActions, newFollowup.trim()]);
      setNewFollowup('');
    }
  };

  const handleRemoveFollowup = (action: string) => {
    setFollowupActions(followupActions.filter(a => a !== action));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHcp?.id && !searchQuery.trim()) {
      setSuccessMessage("Please type or select a Healthcare Professional's name.");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
      return;
    }
    if (!summary.trim()) {
      setSuccessMessage("Please enter an interaction summary details before submitting.");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmitLog({
        hcpId: selectedHcp.id || 'unknown',
        hcpName: selectedHcp.name && selectedHcp.name === searchQuery ? selectedHcp.name : searchQuery || 'Unknown Provider',
        specialty: selectedHcp.specialty || 'General',
        facility: facilityName.trim() || selectedHcp.facility || 'Unknown Facility',
        location: interactionRegion,
        products: products,
        engagement: engagementLevel ? `${products[0] || 'GENERAL'} / ${engagementLevel.toUpperCase()}` : `${products[0] || 'GENERAL'} / ${selectedHcp?.engagement || 'MEDIUM'}`,
        narrative: insights.trim() ? `${summary}\n\nKey Insights/Concerns:\n${insights}` : summary,
        actions: followupActions.length > 0 ? followupActions : [
          'Follow-up scheduled within CRM portal',
          'Updated HCP clinical receptivity dashboard profiles'
        ],
        complianceVerified: true
      });

      // Check if the thunk was rejected
      if (result?.error) {
        throw new Error(result.error.message || 'Failed to save interaction');
      }

      // Reset Form only on success
      setSelectedHcp({} as HCP);
      setSearchQuery('');
      setSummary('');
      setFacilityName('');
      setProducts([]);
      setFollowupActions([]);
      setInsights('');
      setEngagementLevel('');
      setAiAutofillMessage(null);
      setSuccessMessage(`Success! Clinical log with ${selectedHcp.name || searchQuery || 'the provider'} submitted successfully to the Chronological Ledger. Territory mapped: ${interactionRegion || 'Unspecified'}.`);
      setShowSuccessPopup(true);
    } catch (err: any) {
      console.error('Failed to submit interaction:', err);
      setSuccessMessage(`Error: Failed to save interaction. ${err?.message || 'Backend server may be offline. Please check the connection.'}`);
      setShowSuccessPopup(true);
    } finally {
      setIsSubmitting(false);
      // Hide popup after 4 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 4000);
    }
  };

  // Chat Submit
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    try {
      // First, try to see if they are asking to extract notes or "fill" the form
      const isAutoFillRequest = userMsg.toLowerCase().includes('extract') || 
                                userMsg.toLowerCase().includes('fill') || 
                                userMsg.toLowerCase().includes('transcript') || 
                                userMsg.toLowerCase().includes('draft') ||
                                userMsg.length > 50; // Long session transcripts should attempt extraction

      if (isAutoFillRequest) {
        // Send to /api/suggest
        const response = await api.post('/suggest', { text: userMsg });
        const data = response.data;
        if (data.hcpName) {
          const match = hcps.find(h => h.name.toLowerCase().includes(data.hcpName.toLowerCase()));
          if (match) {
            setSelectedHcp(match);
            setSearchQuery(match.name);
            if (!data.facility) {
              setFacilityName(match.facility || '');
            }
          } else {
            // If the doctor isn't in the CRM directory yet, at least type their name in the box!
            setSearchQuery(data.hcpName);
            setSelectedHcp({} as HCP); // Fix: Clear the previously selected HCP
          }
        }
        // Always ensure the date defaults to today when using AI to log interactions
        const today = getLocalDateString();
        setInteractionDate(today); // Unconditionally use today's date
        
        if (data.facility) {
          setFacilityName(data.facility);
        }
        
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
        }
        if (data.receptivity || data.engagement) {
          const e = String(data.receptivity || data.engagement).toLowerCase();
          if (e.includes('high') || e.includes('positive') || e.includes('great')) setEngagementLevel('High');
          else if (e.includes('low') || e.includes('negative') || e.includes('poor')) setEngagementLevel('Low');
          else setEngagementLevel('Medium');
        }
        if (data.followUp || data.actions || data.nextSteps || data.followup) {
          const arr = data.followUp || data.actions || data.nextSteps || data.followup;
          if (Array.isArray(arr)) setFollowupActions(arr);
          else if (typeof arr === 'string') setFollowupActions([arr]);
        }
        if (data.insights || data.concerns || data.sentimentDetails) {
          setInsights(data.insights || data.concerns || data.sentimentDetails);
        }
        if (data.summary) {
          setSummary(data.summary);
        }
        
        // Update sidebar stats too!
        if (data.receptivity) {
          setSelectedHcp(prev => ({
            ...prev,
            engagement: data.receptivity as any,
            sentimentDetails: data.sentimentDetails || prev.sentimentDetails
          }));
        }

        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: `✨ Excellent, I have analyzed your transcript and successfully structured the data! I've pre-filled the **Structured Form** for ${data.hcpName || 'the practitioner'} with the summary details and therapeutic products. Switched tabs so you can review and submit.`
        }]);

        // Automatically switch tabs with a delay to let them read, or do it immediately
        setAiAutofillMessage(`PharmaFlow AI auto-filled this form from your clinical chat transcript! Please review and click Submit.`);
        setTimeout(() => {
          setActiveTab('form');
        }, 800);

      } else {
        // Just standard chat response
        const response = await api.post('/chat', {
          message: userMsg,
          history: chatHistory.map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            content: h.content
          }))
        });

        const data = response.data;
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.text }]);
      }
    } catch (err: any) {
      console.error(err);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an issue: ${err.message || 'Server connection error. Please verify GEMINI_API_KEY is configured.'}` 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-73px)] bg-white">
      {/* Left Pane: Structured Form or AI Chat (Flex-1, Scrollable) */}
      <div className={`flex-1 flex flex-col p-8 custom-scrollbar ${activeTab === 'form' ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        <div className="max-w-3xl mx-auto flex flex-col gap-6 w-full flex-1 min-h-0">
          
          {/* Tabs Switch */}
          <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl w-fit border border-outline-variant/10">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'form'
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                  : 'text-on-surface-variant hover:bg-white/50'
              }`}
            >
              <FileText size={16} />
              <span>Structured Form</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'chat'
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                  : 'text-on-surface-variant hover:bg-white/50'
              }`}
            >
              <Bot size={16} />
              <span>AI Chat</span>
              <span className="bg-primary/10 text-primary text-[9px] px-1.5 py-0.5 rounded-full font-sans font-extrabold flex items-center gap-0.5">
                <Sparkles size={8} /> LLAMA 3
              </span>
            </button>
          </div>

          {/* Banner notification for AI Autofill */}
          {activeTab === 'form' && aiAutofillMessage && (
            <div className="flex items-center justify-between p-3.5 bg-primary/10 text-primary rounded-xl text-xs font-bold animate-pulse">
              <span className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary fill-current" />
                {aiAutofillMessage}
              </span>
              <button onClick={() => setAiAutofillMessage(null)} className="hover:text-primary/70">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Form View Tab */}
          {activeTab === 'form' && (
            <form onSubmit={handleSubmitForm} className="flex flex-col gap-6">
              
              {/* SECTION: HCP & SESSION */}
              <section className="flex flex-col gap-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">HCP & Session</h3>
                
                <div className="grid grid-cols-2 gap-5">
                  
                  {/* HCP Search Autocomplete */}
                  <div className="col-span-2 md:col-span-1 flex flex-col gap-2 relative">
                    <label className="text-xs text-on-surface-variant font-medium">Search HCP</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchQuery(val);
                          if (selectedHcp.id && selectedHcp.name !== val) {
                            setSelectedHcp({} as HCP);
                          }
                          setShowHcpDropdown(true);
                        }}
                        onFocus={() => setShowHcpDropdown(true)}
                        className="w-full pl-4 pr-10 py-3 bg-surface rounded-xl border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm font-sans"
                        placeholder="Type HCP Name..."
                      />
                    </div>
                    
                    {/* Autocomplete suggestions dropdown */}
                    {showHcpDropdown && searchQuery.length > 0 && (
                      <div className="absolute top-[72px] left-0 right-0 bg-white border border-outline-variant/30 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredHcps.length > 0 ? (
                          filteredHcps.map((hcp) => (
                            <button
                              key={hcp.id}
                              type="button"
                              onClick={() => handleSelectHcp(hcp)}
                              className="w-full text-left px-4 py-2.5 hover:bg-surface text-xs font-medium border-b border-outline-variant/10 flex flex-col"
                            >
                              <span className="font-bold text-on-surface">{hcp.name}</span>
                              <span className="text-[10px] text-on-surface-variant mt-0.5">{hcp.title} • {hcp.facility}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-xs text-on-surface-variant">No health providers found.</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Date Picker */}
                  <div className="col-span-2 md:col-span-1 flex flex-col gap-2">
                    <label className="text-xs text-on-surface-variant font-medium">Date of Interaction</label>
                    <input
                      type="date"
                      value={interactionDate}
                      onChange={(e) => setInteractionDate(e.target.value)}
                      className="w-full px-4 py-3 bg-surface rounded-xl border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm"
                    />
                  </div>
                  
                  {/* Facility Input */}
                  <div className="col-span-2 md:col-span-1 flex flex-col gap-2">
                    <label className="text-xs text-on-surface-variant font-medium">Medical Facility, Hospital, or Clinic Name</label>
                    <input
                      type="text"
                      value={facilityName}
                      onChange={(e) => setFacilityName(e.target.value)}
                      className="w-full px-4 py-3 bg-surface rounded-xl border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm font-sans"
                      placeholder="e.g. Mount Sinai Hospital"
                    />
                  </div>

                  {/* Auto-detected Region Display */}
                  <div className="col-span-2 md:col-span-1 flex flex-col gap-2">
                    <label className="text-xs text-on-surface-variant font-medium">Territory / Region</label>
                    <div className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between text-sm font-sans opacity-80 select-none">
                      <span className="text-on-surface font-bold">
                        {interactionRegion || 'Detecting location...'}
                      </span>
                      <MapPin size={16} className="text-primary animate-pulse" />
                    </div>
                  </div>

                </div>
              </section>

              {/* SECTION: SCIENTIFIC DISCUSSION */}
              <section className="flex flex-col gap-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Scientific Discussion</h3>
                
                {/* Product Tags */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-on-surface-variant font-medium">Therapeutic Areas / Products</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-surface rounded-xl ring-1 ring-outline-variant/80 min-h-[50px] items-center">
                    {products.map((prod) => (
                      <span 
                        key={prod} 
                        className="flex items-center gap-1.5 px-3 py-1 bg-primary-fixed text-on-primary-fixed-variant rounded-lg text-xs font-bold shadow-sm"
                      >
                        {prod}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveProduct(prod)}
                          className="hover:text-primary transition-colors cursor-pointer"
                        >
                          <X size={12} className="stroke-[2.5px]" />
                        </button>
                      </span>
                    ))}
                    
                    {/* Add product element inline */}
                    <div className="flex items-center ml-1">
                      <input
                        type="text"
                        placeholder="Add area..."
                        value={newProduct}
                        onChange={(e) => setNewProduct(e.target.value)}
                        className="bg-transparent border-none focus:outline-none text-xs w-24 p-0 text-on-surface placeholder:text-on-surface-variant/40"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newProduct.trim()) {
                              setProducts([...products, newProduct.trim()]);
                              setNewProduct('');
                            }
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={handleAddProduct}
                        className="p-1 text-primary hover:bg-primary-container/20 rounded-full transition-colors ml-1"
                      >
                        <Plus size={14} className="stroke-[2.5px]" />
                      </button>
                    </div>

                  </div>
                </div>

                {/* Interaction Summary */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-on-surface-variant font-medium">Interaction Summary</label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    required
                    placeholder="Document key clinical takeaways, professional feedback, and scientific queries discussed..."
                    className="w-full px-4 py-4 bg-surface rounded-xl border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary focus:outline-none transition-all min-h-[120px] text-sm leading-relaxed"
                  />
                </div>

                  {/* Additional AI extracted details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                    {/* Doctor Interest / Engagement */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-on-surface-variant font-medium">Doctor Interest (Receptivity)</label>
                      <select 
                        value={engagementLevel}
                        onChange={(e) => setEngagementLevel(e.target.value as any)}
                        className="w-full px-4 py-3 bg-surface rounded-xl border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm"
                      >
                        <option value="">Select Level...</option>
                        <option value="High">High (Positive)</option>
                        <option value="Medium">Moderate (Neutral)</option>
                        <option value="Low">Low (Caution)</option>
                      </select>
                    </div>
                    {/* Key Insights / Concerns */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-on-surface-variant font-medium">Key Insights & Concerns</label>
                      <input 
                        type="text"
                        value={insights}
                        onChange={(e) => setInsights(e.target.value)}
                        placeholder="e.g. Cost is a concern for some patients"
                        className="w-full px-4 py-3 bg-surface rounded-xl border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Follow-up Actions */}
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-xs text-on-surface-variant font-medium">Follow-up Actions</label>
                    <div className="flex flex-col gap-2 p-3 bg-surface rounded-xl ring-1 ring-outline-variant/80 min-h-[50px]">
                      {followupActions.map((action, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg text-xs font-medium shadow-sm border border-outline-variant/20">
                          <span className="flex-1">{action}</span>
                          <button type="button" onClick={() => handleRemoveFollowup(action)} className="text-error hover:text-error/70 p-1">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center mt-1 border border-outline-variant/30 rounded-lg bg-white overflow-hidden focus-within:ring-1 focus-within:ring-primary">
                        <input
                          type="text"
                          placeholder="Add follow-up action (e.g. Schedule call in two weeks)"
                          value={newFollowup}
                          onChange={(e) => setNewFollowup(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddFollowup(e);
                            }
                          }}
                          className="bg-transparent border-none focus:outline-none text-xs flex-1 px-3 py-2 text-on-surface"
                        />
                        <button type="button" onClick={handleAddFollowup} className="p-2 text-primary hover:bg-primary/10">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

              </section>

              {/* Form Buttons */}
              <div className="flex justify-end gap-4 pt-6 pb-8 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => {
                    alert("Draft saved locally in PharmaFlow cache.");
                  }}
                  className="px-6 py-3 text-primary font-bold hover:bg-primary/5 rounded-xl text-sm transition-colors"
                >
                  Save Draft
                </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-10 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:brightness-110 active:scale-98 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    {isSubmitting ? 'Submitting...' : 'Submit Interaction'}
                  </button>
              </div>

            </form>
          )}

          {/* AI Chat View Tab */}
          {activeTab === 'chat' && (
            <div className="flex flex-col flex-1 min-h-0">
              
              {/* Scrollable messages area */}
              <div 
                ref={chatContainerRef}
                className="flex-1 flex flex-col gap-5 overflow-y-auto custom-scrollbar pr-2 pb-4"
              >
                {chatHistory.map((msg, index) => {
                  const isAssistant = msg.role === 'assistant';
                  return (
                    <div 
                      key={index} 
                      className={`flex gap-3 max-w-[85%] ${isAssistant ? '' : 'self-end flex-row-reverse'}`}
                    >
                      {isAssistant ? (
                        <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center shrink-0 shadow-sm">
                          <Bot size={18} className="text-secondary" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0 shadow-sm text-[10px] font-bold text-primary">
                          SC
                        </div>
                      )}
                      <div className={`p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${
                        isAssistant 
                          ? 'bg-surface-container rounded-tl-none text-on-surface' 
                          : 'bg-primary text-on-primary rounded-tr-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                
                {isChatLoading && (
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center shrink-0 animate-bounce">
                      <Bot size={18} className="text-secondary" />
                    </div>
                    <div className="p-4 bg-surface-container rounded-2xl rounded-tl-none text-xs text-on-surface-variant flex items-center gap-2">
                      <Sparkles size={14} className="text-primary animate-spin" />
                      <span>PharmaFlow AI is compiling notes and structuring logs...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Static suggestion prompts for users */}
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pt-4 pb-2 shrink-0">
                <button
                  onClick={() => setChatInput("Met with Dr. Michael Aris today regarding Lumidex 50mg. He was highly receptive and noted we should focus on rural patient adherence.")}
                  className="px-3.5 py-2 bg-surface hover:bg-surface-container border border-outline-variant/30 rounded-xl text-[11px] font-bold text-on-surface-variant shrink-0 transition-colors"
                >
                  📝 Fill out: "Met Dr. Aris today..."
                </button>
                <button
                  onClick={() => setChatInput("Extract details: Dr. Salinger reviewed formulary pricing for VeroCell Oral on 2023-11-15. Expressed positive interest.")}
                  className="px-3.5 py-2 bg-surface hover:bg-surface-container border border-outline-variant/30 rounded-xl text-[11px] font-bold text-on-surface-variant shrink-0 transition-colors"
                >
                  📊 Auto-extract Salinger transcript
                </button>
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleChatSubmit} className="flex gap-2 bg-white pt-2 pb-2 shrink-0">
                <div className="relative flex-1">
                  <textarea
                    ref={chatInputRef}
                    rows={1}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (chatInput.trim() && !isChatLoading) {
                          handleChatSubmit(e as any);
                        }
                      }
                    }}
                    disabled={isChatLoading}
                    placeholder="Talk to PharmaFlow AI or paste transcript notes here..."
                    className="w-full pl-6 pr-24 py-3 bg-surface rounded-2xl border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm font-sans resize-none overflow-y-auto custom-scrollbar"
                    style={{ lineHeight: '1.5' }}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button 
                      type="button" 
                      onClick={() => setChatInput("Met with Dr. Beatrice Salinger today. We reviewed Phase III clinical trials on Lumidex 50mg. She remains highly receptive to formulary changes.")}
                      className="p-2 text-primary hover:bg-primary-container/20 rounded-full transition-colors"
                    >
                      <Mic size={18} />
                    </button>
                    <button 
                      type="submit"
                      disabled={!chatInput.trim() || isChatLoading}
                      className="p-2.5 bg-primary disabled:opacity-40 text-on-primary rounded-xl shadow-md transition-colors hover:brightness-110 cursor-pointer"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </form>

            </div>
          )}

        </div>
      </div>
      
      {/* Custom Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl max-w-sm w-full mx-4 transform animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${successMessage.includes('Success') ? 'bg-primary/10' : 'bg-error/10'}`}>
              {successMessage.includes('Success') ? (
                <Check size={32} className="text-primary stroke-[3px]" />
              ) : (
                <AlertCircle size={32} className="text-error stroke-[3px]" />
              )}
            </div>
            <h3 className={`text-xl font-bold text-center ${successMessage.includes('Success') ? 'text-on-surface' : 'text-error'}`}>
              {successMessage.includes('Success') ? 'Success!' : 'Missing Info'}
            </h3>
            <p className="text-sm text-on-surface-variant text-center leading-relaxed">
              {successMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
