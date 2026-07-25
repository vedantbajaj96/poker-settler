import { useState } from "react";
import { useGame } from "../hooks/GameContext";
import { loanBalance } from "../utils/settle";

export default function LoansTab() {
  const { game, addLoan, removeLoan } = useGame();
  const { players, loans } = game;

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");

  if (players.length < 2) {
    return (
      <div className="tab-content">
        <p className="empty-hint">Add at least two players before tracking chip loans.</p>
      </div>
    );
  }

  function handleAdd(e) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!fromId || !toId || fromId === toId || !(value > 0)) return;
    addLoan(fromId, toId, value);
    setAmount("");
  }

  const nameOf = (id) => players.find((p) => p.id === id)?.name ?? "?";

  return (
    <div className="tab-content">
      <p className="hint">
        When someone lends chips because another player is out, log it here. It'll show
        up as its own payment on the Settle tab, on top of the regular buy-in settlement.
      </p>

      <form className="loan-form" onSubmit={handleAdd}>
        <div className="loan-form-row">
          <select value={fromId} onChange={(e) => setFromId(e.target.value)}>
            <option value="">Lender</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <span className="loan-arrow">→</span>
          <select value={toId} onChange={(e) => setToId(e.target.value)}>
            <option value="">Borrower</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="add-row">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button type="submit" className="btn-primary">Log loan</button>
        </div>
      </form>

      {loans.length === 0 ? (
        <p className="empty-hint">No chip loans logged yet.</p>
      ) : (
        <>
          <h3 className="section-title">Loan ledger</h3>
          <ul className="entry-list">
            {[...loans].reverse().map((l) => (
              <li key={l.id}>
                <span>{nameOf(l.fromId)} → {nameOf(l.toId)}: ${l.amount.toFixed(2)}</span>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => removeLoan(l.id)}
                  aria-label="Remove loan"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <h3 className="section-title">Running balance</h3>
          <ul className="entry-list">
            {players.map((p) => {
              const bal = loanBalance(loans, p.id);
              if (Math.abs(bal) < 0.01) return null;
              return (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <span className={bal > 0 ? "positive" : "negative"}>
                    {bal > 0 ? `is owed $${bal.toFixed(2)}` : `owes $${Math.abs(bal).toFixed(2)}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
