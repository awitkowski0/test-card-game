import { useState, useMemo } from "react";
import usePartySocket from "partysocket/react";
import { GameCanvas } from "./components/GameCanvas";
import { CreativeHUD } from "./components/HUD";
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
    room: "match-1", 
    onMessage(event) {
      const msg = JSON.parse(event.data);
      if (msg.type === "sync" || msg.type === "welcome") {
        setGameState(msg.state);
        if (msg.type === "welcome") setPlayerId(msg.playerId);
      }
    },
  });

  const handleAction = (action: GameAction) => {
      socket.send(JSON.stringify(action));
  };

  const handleEndTurn = () => {
    if (gameState?.activePlayer === playerId) handleAction({ type: "END_TURN" });
  };

  // Main interaction handler
  const handleTileClick = (x: number, y: number) => {
    if (gameState?.activePlayer === playerId && selectedCardId) {
        handleAction({ type: "PLAY_CARD", cardInstanceId: selectedCardId, x, y });
        setSelectedCardId(null);
    }
  };

  if (!gameState) return <div className="text-white flex items-center justify-center h-screen bg-black">Connecting to Central Core...</div>;

  const myPlayerEntity = gameState?.entities.find(e => e.isPlayer && e.owner === playerId);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-black">
        <div className="absolute inset-0 z-10">
            <GameCanvas
                entities={gameState.entities}
                playerId={playerId}
                turn={gameState.turn}
                activePlayer={gameState.activePlayer}
                actions={myPlayerEntity?.actions ?? 0}
                onTileClick={handleTileClick}
                onSelectCard={setSelectedCardId}
                onAction={handleAction}
                onEndTurn={handleEndTurn}
            />
        </div>
    </div>
  );
}

export default App;
