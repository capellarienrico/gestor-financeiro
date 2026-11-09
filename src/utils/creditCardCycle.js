/**
 * Credit Card Billing Cycle Utility
 * Calculates invoice closing and due dates for credit card transactions.
 */

export const DEFAULT_CARD_SETTINGS = {
  closingDay: 15,
  dueDay: 25
}

/**
 * Calculates the exact invoice due date (YYYY-MM-DD) for a credit card transaction.
 * 
 * Rules:
 * - If transaction day <= closingDay of the month:
 *   * If dueDay > closingDay: invoice is due on dueDay of current month.
 *   * If dueDay <= closingDay: invoice is due on dueDay of following month (month + 1).
 * - If transaction day > closingDay of the month (past the closing date):
 *   * If dueDay > closingDay: invoice is due on dueDay of following month (month + 1).
 *   * If dueDay <= closingDay: invoice is due on dueDay of month + 2.
 * 
 * @param {string|Date} transactionDate - 'YYYY-MM-DD' string or Date object
 * @param {number} closingDay - Day of month when invoice closes (1-31, default 15)
 * @param {number} dueDay - Day of month when invoice is due (1-31, default 25)
 * @returns {string} - 'YYYY-MM-DD'
 */
export function calculateCreditCardDueDate(transactionDate, closingDay = 15, dueDay = 25) {
  if (!transactionDate) return ''

  let year, month, day

  if (typeof transactionDate === 'string') {
    const parts = transactionDate.split('-')
    if (parts.length >= 3) {
      year = parseInt(parts[0], 10)
      month = parseInt(parts[1], 10) - 1 // 0-indexed
      day = parseInt(parts[2].substring(0, 2), 10)
    } else {
      const d = new Date(transactionDate)
      year = d.getFullYear()
      month = d.getMonth()
      day = d.getDate()
    }
  } else if (transactionDate instanceof Date) {
    year = transactionDate.getFullYear()
    month = transactionDate.getMonth()
    day = transactionDate.getDate()
  } else {
    return ''
  }

  const cDay = Math.max(1, Math.min(31, parseInt(closingDay, 10) || 15))
  const dDay = Math.max(1, Math.min(31, parseInt(dueDay, 10) || 25))

  let targetYear = year
  let targetMonth = month

  if (day <= cDay) {
    // Current billing cycle
    if (dDay > cDay) {
      // Due in current month
      targetMonth = month
    } else {
      // Due in next month (e.g. closes 28th, due 5th of next month)
      targetMonth = month + 1
    }
  } else {
    // Falls into subsequent month's invoice ("melhor dia de compra")
    if (dDay > cDay) {
      // Due in next month
      targetMonth = month + 1
    } else {
      // Due in month + 2 (e.g. closes 28th, buy 29th -> closes next month 28th -> due month+2 5th)
      targetMonth = month + 2
    }
  }

  // Adjust for year rollover if targetMonth >= 12
  const finalDate = new Date(targetYear, targetMonth, 1)
  const finalYear = finalDate.getFullYear()
  const finalMonth = finalDate.getMonth() // 0-indexed

  // Clamp dueDay to the last day of target month (e.g. Feb 28/29, April 30)
  const daysInFinalMonth = new Date(finalYear, finalMonth + 1, 0).getDate()
  const actualDay = Math.min(dDay, daysInFinalMonth)

  const yyyy = finalYear
  const mm = String(finalMonth + 1).padStart(2, '0')
  const dd = String(actualDay).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}`
}

/**
 * Checks if a transaction is a credit card payment
 */
export function isCreditCardTransaction(tx) {
  if (!tx) return false
  const method = (tx.paymentMethod || '').toLowerCase()
  const source = (tx.source || '').toLowerCase()

  if (method === 'credit_card' || method.includes('cartão') || method.includes('cartao') || method.includes('crédito') || method.includes('credito')) {
    return true
  }

  if (source.includes('cartão') || source.includes('cartao') || source.includes('crédito') || source.includes('credito') || source.includes('card')) {
    return true
  }

  return false
}

/**
 * Returns formatted badge text for invoice due date
 * e.g.: "Fatura d. 25" or "Fatura 25/04"
 */
export function formatInvoiceTag(dueDate) {
  if (!dueDate) return 'Fatura Cartão'
  const parts = dueDate.split('-')
  if (parts.length >= 3) {
    const day = parts[2]
    const month = parts[1]
    return `Fatura d. ${day} (${day}/${month})`
  }
  return 'Fatura Cartão'
}

/**
 * Detailed credit card cycle info for UI inspection
 */
export function getCreditCardCycleDetails(transactionDate, closingDay = 15, dueDay = 25) {
  const dueDate = calculateCreditCardDueDate(transactionDate, closingDay, dueDay)
  const isPostClosing = transactionDate ? parseInt(transactionDate.split('-')[2], 10) > closingDay : false

  return {
    transactionDate,
    dueDate,
    closingDay,
    dueDay,
    isPostClosing,
    badgeText: `Fatura d. ${dueDay}`
  }
}
