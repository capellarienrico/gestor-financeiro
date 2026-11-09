import React from 'react'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  PieChart as PieChartIcon,
  Flame,
  ArrowRight
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts'
import { formatCurrency, getMonthInfo } from '../utils/financialMath'
import { CATEGORIES } from '../utils/categories'

export function OverviewTab({
  data,
  forecast,
  onNavigateToForecast,
  onOpenNubankModal
}) {
  const { monthName, daysRemaining, today, totalDays } = getMonthInfo()

  // Generate day-by-day projection for remaining days of the month
  const projectionChartData = []
  let runningBalance = data.currentBalance

  for (let d = today; d <= totalDays; d++) {
    // Check if any recurring bills fall on day d
    const billsOnDay = data.recurringExpenses
      .filter(item => item.dayOfMonth === d)
      .reduce((sum, item) => sum + item.amount, 0)

    const incomesOnDay = data.recurringIncomes
      .filter(item => item.dayOfMonth === d)
      .reduce((sum, item) => sum + item.amount, 0)

    // Daily variable burn
    const dailyVariable = d > today ? data.dailyBudgetGoal : 0
    runningBalance = runningBalance + incomesOnDay - billsOnDay - dailyVariable

    projectionChartData.push({
      dia: `Dia ${d}`,
      saldo: Math.round(runningBalance),
      contas: billsOnDay
    })
  }

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
      {/* Runway / Pós-Demissão Shield Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm">
              <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
              <span>Seu Runway Financeiro (Fôlego sem trabalhar)</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              {forecast.runwayMonths > 120 ? 'Mais de 10 anos' : `${forecast.runwayMonths} meses de fôlego`}
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Com seu saldo atual ({formatCurrency(data.currentBalance)}), suas entradas automáticas (Seguro-Desemprego + Rendimento CDI somam <span className="text-emerald-400 font-semibold">{formatCurrency(forecast.totalMonthlyRecurringIncomes)}/mês</span>) cobrem boa parte das suas contas. Você só precisa queimar cerca de <span className="text-rose-400 font-semibold">{formatCurrency(Math.max(0, forecast.estimatedNetMonthlyBurn))}/mês</span> do patrimônio principal!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNavigateToForecast}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <span>Simular Gastos Diários</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenNubankModal}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition flex items-center justify-center space-x-2 border border-slate-700 cursor-pointer"
            >
              <span>Puxar Médias do Nubank</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Atual */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Saldo Atual Total</span>
            <span className="p-1 rounded bg-slate-800 text-emerald-400">Em conta</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {formatCurrency(data.currentBalance)}
          </div>
          <p className="text-xs text-slate-400">
            Base da rescisão + FGTS + reserva
          </p>
        </div>

        {/* Card 2: Previsão Fim do Mês */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Previsão Fim de {monthName}</span>
            <span className="p-1 rounded bg-slate-800 text-indigo-400">Projeção</span>
          </div>
          <div className={`text-2xl font-bold ${forecast.projectedEndOfMonthBalance >= data.currentBalance ? 'text-emerald-400' : 'text-slate-100'}`}>
            {formatCurrency(forecast.projectedEndOfMonthBalance)}
          </div>
          <p className="text-xs text-slate-400">
            {daysRemaining} dias restantes a {formatCurrency(data.dailyBudgetGoal)}/dia
          </p>
        </div>

        {/* Card 3: Gastos Fixos Recorrentes */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Contas Fixas do Mês</span>
            <span className="p-1 rounded bg-slate-800 text-rose-400">Recorrentes</span>
          </div>
          <div className="text-2xl font-bold text-rose-400">
            {formatCurrency(forecast.totalMonthlyRecurringExpenses)}
          </div>
          <p className="text-xs text-slate-400">
            Ainda a pagar este mês: {formatCurrency(forecast.remainingRecurringExpenses)}
          </p>
        </div>

        {/* Card 4: Entradas Mensais (Seguro + CDI) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Entradas Recorrentes</span>
            <span className="p-1 rounded bg-slate-800 text-cyan-400">Seguro + CDI</span>
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            +{formatCurrency(forecast.totalMonthlyRecurringIncomes)}
          </div>
          <p className="text-xs text-slate-400">
            A receber este mês: +{formatCurrency(forecast.remainingRecurringIncomes)}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Projeção de Saldo até o Fim do Mês */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Evolução Projetada do Saldo</h3>
              <p className="text-xs text-slate-400">Como o saldo se comportará até o último dia do mês considerando contas fixas e o gasto diário de {formatCurrency(data.dailyBudgetGoal)}/dia</p>
            </div>
            <div className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {daysRemaining} dias restantes
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="dia" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={val => `R$${(val/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Saldo Projetado']}
                  labelStyle={{ color: '#94a3b8' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="saldo" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Distribuição por Categoria */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Para Onde Vai o Dinheiro</h3>
            <p className="text-xs text-slate-400">Distribuição mensal entre contas fixas e gastos do dia a dia</p>
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
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">Sem dados suficientes</p>
            )}
          </div>

          {/* Mini Legend */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {pieData.slice(0, 5).map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 truncate max-w-[130px]">{item.name}</span>
                </div>
                <span className="text-slate-400 font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Próximas Contas a Pagar este Mês */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Contas Fixas Restantes em {monthName}</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Hoje é dia {today}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.recurringExpenses
            .filter(item => item.dayOfMonth >= today)
            .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
            .map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="space-y-0.5">
                  <span className="text-sm font-medium text-slate-200 block">{item.description}</span>
                  <span className="text-xs text-amber-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Vence dia {item.dayOfMonth}</span>
                  </span>
                </div>
                <span className="text-sm font-semibold text-rose-400">{formatCurrency(item.amount)}</span>
              </div>
            ))}

          {data.recurringExpenses.filter(item => item.dayOfMonth >= today).length === 0 && (
            <div className="col-span-full py-6 text-center text-slate-500 text-sm flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Todas as contas fixas deste mês já venceram ou foram pagas!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
