/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Venue, LogEntry, AgentStatus } from './types';
import { INITIAL_VENUES } from './data/initialVenues';
import { TerminalLog } from './components/TerminalLog';
import { VenueGrid } from './components/VenueGrid';
import { AgentHeader } from './components/AgentHeader';
import { terminalAudio } from './utils/audio';
import {
  Play,
  IndianRupee,
  Calendar,
  AlertOctagon,
  Activity,
  Sliders,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  // Config & State
  const [eventName, setEventName] = useState<string>('Tech Fest Inauguration');
  const [budget, setBudget] = useState<number>(40000);
  const [venues, setVenues] = useState<Venue[]>(INITIAL_VENUES);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [cancelledVenueId, setCancelledVenueId] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [thinkingTag, setThinkingTag] = useState<string>('REASONING');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [pacedMode, setPacedMode] = useState<boolean>(true);
  const [disruptionCount, setDisruptionCount] = useState<number>(0);

  // Helper to generate precise timestamp [HH:MM:SS.mmm]
  const getTimestamp = (): string => {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `${time}.${ms}`;
  };

  // Helper to push a log
  const addLog = (
    level: 'grey' | 'green' | 'orange',
    tag: string,
    message: string,
    detail?: string
  ) => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: getTimestamp(),
      level,
      tag,
      message,
      detail,
    };
    setLogs((prev) => [...prev, entry]);
    if (level === 'orange') {
      terminalAudio.playDisruptionAlert();
    } else if (level === 'green') {
      terminalAudio.playSuccessTone();
    } else {
      terminalAudio.playKeyClick();
    }
  };

  // Sleep utility for paced demonstration
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // 1. START PLANNING
  const handleStartPlanning = async () => {
    if (agentStatus === 'planning' || agentStatus === 'replanning') return;

    setAgentStatus('planning');
    setIsThinking(true);
    setThinkingTag('PLANNING');
    setSelectedVenueId(null);
    setCancelledVenueId(null);

    // Initial logs as requested:
    // Log "Planning started", then reasoning steps, then selected venue with reason, then booking confirmed line
    addLog('grey', 'STATUS', 'Planning started');
    addLog(
      'grey',
      'INIT',
      `Target: "${eventName}" | Budget limit: ₹${budget.toLocaleString('en-IN')}`,
      `Candidate pool: ${venues.filter((v) => v.available).length} available venues.`
    );

    if (pacedMode) await sleep(300);

    addLog('grey', 'EVAL', `Evaluating candidate venues against ₹${budget.toLocaleString('en-IN')} budget ceiling...`);

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          budget,
          venues,
          isDisruption: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server responded with HTTP status ${response.status}`);
      }

      // Live paced trace output if model returned thought traces
      if (Array.isArray(data.trace) && data.trace.length > 0) {
        for (const step of data.trace) {
          if (pacedMode) await sleep(350);
          addLog('grey', 'REASON', step);
        }
      }

      const pickedVenue = venues.find(
        (v) => v.name.toLowerCase().trim() === (data.selectedVenue || '').toLowerCase().trim()
      ) || venues.find((v) => v.available && v.price <= budget);

      if (!pickedVenue) {
        throw new Error('No available venue found within specified budget criteria.');
      }

      if (pacedMode) await sleep(250);

      // Selected venue with reason (Green)
      addLog(
        'green',
        'DECISION',
        `Selected venue: ${pickedVenue.name}`,
        data.reason || `Fits strictly within budget of ₹${budget.toLocaleString('en-IN')}.`
      );

      if (pacedMode) await sleep(250);

      // Booking confirmed line (Green)
      addLog(
        'green',
        'CONFIRMED',
        `booking confirmed: ${pickedVenue.name} locked at ₹${pickedVenue.price.toLocaleString('en-IN')}. Capacity: ${pickedVenue.capacity} seats.`
      );

      setSelectedVenueId(pickedVenue.id);
      setAgentStatus('confirmed');
    } catch (err: any) {
      // Per spec: "If any model call fails, show the real error message directly in the log panel (in orange) instead of failing silently, and fall back to picking the first available venue so the demo never fully breaks."
      const realErrorMessage = err?.message || 'Agent reasoning model connection failed';
      addLog('orange', 'ERROR', `Model Execution Failed: ${realErrorMessage}`);

      if (pacedMode) await sleep(350);
      addLog(
        'orange',
        'FALLBACK',
        'Autonomous self-healing initiated: Selecting first available venue within budget...'
      );

      const fallbackVenue = venues.find((v) => v.available && v.price <= budget);
      if (fallbackVenue) {
        if (pacedMode) await sleep(300);
        addLog(
          'green',
          'DECISION',
          `Selected venue: ${fallbackVenue.name}`,
          `Fallback heuristic selected first compliant venue within ₹${budget.toLocaleString('en-IN')}.`
        );
        addLog(
          'green',
          'CONFIRMED',
          `booking confirmed: ${fallbackVenue.name} locked at ₹${fallbackVenue.price.toLocaleString('en-IN')}. Capacity: ${fallbackVenue.capacity} seats.`
        );
        setSelectedVenueId(fallbackVenue.id);
        setAgentStatus('confirmed');
      } else {
        addLog('orange', 'CRITICAL', 'No venues available within the current budget constraints.');
        setAgentStatus('error');
      }
    } finally {
      setIsThinking(false);
    }
  };

  // 2. TRIGGER DISRUPTION
  const handleTriggerDisruption = async () => {
    if (!selectedVenueId || agentStatus === 'planning' || agentStatus === 'replanning') return;

    const currentVenue = venues.find((v) => v.id === selectedVenueId);
    if (!currentVenue) return;

    // Mark current venue as unavailable
    const updatedVenues = venues.map((v) =>
      v.id === selectedVenueId ? { ...v, available: false } : v
    );
    setVenues(updatedVenues);
    setCancelledVenueId(selectedVenueId);
    setSelectedVenueId(null);
    setAgentStatus('disrupted');
    setDisruptionCount((prev) => prev + 1);
    setIsThinking(true);
    setThinkingTag('RE-PLANNING');

    // Exact prompt behavior:
    // Log a visible "DISRUPTION: cancelled" line (Orange)
    addLog(
      'orange',
      'DISRUPTION',
      `DISRUPTION: cancelled — ${currentVenue.name} booking has been cancelled!`,
      `Provider notification: Venue unavailable due to unforeseen emergency. Preserving operational state.`
    );

    if (pacedMode) await sleep(400);

    addLog(
      'grey',
      'ADAPT',
      'Dynamic re-planning triggered: Re-evaluating available options without pipeline reset...'
    );

    setAgentStatus('replanning');

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          budget,
          venues: updatedVenues,
          isDisruption: true,
          cancelledVenueName: currentVenue.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server responded with HTTP status ${response.status}`);
      }

      // Stream replacement reasoning trace
      if (Array.isArray(data.trace) && data.trace.length > 0) {
        for (const step of data.trace) {
          if (pacedMode) await sleep(350);
          addLog('grey', 'RE-EVAL', step);
        }
      }

      const replacementVenue = updatedVenues.find(
        (v) =>
          v.name.toLowerCase().trim() === (data.selectedVenue || '').toLowerCase().trim() &&
          v.available
      ) || updatedVenues.find((v) => v.available && v.price <= budget);

      if (!replacementVenue) {
        throw new Error('No alternative venues remain available within budget.');
      }

      if (pacedMode) await sleep(300);

      // Log new choice with reason (Green)
      addLog(
        'green',
        'DECISION',
        `Replacement venue selected: ${replacementVenue.name}`,
        data.reason || `Optimal alternative accommodating ${replacementVenue.capacity} pax at ₹${replacementVenue.price.toLocaleString('en-IN')}.`
      );

      if (pacedMode) await sleep(300);

      // Exact requirement: Log "re-booked — no restart, plan adjusted in place" (Green)
      addLog(
        'green',
        'CONFIRMED',
        `re-booked — no restart, plan adjusted in place.`
      );

      setSelectedVenueId(replacementVenue.id);
      setAgentStatus('adapted');
    } catch (err: any) {
      const realErrorMessage = err?.message || 'Agent reasoning model connection failed';
      addLog('orange', 'ERROR', `Replanning Model Execution Failed: ${realErrorMessage}`);

      if (pacedMode) await sleep(350);
      addLog(
        'orange',
        'FALLBACK',
        'Local recovery heuristic active: locking first available compliant replacement...'
      );

      const fallbackReplacement = updatedVenues.find((v) => v.available && v.price <= budget);
      if (fallbackReplacement) {
        if (pacedMode) await sleep(300);
        addLog(
          'green',
          'DECISION',
          `Replacement venue selected: ${fallbackReplacement.name}`,
          `Fallback heuristic locked next available compliant venue (₹${fallbackReplacement.price.toLocaleString('en-IN')}).`
        );
        addLog(
          'green',
          'CONFIRMED',
          `re-booked — no restart, plan adjusted in place.`
        );
        setSelectedVenueId(fallbackReplacement.id);
        setAgentStatus('adapted');
      } else {
        addLog(
          'orange',
          'EXHAUSTED',
          'All available venues exhausted or exceed the ₹' + budget.toLocaleString('en-IN') + ' budget.'
        );
        setAgentStatus('error');
      }
    } finally {
      setIsThinking(false);
    }
  };

  // Reset demo simulation
  const handleReset = () => {
    setVenues(INITIAL_VENUES);
    setSelectedVenueId(null);
    setCancelledVenueId(null);
    setAgentStatus('idle');
    setDisruptionCount(0);
    setIsThinking(false);
    addLog('grey', 'SYSTEM', 'Simulation reset: All venues restored to original availability.');
  };

  // Sound toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    terminalAudio.setEnabled(next);
    if (next) terminalAudio.playKeyClick();
  };

  const currentlyChosenVenue = venues.find((v) => v.id === selectedVenueId);
  const canDisrupt = (agentStatus === 'confirmed' || agentStatus === 'adapted') && selectedVenueId !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fcf7f9] via-[#f9eef2] to-[#f4e2e9] text-slate-800 font-sans flex flex-col selection:bg-rose-400/25 selection:text-rose-950 relative overflow-x-hidden">
      {/* Dynamic Ambient Background Lighting & Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft blush pink top orb */}
        <div className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-rose-300/35 via-pink-200/40 to-white/20 blur-3xl animate-float-slow opacity-80" />
        {/* Dusty rose & lavender ambient center-right orb */}
        <div className="absolute top-1/3 -right-28 w-[640px] h-[640px] rounded-full bg-gradient-to-bl from-pink-300/30 via-rose-200/35 to-purple-200/20 blur-3xl animate-float-reverse opacity-75" />
        {/* Light peach blush bottom orb */}
        <div className="absolute -bottom-40 left-1/3 w-[560px] h-[560px] rounded-full bg-gradient-to-t from-rose-200/40 via-pink-100/50 to-amber-100/25 blur-3xl opacity-70" />
      </div>

      {/* Header Container */}
      <div className="relative z-10">
        <AgentHeader
          status={agentStatus}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          pacedMode={pacedMode}
          onTogglePaced={() => setPacedMode(!pacedMode)}
          onReset={handleReset}
        />
      </div>

      {/* Main Hackathon Liquid Glass Cockpit */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-7">
        {/* Top Control Bar & Live Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Inputs & Action Card */}
          <div className="lg:col-span-2 liquid-glass rounded-3xl p-5 sm:p-7 shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-rose-900/5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                  <Sliders className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h2 className="text-sm font-bold tracking-tight text-slate-800">
                  Mission Parameters & Agent Controls
                </h2>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/70 text-slate-500 border border-white/80 shadow-xs">
                In-Place Replan Loop
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Event Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" />
                  Event Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={eventName}
                    disabled={agentStatus === 'planning' || agentStatus === 'replanning'}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. Tech Fest Inauguration"
                    className="w-full liquid-glass-input rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400/50 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Budget Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-rose-500" />
                    Budget (₹ INR)
                  </label>
                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setBudget(30000)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition active:scale-95 ${
                        budget === 30000
                          ? 'bg-rose-500/15 text-rose-800 border-rose-300 font-semibold shadow-xs'
                          : 'bg-white/50 text-slate-500 border-white/80 hover:bg-white/80 hover:text-slate-800'
                      }`}
                    >
                      ₹30k
                    </button>
                    <button
                      type="button"
                      onClick={() => setBudget(40000)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition active:scale-95 ${
                        budget === 40000
                          ? 'bg-rose-500/15 text-rose-800 border-rose-300 font-semibold shadow-xs'
                          : 'bg-white/50 text-slate-500 border-white/80 hover:bg-white/80 hover:text-slate-800'
                      }`}
                    >
                      ₹40k
                    </button>
                    <button
                      type="button"
                      onClick={() => setBudget(50000)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition active:scale-95 ${
                        budget === 50000
                          ? 'bg-rose-500/15 text-rose-800 border-rose-300 font-semibold shadow-xs'
                          : 'bg-white/50 text-slate-500 border-white/80 hover:bg-white/80 hover:text-slate-800'
                      }`}
                    >
                      ₹50k
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={budget}
                    disabled={agentStatus === 'planning' || agentStatus === 'replanning'}
                    onChange={(e) => setBudget(Number(e.target.value) || 0)}
                    step="1000"
                    min="10000"
                    max="100000"
                    className="w-full liquid-glass-input rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 font-bold font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400/50 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5">
              {/* Start Planning Button */}
              <button
                type="button"
                onClick={handleStartPlanning}
                disabled={agentStatus === 'planning' || agentStatus === 'replanning'}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-sans font-semibold text-xs sm:text-sm tracking-tight bg-gradient-to-r from-rose-600 via-rose-500 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/35 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                {agentStatus === 'planning' ? 'Planning in Progress...' : 'Start Planning'}
              </button>

              {/* Trigger Disruption Button */}
              <button
                type="button"
                onClick={handleTriggerDisruption}
                disabled={!canDisrupt}
                className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-sans font-semibold text-xs sm:text-sm tracking-tight transition-all duration-200 active:scale-95 cursor-pointer ${
                  canDisrupt
                    ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 animate-pulse'
                    : 'bg-white/40 border border-white/60 text-slate-400 cursor-not-allowed'
                }`}
              >
                <AlertOctagon className="w-4 h-4" />
                Trigger Disruption
              </button>
            </div>
          </div>

          {/* Real-Time Agent Telemetry Card */}
          <div className="liquid-glass rounded-3xl p-5 sm:p-7 flex flex-col justify-between shadow-xl transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-rose-900/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                    <Activity className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <h3 className="text-sm font-bold tracking-tight text-slate-800">
                    Telemetry & State
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 border border-rose-200/60 font-mono">
                  CYCLE #{disruptionCount + 1}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Active Venue Status */}
                <div className="p-3 rounded-2xl bg-white/50 border border-white/80 shadow-xs flex items-center justify-between">
                  <span className="text-slate-500 text-[11px] font-medium">Committed Venue:</span>
                  <span className="font-bold text-slate-900 text-right truncate max-w-[170px]">
                    {currentlyChosenVenue ? currentlyChosenVenue.name : '— Standby —'}
                  </span>
                </div>

                {/* Budget Utilization Meter */}
                <div className="p-3 rounded-2xl bg-white/50 border border-white/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Budget Committed:</span>
                    <span className="font-bold font-mono text-rose-900">
                      {currentlyChosenVenue
                        ? `₹${currentlyChosenVenue.price.toLocaleString('en-IN')} / ₹${budget.toLocaleString('en-IN')}`
                        : `₹0 / ₹${budget.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-rose-100/60 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500 shadow-xs"
                      style={{
                        width: currentlyChosenVenue
                          ? `${Math.min(100, (currentlyChosenVenue.price / budget) * 100)}%`
                          : '0%',
                      }}
                    ></div>
                  </div>
                </div>

                {/* Disruptions Handled */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 border border-white/80 shadow-xs text-[11px]">
                  <span className="text-slate-500 font-medium">In-Place Disruption Events:</span>
                  <span className={`font-bold font-mono ${disruptionCount > 0 ? 'text-amber-800' : 'text-slate-600'}`}>
                    {disruptionCount} {disruptionCount === 1 ? 'incident' : 'incidents'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-rose-900/5 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="font-medium">Model: gemini-3.8-flash</span>
              <span className="text-rose-700 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-xs"></span>
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* Venue Matrix View */}
        <VenueGrid
          venues={venues}
          budget={budget}
          selectedVenueId={selectedVenueId}
          cancelledVenueId={cancelledVenueId}
          isDisrupted={agentStatus === 'disrupted' || agentStatus === 'replanning'}
        />

        {/* Agent Reasoning Console Log Panel */}
        <div className="space-y-2">
          <TerminalLog
            logs={logs}
            isThinking={isThinking}
            currentThinkingTag={thinkingTag}
            onClearLogs={() => setLogs([])}
          />
        </div>
      </main>

      {/* Floating Translucent Liquid Glass Footer */}
      <footer className="relative z-10 border-t border-rose-900/5 py-4 px-6 text-center text-xs text-slate-500 font-sans backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-600">
            Ripple • Autonomous Planning & In-Place Disruption Recovery Agent
          </span>
          <span className="text-rose-700/80 text-[11px] font-medium">
            Liquid Glass UI Edition • Hackathon Automation Showcase
          </span>
        </div>
      </footer>
    </div>
  );
}
