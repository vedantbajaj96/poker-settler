import { createContext, useContext, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { makeId } from "../utils/id";

const emptyGame = {
  players: [],
  buyIns: [],
  loans: [],
  cashOuts: {},
};

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [game, setGame] = useLocalStorage("poker-settler-game", emptyGame);

  const actions = useMemo(
    () => ({
      addPlayer(name) {
        const trimmed = name.trim();
        if (!trimmed) return;
        setGame((g) => ({
          ...g,
          players: [...g.players, { id: makeId(), name: trimmed }],
        }));
      },

      removePlayer(playerId) {
        setGame((g) => ({
          ...g,
          players: g.players.filter((p) => p.id !== playerId),
          buyIns: g.buyIns.filter((b) => b.playerId !== playerId),
          loans: g.loans.filter((l) => l.fromId !== playerId && l.toId !== playerId),
          cashOuts: Object.fromEntries(
            Object.entries(g.cashOuts).filter(([id]) => id !== playerId)
          ),
        }));
      },

      addBuyIn(playerId, amount) {
        if (!(amount > 0)) return;
        setGame((g) => ({
          ...g,
          buyIns: [
            ...g.buyIns,
            { id: makeId(), playerId, amount, ts: Date.now() },
          ],
        }));
      },

      removeBuyIn(buyInId) {
        setGame((g) => ({
          ...g,
          buyIns: g.buyIns.filter((b) => b.id !== buyInId),
        }));
      },

      addLoan(fromId, toId, amount) {
        if (!(amount > 0) || fromId === toId) return;
        setGame((g) => ({
          ...g,
          loans: [
            ...g.loans,
            { id: makeId(), fromId, toId, amount, ts: Date.now() },
          ],
        }));
      },

      removeLoan(loanId) {
        setGame((g) => ({
          ...g,
          loans: g.loans.filter((l) => l.id !== loanId),
        }));
      },

      setCashOut(playerId, amount) {
        setGame((g) => ({
          ...g,
          cashOuts: { ...g.cashOuts, [playerId]: amount },
        }));
      },

      clearCashOut(playerId) {
        setGame((g) => {
          const cashOuts = { ...g.cashOuts };
          delete cashOuts[playerId];
          return { ...g, cashOuts };
        });
      },

      newGame() {
        setGame(emptyGame);
      },
    }),
    [setGame]
  );

  const value = useMemo(() => ({ game, ...actions }), [game, actions]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
