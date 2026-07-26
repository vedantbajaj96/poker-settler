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

function drawShareImage(nets, transactions, totalPot) {
  const W = 390;
  const PAD = 24;
  const LINE = 34;
  const headerH = 90;
  const resultsH = 30 + nets.length * LINE + 12;
  const settlementH = 30 + Math.max(transactions.length, 1) * LINE + 12;
  const footerH = 36;
  const H = PAD + headerH + resultsH + settlementH + footerH + PAD;

  const dpr = Math.min(window.devicePixelRatio || 2, 3);
  const canvas = document.createElement("canvas");
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, W, H);

  // Top accent bar
  ctx.fillStyle = "#22a552";
  ctx.fillRect(0, 0, W, 3);

  let y = PAD;

  // Title row
  ctx.font = "700 20px 'Outfit', system-ui, sans-serif";
  ctx.fillStyle = "#edf2f7";
  ctx.fillText("♠  Settle Up", PAD, y + 20);

  const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  ctx.font = "400 13px 'Outfit', system-ui, sans-serif";
  ctx.fillStyle = "#4e5a6e";
  ctx.fillText(dateStr, PAD, y + 40);

  // Pot amount (right-aligned)
  ctx.font = "600 22px 'IBM Plex Mono', monospace";
  ctx.fillStyle = "#e8a628";
  const potStr = `$${totalPot.toFixed(2)}`;
  const potW = ctx.measureText(potStr).width;
  ctx.fillText(potStr, W - PAD - potW, y + 22);
  ctx.font = "400 11px 'Outfit', system-ui, sans-serif";
  ctx.fillStyle = "#4e5a6e";
  ctx.fillText("total pot", W - PAD - potW, y + 38);

  y += headerH;

  // Divider
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(PAD, y - 8, W - PAD * 2, 1);

  // Results section
  ctx.font = "600 10px 'Outfit', system-ui, sans-serif";
  ctx.fillStyle = "#4e5a6e";
  ctx.fillText("RESULTS", PAD, y + 12);
  y += 26;

  for (let i = 0; i < nets.length; i++) {
    const n = nets[i];
    const color = COLORS[i % COLORS.length];

    // Color dot
    ctx.beginPath();
    ctx.arc(PAD + 5, y + LINE / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Name
    ctx.font = "500 15px 'Outfit', system-ui, sans-serif";
    ctx.fillStyle = "#edf2f7";
    ctx.fillText(n.name, PAD + 18, y + LINE / 2 + 5);

    // Net
    if (n.net !== null) {
      const sign = n.net >= 0 ? "+" : "";
      const netStr = `${sign}$${Math.abs(n.net).toFixed(2)}`;
      ctx.font = "600 14px 'IBM Plex Mono', monospace";
      ctx.fillStyle = n.net > 0.01 ? "#22a552" : n.net < -0.01 ? "#e05252" : "#4e5a6e";
      const tw = ctx.measureText(netStr).width;
      ctx.fillText(netStr, W - PAD - tw, y + LINE / 2 + 5);
    }
    y += LINE;
  }

  y += 12;

  // Divider
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(PAD, y - 8, W - PAD * 2, 1);

  // Settlement section
  ctx.font = "600 10px 'Outfit', system-ui, sans-serif";
  ctx.fillStyle = "#4e5a6e";
  ctx.fillText("SETTLEMENT", PAD, y + 12);
  y += 26;

  if (transactions.length === 0) {
    ctx.font = "400 14px 'Outfit', system-ui, sans-serif";
    ctx.fillStyle = "#4e5a6e";
    ctx.fillText("Everyone's even — no payments needed", PAD, y + LINE / 2 + 5);
    y += LINE;
  } else {
    for (const t of transactions) {
      ctx.font = "500 15px 'Outfit', system-ui, sans-serif";
      ctx.fillStyle = "#edf2f7";
      ctx.fillText(`${t.fromName}  →  ${t.toName}`, PAD, y + LINE / 2 + 5);

      ctx.font = "600 15px 'IBM Plex Mono', monospace";
      ctx.fillStyle = "#e8a628";
      const amtStr = `$${t.amount.toFixed(2)}`;
      const tw = ctx.measureText(amtStr).width;
      ctx.fillText(amtStr, W - PAD - tw, y + LINE / 2 + 5);
      y += LINE;
    }
  }

  // Footer
  y += 12;
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(PAD, y, W - PAD * 2, 1);
  y += 12;
  ctx.font = "400 11px 'Outfit', system-ui, sans-serif";
  ctx.fillStyle = "rgba(90,100,120,0.5)";
  ctx.fillText("vedantbajaj96.github.io/poker-settler", PAD, y + 12);

  return canvas;
}

