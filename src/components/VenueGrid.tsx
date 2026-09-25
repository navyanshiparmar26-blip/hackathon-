import React from 'react';
import { Venue } from '../types';
import { Building2, Users, IndianRupee, CheckCircle2, XCircle, AlertTriangle, Sparkles, MapPin } from 'lucide-react';

interface VenueGridProps {
  venues: Venue[];
  budget: number;
  selectedVenueId: string | null;
  cancelledVenueId: string | null;
  isDisrupted: boolean;
}

export const VenueGrid: React.FC<VenueGridProps> = ({
  venues,
  budget,
  selectedVenueId,
  cancelledVenueId,
}) => {
  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between text-xs text-slate-600 px-1 font-sans">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-800 tracking-tight text-sm">
            Venue Registry & Live Status Matrix
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 border border-white/80 text-[11px] text-slate-600 shadow-sm">
          <span>Budget Ceiling:</span>
          <span className="text-rose-700 font-bold font-mono">
            ₹{budget.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {venues.map((venue) => {
          const isSelected = venue.id === selectedVenueId;
          const isCancelled = venue.id === cancelledVenueId || !venue.available;
          const exceedsBudget = venue.price > budget;

          let cardStyle = 'liquid-glass hover:-translate-y-1 hover:shadow-lg transition-all duration-300';
          let statusBadge = (
            <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-200/80 shadow-xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Available
            </span>
          );

          if (isCancelled) {
            cardStyle = 'bg-amber-50/50 backdrop-blur-xl border border-amber-200/60 opacity-85 shadow-sm';
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] text-amber-800 font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-300/80 animate-pulse">
                <XCircle className="w-3 h-3 text-amber-600" /> Cancelled
              </span>
            );
          } else if (isSelected) {
            cardStyle = 'liquid-glass-elevated ring-2 ring-rose-400/60 shadow-[0_16px_36px_rgba(244,63,94,0.18)] -translate-y-1';
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] text-rose-700 font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-300/90 shadow-xs">
                <Sparkles className="w-3 h-3 text-rose-600" /> Booked
              </span>
            );
          } else if (exceedsBudget) {
            cardStyle = 'bg-white/30 backdrop-blur-md border border-white/50 opacity-60';
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium px-2 py-0.5 rounded-full bg-slate-200/50 border border-slate-300/60">
                <AlertTriangle className="w-3 h-3 text-slate-400" /> Over Budget
              </span>
            );
          }

          return (
            <div
              key={venue.id}
              className={`p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden ${cardStyle}`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
                  <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[8px] font-bold tracking-wider uppercase py-0.5 text-center transform rotate-45 translate-x-4 translate-y-2.5 shadow-sm">
                    Active
                  </div>
                </div>
              )}

              <div>
                <div className="mb-2">
                  <h4
                    className={`text-xs sm:text-sm font-bold tracking-tight leading-snug ${
                      isSelected
                        ? 'text-rose-950 font-extrabold'
                        : isCancelled
                        ? 'text-slate-500 line-through'
                        : 'text-slate-800'
                    }`}
                  >
                    {venue.name}
                  </h4>
                </div>

                <div className="space-y-2 my-3 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <IndianRupee className="w-3.5 h-3.5 text-rose-500/70" /> Cost:
                    </span>
                    <span
                      className={`font-semibold font-mono ${
                        exceedsBudget ? 'text-slate-400 line-through' : 'text-slate-900 font-bold'
                      }`}
                    >
                      ₹{venue.price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Users className="w-3.5 h-3.5 text-rose-500/70" /> Capacity:
                    </span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {venue.capacity} pax
                    </span>
                  </div>
                </div>

                {venue.tagline && (
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3.5 line-clamp-2">
                    {venue.tagline}
                  </p>
                )}
              </div>

              <div className="pt-2.5 border-t border-rose-900/5 flex items-center justify-between mt-auto">
                <span className="text-[10px] text-slate-400 font-mono">
                  {venue.id}
                </span>
                {statusBadge}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

