# 3D Multiplayer Card Game Test

A real-time, 3D multiplayer card game built with React, Three.js, and PartyKit. Players can join matches, play cards from their hand onto a grid-based board, and battle against opponents in a shared 3D environment.

## Getting Started

This project consists of two main parts: a **Vite-powered React client** and a **PartyKit networking server**.

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js
- PartyKit CLI (installed via dependencies)

### Installation

```bash
bun install
```

### Running the Project

You need to run both the client and the server simultaneously:

1.  **Start the PartyKit Server:**
    ```bash
    bun run party-dev
    ```
    This starts the local multiplayer backend on `http://127.0.0.1:1999`.

2.  **Start the React Client:**
    ```bash
    bun run dev
    ```
    This starts the 3D frontend on `http://localhost:5173`.

---

## Tech Stack & Tools

### Core Rendering
- **[React 19](https://react.dev/)**: For the application UI and structure.
- **[Three.js](https://threejs.org/) & [@react-three/fiber](https://r3f.docs.pmnd.rs/)**: Powers the 3D game board, cards, and animations within a React-friendly ecosystem.
- **[@react-three/drei](https://github.com/pmndrs/drei)**: Useful helpers for cameras, shadows, and environment lighting.

### State & Logic
- **[Miniplex](https://github.com/hmans/miniplex)**: An Entity Component System (ECS) for managing game entities (cards, players, world state) efficiently.
- **TypeScript**: Ensures type safety across the client and server.

### Networking
- **[PartyKit](https://www.partykit.io/)**: A real-time collaboration platform. It handles the websocket server logic, synchronization of the game board, and player connections.
- **[PartySocket](https://github.com/partykit/partysocket)**: The client-side library for connecting to the PartyKit server.

### Styling
- **[Tailwind CSS](https://tailwindcss.com/)**: Used for the 2D UI overlays and layout.

---

## Controls

| Key | Action |
| --- | --- |
| `W` | Standing View (Top-down) |
| `S` | Sitting View (Perspective) |
| `D` | Toggle Deck View |
| `A` | Toggle Left View |
| `G` | Toggle Graveyard View |
| `H` | Toggle HUD |
| `ESC` | Close Overlays |

---

## Project Structure

- `src/components/`: React Three Fiber components (Board, Card, Hand).
- `src/logic/`: Game schemas, ECS world setup, and shared card database.
- `party/`: PartyKit server implementation handling game rules and sync.
