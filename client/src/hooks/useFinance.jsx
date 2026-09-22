import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    profit: 0,
    count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.list();
      setTransactions(data.transactions || []);
      setStats(data.stats || { totalIncome: 0, totalExpense: 0, profit: 0, count: 0 });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTransaction = useCallback(
    async (payload) => {
      const res = await api.create(payload);
      await refresh();
      return res.transaction;
    },
    [refresh]
  );

  const updateTransaction = useCallback(
    async (id, payload) => {
      const res = await api.update(id, payload);
      await refresh();
      return res.transaction;
    },
    [refresh]
  );

  const deleteTransaction = useCallback(
    async (id) => {
      await api.remove(id);
      await refresh();
    },
    [refresh]
  );

  /** Statistik untuk subset transaksi (mis. filter laporan) */
  const statsFor = useCallback(
    (list) => {
      let totalIncome = 0;
      let totalExpense = 0;
      let incomeCount = 0;
      let expenseCount = 0;
      for (const t of list) {
        if (t.type === 'income') {
          totalIncome += t.amount;
          incomeCount++;
        } else {
          totalExpense += t.amount;
          expenseCount++;
        }
      }
      return {
        totalIncome,
        totalExpense,
        profit: totalIncome - totalExpense,
        count: list.length,
        incomeCount,
        expenseCount,
      };
    },
    []
  );

  const value = useMemo(
    () => ({
      transactions,
      stats,
      loading,
      error,
      refresh,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      statsFor,
    }),
    [transactions, stats, loading, error, refresh, addTransaction, updateTransaction, deleteTransaction, statsFor]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance harus dipakai di dalam FinanceProvider');
  return ctx;
}
