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
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">Assistente de Previsão & Orçamento Diário</h2>
            <p className="text-stone-500 text-sm">
              Descubra exatamente quanto você pode gastar por dia sem comprometer sua tranquilidade até o fim do mês e nos próximos anos.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Esquerdo: Simulador Interativo de Gasto Diário */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-stone-900">Simulador em Tempo Real</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-medium">
              {daysRemaining} dias restantes no mês
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-stone-600 font-medium">Gasto Diário Variável Estimado (Y):</span>
              <div className="text-2xl font-black font-mono text-orange-600 flex items-center space-x-1">
                <span>{formatCurrency(sliderValue)}</span>
                <span className="text-xs text-stone-400 font-normal">/dia</span>
              </div>
            </div>

            <input
              type="range"
              min="20"
              max="500"
              step="5"
              value={sliderValue}
              onChange={e => setSliderValue(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
            <div className="flex justify-between text-xs text-stone-400">
              <span>R$ 20/dia (Super enxuto)</span>
              <span>R$ 250/dia</span>
              <span>R$ 500/dia (Confortável)</span>
            </div>
          </div>

          {/* Resultado da Projeção para esse valor Y */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Se você gastar {formatCurrency(sliderValue)}/dia até o fim de {monthName}:
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600">Total variável gasto até dia {totalDays}:</span>
                <span className="text-stone-800 font-medium font-mono">{formatCurrency(simulatedVariableTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Contas fixas restantes a pagar:</span>
                <span className="text-rose-700 font-medium font-mono">-{formatCurrency(forecast.remainingRecurringExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Entradas restantes a receber:</span>
                <span className="text-teal-700 font-medium font-mono">+{formatCurrency(forecast.remainingRecurringIncomes)}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between items-center">
                <span className="font-semibold text-stone-900">Saldo Previsto no Fim do Mês:</span>
                <span className={`text-lg font-bold font-mono ${simulatedEndOfMonth >= data.currentBalance ? 'text-emerald-700' : 'text-stone-800'}`}>
                  {formatCurrency(simulatedEndOfMonth)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-stone-500 pt-1">
                <span>Fôlego total de sobrevivência:</span>
                <span className="font-semibold text-orange-600">{simulatedRunway} meses de contas pagas</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleApplySlider}
            className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Adotar {formatCurrency(sliderValue)}/dia como minha Meta Oficial</span>
          </button>
        </div>

        {/* Lado Direito: Assistente Guiado de Meta Reversa */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-stone-900">Cálculo Reverso: Quanto Posso Gastar?</h3>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Diga qual saldo você gostaria de ver na sua conta no último dia do mês, e nós dizemos exatamente qual é o seu teto diário de gastos.
            </p>

            <div className="space-y-2">
              <label className="text-xs text-stone-600 font-medium">Saldo desejado no fim de {monthName}:</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-400 text-sm font-mono">R$</span>
                <input
                  type="number"
                  value={targetEndMonthBalance}
                  onChange={e => setTargetEndMonthBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2 pl-10 pr-3 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                />
              </div>
            </div>

            {/* Resultado do Cálculo */}
            <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 space-y-2">
              <span className="text-xs text-orange-800 font-semibold">Seu Teto de Gastos Diário Permitido:</span>
              <div className="text-3xl font-extrabold font-mono text-orange-600">
                {formatCurrency(calculatedAllowedDaily)} <span className="text-xs text-orange-700 font-normal">/dia</span>
              </div>
              <p className="text-xs text-stone-600">
                Gastando até {formatCurrency(calculatedAllowedDaily)} por dia pelos próximos {daysRemaining} dias, você atingirá exatamente o saldo pretendido de {formatCurrency(targetEndMonthBalance)}.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleApplyCalculated}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Usar Esse Teto Diário ({formatCurrency(calculatedAllowedDaily)}/dia)</span>
            </button>

            {/* Presets Estratégicos */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setTargetEndMonthBalance(data.currentBalance)}
                className="p-2.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs border border-stone-200 text-left transition cursor-pointer"
              >
                <span className="font-semibold block text-emerald-700">Não Perder Nada</span>
                <span className="text-[11px] text-stone-500">Terminar o mês com o mesmo saldo</span>
              </button>
              <button
                onClick={() => setTargetEndMonthBalance(data.currentBalance - 3000)}
                className="p-2.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs border border-stone-200 text-left transition cursor-pointer"
              >
                <span className="font-semibold block text-orange-600">Queimar até R$ 3k</span>
                <span className="text-[11px] text-stone-500">Equilíbrio com mais folga</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