async function shareResults(nets, transactions, totalPot) {
  const canvas = drawShareImage(nets, transactions, totalPot);
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "settle-up.png", { type: "image/png" });
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: "Settle Up — Game Results" });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "settle-up.png";
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      }
      resolve();
    }, "image/png");
  });
}

export default function SettlePhase() {
  const { game, setCashOut, clearCashOut, setPhase } = useGame();
  const { players, buyIns, cashOuts } = game;
  const [simplified, setSimplified] = useState(true);
  const [sharing, setSharing] = useState(false);

  const playerIndex = (id) => players.findIndex((p) => p.id === id);

  const nets = computeNets(players, buyIns, cashOuts);
  const allEntered = nets.every((n) => n.cashOut !== null);
  const totalBuyInAmt = nets.reduce((sum, n) => sum + n.buyIn, 0);
  const totalCashOut = nets.reduce((sum, n) => sum + (n.cashOut ?? 0), 0);
  const mismatch = allEntered && Math.abs(totalBuyInAmt - totalCashOut) > 0.01;

  const transactions = allEntered
    ? (simplified ? settle(nets) : settleOneToOne(nets))
    : [];

  const enteredSoFar = nets.reduce((sum, n) => sum + (n.cashOut ?? 0), 0);
  const remaining = totalBuyInAmt - enteredSoFar;

  async function handleShare() {
    setSharing(true);
    await shareResults(nets, transactions, totalBuyInAmt);
    setSharing(false);
  }

  return (
    <div className="phase-content">
      <div className="phase-heading">
        <h2 className="phase-title">Cash out</h2>
        <p className="phase-sub">Enter each player's final chip value. Total should match the pot.</p>
      </div>

      <div className="pot-guide">
        <div className="pot-guide-row">
          <span className="pot-guide-label">Total pot</span>
          <span className="pot-guide-amount text-mono">${totalBuyInAmt.toFixed(2)}</span>
        </div>
        {!allEntered && enteredSoFar > 0 && (
          <div className="pot-guide-row pot-guide-sub">
            <span className="pot-guide-label">Entered so far</span>
            <span className="text-mono" style={{ fontSize: 13 }}>${enteredSoFar.toFixed(2)}</span>
          </div>
        )}
        {!allEntered && enteredSoFar > 0 && (
          <div className="pot-guide-row pot-guide-sub">
            <span className="pot-guide-label">Still to enter</span>
            <span className="text-mono" style={{ fontSize: 13, color: remaining < 0 ? "var(--red)" : "var(--text-dim)" }}>
              ${Math.abs(remaining).toFixed(2)}{remaining < 0 ? " over" : ""}
            </span>
          </div>
        )}
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
          <p className="empty-hint">Everyone's even — no payments needed.</p>
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
        {allEntered && (
          <button className="btn-primary lg" onClick={handleShare} disabled={sharing}>
            {sharing ? "Sharing…" : "Share results"}
          </button>
        )}
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
        <span className={net.net >= 0 ? "text-positive" : "text-negative"} style={{ fontSize: 14, minWidth: 52, textAlign: "right" }}>
          {net.net >= 0 ? "+" : ""}${Math.abs(net.net).toFixed(2)}
        </span>
      )}
    </li>
  );
}
