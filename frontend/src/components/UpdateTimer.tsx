import { useState, useEffect } from "react";
import Tooltip from "@mui/material/Tooltip";

interface IProps {
  timestamp?: number;
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "Soon";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

const UPDATE_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours

const AnimatedClock = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className="h-5 w-5 sm:h-6 sm:w-6"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="2"
      className="text-sky-500/40"
    />
    <path
      d="M12 7V12L15 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-sky-400 origin-[12px_12px] animate-[spin_8s_linear_infinite]"
    />
    <path
      d="M12 12L12 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="text-sky-200 origin-[12px_12px] animate-[spin_60s_linear_infinite]"
    />
  </svg>
);

const UpdateTimer = ({ timestamp }: IProps) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timestamp) return null;

  const nextUpdateTarget = timestamp + UPDATE_INTERVAL_MS;
  const timeUntilNextUpdate = nextUpdateTarget - now;
  const isOverdue = timeUntilNextUpdate <= 0;

  const timeLeftString = isOverdue ? "Soon" : formatTimeLeft(timeUntilNextUpdate);
  const timeAgoString = formatTimeAgo(timestamp);

  const localTime = new Date(timestamp).toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="group relative overflow-hidden rounded-lg border border-sky-500/20 bg-slate-900/60 px-2 py-1 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all hover:border-sky-500/40 hover:bg-slate-900/80 hover:shadow-[0_8px_25px_-5px_rgba(14,165,233,0.15)] sm:px-3 sm:py-1.5">
      {/* Glow effect */}
      <div className="absolute -left-full top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-sky-500/10 to-transparent blur-md transition-all duration-1000 group-hover:left-full"></div>

      <div className="relative flex items-center gap-2 sm:gap-3">
        {/* Animated Icon */}
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/10 ring-1 ring-inset ring-sky-500/20 sm:h-9 sm:w-9">
          <AnimatedClock />
        </div>

        {/* Timers */}
        <div className="flex items-center gap-3 text-xs sm:gap-4 sm:text-sm">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider text-sky-500/90 sm:text-[10px] whitespace-nowrap">
              Next Update
            </span>
            <span className={`font-mono font-bold tracking-tight text-xs sm:text-sm ${isOverdue ? "text-amber-400" : "text-white"}`}>
              {timeLeftString}
            </span>
          </div>

          <div className="h-5 w-px bg-slate-700/50"></div>

          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 sm:text-[10px] whitespace-nowrap">
              Updated
            </span>
            <Tooltip title={localTime} arrow placement="top">
              <span className="cursor-help font-medium text-slate-300 transition-colors hover:text-sky-300 text-xs sm:text-sm whitespace-nowrap">
                {timeAgoString}
              </span>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateTimer;
