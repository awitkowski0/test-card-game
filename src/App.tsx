import { useState, useEffect } from "react";
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
        // Hacky way to get ID if not set, usually server sends "welcome" or we use socket.id
        // But socket.id might be ready after connection.
      }
    },
  });

  useEffect(() => {
    // partysocket doesn't expose .id directly on the hook return effectively sometimes
    // But we can check socket property
    if (socket.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlayerId(socket.id);
    }
  }, [socket, gameState]); 
  // Update when gameState changes as socket.id might resolve then? 
  // Actually better to handle "assign_id" message from server, but for now socket.id is consistent.

  const handleTileClick = (x: number, y: number) => {
    if (!gameState || !playerId) return;
    if (gameState.activePlayer !== playerId) return;
    if (!selectedCardId) return; // Must select card first

    const action: GameAction = {
        type: "PLAY_CARD",
        cardInstanceId: selectedCardId,
        x,
        y
    };
    socket.send(JSON.stringify(action));
    setSelectedCardId(null); // Deselect after play attempt
  };

  if (!gameState) return <div className="text-white flex items-center justify-center h-screen">Connecting to server...</div>;

  return (
    <div className="w-full h-full relative">
        <GameCanvas
        entities={gameState.entities}
        playerId={playerId}
        onTileClick={handleTileClick}
        onSelectCard={setSelectedCardId}
      />
    </div>
  );
}

export default App;
