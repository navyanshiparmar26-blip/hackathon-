import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types';
import { Copy, Check, Terminal, Trash2, ArrowDown, Activity, Sparkles, Filter } from 'lucide-react';

interface TerminalLogProps {
  logs: LogEntry[];
  isThinking: boolean;
  currentThinkingTag?: string;
  onClearLogs: () => void;
}

export const TerminalLog: React.FC<TerminalLogProps> = ({
  logs,
  isThinking,
  currentThinkingTag = 'REASONING',
  onClearLogs,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<'all' | 'grey' | 'green' | 'orange'>('all');

  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs, isThinking, autoScroll]);

  const handleCopy = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.tag}] ${l.message} ${l.detail ? `| ${l.detail}` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((l) => {
    if (filter === 'all') return true;
    return l.level === filter;
  });

  return (
    <div className="flex flex-col h-full liquid-glass-console rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300">
      {/* Console Glass Title Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white/40 border-b border-rose-900/5 text-xs text-slate-600 select-none backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          {/* iOS / Mac translucent dots */}
          <div className="flex items-center gap-1.5 mr-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80 inline-block border border-rose-300 shadow-xs"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block border border-amber-300 shadow-xs"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block border border-emerald-300 shadow-xs"></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-rose-600" />
            <span className="font-bold text-slate-800 tracking-tight font-sans text-xs sm:text-sm">
              Live Agent Reasoning Trace
            </span>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 border border-rose-200/60 ml-1">
            Real-Time Engine
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] bg-white/50 p-1 rounded-full border border-white/80 shadow-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-0.5 rounded-full transition font-medium ${
                filter === 'all'
                  ? 'bg-rose-500/15 text-rose-900 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilter('green')}
              className={`px-2.5 py-0.5 rounded-full transition font-medium ${
                filter === 'green'
                  ? 'bg-emerald-500/15 text-emerald-900 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              Decisions
            </button>
            <button
              onClick={() => setFilter('orange')}
              className={`px-2.5 py-0.5 rounded-full transition font-medium ${
                filter === 'orange'
                  ? 'bg-amber-500/20 text-amber-900 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-amber-700'
              }`}
            >
              Disruptions
            </button>
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Disable Auto-scroll' : 'Enable Auto-scroll'}
            className={`p-1.5 rounded-full border transition active:scale-95 ${
              autoScroll
                ? 'text-rose-700 bg-rose-500/10 border-rose-200/80 shadow-xs'
                : 'text-slate-400 bg-white/40 border-white/60 hover:text-slate-700'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            disabled={logs.length === 0}
            title="Copy trace log"
            className="p-1.5 rounded-full bg-white/40 border border-white/60 text-slate-500 hover:text-rose-700 hover:bg-white/80 transition active:scale-95 disabled:opacity-30"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            title="Clear logs"
            className="p-1.5 rounded-full bg-white/40 border border-white/60 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95 disabled:opacity-30"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Output Stream Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-2 select-text bg-white/30 min-h-[360px] max-h-[540px]"
      >
        {logs.length === 0 ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-3 select-none">
            <div className="w-12 h-12 rounded-2xl bg-white/60 border border-white/90 shadow-sm flex items-center justify-center text-rose-500/70">
              <Terminal className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-slate-600 font-medium text-sm">Autonomous planning trace standby</p>
              <p className="text-xs text-slate-400 mt-1">
                Configure your budget and click <span className="font-semibold text-rose-700 font-mono">[Start Planning]</span> to watch the agent reason in real time.
              </p>
            </div>
          </div>
        ) : (
          filteredLogs.map((entry) => {
            // Strict color-code compliance: grey for status, green for decisions/results, orange for disruptions/errors
            let textColor = 'text-slate-600';
            let tagBadge = 'bg-slate-100/90 text-slate-600 border-slate-200';
            let lineBg = 'hover:bg-white/50';

            if (entry.level === 'green') {
              textColor = 'text-emerald-950 font-semibold';
              tagBadge = 'bg-emerald-500/15 text-emerald-800 border-emerald-300/80 shadow-xs';
              lineBg = 'bg-emerald-50/40 border-l-2 border-emerald-500 hover:bg-emerald-50/70';
            } else if (entry.level === 'orange') {
              textColor = 'text-amber-950 font-bold';
              tagBadge = 'bg-amber-500/20 text-amber-900 border-amber-300 shadow-xs';
              lineBg = 'bg-amber-50/60 border-l-2 border-amber-500 hover:bg-amber-50/90';
            }

            return (
              <div
                key={entry.id}
                className={`group flex items-start gap-2.5 py-1.5 px-3 rounded-xl transition-all duration-150 leading-relaxed ${lineBg}`}
              >
                {/* Timestamp */}
                <span className="text-slate-400 text-[11px] select-none shrink-0 font-mono tracking-tighter pt-0.5">
                  [{entry.timestamp}]
                </span>

                {/* Tag */}
                <span
                  className={`text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-md border shrink-0 font-semibold ${tagBadge}`}
                >
                  {entry.tag}
                </span>

                {/* Message Body */}
                <div className={`flex-1 break-words text-xs sm:text-sm ${textColor}`}>
                  <span>{entry.message}</span>
                  {entry.detail && (
                    <div className="text-xs mt-1 font-normal text-slate-500 pl-2.5 border-l border-slate-300/60 font-sans">
                      {entry.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Live Thinking Indicator */}
        {isThinking && (
          <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl bg-rose-50/60 border border-rose-200/60 text-rose-900 font-sans text-xs animate-pulse">
            <span className="text-slate-400 font-mono text-[11px]">
              [{new Date().toTimeString().split(' ')[0]}.{String(new Date().getMilliseconds()).padStart(3, '0')}]
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-rose-500/15 text-rose-800 border border-rose-300 uppercase font-semibold">
              {currentThinkingTag}
            </span>
            <span className="flex items-center gap-2 font-medium text-rose-800">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Agent reasoning in progress...
            </span>
          </div>
        )}
      </div>

      {/* Terminal Footer Legend */}
      <div className="px-4 sm:px-6 py-2.5 bg-white/40 border-t border-rose-900/5 flex items-center justify-between text-xs text-slate-500 font-sans backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
            <span className="text-slate-600">Grey: Status Updates</span>
          </span>
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
            <span className="text-emerald-700 font-medium">Green: Decisions & Results</span>
          </span>
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shadow-xs"></span>
            <span className="text-amber-800 font-medium">Orange: Disruptions & Errors</span>
          </span>
        </div>
        <div className="text-slate-400 font-mono text-[11px]">
          {logs.length} entries
        </div>
      </div>
    </div>
  );
};

