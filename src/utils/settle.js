const EPSILON = 0.01;

export function totalBuyIn(buyIns, playerId) {
  return buyIns
    .filter((b) => b.playerId === playerId)
    .reduce((sum, b) => sum + b.amount, 0);
}

export function loanBalance(loans, playerId) {
  const lent = loans
    .filter((l) => l.fromId === playerId)
    .reduce((sum, l) => sum + l.amount, 0);
  const borrowed = loans
    .filter((l) => l.toId === playerId)
    .reduce((sum, l) => sum + l.amount, 0);
  return lent - borrowed;
}

export function computeNets(players, buyIns, cashOuts) {
  return players.map((p) => {
    const buyIn = totalBuyIn(buyIns, p.id);
    const cashOut = cashOuts[p.id];
    const hasCashOut = typeof cashOut === "number";
    return {
      playerId: p.id,
      name: p.name,
      buyIn,
      cashOut: hasCashOut ? cashOut : null,
      net: hasCashOut ? cashOut - buyIn : null,
    };
  });
}

export function netLoanRepayments(loans) {
  const pairNet = new Map();

  for (const l of loans) {
    const [a, b] = [l.toId, l.fromId].sort();
    const sign = l.toId === a ? 1 : -1;
    const key = `${a}|${b}`;
    pairNet.set(key, (pairNet.get(key) ?? 0) + sign * l.amount);
  }

  const repayments = [];
  for (const [key, net] of pairNet) {
    if (Math.abs(net) < EPSILON) continue;
    const [a, b] = key.split("|");
    repayments.push({
      fromId: net > 0 ? a : b,
      toId: net > 0 ? b : a,
      amount: Math.round(Math.abs(net) * 100) / 100,
    });
  }

  return repayments;
}

export function settle(nets) {
  const creditors = [];
  const debtors = [];

  for (const n of nets) {
    if (n.net > EPSILON) creditors.push({ playerId: n.playerId, name: n.name, amount: n.net });
    else if (n.net < -EPSILON) debtors.push({ playerId: n.playerId, name: n.name, amount: -n.net });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > EPSILON) {
      transactions.push({
        fromId: debtor.playerId,
        fromName: debtor.name,
        toId: creditor.playerId,
        toName: creditor.name,
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount <= EPSILON) i++;
    if (creditor.amount <= EPSILON) j++;
  }

  return transactions;
}
