import { useState } from "react";
import { useGame } from "../hooks/GameContext";
import { computeNets, settle, netTransactions } from "../utils/settle";

export default function SettleTab() {
  const { game, setCashOut, clearCashOut } = useGame();
  const { players, buyIns, cashOuts, loans } = game;

  if (players.length < 2) {
    return (
      <div className="tab-content">
        <p className="empty-hint">Add at least two players to settle up.</p>
      </div>
    );
  }

  const nameOf = (id) => players.find((p) => p.id === id)?.name ?? "?";
  const nets = computeNets(players, buyIns, cashOuts);
  const allEntered = nets.every((n) => n.cashOut !== null);
  const totalBuyIn = nets.reduce((sum, n) => sum + n.buyIn, 0);
  const totalCashOut = nets.reduce((sum, n) => sum + (n.cashOut ?? 0), 0);
  const mismatch = allEntered && Math.abs(totalBuyIn - totalCashOut) > 0.01;
  const loanFlows = loans.map((l) => ({ fromId: l.toId, toId: l.fromId, amount: l.amount }));
  const tableFlows = allEntered ? settle(nets) : [];
  const transactions = allEntered ? netTransactions([...loanFlows, ...tableFlows]) : [];

  return (
    <div className="tab-content">
      <p className="hint">
        Enter what each player's chips were worth when the game ended (their cash-out).
      </p>

      <ul className="entry-list">
        {nets.map((n) => (
          <CashOutRow
            key={n.playerId}
            net={n}
            onSet={(v) => setCashOut(n.playerId, v)}
            onClear={() => clearCashOut(n.playerId)}
          />
        ))}
      </ul>

      {mismatch && (
        <p className="warning">
          Total cash-out (${totalCashOut.toFixed(2)}) doesn't match total buy-ins (${totalBuyIn.toFixed(2)}).
          Double-check the chip counts — someone's total is probably off by ${Math.abs(totalBuyIn - totalCashOut).toFixed(2)}.
        </p>
      )}

      <h3 className="section-title">Settlement</h3>
      {!allEntered && (
        <p className="empty-hint">Enter a cash-out for every player to see who pays whom.</p>
      )}
      {allEntered && transactions.length === 0 && (
        <p className="empty-hint">Everyone's even — no payments needed.</p>
      )}
      {allEntered && transactions.length > 0 && (
        <ul className="settlement-list">
          {transactions.map((t, idx) => (
            <li key={idx} className="settlement-row">
              <span className="settlement-from">{nameOf(t.fromId)}</span>
              <span className="settlement-arrow">pays</span>
              <span className="settlement-to">{nameOf(t.toId)}</span>
              <span className="settlement-amount">${t.amount.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CashOutRow({ net, onSet, onClear }) {
  const [value, setValue] = useState(net.cashOut === null ? "" : String(net.cashOut));

  function commit() {
    if (value === "") {
      onClear();
      return;
    }
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      setValue(net.cashOut === null ? "" : String(net.cashOut));
      return;
    }
    onSet(parsed);
  }

  return (
    <li className="cashout-row">
      <div className="cashout-info">
        <span className="player-name">{net.name}</span>
        <span className="buyin-sub">bought in ${net.buyIn.toFixed(2)}</span>
      </div>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        placeholder="Cash-out"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
      />
      {net.net !== null && (
        <span className={net.net >= 0 ? "positive" : "negative"}>
          {net.net >= 0 ? "+" : ""}${net.net.toFixed(2)}
        </span>
      )}
    </li>
  );
}
