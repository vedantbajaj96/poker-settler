import { useState } from "react";
import { useGame } from "../hooks/GameContext";
import { totalBuyIn } from "../utils/settle";

export default function PlayersTab() {
  const { game, addPlayer, removePlayer, addBuyIn, removeBuyIn } = useGame();
  const [name, setName] = useState("");
  const [openPlayerId, setOpenPlayerId] = useState(null);

  function handleAddPlayer(e) {
    e.preventDefault();
    addPlayer(name);
    setName("");
  }

  return (
    <div className="tab-content">
      <form className="add-row" onSubmit={handleAddPlayer}>
        <input
          type="text"
          placeholder="Friend's name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="btn-primary">Add</button>
      </form>

      {game.players.length === 0 && (
        <p className="empty-hint">Add your friends to get started.</p>
      )}

      <ul className="player-list">
        {game.players.map((p) => (
          <PlayerCard
            key={p.id}
            player={p}
            buyIns={game.buyIns.filter((b) => b.playerId === p.id)}
            isOpen={openPlayerId === p.id}
            onToggle={() => setOpenPlayerId(openPlayerId === p.id ? null : p.id)}
            onRemovePlayer={() => removePlayer(p.id)}
            onAddBuyIn={(amount) => addBuyIn(p.id, amount)}
            onRemoveBuyIn={removeBuyIn}
          />
        ))}
      </ul>
    </div>
  );
}

function PlayerCard({ player, buyIns, isOpen, onToggle, onRemovePlayer, onAddBuyIn, onRemoveBuyIn }) {
  const [amount, setAmount] = useState("");
  const total = totalBuyIn(buyIns, player.id);

  function handleAdd(e) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!(value > 0)) return;
    onAddBuyIn(value);
    setAmount("");
  }

  function handleRemovePlayer() {
    if (buyIns.length > 0 && !window.confirm(`Remove ${player.name} and their ${buyIns.length} buy-in(s)?`)) {
      return;
    }
    onRemovePlayer();
  }

  return (
    <li className="card">
      <div className="card-header" onClick={onToggle}>
        <span className="player-name">{player.name}</span>
        <span className="player-total">${total.toFixed(2)}</span>
        <button
          type="button"
          className="btn-icon"
          onClick={(e) => {
            e.stopPropagation();
            handleRemovePlayer();
          }}
          aria-label={`Remove ${player.name}`}
        >
          ×
        </button>
      </div>

      {isOpen && (
        <div className="card-body">
          <form className="add-row" onSubmit={handleAdd}>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="Buy-in amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button type="submit" className="btn-primary">+ Buy-in</button>
          </form>

          {buyIns.length > 0 && (
            <ul className="entry-list">
              {buyIns.map((b, idx) => (
                <li key={b.id}>
                  <span>{idx === 0 ? "Initial" : "Rebuy"}: ${b.amount.toFixed(2)}</span>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => onRemoveBuyIn(b.id)}
                    aria-label="Remove buy-in"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
