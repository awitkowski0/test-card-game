import { useState } from "react";
import usePartySocket from "partysocket/react";
import { GameCanvas } from "./components/GameCanvas";
import type { Entity } from "./logic/schema";
import type { GameAction } from "./logic/actions";

// Types matching server state
type GameState = {
  entities: Entity[];
  turn: number;
  activePlayer: string;
  players: string[];
};

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const PARTY_HOST = "127.0.0.1:1999";

  const socket = usePartySocket({
    host: PARTY_HOST,
    room: "match-1", // hardcoded room for prototype
    onOpen() {
        // We will get ID from connection or server message
        // For now, rely on partysocket internals or server message
    },
    onMessage(event) {
      const msg = JSON.parse(event.data);
      if (msg.type === "sync") {
        setGameState(msg.state);
      } else if (msg.type === "welcome") {
        setPlayerId(msg.playerId);
        setGameState(msg.state);
      }
    },
  });

  // Removed the useEffect that was setting playerId from socket.id

  // Main action handler
  const handleAction = (action: GameAction) => {
      socket.send(JSON.stringify(action));
  };
  
  // Legacy handler (kept for strict board interactions if needed, but mostly unused now)
  const handleTileClick = (x: number, y: number) => {
    if (!gameState || !playerId) return;
    if (gameState.activePlayer !== playerId) return;
    if (!selectedCardId) return; // Must select card first

    handleAction({
        type: "PLAY_CARD",
        cardInstanceId: selectedCardId,
        x,
        y
    });
    setSelectedCardId(null); // Deselect after play attempt
  };
  
  const handleEndTurn = () => {
    if (!gameState || !playerId) return;
    if (gameState.activePlayer !== playerId) return;
    
    handleAction({ type: "END_TURN" });
  };

  if (!gameState) return <div className="text-white flex items-center justify-center h-screen">Connecting to server...</div>;

  return (
    <div className="w-full h-full relative">
        <div className="absolute top-4 left-4 z-10 text-white pointer-events-none">
            <h1 className="text-xl font-bold">Player: {playerId}</h1>
            <p>Turn: {gameState.turn}</p>
            <p className={gameState.activePlayer === playerId ? "text-green-400" : "text-neutral-400"}>
                Active Player: {gameState.activePlayer}
            </p>
        </div>
        
        {/* End Turn Button */}
        {gameState.activePlayer === playerId && (
             <button 
                className="absolute top-4 right-4 z-10 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow-lg pointer-events-auto"
                onClick={handleEndTurn}
             >
                End Turn
             </button>
        )}

        {/* Debug Reset Button */}
        <button 
            className="absolute bottom-4 right-4 z-10 bg-red-600 hover:bg-red-500 text-white px-2 py-1 text-xs rounded shadow-lg pointer-events-auto opacity-50 hover:opacity-100"
            onClick={() => handleAction({ type: "RESET_GAME" } as any)}
        >
            Reset Game
        </button>

        <GameCanvas
        entities={gameState.entities}
        playerId={playerId}
        onTileClick={handleTileClick}
        onSelectCard={setSelectedCardId}
        onAction={handleAction}
      />
    </div>
  );
}

export default App;
