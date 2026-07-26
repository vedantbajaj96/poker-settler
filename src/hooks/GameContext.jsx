import { createContext, useContext, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { makeId } from "../utils/id";

const emptyGame = {
  players: [],
  buyIns: [],
  loans: [],
  cashOuts: {},
  phase: "setup",
  defaultBuyIn: null,
};

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [game, setGame] = useLocalStorage("poker-settler-game", emptyGame);

  const actions = useMemo(
    () => ({
      setPhase(phase) {
        setGame((g) => ({ ...g, phase }));
      },

      setDefaultBuyIn(amount) {
        setGame((g) => ({ ...g, defaultBuyIn: amount > 0 ? amount : null }));
      },

      addPlayer(name) {
        const trimmed = name.trim();
        if (!trimmed) return;
        const id = makeId();
        setGame((g) => {
          const result = { ...g, players: [...g.players, { id, name: trimmed }] };
          if (g.defaultBuyIn > 0) {
            result.buyIns = [
              ...g.buyIns,
              { id: makeId(), playerId: id, amount: g.defaultBuyIn, ts: Date.now() },
            ];
          }
          return result;
        });
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
