import React from "react";
import { Typography } from "@mui/material";

const EmptyState = () => {
  return (
    <div className="relative mt-6 flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-slate-400/20 bg-gradient-to-br from-slate-900/60 to-slate-800/40 px-8 py-12 text-center text-sky-200">
      {/* Background Effect */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.08)_0%,transparent_50%)]" />

      {/* Illustration */}
      <div className="relative flex h-40 w-52 items-center justify-center">
        {/* Chart */}
        <div className="z-10 flex h-20 items-end gap-2 rounded-xl border border-slate-400/15 bg-slate-900/60 p-3">
          <div className="w-5 animate-[barGrow_2s_ease-in-out_infinite] rounded-t bg-gradient-to-b from-cyan-400 to-cyan-600 opacity-50" />
          <div className="w-5 animate-[barGrow_2s_ease-in-out_infinite_0.2s] rounded-t bg-gradient-to-b from-purple-400 to-purple-600 opacity-50" />
          <div className="w-5 animate-[barGrow_2s_ease-in-out_infinite_0.4s] rounded-t bg-gradient-to-b from-pink-400 to-pink-600 opacity-50" />
          <div className="w-5 animate-[barGrow_2s_ease-in-out_infinite_0.6s] rounded-t bg-gradient-to-b from-emerald-400 to-emerald-600 opacity-50" />
          <div className="w-5 animate-[barGrow_2s_ease-in-out_infinite_0.8s] rounded-t bg-gradient-to-b from-amber-400 to-amber-600 opacity-50" />
        </div>

        {/* Gears */}
        <div className="absolute right-2 top-0">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="absolute right-0 top-0 h-10 w-10 animate-[spin_4s_linear_infinite] text-cyan-400/60"
          >
            <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
          </svg>
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="absolute right-8 top-7 h-6 w-6 animate-[spin_3s_linear_infinite_reverse] text-purple-400/60"
          >
            <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
          </svg>
        </div>

        {/* Pulse Rings */}
        <div className="absolute h-44 w-44 animate-[ping_3s_ease-out_infinite] rounded-full border-2 border-cyan-400/20 opacity-0" />
        <div className="absolute h-44 w-44 animate-[ping_3s_ease-out_infinite_1.5s] rounded-full border-2 border-cyan-400/20 opacity-0" />
      </div>

      {/* Content */}
      <div className="z-10 flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-purple-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.8)]" />
          Updating
        </div>

        <Typography
          variant="h5"
          className="bg-gradient-to-br from-slate-50 to-indigo-300 bg-clip-text font-bold text-transparent"
        >
          No Data Yet
        </Typography>

        <Typography
          variant="body2"
          className="max-w-md leading-relaxed text-slate-400"
        >
          There is no data yet, but we’re aware of it and updating. Please check
          back soon.
        </Typography>

        <div className="mt-3 flex flex-wrap justify-center gap-3">
          {[
            { icon: "📊", text: "Fetching ladder positions", delay: "0.2s" },
            { icon: "🧮", text: "Computing percentile scores", delay: "0.4s" },
            { icon: "🏆", text: "Ranking players", delay: "0.6s" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex animate-[fadeIn_0.5s_ease-out_forwards] items-center gap-2 rounded-full border border-slate-400/15 bg-slate-900/60 px-4 py-2 text-xs text-slate-300 opacity-0"
              style={{ animationDelay: item.delay }}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes barGrow {
          0%, 100% { height: 20px; opacity: 0.5; }
          50% { height: 60px; opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default EmptyState;
