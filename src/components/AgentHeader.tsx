import React from 'react';
import { AgentStatus } from '../types';
import { Sparkles, Volume2, VolumeX, RefreshCw, Zap, Bot, Radio } from 'lucide-react';

interface AgentHeaderProps {
  status: AgentStatus;
  soundEnabled: boolean;
  onToggleSound: () => void;
  pacedMode: boolean;
  onTogglePaced: () => void;
  onReset: () => void;
}

export const AgentHeader: React.FC<AgentHeaderProps> = ({
  status,
  soundEnabled,
  onToggleSound,
  pacedMode,
  onTogglePaced,
  onReset,
}) => {
  let statusBadge = {
    text: 'Agent Standby',
    bg: 'bg-white/60 text-slate-700 border-white/80',
    dot: 'bg-slate-400',
    icon: <Radio className="w-3.5 h-3.5 text-slate-500" />,
  };

  switch (status) {
    case 'planning':
      statusBadge = {
        text: 'Analyzing Options...',
        bg: 'bg-rose-50/80 text-rose-800 border-rose-200/90 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
        dot: 'bg-rose-500 animate-ping',
        icon: <Zap className="w-3.5 h-3.5 text-rose-600 animate-pulse" />,
      };
      break;
    case 'confirmed':
      statusBadge = {
        text: 'Plan Active & Booked',
        bg: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/90 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        dot: 'bg-emerald-500',
        icon: <Sparkles className="w-3.5 h-3.5 text-emerald-600" />,
      };
      break;
    case 'disrupted':
      statusBadge = {
        text: 'Disruption Detected!',
        bg: 'bg-amber-50/90 text-amber-900 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]',
        dot: 'bg-amber-500 animate-ping',
        icon: <Radio className="w-3.5 h-3.5 text-amber-600 animate-bounce" />,
      };
      break;
    case 'replanning':
      statusBadge = {
        text: 'Replanning in Place...',
        bg: 'bg-rose-100/80 text-rose-900 border-rose-300 shadow-[0_0_20px_rgba(225,29,72,0.15)]',
        dot: 'bg-rose-500 animate-ping',
        icon: <Zap className="w-3.5 h-3.5 text-rose-600 animate-pulse" />,
      };
      break;
    case 'adapted':
      statusBadge = {
        text: 'Adapted & Resilient',
        bg: 'bg-teal-50/90 text-teal-900 border-teal-200/90 shadow-[0_0_15px_rgba(20,184,166,0.18)]',
        dot: 'bg-teal-500',
        icon: <Sparkles className="w-3.5 h-3.5 text-teal-600" />,
      };
      break;
    case 'error':
      statusBadge = {
        text: 'Fallback Protocol Active',
        bg: 'bg-rose-100/90 text-rose-900 border-rose-300',
        dot: 'bg-rose-500',
        icon: <Radio className="w-3.5 h-3.5 text-rose-600" />,
      };
      break;
  }

  return (
    <header className="sticky top-0 z-30 px-4 pt-3 pb-2 transition-all">
      <div className="max-w-7xl mx-auto liquid-glass rounded-2xl md:rounded-full px-4 py-2.5 sm:px-6 sm:py-3 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500/20 via-pink-400/20 to-white/70 border border-white/90 shadow-sm flex items-center justify-center text-rose-600 backdrop-blur-md">
              <Bot className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-sans">
                  Ripple
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 border border-rose-200/60">
                  Autonomous Agent
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal tracking-normal -mt-0.5">
                Real-time adaptive event planning & disruption recovery
              </p>
            </div>
          </div>

          {/* Action & Status Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Live Agent Status Pill */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-tight transition-all duration-300 backdrop-blur-md ${statusBadge.bg}`}
            >
              <div className="relative flex items-center justify-center">
                <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`}></span>
              </div>
              {statusBadge.icon}
              <span className="font-medium">{statusBadge.text}</span>
            </div>

            {/* Presentation Mode Toggle */}
            <button
              onClick={onTogglePaced}
              title={pacedMode ? 'Demo Pacing: ON (showing step-by-step thinking)' : 'Instant execution'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 active:scale-95 ${
                pacedMode
                  ? 'bg-rose-500/10 text-rose-800 border-rose-200/80 shadow-sm'
                  : 'bg-white/40 text-slate-600 border-white/60 hover:bg-white/70 hover:text-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden md:inline">{pacedMode ? 'Paced Demo' : 'Instant'}</span>
            </button>

            {/* Terminal Sound Toggle */}
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute audio' : 'Enable audio feedback'}
              className={`p-2 rounded-full border transition-all duration-200 active:scale-95 ${
                soundEnabled
                  ? 'bg-rose-500/15 text-rose-700 border-rose-200/90 shadow-sm'
                  : 'bg-white/40 text-slate-500 border-white/60 hover:bg-white/70 hover:text-slate-800'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Reset Simulation */}
            <button
              onClick={onReset}
              title="Reset simulation to initial state"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/50 hover:bg-white/80 text-slate-700 border border-white/80 shadow-sm hover:shadow transition-all duration-200 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

