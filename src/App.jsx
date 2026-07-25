import { useState } from "react";
import { GameProvider, useGame } from "./hooks/GameContext";
import PlayersTab from "./components/PlayersTab";
import LoansTab from "./components/LoansTab";
import SettleTab from "./components/SettleTab";
import TabNav from "./components/TabNav";
import "./App.css";

function AppShell() {
  const [tab, setTab] = useState("players");
  const { newGame } = useGame();

  function handleNewGame() {
    if (window.confirm("Start a new game? This clears all players, buy-ins, loans, and cash-outs.")) {
      newGame();
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Settle Up</h1>
        <button type="button" className="btn-link" onClick={handleNewGame}>
          New game
        </button>
      </header>

      <main className="app-main">
        {tab === "players" && <PlayersTab />}
        {tab === "loans" && <LoansTab />}
        {tab === "settle" && <SettleTab />}
      </main>

      <TabNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  );
}
