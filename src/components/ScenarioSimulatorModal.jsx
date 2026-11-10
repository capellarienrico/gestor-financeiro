import React, { useState, useMemo } from 'react'
import {
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Flame,
  Sliders,
  DollarSign,
  RotateCcw,
  Check,
  Percent,
  Coins,
  PiggyBank
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import { formatCurrency, simulateBalanceEvolution } from '../utils/financialMath'

export function ScenarioSimulatorModal({
  isOpen,
  onClose,
  data,
  onApplyPlan
}) {
  // State for interactive sliders
  const [extraIncome, setExtraIncome] = useState(0)
  const [cutPercent, setCutPercent] = useState(0)
  const [simulatedDailyGoal, setSimulatedDailyGoal] = useState(() => data.dailyBudgetGoal || 100)
  const [oneTimeExpense, setOneTimeExpense] = useState(0)
  const [includeCDI, setIncludeCDI] = useState(true)
  const [horizonMonths, setHorizonMonths] = useState(12)
  const [applySuccessMessage, setApplySuccessMessage] = useState(null)

  // Non-CDI recurring incomes
  const nonCdiRecurringIncomes = useMemo(() => {
    return (data.recurringIncomes || [])
      .filter(item => {
        const desc = (item.description || '').toLowerCase()
        const cat = (item.category || '').toLowerCase()
        return !desc.includes('cdi') && !desc.includes('selic') && !desc.includes('rendimento') && cat !== 'rendimentos'
      })
      .reduce((acc, item) => acc + item.amount, 0)
  }, [data.recurringIncomes])

  const totalFixedExpenses = useMemo(() => {
    return (data.recurringExpenses || []).reduce((acc, item) => acc + item.amount, 0)
  }, [data.recurringExpenses])

  // Base Simulation (Current Plan)
  const baseSim = useMemo(() => {
    return simulateBalanceEvolution({
      startBalance: data.currentBalance,
      monthlyFixedExpenses: totalFixedExpenses,
      dailyBudgetGoal: data.dailyBudgetGoal,
      monthlyOtherIncomes: nonCdiRecurringIncomes,
      extraMonthlyIncome: 0,
      variableCutPercent: 0,
      oneTimeExpense: 0,
      includeCDI,
      maxMonths: horizonMonths
    })
  }, [data.currentBalance, totalFixedExpenses, data.dailyBudgetGoal, nonCdiRecurringIncomes, includeCDI, horizonMonths])

  // Simulated Scenario
  const customSim = useMemo(() => {
    return simulateBalanceEvolution({
      startBalance: data.currentBalance,
      monthlyFixedExpenses: totalFixedExpenses,
      dailyBudgetGoal: simulatedDailyGoal,
      monthlyOtherIncomes: nonCdiRecurringIncomes,
      extraMonthlyIncome: Number(extraIncome) || 0,
      variableCutPercent: Number(cutPercent) / 100,
      oneTimeExpense: Number(oneTimeExpense) || 0,
      includeCDI,
      maxMonths: horizonMonths
    })
  }, [
    data.currentBalance,
    totalFixedExpenses,
    simulatedDailyGoal,
    nonCdiRecurringIncomes,
    extraIncome,
    cutPercent,
    oneTimeExpense,
    includeCDI,
    horizonMonths
  ])

  // Chart data
  const chartData = useMemo(() => {
    const points = []
    const baseHist = baseSim.history
    const customHist = customSim.history
    const maxLen = Math.max(baseHist.length, customHist.length)

    for (let i = 0; i < maxLen; i++) {
      const b = baseHist[i]
      const c = customHist[i]
      const monthLabel = b ? b.label : c ? c.label : `Mês ${i}`
      points.push({
        label: monthLabel,
        'Cenário Atual': b ? b.balance : 0,
        'Cenário Simulado': c ? c.balance : 0
      })
    }
    return points
  }, [baseSim, customSim])

  // Difference calculations
  const runwayDiff = useMemo(() => {
    if (customSim.isSelfSustaining && !baseSim.isSelfSustaining) {
      return { text: 'Autonomia Infinita (Perpétuo) 🚀', type: 'infinity' }
    }
    if (customSim.isSelfSustaining && baseSim.isSelfSustaining) {
      return { text: 'Sustentável em ambos', type: 'neutral' }
    }
    const diff = customSim.runwayMonths - baseSim.runwayMonths
    const rounded = Math.round(diff * 10) / 10
    if (rounded > 0) {
      const years = (rounded / 12).toFixed(1)
      return {
        text: `+${rounded} meses (+${years} anos) de fôlego!`,
        value: rounded,
        type: 'positive'
      }
    }
    if (rounded < 0) {
      return {
        text: `${rounded} meses de fôlego`,
        value: rounded,
        type: 'negative'
      }
    }
    return { text: 'Sem alteração no fôlego', type: 'neutral' }
  }, [customSim, baseSim])

  const diffIn6Months = customSim.balanceIn6Months - baseSim.balanceIn6Months
  const diffIn12Months = customSim.balanceIn12Months - baseSim.balanceIn12Months

  const handleReset = () => {
    setExtraIncome(0)
    setCutPercent(0)
    setSimulatedDailyGoal(data.dailyBudgetGoal || 100)
    setOneTimeExpense(0)
    setHorizonMonths(12)
    setIncludeCDI(true)
    setApplySuccessMessage(null)
  }

  const handleApply = () => {
    if (onApplyPlan) {
      onApplyPlan({
        newDailyGoal: simulatedDailyGoal,
        extraIncome: Number(extraIncome) || 0,
        oneTimeExpense: Number(oneTimeExpense) || 0,
        cutPercent: Number(cutPercent) || 0
      })
      setApplySuccessMessage('Metas aplicadas com sucesso ao seu planejamento!')
      setTimeout(() => {
        setApplySuccessMessage(null)
        onClose()
      }, 1500)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-stone-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border-t sm:border border-stone-200 rounded-t-3xl sm:rounded-3xl w-full max-w-5xl max-h-[88vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative pb-safe">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-stone-300 mx-auto mt-2 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="relative z-10 p-5 sm:p-6 border-b border-stone-200 flex items-start justify-between bg-stone-50">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-200">
                <Sparkles className="w-5 h-5 text-orange-600" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                Simulador de Cenários "E Se?"
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 hidden sm:inline-block">
                Stress Testing de Runway
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 max-w-2xl">
              Teste o impacto de novas fontes de renda, cortes de gastos, compras pontuais e o efeito dos juros sobre a longevidade da sua reserva financeira.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
              title="Resetar parâmetros"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Top KPI Comparison Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Runway */}
            <div className={`p-4 rounded-2xl border transition shadow-sm ${
              runwayDiff.type === 'positive' || runwayDiff.type === 'infinity'
                ? 'bg-emerald-50/70 border-emerald-200'
                : runwayDiff.type === 'negative'
                ? 'bg-rose-50/70 border-rose-200'
                : 'bg-stone-50 border-stone-200'
            }`}>
              <div className="flex items-center justify-between text-xs font-medium text-stone-500 mb-1">
                <span className="flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-600" />
                  <span>Novo Runway</span>
                </span>
                <span className="text-[11px] text-stone-500">
                  Base: {baseSim.runwayMonths >= 999 ? 'Infinito' : `${baseSim.runwayMonths} m`}
                </span>
              </div>
              <div className="text-2xl font-black text-stone-900">
                {customSim.runwayMonths >= 999 ? 'Autonomia Infinita' : `${customSim.runwayMonths} meses`}
              </div>
              <div className="text-xs font-semibold mt-1">
                <span className={
                  runwayDiff.type === 'positive' || runwayDiff.type === 'infinity'
                    ? 'text-emerald-700 flex items-center space-x-1'
                    : runwayDiff.type === 'negative'
                    ? 'text-rose-700 flex items-center space-x-1'
                    : 'text-stone-500'
                }>
                  {(runwayDiff.type === 'positive' || runwayDiff.type === 'infinity') && <TrendingUp className="w-3.5 h-3.5 inline" />}
                  {runwayDiff.type === 'negative' && <TrendingDown className="w-3.5 h-3.5 inline" />}
                  <span>{runwayDiff.text}</span>
                </span>
              </div>
            </div>

            {/* KPI 2: Saldo em 6 Meses */}
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium text-stone-500">
                <span>Saldo em 6 meses</span>
                <span className="text-[11px] text-stone-400">Base: {formatCurrency(baseSim.balanceIn6Months)}</span>
              </div>
              <div className="text-2xl font-black font-mono text-stone-900">
                {formatCurrency(customSim.balanceIn6Months)}
              </div>
              <p className={`text-xs font-semibold font-mono ${diffIn6Months >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {diffIn6Months >= 0 ? `+${formatCurrency(diffIn6Months)}` : formatCurrency(diffIn6Months)} vs. atual
              </p>
            </div>

            {/* KPI 3: Saldo em 12 Meses */}
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium text-stone-500">
                <span>Saldo em 12 meses</span>
                <span className="text-[11px] text-stone-400">Base: {formatCurrency(baseSim.balanceIn12Months)}</span>
              </div>
              <div className="text-2xl font-black font-mono text-stone-900">
                {formatCurrency(customSim.balanceIn12Months)}
              </div>
              <p className={`text-xs font-semibold font-mono ${diffIn12Months >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {diffIn12Months >= 0 ? `+${formatCurrency(diffIn12Months)}` : formatCurrency(diffIn12Months)} vs. atual
              </p>
            </div>

            {/* KPI 4: Gasto Mensal Total */}
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium text-stone-500">
                <span>Despesa Total/Mês</span>
                <span className="text-[11px] text-stone-400">Fixas + Var.</span>
              </div>
              <div className="text-2xl font-black font-mono text-stone-900">
                {formatCurrency(customSim.monthlyExpenses)}
              </div>
              <p className="text-xs text-stone-500">
                Renda total: <span className="text-emerald-700 font-semibold font-mono">{formatCurrency(customSim.totalIncomes)}/mês</span>
              </p>
            </div>
          </div>

          {/* Interactive Sliders Grid */}
          <div className="bg-stone-50/50 border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-stone-900">Parâmetros de Simulação Interativa</h3>
              </div>
              
              <div className="flex items-center space-x-3 text-xs">
                {/* CDI Toggle */}
                <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm hover:border-stone-300">
                  <input
                    type="checkbox"
                    checked={includeCDI}
                    onChange={e => setIncludeCDI(e.target.checked)}
                    className="rounded bg-stone-100 border-stone-300 text-orange-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-stone-700 font-medium">Juros 100% CDI (~10.75% a.a.)</span>
                </label>

                {/* Horizon Switch */}
                <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200">
                  <button
                    onClick={() => setHorizonMonths(12)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      horizonMonths === 12 ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    12 meses
                  </button>
                  <button
                    onClick={() => setHorizonMonths(24)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      horizonMonths === 24 ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    24 meses
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Slider 1: Renda Extra Mensal */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-stone-800 flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                    <span>Renda Extra Mensal</span>
                  </label>
                  <span className="text-base font-bold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    +{formatCurrency(extraIncome)}/mês
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15000"
                  step="250"
                  value={extraIncome}
                  onChange={e => setExtraIncome(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
                />
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: 'R$ 0', val: 0 },
                    { label: '+R$ 1.500 (Freela)', val: 1500 },
                    { label: '+R$ 3.500 (Consultoria)', val: 3500 },
                    { label: '+R$ 6.000 (PJ/CLT)', val: 6000 },
                    { label: '+R$ 10.000', val: 10000 }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => setExtraIncome(preset.val)}
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                        extraIncome === preset.val
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider 2: Redução de Gastos Variáveis */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-stone-800 flex items-center space-x-2">
                    <Percent className="w-4 h-4 text-orange-600" />
                    <span>Redução de Gastos Variáveis</span>
                  </label>
                  <span className="text-base font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-200">
                    {cutPercent}% de economia
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={cutPercent}
                  onChange={e => setCutPercent(Number(e.target.value))}
                  className="w-full accent-orange-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
                />
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: '0% (Padrão)', val: 0 },
                    { label: '15% (Aperto leve)', val: 15 },
                    { label: '30% (Modo Guerra)', val: 30 },
                    { label: '50% (Ultra Econômico)', val: 50 }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => setCutPercent(preset.val)}
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                        cutPercent === preset.val
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider 3: Meta Diária Alternativa */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-stone-800 flex items-center space-x-2">
                    <PiggyBank className="w-4 h-4 text-amber-600" />
                    <span>Meta Diária Alternativa</span>
                  </label>
                  <span className="text-base font-bold font-mono text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                    {formatCurrency(simulatedDailyGoal)}/dia
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="300"
                  step="5"
                  value={simulatedDailyGoal}
                  onChange={e => setSimulatedDailyGoal(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
                />
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: 'R$ 50/dia', val: 50 },
                    { label: 'R$ 80/dia', val: 80 },
                    { label: `R$ ${data.dailyBudgetGoal || 100}/dia (Atual)`, val: data.dailyBudgetGoal || 100 },
                    { label: 'R$ 150/dia', val: 150 },
                    { label: 'R$ 200/dia', val: 200 }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => setSimulatedDailyGoal(preset.val)}
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                        simulatedDailyGoal === preset.val
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider 4: Gasto Extra Pontual */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-stone-800 flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-rose-600" />
                    <span>Gasto Extra Pontual (Imprevisto/Viagem)</span>
                  </label>
                  <span className={`text-base font-bold font-mono px-2.5 py-0.5 rounded-lg border ${
                    oneTimeExpense > 0
                      ? 'text-rose-700 bg-rose-50 border-rose-200'
                      : 'text-stone-500 bg-stone-100 border-stone-200'
                  }`}>
                    {oneTimeExpense > 0 ? `-${formatCurrency(oneTimeExpense)}` : 'R$ 0'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="500"
                  value={oneTimeExpense}
                  onChange={e => setOneTimeExpense(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
                />
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: 'R$ 0', val: 0 },
                    { label: 'R$ 3.000 (Emergência)', val: 3000 },
                    { label: 'R$ 8.000 (Viagem)', val: 8000 },
                    { label: 'R$ 15.000 (Reforma/Carro)', val: 15000 }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => setOneTimeExpense(preset.val)}
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                        oneTimeExpense === preset.val
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Comparative Balance Evolution Chart */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                  <span>Projeção Comparativa do Saldo ({horizonMonths} meses)</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Compare a linha do <span className="text-stone-600 font-medium">Cenário Atual</span> contra o impacto do <span className="text-emerald-700 font-medium">Cenário Otimizado</span>.
                </p>
              </div>

              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-1 bg-stone-400 rounded" />
                  <span className="text-stone-500">Cenário Atual</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-1 bg-emerald-600 rounded" />
                  <span className="text-emerald-700 font-semibold">Cenário Simulado</span>
                </div>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="simulatedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="baseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#78716c" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#78716c" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    stroke="#a8a29e"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#a8a29e"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={val => `R$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(value), name]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e7e5e4',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      color: '#1c1917'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Cenário Atual"
                    stroke="#78716c"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#baseGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Cenário Simulado"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#simulatedGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 p-5 sm:p-6 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-stone-500">
            {applySuccessMessage ? (
              <span className="text-emerald-700 font-semibold flex items-center space-x-1.5">
                <Check className="w-4 h-4" />
                <span>{applySuccessMessage}</span>
              </span>
            ) : (
              <span>
                💡 A simulação é em tempo real e não altera seus dados originais até você clicar em aplicar.
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-medium text-sm transition cursor-pointer"
            >
              Apenas Simular
            </button>
            <button
              onClick={handleApply}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar estas metas ao meu plano</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
