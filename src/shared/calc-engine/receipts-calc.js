/**
 * Calculates the next reminder date for a product based on its replenishment cycle.
 * @param {string} purchaseDate - ISO date string (YYYY-MM-DD)
 * @param {number} cycleDays - Days until the product typically runs out
 * @returns {string|null} ISO date string (YYYY-MM-DD) or null if invalid
 */
export function calculateNextReminderDate(purchaseDate, cycleDays) {
  if (!purchaseDate || typeof cycleDays !== 'number' || cycleDays <= 0) {
    return null;
  }
  
  const date = new Date(purchaseDate);
  if (isNaN(date.getTime())) return null;
  
  date.setDate(date.getDate() + cycleDays);
  return date.toISOString().split('T')[0];
}

/**
 * Determines if a customer is due for a follow-up based on the reminder date.
 * @param {string} reminderDate - ISO date string
 * @param {Date} [currentDate=new Date()] - The comparison date (defaults to today)
 * @returns {boolean}
 */
export function isCustomerDue(reminderDate, currentDate = new Date()) {
  if (!reminderDate) return false;
  
  const reminder = new Date(reminderDate);
  if (isNaN(reminder.getTime())) return false;
  
  // Normalize both dates to midnight for a strict day-level comparison
  currentDate.setHours(0, 0, 0, 0);
  reminder.setHours(0, 0, 0, 0);
  
  return currentDate.getTime() >= reminder.getTime();
}