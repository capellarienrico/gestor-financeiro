import React, { useState } from 'react'
import {
  Calendar,
  Clock,
  CheckCircle2,
  Flame,
  ArrowRight,
  Sparkles,
  Coins,
  ShieldCheck,
  Percent,
  TrendingUp
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis
} from 'recharts'
import {
  formatCurrency,
  getMonthInfo,
  simulateBalanceEvolution
} from '../utils/financialMath'
import { CATEGORIES } from '../utils/categories'

export function OverviewTab({
  data,
  forecast,
  onNavigateToForecast,
  onOpenNubankModal,
  onOpenScenarioModal
}) {
  const { monthName, daysRemaining, today, totalDays } = getMonthInfo()
  const [projectionHorizon, setProjectionHorizon] = useState('1a') // '6m' | '1a' | '3a' | 'fim_mes'

  const fixedMonthlyExpenses = (data.recurringExpenses || []).reduce((sum, item) => sum + item.amount, 0)
  const fixedMonthlyIncomes = (data.recurringIncomes || []).reduce((sum, item) => sum + item.amount, 0)

  // Compute projection chart data based on selected horizon
  let projectionChartData = []
  let chartSubtitle = ''

  if (projectionHorizon === 'fim_mes') {
    let runningBalance = data.currentBalance
    chartSubtitle = `Projeção até o fim do mês considerando contas fixas e meta de ${formatCurrency(data.dailyBudgetGoal)}/dia.`

    for (let d = today; d <= totalDays; d++) {
      const billsOnDay = data.recurringExpenses
        .filter(item => item.dayOfMonth === d)
        .reduce((sum, item) => sum + item.amount, 0)

      const incomesOnDay = data.recurringIncomes
        .filter(item => item.dayOfMonth === d)
        .reduce((sum, item) => sum + item.amount, 0)

      const dailyVariable = d > today ? data.dailyBudgetGoal : 0
      runningBalance = runningBalance + incomesOnDay - billsOnDay - dailyVariable

      projectionChartData.push({
        label: `Dia ${d}`,
        saldo: Math.round(runningBalance),
        rendimento: 0
      })
    }
  } else {
    const horizonMonths = projectionHorizon === '6m' ? 6 : projectionHorizon === '3a' ? 36 : 12
    const horizonLabel = projectionHorizon === '6m' ? '6 meses' : projectionHorizon === '3a' ? '3 anos (36 meses)' : '1 ano (12 meses)'
    chartSubtitle = `Projeção para os próximos ${horizonLabel} considerando entradas de ${formatCurrency(fixedMonthlyIncomes)}/mês, fixos de ${formatCurrency(fixedMonthlyExpenses)}/mês, meta de ${formatCurrency(data.dailyBudgetGoal)}/dia e rendimento do CDI.`

    const sim = simulateBalanceEvolution({
      startBalance: data.currentBalance,
      monthlyFixedExpenses: fixedMonthlyExpenses,
      dailyBudgetGoal: data.dailyBudgetGoal,
      monthlyOtherIncomes: fixedMonthlyIncomes,
      includeCDI: true,
      maxMonths: horizonMonths
    })

    const now = new Date()
    projectionChartData = sim.history.map((h) => {
      let label = 'Hoje'
      if (h.month > 0) {
        const d = new Date(now.getFullYear(), now.getMonth() + h.month, 1)
        const shortMonth = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
        const shortYear = d.getFullYear().toString().slice(-2)
        label = `${shortMonth.charAt(0).toUpperCase() + shortMonth.slice(1)}/${shortYear}`
      }
      return {
        label,
        saldo: h.balance,
        rendimento: h.cdiYield,
        fluxo: h.netFlow
      }
    })
  }

  const startBal = data.currentBalance
  const endBal = projectionChartData[projectionChartData.length - 1]?.saldo ?? startBal
  const balDiff = endBal - startBal
  const isGrowing = balDiff >= 0

  // Category breakdown for pie chart
  const categoryTotals = {}
  data.transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
    })
  // Also add recurring expenses
  data.recurringExpenses.forEach(r => {
    categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount
  })

  const pieData = Object.entries(categoryTotals).map(([catId, amount]) => {
    const cat = CATEGORIES.find(c => c.id === catId) || { name: 'Outros', color: '#64748b' }
    return {
      name: cat.name,
      value: Math.round(amount),
      color: cat.color
    }
  }).filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      {/* Runway / Fôlego Financeiro Shield Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-orange-600 font-semibold text-sm">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center">
                <Flame className="w-4 h-4 text-orange-600" />
              </div>
              <span>Seu Runway Financeiro (Fôlego Estimado com CDI)</span>
            </div>
            <h2 className="text-3xl font-extrabold text-stone-900">
              {forecast.runwayMonths > 120 ? 'Mais de 10 anos' : `${forecast.runwayMonths} meses de fôlego`}
            </h2>
            <p className="text-stone-600 text-sm max-w-2xl leading-relaxed">
              Com seu saldo atual ({formatCurrency(data.currentBalance)}), suas entradas automáticas (rendimentos e recebíveis somam <span className="text-emerald-700 font-semibold">{formatCurrency(forecast.totalMonthlyRecurringIncomes)}/mês</span>) cobrem boa parte das suas contas. Você só precisa queimar cerca de <span className="text-rose-700 font-semibold">{formatCurrency(Math.max(0, forecast.estimatedNetMonthlyBurn))}/mês</span> do patrimônio principal!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onOpenScenarioModal}
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Simulador 'E Se?'</span>
            </button>
            <button
              onClick={onNavigateToForecast}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <span>Simular Gastos Diários</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenNubankModal}
              title="Importar Extrato Bancário (Nubank, Itaú, Inter, Bradesco, OFX, CSV)"
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-sm transition flex items-center justify-center space-x-2 border border-stone-200 cursor-pointer"
            >
              <span>Importar Extrato</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Atual */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider">
            <span>Saldo Atual Total</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">Em conta</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {formatCurrency(data.currentBalance)}
          </div>
          <p className="text-xs text-stone-500">
            Disponível em conta e aplicações
          </p>
        </div>

        {/* Card 2: Previsão Fim do Mês */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider">
            <span>Previsão Fim de {monthName}</span>
            <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold">Projeção</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${forecast.projectedEndOfMonthBalance >= data.currentBalance ? 'text-emerald-700' : 'text-stone-900'}`}>
            {formatCurrency(forecast.projectedEndOfMonthBalance)}
          </div>
          <p className="text-xs text-stone-500">
            {daysRemaining} dias restantes a {formatCurrency(data.dailyBudgetGoal)}/dia
          </p>
        </div>

        {/* Card 3: Gastos Fixos Recorrentes */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider">
            <span>Contas Fixas do Mês</span>
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">Recorrentes</span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700">
            {formatCurrency(forecast.totalMonthlyRecurringExpenses)}
          </div>
          <p className="text-xs text-stone-500">
            Ainda a pagar este mês: {formatCurrency(forecast.remainingRecurringExpenses)}
          </p>
        </div>

        {/* Card 4: Entradas Mensais (Rendimentos + Recebíveis) */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider">
            <span>Entradas Recorrentes</span>
            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold">Renda + CDI</span>
          </div>
          <div className="text-2xl font-bold font-mono text-teal-700">
            +{formatCurrency(forecast.totalMonthlyRecurringIncomes)}
          </div>
          <p className="text-xs text-stone-500">
            A receber este mês: +{formatCurrency(forecast.remainingRecurringIncomes)}
          </p>
        </div>
      </div>

      {/* MELHORIA 3: Card Informativo do Rendimento Passivo Estimado do Saldo (100% CDI) */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-emerald-800 font-semibold text-xs uppercase tracking-wider">
              <Coins className="w-4 h-4 text-emerald-700" />
              <span>Reserva Ativa • Rendimento Passivo Estimado (100% CDI ~10.75% a.a.)</span>
            </div>

            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black font-mono text-emerald-700">
                  +{formatCurrency(forecast.cdiYield?.monthlyNetYield || 0)}
                </span>
                <span className="text-sm font-medium text-stone-600">/mês de renda passiva limpa</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed mt-1">
                Seu patrimônio disponível ({formatCurrency(data.currentBalance)}) investido a 100% do CDI rende aproximadamente <strong className="text-emerald-700 font-semibold font-mono">+{formatCurrency(forecast.cdiYield?.dailyNetYield || 0)}/dia</strong> pingando silenciosamente na conta, compensando a inflação e amortecendo sua queima de caixa.
              </p>
            </div>

            {/* Metrics Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-3 py-1 rounded-xl bg-white border border-stone-200 text-stone-700 shadow-sm flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Rendimento anual reinvestido: <strong className="text-emerald-700 font-semibold font-mono">+{formatCurrency(forecast.cdiYield?.annualNetYield || 0)}</strong></span>
              </span>

              {forecast.runwayGainMonths > 0 && (
                <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>+{forecast.runwayGainMonths} meses de fôlego extra gerados exclusivamente pelos juros</span>
                </span>
              )}

              {forecast.totalMonthlyRecurringExpenses > 0 && (
                <span className="px-3 py-1 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 flex items-center space-x-1.5">
                  <Percent className="w-3.5 h-3.5 text-orange-600" />
                  <span>Cobre {Math.min(100, Math.round(((forecast.cdiYield?.monthlyNetYield || 0) / forecast.totalMonthlyRecurringExpenses) * 100))}% dos seus custos fixos</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <button
              onClick={onOpenScenarioModal}
              className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Simular Cenários 'E Se?'</span>
            </button>
            <span className="text-[11px] text-center text-stone-500">
              Stress test de renda, cortes e compras
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Evolução Projetada do Saldo (Dropdown: 6m, 1a, 3a) */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-stone-900">Evolução Projetada do Saldo</h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isGrowing
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {isGrowing ? `+${formatCurrency(balDiff)}` : `-${formatCurrency(Math.abs(balDiff))}`}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">{chartSubtitle}</p>
            </div>

            {/* Dropdown de Seleção de Horizonte */}
            <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
              <label htmlFor="horizon-select" className="text-xs text-stone-500 font-medium hidden sm:inline">
                Horizonte:
              </label>
              <select
                id="horizon-select"
                value={projectionHorizon}
                onChange={e => setProjectionHorizon(e.target.value)}
                className="bg-stone-50 border border-stone-300 text-stone-900 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer shadow-sm"
              >
                <option value="6m">6 Meses (6m)</option>
                <option value="1a">1 Ano (1a)</option>
                <option value="3a">3 Anos (3a)</option>
                <option value="fim_mes">Fim do Mês Atual</option>
              </select>
            </div>
          </div>

          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isGrowing ? "#059669" : "#ea580c"} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={isGrowing ? "#059669" : "#ea580c"} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  stroke="#a8a29e"
                  fontSize={11}
                  tickLine={false}
                  interval={projectionHorizon === '3a' ? 5 : projectionHorizon === '1a' ? 1 : 0}
                />
                <YAxis
                  stroke="#a8a29e"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={val => `R$${(val/1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'saldo') return [formatCurrency(value), 'Saldo Projetado']
                    if (name === 'rendimento') return [formatCurrency(value), 'Rendimento CDI no Mês']
                    return [formatCurrency(value), name]
                  }}
                  labelStyle={{ color: '#78716c', fontWeight: 600 }}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e5e4', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#1c1917' }}
                />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke={isGrowing ? "#059669" : "#ea580c"}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#balanceGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Distribuição por Categoria */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-base font-semibold text-stone-900">Para Onde Vai o Dinheiro</h3>
            <p className="text-xs text-stone-500">Distribuição mensal entre contas fixas e gastos do dia a dia</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Total']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e5e4', borderRadius: '8px', color: '#1c1917' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-stone-400">Sem dados suficientes</p>
            )}
          </div>

          {/* Mini Legend */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {pieData.slice(0, 5).map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-stone-700 truncate max-w-[130px]">{item.name}</span>
                </div>
                <span className="text-stone-500 font-mono font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Próximas Contas a Pagar este Mês */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            <h3 className="text-base font-semibold text-stone-900">Contas Fixas Restantes em {monthName}</h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">Hoje é dia {today}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.recurringExpenses
            .filter(item => item.dayOfMonth >= today)
            .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
            .map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-stone-300 transition"
              >
                <div className="space-y-0.5">
                  <span className="text-sm font-medium text-stone-800 block">{item.description}</span>
                  <span className="text-xs text-amber-700 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Vence dia {item.dayOfMonth}</span>
                  </span>
                </div>
                <span className="text-sm font-semibold font-mono text-rose-700">{formatCurrency(item.amount)}</span>
              </div>
            ))}

          {data.recurringExpenses.filter(item => item.dayOfMonth >= today).length === 0 && (
            <div className="col-span-full py-6 text-center text-stone-400 text-sm flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Todas as contas fixas deste mês já venceram ou foram pagas!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
