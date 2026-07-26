import { useState } from "react";
import { useGame } from "../hooks/GameContext";
import { computeNets, settle, settleOneToOne } from "../utils/settle";

const COLORS = [
  "#22a552", "#3b82f6", "#a855f7", "#ef4444",
  "#f97316", "#eab308", "#06b6d4", "#ec4899",
];

function colorFor(index) {
  return COLORS[index % COLORS.length];
}

export default function SettlePhase() {
  const { game, setCashOut, clearCashOut, setPhase } = useGame();
  const { players, buyIns, cashOuts } = game;
  const [simplified, setSimplified] = useState(true);

  const playerIndex = (id) => players.findIndex((p) => p.id === id);

  const nets = computeNets(players, buyIns, cashOuts);
  const allEntered = nets.every((n) => n.cashOut !== null);
  const totalBuyInAmt = nets.reduce((sum, n) => sum + n.buyIn, 0);
  const totalCashOut = nets.reduce((sum, n) => sum + (n.cashOut ?? 0), 0);
  const mismatch = allEntered && Math.abs(totalBuyInAmt - totalCashOut) > 0.01;

  const transactions = allEntered
    ? (simplified ? settle(nets) : settleOneToOne(nets))
    : [];

  return (
    <div className="phase-content">
      <div className="phase-heading">
        <h2 className="phase-title">Cash out</h2>
        <p className="phase-sub">Enter what each player's chips are worth.</p>
      </div>

      <ul className="cashout-list">
        {nets.map((n, idx) => (
          <CashOutRow
            key={n.playerId}
            net={n}
            color={colorFor(idx)}
            onSet={(v) => setCashOut(n.playerId, v)}
            onClear={() => clearCashOut(n.playerId)}
          />
        ))}
      </ul>

      {allEntered && (
        <div className="pot-check">
          <span className="text-muted" style={{ fontSize: 13 }}>Pot check</span>
          <span className="text-mono" style={{ fontSize: 13, color: mismatch ? "var(--red)" : "var(--accent)" }}>
            ${totalCashOut.toFixed(2)} / ${totalBuyInAmt.toFixed(2)}
            {mismatch ? " ✗" : " ✓"}
          </span>
        </div>
      )}

      {mismatch && (
        <div className="warning-banner">
          Cash-out total is off by ${Math.abs(totalBuyInAmt - totalCashOut).toFixed(2)}. Check the chip counts — someone's total is probably wrong.
        </div>
      )}

      <div>
        <div className="settle-header">
          <span className="section-label">Settlement</span>
          {allEntered && transactions.length > 0 && (
            <label className="toggle-row" style={{ gap: 8 }}>
              <span className="toggle-label" style={{ fontSize: 12 }}>
                {simplified ? "Fewest transfers" : "Direct only"}
              </span>
              <span className="toggle">
                <input
                  type="checkbox"
                  checked={simplified}
                  onChange={(e) => setSimplified(e.target.checked)}
                />
                <span className="toggle-track" />
              </span>
            </label>
          )}
        </div>

        {!allEntered && (
          <p className="empty-hint">Enter a cash-out for every player to see who pays whom.</p>
        )}

        {allEntered && transactions.length === 0 && (
          <p className="empty-hint">Everyone's even — no payments needed. 🎉</p>
        )}

        {allEntered && transactions.length > 0 && (
          <ul className="settlement-list">
            {transactions.map((t, i) => {
              const fi = playerIndex(t.fromId);
              const ti = playerIndex(t.toId);
              return (
                <li key={i} className="settlement-row">
                  <div className="settlement-from">
                    <div className="avatar sm" style={{ background: colorFor(fi) }}>
                      {t.fromName[0].toUpperCase()}
                    </div>
                    <span>{t.fromName}</span>
                  </div>
                  <span className="settlement-verb">pays</span>
                  <div className="settlement-to">
                    <div className="avatar sm" style={{ background: colorFor(ti) }}>
                      {t.toName[0].toUpperCase()}
                    </div>
                    <span>{t.toName}</span>
                  </div>
                  <span className="settlement-amount text-mono">${t.amount.toFixed(2)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="phase-footer">
        <button className="btn-ghost" onClick={() => setPhase("playing")}>← Game</button>
      </div>
    </div>
  );
}

function CashOutRow({ net, color, onSet, onClear }) {
  const [value, setValue] = useState(net.cashOut === null ? "" : String(net.cashOut));

  function commit() {
    if (value === "") { onClear(); return; }
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      setValue(net.cashOut === null ? "" : String(net.cashOut));
      return;
    }
    onSet(parsed);
  }

  const hasValue = net.net !== null;

  return (
    <li className="cashout-row">
      <div className="avatar sm" style={{ background: color }}>
        {net.name[0].toUpperCase()}
      </div>
      <div className="cashout-info">
        <span className="cashout-name">{net.name}</span>
        <span className="cashout-sub text-mono">${net.buyIn.toFixed(2)} in</span>
      </div>
      <div className="money-field cashout-input-wrap">
        <span className="currency">$</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
        />
      </div>
      {hasValue && (
        <span className={net.net >= 0 ? "text-positive" : "text-negative"} style={{ fontSize: 14, minWidth: 50, textAlign: "right" }}>
          {net.net >= 0 ? "+" : ""}${net.net.toFixed(2)}
        </span>
      )}
    </li>
  );
}
