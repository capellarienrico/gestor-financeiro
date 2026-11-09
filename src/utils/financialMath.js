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
    currentBalance = 0,
    dailyBudgetGoal = 100,
    transactions = [],
    recurringExpenses = [],
    recurringIncomes = []
  } = data

  const { today, totalDays, daysRemaining, currentMonthKey } = getMonthInfo()

  // 1. Transactions in current month
  const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonthKey))
  const spentSoFar = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0)
  const earnedSoFar = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0)

  // 2. Fixed recurring totals
  const totalMonthlyRecurringExpenses = recurringExpenses.reduce((acc, item) => acc + item.amount, 0)
  const totalMonthlyRecurringIncomes = recurringIncomes.reduce((acc, item) => acc + item.amount, 0)

  // 3. Remaining recurring items this month (due from today onwards)
  const remainingRecurringExpenses = recurringExpenses
    .filter(item => item.dayOfMonth >= today)
    .reduce((acc, item) => acc + item.amount, 0)

  const remainingRecurringIncomes = recurringIncomes
    .filter(item => item.dayOfMonth >= today)
    .reduce((acc, item) => acc + item.amount, 0)

  // 4. Projected variable spending for the rest of the month
  const projectedVariableSpending = dailyBudgetGoal * daysRemaining

  // 5. Projected balance at the end of the month
  const projectedEndOfMonthBalance = currentBalance + remainingRecurringIncomes - remainingRecurringExpenses - projectedVariableSpending

  // 6. Monthly Burn Rate & Runway Calculation
  const estimatedMonthlyVariableSpending = dailyBudgetGoal * 30
  const estimatedTotalMonthlyOutflow = totalMonthlyRecurringExpenses + estimatedMonthlyVariableSpending
  const estimatedNetMonthlyBurn = estimatedTotalMonthlyOutflow - totalMonthlyRecurringIncomes

  let runwayMonths = 999
  if (estimatedNetMonthlyBurn > 0) {
    runwayMonths = Math.max(0, currentBalance / estimatedNetMonthlyBurn)
  }

  // 7. Calculate "Recommended Daily Budget" to break even (not burn capital)
  // Break-even daily budget = (Total Recurring Incomes - Total Recurring Expenses) / 30
  const breakEvenDailyBudget = Math.max(0, (totalMonthlyRecurringIncomes - totalMonthlyRecurringExpenses) / 30)

  // 8. Calculate how much daily budget you can spend to maintain balance over X months
  const safeDailyBudgetFor12Months = Math.max(0, ((currentBalance / 12) + totalMonthlyRecurringIncomes - totalMonthlyRecurringExpenses) / 30)
  const safeDailyBudgetFor24Months = Math.max(0, ((currentBalance / 24) + totalMonthlyRecurringIncomes - totalMonthlyRecurringExpenses) / 30)

  return {
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
    safeDailyBudgetFor12Months: Math.round(safeDailyBudgetFor12Months),
    safeDailyBudgetFor24Months: Math.round(safeDailyBudgetFor24Months),
    daysRemaining,
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
