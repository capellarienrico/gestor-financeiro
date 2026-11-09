export const DEFAULT_CDI_ANNUAL_RATE = 0.1075 // 10.75% ao ano (Taxa Selic/CDI atual)
export const DEFAULT_IR_RATE = 0.15 // Alíquota de IR 15% (Longo prazo / Tesouro / CDB)

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

/**
 * Calcula taxas efetivas do CDI mensal, diária e líquida
 */
export function calculateNetCDIRate(annualRate = DEFAULT_CDI_ANNUAL_RATE, irRate = 0) {
  // Taxa mensal equivalente de juros compostos: (1 + i_ano)^(1/12) - 1
  // Para 10.75% a.a., taxa mensal bruta é ~0.855% ao mês.
  // Se irRate for aplicado sobre rendimento líquido:
  const monthlyGrossRate = Math.pow(1 + annualRate, 1 / 12) - 1
  const netMonthlyRate = irRate > 0 ? monthlyGrossRate * (1 - irRate) : monthlyGrossRate
  const dailyRate = Math.pow(1 + netMonthlyRate, 1 / 30) - 1

  return {
    annualGrossRate: annualRate,
    monthlyGrossRate,
    netMonthlyRate,
    dailyRate
  }
}

/**
 * Calcula o rendimento passivo do saldo disponível a 100% do CDI
 */
export function calculateCDIYield(balance = 0, annualRate = DEFAULT_CDI_ANNUAL_RATE, irRate = 0) {
  const safeBalance = Math.max(0, Number(balance) || 0)
  if (safeBalance <= 0) {
    return {
      monthlyNetYield: 0,
      dailyNetYield: 0,
      annualNetYield: 0,
      netMonthlyRate: 0,
      annualGrossRate: annualRate
    }
  }

  const { netMonthlyRate, dailyRate, annualGrossRate } = calculateNetCDIRate(annualRate, irRate)
  const monthlyNetYield = safeBalance * netMonthlyRate
  const dailyNetYield = safeBalance * dailyRate
  // Rendimento anual considerando reinvestimento dos juros
  const annualNetYield = safeBalance * (Math.pow(1 + netMonthlyRate, 12) - 1)

  return {
    monthlyNetYield,
    dailyNetYield,
    annualNetYield,
    netMonthlyRate,
    annualGrossRate
  }
}

/**
 * Simula a evolução do saldo mês a mês com ou sem CDI e com parâmetros de cenários 'E Se?'
 */
export function simulateBalanceEvolution({
  startBalance = 155000,
  monthlyFixedExpenses = 0,
  dailyBudgetGoal = 100,
  monthlyOtherIncomes = 0,
  extraMonthlyIncome = 0,
  variableCutPercent = 0, // 0 a 0.50 (0% a 50%)
  oneTimeExpense = 0, // Gasto pontual deduzido no início
  annualCDI = DEFAULT_CDI_ANNUAL_RATE,
  irRate = 0,
  includeCDI = true,
  maxMonths = 24
}) {
  const safeStart = Math.max(0, Number(startBalance) || 0)
  let balance = Math.max(0, safeStart - (Number(oneTimeExpense) || 0))
  
  const cut = Math.min(0.5, Math.max(0, Number(variableCutPercent) || 0))
  const effectiveDaily = Math.max(0, Number(dailyBudgetGoal) || 0) * (1 - cut)
  const monthlyVariable = effectiveDaily * 30
  const monthlyExpenses = (Number(monthlyFixedExpenses) || 0) + monthlyVariable
  const totalIncomes = (Number(monthlyOtherIncomes) || 0) + (Number(extraMonthlyIncome) || 0)

  const { netMonthlyRate } = calculateNetCDIRate(annualCDI, irRate)

  const history = [
    {
      month: 0,
      label: 'Hoje',
      balance: Math.round(balance),
      cdiYield: 0,
      netFlow: 0
    }
  ]

  let runwayMonths = maxMonths
  let depleted = false

  for (let m = 1; m <= maxMonths; m++) {
    const cdiYield = includeCDI && balance > 0 ? balance * netMonthlyRate : 0
    const netFlow = totalIncomes + cdiYield - monthlyExpenses
    const prevBalance = balance
    balance = balance + netFlow

    if (balance <= 0) {
      depleted = true
      const frac = prevBalance > 0 && netFlow < 0 ? prevBalance / (-netFlow) : 0
      runwayMonths = m - 1 + frac
      balance = 0
      history.push({
        month: m,
        label: `Mês ${m}`,
        balance: 0,
        cdiYield: 0,
        netFlow: Math.round(netFlow)
      })
      // Preenche meses restantes com 0
      for (let rest = m + 1; rest <= maxMonths; rest++) {
        history.push({
          month: rest,
          label: `Mês ${rest}`,
          balance: 0,
          cdiYield: 0,
          netFlow: 0
        })
      }
      break
    } else {
      history.push({
        month: m,
        label: `Mês ${m}`,
        balance: Math.round(balance),
        cdiYield: Math.round(cdiYield),
        netFlow: Math.round(netFlow)
      })
    }
  }

  // Se não zerou após maxMonths, simula até 360 meses para achar o runway real
  if (!depleted) {
    let testBal = balance
    let extendedMonths = maxMonths
    const maxHorizon = 360 // 30 anos
    while (extendedMonths < maxHorizon) {
      extendedMonths++
      const cdi = includeCDI && testBal > 0 ? testBal * netMonthlyRate : 0
      const flow = totalIncomes + cdi - monthlyExpenses
      if (flow >= 0 && testBal >= safeStart) {
        runwayMonths = 999
        break
      }
      testBal += flow
      if (testBal <= 0) {
        depleted = true
        runwayMonths = extendedMonths
        break
      }
    }
    if (!depleted) {
      runwayMonths = 999
    }
  }

  const isSelfSustaining = runwayMonths >= 999 || (!depleted && history[history.length - 1].balance >= safeStart)

  return {
    runwayMonths: isSelfSustaining ? 999 : Math.round(runwayMonths * 10) / 10,
    isSelfSustaining,
    balanceIn6Months: history[Math.min(6, history.length - 1)]?.balance ?? 0,
    balanceIn12Months: history[Math.min(12, history.length - 1)]?.balance ?? 0,
    balanceIn24Months: history[Math.min(24, history.length - 1)]?.balance ?? 0,
    monthlyExpenses,
    totalIncomes,
    history
  }
}

