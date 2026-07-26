import { useState } from "react";
import { useGame } from "../hooks/GameContext";
import { totalBuyIn } from "../utils/settle";

const COLORS = [
  "#22a552", "#3b82f6", "#a855f7", "#ef4444",
  "#f97316", "#eab308", "#06b6d4", "#ec4899",
];

function colorFor(index) {
  return COLORS[index % COLORS.length];
}

export default function SetupPhase() {
  const { game, addPlayer, removePlayer, addBuyIn, removeBuyIn, setDefaultBuyIn, setPhase } = useGame();
  const [name, setName] = useState("");
  const [buyInStr, setBuyInStr] = useState(game.defaultBuyIn ? String(game.defaultBuyIn) : "");

  function handleBuyInBlur() {
    const val = parseFloat(buyInStr);
    setDefaultBuyIn(val > 0 ? val : 0);
    if (!(val > 0)) setBuyInStr("");
  }

  function handleAddPlayer(e) {
    e.preventDefault();
    if (!name.trim()) return;
    addPlayer(name);
    setName("");
  }

  const totalPot = game.buyIns.reduce((sum, b) => sum + b.amount, 0);
  const canStart = game.players.length >= 2;

  return (
    <div className="phase-content">
      <div className="phase-heading">
        <h2 className="phase-title">Set up the game</h2>
        <p className="phase-sub">Set a buy-in, then add your players.</p>
      </div>

      <div>
        <label className="field-label">Buy-in per player</label>
        <div className="money-field">
          <span className="currency">$</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={buyInStr}
            onChange={(e) => setBuyInStr(e.target.value)}
            onBlur={handleBuyInBlur}
          />
        </div>
      </div>

      <div>
        <label className="field-label">Players</label>
        <form className="setup-add-row" onSubmit={handleAddPlayer}>
          <input
            type="text"
            className="name-input"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            autoCapitalize="words"
          />
          <button type="submit" className="btn-primary">Add</button>
        </form>

        {game.players.length > 0 ? (
          <ul className="setup-player-list">
            {game.players.map((p, idx) => {
              const playerBuyIns = game.buyIns.filter((b) => b.playerId === p.id);
              const total = totalBuyIn(game.buyIns, p.id);
              return (
                <SetupPlayerRow
                  key={p.id}
                  player={p}
                  color={colorFor(idx)}
                  buyIns={playerBuyIns}
                  total={total}
                  defaultBuyIn={game.defaultBuyIn}
                  onAddBuyIn={(amount) => addBuyIn(p.id, amount)}
                  onRemoveBuyIn={removeBuyIn}
                  onRemove={() => removePlayer(p.id)}
                />
              );
            })}
          </ul>
        ) : (
          <p className="empty-hint">Add at least two players to start.</p>
        )}
      </div>

      <div className="setup-footer">
        {totalPot > 0 && (
          <div className="pot-line">
            <span className="text-muted" style={{ fontSize: 13 }}>Total pot</span>
            <span className="text-mono" style={{ fontSize: 18, fontWeight: 600, color: "var(--gold)" }}>
              ${totalPot.toFixed(2)}
            </span>
          </div>
        )}
        <button
          className="btn-primary full"
          disabled={!canStart}
          onClick={() => setPhase("playing")}
        >
          Start game →
        </button>
      </div>
    </div>
  );
}

function SetupPlayerRow({ player, color, buyIns, total, defaultBuyIn, onAddBuyIn, onRemoveBuyIn, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const [rebuyStr, setRebuyStr] = useState(defaultBuyIn ? String(defaultBuyIn) : "");

  function handleRebuy(e) {
    e.preventDefault();
    const val = parseFloat(rebuyStr);
    if (!(val > 0)) return;
    onAddBuyIn(val);
    setExpanded(false);
    setRebuyStr(defaultBuyIn ? String(defaultBuyIn) : "");
  }

  return (
    <li className="setup-player-row">
      <div className="setup-player-main">
        <div className="avatar sm" style={{ background: color }}>
          {player.name[0].toUpperCase()}
        </div>
        <span className="setup-player-name">{player.name}</span>
        <span className="text-mono setup-player-total" style={{ color: total > 0 ? "var(--gold)" : "var(--text-muted)", fontSize: 14 }}>
          {total > 0 ? `$${total.toFixed(2)}` : "—"}
        </span>
        <button
          className="btn-ghost setup-rebuy-btn"
          type="button"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Cancel" : "+ Rebuy"}
        </button>
        <button className="btn-icon" type="button" onClick={onRemove} aria-label="Remove player">×</button>
      </div>

      {expanded && (
        <form className="rebuy-form" onSubmit={handleRebuy}>
          <div className="money-field">
            <span className="currency">$</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={rebuyStr}
              onChange={(e) => setRebuyStr(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary">Add</button>
        </form>
      )}

      {buyIns.length > 0 && (
        <ul className="buyin-history">
          {buyIns.map((b, idx) => (
            <li key={b.id} className="buyin-history-row">
              <span className="text-muted" style={{ fontSize: 13 }}>
                {idx === 0 ? "Buy-in" : "Rebuy"}
              </span>
              <span className="text-mono" style={{ fontSize: 13 }}>${b.amount.toFixed(2)}</span>
              <button className="btn-icon" style={{ fontSize: 14 }} onClick={() => onRemoveBuyIn(b.id)}>×</button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
