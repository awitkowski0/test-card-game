import React from "react";

interface HUDProps {
  turn: number;
  activePlayer: string;
  playerId: string;
  actions: number;
  onEndTurn: () => void;
}

export const CreativeHUD: React.FC<HUDProps> = ({ turn, activePlayer, playerId, actions, onEndTurn }) => {
  const isMyTurn = activePlayer === playerId;

  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
      {/* Top Bar - Game State */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Turn</span>
              <span className="text-white text-xl font-black leading-none">{turn}</span>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Active Phase</span>
              <span className={`text-sm font-bold uppercase ${isMyTurn ? "text-blue-400" : "text-red-400"}`}>
                {activePlayer === "p1" ? "First" : "Second"} Player
              </span>
            </div>
          </div>
        </div>

        {/* Player Name / ID */}
        <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2">
           <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold block mb-1">Commander</span>
           <span className="text-white font-bold">{playerId}</span>
        </div>
      </div>

      {/* Bottom Bar - Actions & Turn End */}
      <div className="flex justify-between items-end">
        {/* Actions Indicator */}
        <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-4 h-4 rounded-full border-2 transform rotate-45 transition-all duration-300 ${
                            i < actions 
                            ? "bg-blue-500 border-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.8)] scale-110" 
                            : "bg-transparent border-white/10 scale-90"
                        }`}
                    />
                ))}
            </div>
            <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold text-center">Energy Reserve</span>
        </div>

        {/* End Turn Button Area */}
        <div className="flex flex-col items-center gap-3">
            {isMyTurn && (
                <button 
                    onClick={onEndTurn}
                    className="pointer-events-auto group relative flex items-center justify-center p-[2px] rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                    {/* Animated Border */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 animate-gradient-x" />
                    
                    <div className="relative bg-neutral-900 rounded-full px-10 py-3 flex items-center gap-3">
                        <span className="text-white font-black uppercase tracking-widest text-sm">Initiate Attack</span>
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    </div>
                </button>
            )}
            {!isMyTurn && (
                 <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-8 py-2">
                    <span className="text-white/20 font-bold uppercase tracking-widest text-xs italic">Awaiting Rival...</span>
                 </div>
            )}
        </div>
      </div>

      {/* Styles for the unique animations */}
      <style>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
};
