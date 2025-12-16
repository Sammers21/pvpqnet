import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Collapse } from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import axios from "axios";

const ServerStatusPopup = () => {
  const { data } = useQuery(
    ["serverStatus"],
    async () => {
      const response = await axios.get("/api/status");
      return response.data;
    },
    {
      refetchInterval: 5000, 
      retry: false,
    }
  );

  const show = Boolean(data?.loading);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1300] w-full">
      <Collapse in={show}>
        <div className="relative w-full overflow-hidden select-none shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
          {/* Animated Gradient Background */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900"
            style={{
              backgroundSize: "200% 200%",
              animation: "gradientMove 8s ease infinite",
            }}
          />

          {/* Glass Overlay & Texture */}
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-[6px]" />
          
          {/* Top Glow Line (Only top needed for bottom bar) */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent shadow-[0_0_10px_rgba(99,102,241,0.5)]" />

          {/* Content */}
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 py-4 px-4 text-white">
            
            {/* Animated Status Icon */}
            <div className="relative flex items-center justify-center p-1.5 rounded-full bg-indigo-500/20 ring-1 ring-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
               <SyncIcon 
                  sx={{ fontSize: 20 }} 
                  className="text-indigo-200 animate-[spin_3s_linear_infinite]" 
               />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-left">
              <span className="font-semibold text-sm tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-indigo-200 drop-shadow-sm">
                UPDATE IN PROGRESS
              </span>
              
              <div className="hidden sm:block w-[1px] h-4 bg-indigo-200/20" />
              
              <span className="text-slate-300 text-xs sm:text-sm font-medium tracking-wide">
                Some features (search, profiles) are temporarily syncing.
              </span>
            </div>
          </div>

          {/* Global styles for this component's specific animations */}
          <style>{`
            @keyframes gradientMove {
              0% { background-position: 0% 50% }
              50% { background-position: 100% 50% }
              100% { background-position: 0% 50% }
            }
          `}</style>
        </div>
      </Collapse>
    </div>
  );
};

export default ServerStatusPopup;
