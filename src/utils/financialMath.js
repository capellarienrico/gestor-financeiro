export function getMonthInfo(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth() // 0-indexed
  const today = date.getDate()
  
  // Total days in month
  const totalDays = new Date(year, month + 1, 0).getDate()
  const daysRemaining = Math.max(0, totalDays - today)
  const currentMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`

  return {
    year,
    month,
    today,
    totalDays,
    daysRemaining,
    currentMonthKey,
    monthName: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }
}

export function calculateFinancialForecast(data) {
  const {
    currentBalance = 155000,
    dailyBudgetGoal = 100,
    startingPoint = null,
    transactions = [],
    recurringExpenses = [],
    recurringIncomes = []
  } = data

  const { today, totalDays, daysRemaining, currentMonthKey } = getMonthInfo()

  // Determine starting point
  const startIso = startingPoint?.date || new Date().toISOString().substring(0, 10)
  const startBalance = typeof startingPoint?.balance === 'number' ? startingPoint.balance : currentBalance
  const startDay = startIso.startsWith(currentMonthKey)
    ? parseInt(startIso.substring(8, 10), 10)
    : today

  const daysToProject = Math.max(0, totalDays - startDay + 1)

  // 1. Transactions in current month from starting day onwards
  const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonthKey) && t.date >= startIso)
  const spentSoFar = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0)
  const earnedSoFar = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0)

  // 2. Fixed recurring totals
  const totalMonthlyRecurringExpenses = recurringExpenses.reduce((acc, item) => acc + item.amount, 0)
  const totalMonthlyRecurringIncomes = recurringIncomes.reduce((acc, item) => acc + item.amount, 0)

  // 3. Remaining recurring items from start day onwards
  const remainingRecurringExpenses = recurringExpenses
    .filter(item => item.dayOfMonth >= startDay)
    .reduce((acc, item) => acc + item.amount, 0)

  const remainingRecurringIncomes = recurringIncomes
    .filter(item => item.dayOfMonth >= startDay)
    .reduce((acc, item) => acc + item.amount, 0)

  // 4. Projected variable spending for the rest of the month from start day onwards
  const projectedVariableSpending = dailyBudgetGoal * Math.max(0, totalDays - startDay)

  // 5. Projected balance at the end of the month
  const projectedEndOfMonthBalance = startBalance + remainingRecurringIncomes - remainingRecurringExpenses - projectedVariableSpending

  // 6. Monthly Burn Rate & Runway Calculation
  const estimatedMonthlyVariableSpending = dailyBudgetGoal * 30
  const estimatedTotalMonthlyOutflow = totalMonthlyRecurringExpenses + estimatedMonthlyVariableSpending
  const estimatedNetMonthlyBurn = estimatedTotalMonthlyOutflow - totalMonthlyRecurringIncomes

  let runwayMonths = 999
  if (estimatedNetMonthlyBurn > 0) {
    runwayMonths = Math.max(0, startBalance / estimatedNetMonthlyBurn)
  }

  const breakEvenDailyBudget = Math.max(0, (totalMonthlyRecurringIncomes - totalMonthlyRecurringExpenses) / 30)

  return {
    startBalance,
    startDay,
    startIso,
    spentSoFar,
    earnedSoFar,
    totalMonthlyRecurringExpenses,
    totalMonthlyRecurringIncomes,
    remainingRecurringExpenses,
    remainingRecurringIncomes,
    projectedVariableSpending,
    projectedEndOfMonthBalance,
    estimatedTotalMonthlyOutflow,
    estimatedNetMonthlyBurn,
    runwayMonths: Math.round(runwayMonths * 10) / 10,
    breakEvenDailyBudget: Math.round(breakEvenDailyBudget),
    daysRemaining: daysToProject,
    today,
    totalDays
  }
}

export function formatCurrency(value = 0) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
