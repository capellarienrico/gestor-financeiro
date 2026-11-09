import React, { useState } from 'react'
import { Sparkles, Sliders, ArrowRight, ShieldCheck, Check, DollarSign, Calculator, HelpCircle } from 'lucide-react'
import { formatCurrency, getMonthInfo } from '../utils/financialMath'

export function DailyForecastAssistant({
  data,
  forecast,
  onUpdateDailyGoal,
  onUpdateBalance
}) {
  const { monthName, daysRemaining, today, totalDays } = getMonthInfo()
  const [sliderValue, setSliderValue] = useState(data.dailyBudgetGoal || 100)
  
  // Guided assistant state
  const [targetEndMonthBalance, setTargetEndMonthBalance] = useState(data.currentBalance - 2000)
  const [showCalculationExplanation, setShowCalculationExplanation] = useState(false)

  // Live forecast based on slider
  const simulatedVariableTotal = sliderValue * daysRemaining
  const simulatedEndOfMonth = data.currentBalance + forecast.remainingRecurringIncomes - forecast.remainingRecurringExpenses - simulatedVariableTotal
  const simulatedMonthlyOutflow = forecast.totalMonthlyRecurringExpenses + (sliderValue * 30)
  const simulatedMonthlyBurn = simulatedMonthlyOutflow - forecast.totalMonthlyRecurringIncomes
  const simulatedRunway = simulatedMonthlyBurn > 0 ? (data.currentBalance / simulatedMonthlyBurn).toFixed(1) : '99+'

  // Calculate allowed daily budget based on desired target balance
  // Formula: Target = Balance + Incomes - Expenses - (DailyGoal * Days)
  // DailyGoal = (Balance + Incomes - Expenses - Target) / Days
  const calculatedAllowedDaily = daysRemaining > 0 
    ? Math.max(0, (data.currentBalance + forecast.remainingRecurringIncomes - forecast.remainingRecurringExpenses - targetEndMonthBalance) / daysRemaining)
    : 0

  const handleApplySlider = () => {
    onUpdateDailyGoal(sliderValue)
  }

  const handleApplyCalculated = () => {
    onUpdateDailyGoal(Math.round(calculatedAllowedDaily))
    setSliderValue(Math.round(calculatedAllowedDaily))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Assistente de Previsão & Orçamento Diário</h2>
            <p className="text-slate-400 text-sm">
              Descubra exatamente quanto você pode gastar por dia sem comprometer sua tranquilidade até o fim do mês e nos próximos anos.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Esquerdo: Simulador Interativo de Gasto Diário */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-white">Simulador em Tempo Real</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {daysRemaining} dias restantes no mês
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Gasto Diário Variável Estimado (Y):</span>
              <div className="text-2xl font-black text-emerald-400 flex items-center space-x-1">
                <span>{formatCurrency(sliderValue)}</span>
                <span className="text-xs text-slate-500 font-normal">/dia</span>
              </div>
            </div>

            <input
              type="range"
              min="20"
              max="500"
              step="5"
              value={sliderValue}
              onChange={e => setSliderValue(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>R$ 20/dia (Super enxuto)</span>
              <span>R$ 250/dia</span>
              <span>R$ 500/dia (Confortável)</span>
            </div>
          </div>

          {/* Resultado da Projeção para esse valor Y */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Se você gastar {formatCurrency(sliderValue)}/dia até o fim de {monthName}:
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total variável gasto até dia {totalDays}:</span>
                <span className="text-slate-200 font-medium">{formatCurrency(simulatedVariableTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Contas fixas restantes a pagar:</span>
                <span className="text-rose-400 font-medium">-{formatCurrency(forecast.remainingRecurringExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Entradas restantes a receber:</span>
                <span className="text-cyan-400 font-medium">+{formatCurrency(forecast.remainingRecurringIncomes)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="font-semibold text-white">Saldo Previsto no Fim do Mês:</span>
                <span className={`text-lg font-bold ${simulatedEndOfMonth >= data.currentBalance ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {formatCurrency(simulatedEndOfMonth)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                <span>Fôlego total de sobrevivência:</span>
                <span className="font-semibold text-indigo-400">{simulatedRunway} meses de contas pagas</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleApplySlider}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Adotar {formatCurrency(sliderValue)}/dia como minha Meta Oficial</span>
          </button>
        </div>

        {/* Lado Direito: Assistente Guiado de Meta Reversa */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-white">Cálculo Reverso: Quanto Posso Gastar?</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Diga qual saldo você gostaria de ver na sua conta no último dia do mês, e nós dizemos exatamente qual é o seu teto diário de gastos.
            </p>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Saldo desejado no fim de {monthName}:</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 text-sm">R$</span>
                <input
                  type="number"
                  value={targetEndMonthBalance}
                  onChange={e => setTargetEndMonthBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Resultado do Cálculo */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
              <span className="text-xs text-indigo-300 font-medium">Seu Teto de Gastos Diário Permitido:</span>
              <div className="text-3xl font-extrabold text-indigo-400">
                {formatCurrency(calculatedAllowedDaily)} <span className="text-xs text-indigo-300 font-normal">/dia</span>
              </div>
              <p className="text-xs text-slate-400">
                Gastando até {formatCurrency(calculatedAllowedDaily)} por dia pelos próximos {daysRemaining} dias, você atingirá exatamente o saldo pretendido de {formatCurrency(targetEndMonthBalance)}.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleApplyCalculated}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Usar Esse Teto Diário ({formatCurrency(calculatedAllowedDaily)}/dia)</span>
            </button>

            {/* Presets Estratégicos */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setTargetEndMonthBalance(data.currentBalance)}
                className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700/60 text-left transition cursor-pointer"
              >
                <span className="font-semibold block text-emerald-400">Não Perder Nada</span>
                <span className="text-[11px] text-slate-400">Terminar o mês com o mesmo saldo</span>
              </button>
              <button
                onClick={() => setTargetEndMonthBalance(data.currentBalance - 3000)}
                className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700/60 text-left transition cursor-pointer"
              >
                <span className="font-semibold block text-indigo-400">Queimar até R$ 3k</span>
                <span className="text-[11px] text-slate-400">Equilíbrio com mais folga</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
