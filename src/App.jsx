import { GameProvider, useGame } from "./hooks/GameContext";
import SetupPhase from "./components/SetupPhase";
import PlayPhase from "./components/PlayPhase";
import SettlePhase from "./components/SettlePhase";
import "./App.css";

const PHASES = ["setup", "playing", "settling"];

function AppShell() {
  const { game, newGame } = useGame();
  const { phase } = game;

  function handleNewGame() {
    if (window.confirm("Start a new game? This clears everything.")) {
      newGame();
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-suit">♠</span>
          <span className="header-title">Settle Up</span>
        </div>
        <div className="header-right">
          <div className="phase-steps" aria-hidden="true">
            {PHASES.map((p, i) => {
              const currentIdx = PHASES.indexOf(phase);
              return (
                <div
                  key={p}
                  className={`phase-step ${phase === p ? "active" : ""} ${currentIdx > i ? "done" : ""}`}
                />
              );
            })}
          </div>
          <button type="button" className="btn-new-game" onClick={handleNewGame}>
            New game
          </button>
        </div>
      </header>

      <main className="app-main">
        {phase === "setup" && <SetupPhase />}
        {phase === "playing" && <PlayPhase />}
        {phase === "settling" && <SettlePhase />}
      </main>
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
