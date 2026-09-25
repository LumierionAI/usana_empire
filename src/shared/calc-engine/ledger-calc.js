/**
 * Computes ledger totals from an array of LedgerEntry objects.
 * LedgerEntry type: "sale" | "commission" | "expense" | "inventory"
 */
export function calculateLedgerTotals(entries) {
  return entries.reduce(
    (totals, entry) => {
      const amount = Number(entry.amount);
      if (isNaN(amount) || amount <= 0) return totals; // Amount must be > 0

      switch (entry.type) {
        case 'sale':
          totals.revenue += amount;
          totals.retailSalesTotal += amount;
          break;
        case 'commission':
          totals.revenue += amount;
          totals.commissionTotal += amount;
          break;
        case 'expense':
        case 'inventory':
          totals.expenses += amount;
          break;
      }
      totals.netProfit = totals.revenue - totals.expenses;
      return totals;
    },
    { revenue: 0, expenses: 0, netProfit: 0, retailSalesTotal: 0, commissionTotal: 0 }
  );
}