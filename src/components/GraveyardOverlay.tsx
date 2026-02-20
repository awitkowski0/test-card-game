import React from "react";
import type { Entity } from "../logic/schema";

interface GraveyardOverlayProps {
    owner: string; 
    entities: Entity[]; 
    onClose: () => void;
}

export const GraveyardOverlay: React.FC<GraveyardOverlayProps> = ({ owner, entities, onClose }) => {
    const graveCards = entities.filter(e => e.owner === owner && e.inGraveyard);
    
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
            <div className="relative w-full max-w-5xl p-8">
                <button 
                  className="absolute top-0 right-0 m-4 text-white text-2xl hover:text-red-400"
                  onClick={onClose}
                >
                    ✕
                </button>
                <h2 className="text-white text-2xl font-bold mb-8 text-center">{owner === "p1" ? "P1" : "P2"} Graveyard</h2>
                
                {graveCards.length === 0 ? (
                    <p className="text-white/30 text-center italic">No fallen heroes yet.</p>
                ) : (
                    <div className="flex flex-wrap justify-center gap-6 overflow-y-auto max-h-[70vh] p-4">
                        {graveCards.map((card) => (
                            <div key={card.id} className="w-48 h-64 bg-neutral-800 rounded-lg border border-white/20 relative group shadow-2xl transition-transform hover:scale-110">
                                <img 
                                    src={card.textures?.front || `https://placehold.co/400x600?text=${card.name}`} 
                                    className="w-full h-full object-cover rounded-lg opacity-80"
                                />
                                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                                    <div className="flex justify-between">
                                        <span className="bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold border border-yellow-500/50">{card.cost}</span>
                                        <span className="text-white font-bold drop-shadow-lg">{card.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="bg-red-900/90 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold border border-red-500/50">{card.attack}</span>
                                        <span className="bg-green-900/90 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold border border-green-500/50">{card.health}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
