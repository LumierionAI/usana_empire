import { describe, it, expect } from 'vitest';
import { calculateLedgerTotals } from '../../src/shared/calc-engine/ledger-calc.js';
import { calculateGenealogyOutcome } from '../../src/shared/calc-engine/genealogy-calc.js';
import { calculateNextReminderDate, isCustomerDue } from '../../src/shared/calc-engine/receipts-calc.js';

describe('Ledger Calculator', () => {
  it('should correctly sum revenue, expenses, and net profit', () => {
    const entries = [
      { type: 'sale', amount: 100 },
      { type: 'commission', amount: 50 },
      { type: 'expense', amount: 30 },
      { type: 'inventory', amount: 20 }
    ];
    const totals = calculateLedgerTotals(entries);
    expect(totals.revenue).toBe(150);
    expect(totals.retailSalesTotal).toBe(100);
    expect(totals.commissionTotal).toBe(50);
    expect(totals.expenses).toBe(50);
    expect(totals.netProfit).toBe(100);
  });

  it('should ignore negative and invalid amounts', () => {
    const entries = [
      { type: 'sale', amount: 100 },
      { type: 'expense', amount: -50 }, // Should be ignored
      { type: 'sale', amount: 'abc' }   // Should be ignored
    ];
    const totals = calculateLedgerTotals(entries);
    expect(totals.revenue).toBe(100);
    expect(totals.expenses).toBe(0);
    expect(totals.netProfit).toBe(100);
  });
});

describe('Genealogy Simulator', () => {
  it('should correctly compute downline size based on uniform assumptions', () => {
    // 2 levels deep, 3 recruits per person: 
    // L1: 3, L2: 9 -> Total = 12
    const outcome = calculateGenealogyOutcome(null, { levels: 2, recruitsPerLevel: 3, psvPerPerson: 100 });
    expect(outcome.totalPeople).toBe(12);
    expect(outcome.totalSvp).toBe(1200);
    expect(outcome.isSimulated).toBe(true); // Mandatory compliance flag
  });

  it('should handle zero or invalid inputs gracefully', () => {
    const outcome = calculateGenealogyOutcome(null, { levels: 0, recruitsPerLevel: 0, psvPerPerson: 0 });
    expect(outcome.totalPeople).toBe(0);
    expect(outcome.totalSvp).toBe(0);
    expect(outcome.estimatedBonus).toBe(0);
    expect(outcome.isSimulated).toBe(true);
  });
});

describe('Receipts Reminder Math', () => {
  it('should accurately calculate the next reminder date', () => {
    const purchaseDate = '2026-09-01';
    const nextDate = calculateNextReminderDate(purchaseDate, 30);
    expect(nextDate).toBe('2026-10-01');
  });

  it('should return null for invalid date strings', () => {
    expect(calculateNextReminderDate('invalid-date', 30)).toBeNull();
    expect(calculateNextReminderDate('', 30)).toBeNull();
  });

  it('should correctly identify if a customer is due', () => {
    const reminderDate = '2026-09-15';
    const pastDate = new Date('2026-09-10T12:00:00Z');
    const futureDate = new Date('2026-09-20T12:00:00Z');
    const exactDate = new Date('2026-09-15T08:00:00Z');

    expect(isCustomerDue(reminderDate, pastDate)).toBe(false);
    expect(isCustomerDue(reminderDate, futureDate)).toBe(true);
    expect(isCustomerDue(reminderDate, exactDate)).toBe(true);
  });
});