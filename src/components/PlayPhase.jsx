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

const QUICK_AMOUNTS = [5, 10, 20, 50];

export default function PlayPhase() {
  const { game, addLoan, removeLoan, addBuyIn, removeBuyIn, setPhase } = useGame();
  const { players, loans, buyIns } = game;

  const [mode, setMode] = useState("transfer"); // "transfer" | "rebuy"
  const [fromId, setFromId] = useState(null);
  const [toId, setToId] = useState(null);
  const [amountStr, setAmountStr] = useState("");
  const [rebuyId, setRebuyId] = useState(null);
  const [rebuyStr, setRebuyStr] = useState("");

  const playerIndex = (id) => players.findIndex((p) => p.id === id);
  const nameOf = (id) => players.find((p) => p.id === id)?.name ?? "?";

  function handleFrom(id) {
    setFromId(id);
    if (toId === id) setToId(null);
  }

  function handleLog(e) {
    e?.preventDefault();
    const amount = parseFloat(amountStr);
    if (!fromId || !toId || !(amount > 0)) return;
    addLoan(fromId, toId, amount);
    setAmountStr("");
    setFromId(null);
    setToId(null);
  }

  function handleRebuy(e) {
    e?.preventDefault();
    const amount = parseFloat(rebuyStr);
    if (!rebuyId || !(amount > 0)) return;
    addBuyIn(rebuyId, amount);
    setRebuyStr("");
    setRebuyId(null);
  }

  const canLog = fromId && toId && parseFloat(amountStr) > 0;
  const canRebuy = rebuyId && parseFloat(rebuyStr) > 0;

  return (
    <div className="phase-content">
      <div className="phase-heading">
        <h2 className="phase-title">Game in progress</h2>
        <p className="phase-sub">Log chip transfers or mid-game rebuys.</p>
      </div>

      <div className="play-mode-tabs">
        <button
          className={`play-mode-tab ${mode === "transfer" ? "active" : ""}`}
          onClick={() => setMode("transfer")}
        >
          Chip transfer
        </button>
        <button
          className={`play-mode-tab ${mode === "rebuy" ? "active" : ""}`}
          onClick={() => setMode("rebuy")}
        >
          Rebuy
        </button>
      </div>

      {mode === "transfer" && (
        <div className="transfer-card card">
          <div className="transfer-section">
            <p className="field-label">Who gave chips?</p>
            <div className="player-pill-row">
              {players.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  className={`player-pill ${fromId === p.id ? "selected" : ""}`}
                  style={{ "--pill-color": colorFor(idx) }}
                  onClick={() => handleFrom(p.id)}
                >
                  <span className="pill-avatar">{p.name[0].toUpperCase()}</span>
                  <span className="pill-name">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {fromId && (
            <>
              <div className="transfer-arrow-row">
                <div className="transfer-arrow-line" />
                <span className="transfer-arrow-icon">↓</span>
                <div className="transfer-arrow-line" />
              </div>

              <div className="transfer-section">
                <p className="field-label">To whom?</p>
                <div className="player-pill-row">
                  {players.filter((p) => p.id !== fromId).map((p) => {
                    const idx = playerIndex(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`player-pill ${toId === p.id ? "selected" : ""}`}
                        style={{ "--pill-color": colorFor(idx) }}
                        onClick={() => setToId(p.id)}
                      >
                        <span className="pill-avatar">{p.name[0].toUpperCase()}</span>
                        <span className="pill-name">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {fromId && toId && (
            <>
              <div className="transfer-divider" />
              <div className="transfer-section">
                <p className="field-label">Amount</p>
                <form onSubmit={handleLog} className="transfer-amount-row">
                  <div className="money-field" style={{ flex: 1 }}>
                    <span className="currency">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={!canLog}>Log</button>
                </form>
                <div className="quick-amounts" style={{ marginTop: 8 }}>
                  {QUICK_AMOUNTS.map((amt) => (
                    <button key={amt} type="button" className="quick-amount" onClick={() => setAmountStr(String(amt))}>
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {mode === "rebuy" && (
        <div className="transfer-card card">
          <div className="transfer-section">
            <p className="field-label">Who's rebuying?</p>
            <div className="player-pill-row">
              {players.map((p, idx) => {
                const total = totalBuyIn(buyIns, p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`player-pill ${rebuyId === p.id ? "selected" : ""}`}
                    style={{ "--pill-color": colorFor(idx) }}
                    onClick={() => setRebuyId(p.id)}
                  >
                    <span className="pill-avatar">{p.name[0].toUpperCase()}</span>
                    <span className="pill-name">{p.name}</span>
                    <span className="pill-sub text-mono">${total.toFixed(0)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {rebuyId && (
            <>
              <div className="transfer-divider" />
              <div className="transfer-section">
                <p className="field-label">Rebuy amount</p>
                <form onSubmit={handleRebuy} className="transfer-amount-row">
                  <div className="money-field" style={{ flex: 1 }}>
                    <span className="currency">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={rebuyStr}
                      onChange={(e) => setRebuyStr(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={!canRebuy}>Add</button>
                </form>
                <div className="quick-amounts" style={{ marginTop: 8 }}>
                  {QUICK_AMOUNTS.map((amt) => (
                    <button key={amt} type="button" className="quick-amount" onClick={() => setRebuyStr(String(amt))}>
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {loans.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span className="section-label">Transfers this game</span>
            <span className="text-mono text-muted" style={{ fontSize: 13 }}>{loans.length}</span>
          </div>
          <ul className="transfer-log">
            {[...loans].reverse().map((l) => {
              const fi = playerIndex(l.fromId);
              const ti = playerIndex(l.toId);
              return (
                <li key={l.id} className="transfer-log-row">
                  <span className="tlog-dot" style={{ background: colorFor(fi) }} />
                  <span className="tlog-from">{nameOf(l.fromId)}</span>
                  <span className="tlog-arrow">→</span>
                  <span className="tlog-dot" style={{ background: colorFor(ti) }} />
                  <span className="tlog-to">{nameOf(l.toId)}</span>
                  <span className="tlog-amount text-mono">${l.amount.toFixed(2)}</span>
                  <button className="btn-icon" onClick={() => removeLoan(l.id)} aria-label="Remove">×</button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="phase-footer">
        <button className="btn-ghost" onClick={() => setPhase("setup")}>← Setup</button>
        <button className="btn-primary lg" onClick={() => setPhase("settling")}>End game →</button>
      </div>
    </div>
  );
}