/**
 * Calcula o runway dinâmico considerando juros compostos do CDI mês a mês
 */
export function calculateDynamicRunway({
  startBalance = 155000,
  monthlyFixedExpenses = 0,
  dailyBudgetGoal = 100,
  monthlyOtherIncomes = 0,
  annualCDI = DEFAULT_CDI_ANNUAL_RATE
}) {
  return simulateBalanceEvolution({
    startBalance,
    monthlyFixedExpenses,
    dailyBudgetGoal,
    monthlyOtherIncomes,
    extraMonthlyIncome: 0,
    variableCutPercent: 0,
    oneTimeExpense: 0,
    annualCDI,
    includeCDI: true,
    maxMonths: 60
  })
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

  const { today, totalDays, currentMonthKey } = getMonthInfo()

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

  // Traditional linear runway
  let linearRunwayMonths = 999
  if (estimatedNetMonthlyBurn > 0) {
    linearRunwayMonths = Math.max(0, startBalance / estimatedNetMonthlyBurn)
  }

  // 7. CDI Yield Calculation & Dynamic Compounded Runway
  const cdiYield = calculateCDIYield(startBalance, DEFAULT_CDI_ANNUAL_RATE)
  
  // Recorrentes sem considerar itens já descritos como CDI (para evitar duplicidade no cálculo dinâmico)
  const nonCdiRecurringIncomes = recurringIncomes
    .filter(item => {
      const desc = (item.description || '').toLowerCase()
      const cat = (item.category || '').toLowerCase()
      return !desc.includes('cdi') && !desc.includes('selic') && !desc.includes('rendimento') && cat !== 'rendimentos'
    })
    .reduce((acc, item) => acc + item.amount, 0)

  const dynamicRunway = calculateDynamicRunway({
    startBalance,
    monthlyFixedExpenses: totalMonthlyRecurringExpenses,
    dailyBudgetGoal,
    monthlyOtherIncomes: nonCdiRecurringIncomes,
    annualCDI: DEFAULT_CDI_ANNUAL_RATE
  })

  // Dynamic runway with CDI
  const runwayMonths = dynamicRunway.isSelfSustaining ? 999 : dynamicRunway.runwayMonths
  const linearRunwayRounded = Math.round(linearRunwayMonths * 10) / 10
  const runwayGainMonths = runwayMonths >= 999 ? 999 : Math.max(0, Math.round((runwayMonths - linearRunwayRounded) * 10) / 10)

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
    runwayMonths,
    linearRunwayMonths: linearRunwayRounded,
    runwayWithCDIMonths: runwayMonths,
    runwayGainMonths,
    isSelfSustaining: dynamicRunway.isSelfSustaining,
    cdiYield,
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
