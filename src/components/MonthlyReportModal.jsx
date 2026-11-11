import React, { useRef } from 'react'
import {
  FileText,
  Printer,
  Download,
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart,
  CheckCircle2,
  Wallet
} from 'lucide-react'
import { formatCurrency } from '../utils/financialMath'

export function MonthlyReportModal({
  isOpen,
  onClose,
  data,
  selectedYear = new Date().getFullYear(),
  selectedMonth = new Date().getMonth(),
  categories = [],
  incomeCategories = []
}) {
  const printAreaRef = useRef(null)

  if (!isOpen) return null

  const monthDate = new Date(selectedYear, selectedMonth, 1)
  const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'long' })
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const currentMonthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`

  // 1. Transactions of the active month
  const monthTransactions = (data.transactions || []).filter(
    t => t.date && t.date.startsWith(currentMonthKey)
  )

  const expenses = monthTransactions.filter(t => t.type === 'expense')
  const incomes = monthTransactions.filter(t => t.type === 'income')

  // 2. Recurring expenses and incomes in this month
  const recurringExp = data.recurringExpenses || []
  const recurringInc = data.recurringIncomes || []

  const totalRecurringExp = recurringExp.reduce((s, r) => s + r.amount, 0)
  const totalRecurringInc = recurringInc.reduce((s, r) => s + r.amount, 0)

  const totalManualExp = expenses.reduce((s, t) => s + t.amount, 0)
  const totalManualInc = incomes.reduce((s, t) => s + t.amount, 0)

  const totalIncomes = totalManualInc + totalRecurringInc
  const totalExpenses = totalManualExp + totalRecurringExp
  const netResult = totalIncomes - totalExpenses

  // Daily budget metrics
  const dailyGoal = data.dailyBudgetGoal || 65
  const currentDay = new Date().getDate()
  const daysPassed = (selectedYear === new Date().getFullYear() && selectedMonth === new Date().getMonth())
    ? currentDay
    : daysInMonth
  const avgDailySpent = daysPassed > 0 ? (totalManualExp / daysPassed) : 0

  // 3. Category Breakdown
  const catBreakdown = {}
  expenses.forEach(t => {
    catBreakdown[t.category] = (catBreakdown[t.category] || 0) + t.amount
  })
  recurringExp.forEach(r => {
    catBreakdown[r.category] = (catBreakdown[r.category] || 0) + r.amount
  })

  const sortedCategories = Object.entries(catBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([catId, amount]) => {
      const cat = categories.find(c => c.id === catId)
      const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
      return {
        id: catId,
        name: cat?.name || catId,
        color: cat?.color || '#ea580c',
        amount,
        pct
      }
    })

  // Handle Print / Save as PDF
  const handlePrint = () => {
    window.print()
  }

  // Handle CSV Download
  const handleDownloadCSV = () => {
    let csv = `Relatório Financeiro Consolidado - ${capitalizedMonth} ${selectedYear}\n\n`
    csv += `Resumo Geral\n`
    csv += `Total de Entradas,R$ ${totalIncomes.toFixed(2)}\n`
    csv += `Total de Saídas,R$ ${totalExpenses.toFixed(2)}\n`
    csv += `Resultado Líquido,R$ ${netResult.toFixed(2)}\n`
    csv += `Média Diária Real,R$ ${avgDailySpent.toFixed(2)}/dia\n`
    csv += `Meta Diária,R$ ${dailyGoal.toFixed(2)}/dia\n\n`

    csv += `Despesas por Categoria\n`
    csv += `Categoria,Valor (R$),Percentual\n`
    sortedCategories.forEach(c => {
      csv += `"${c.name}",${c.amount.toFixed(2)},${c.pct}%\n`
    })
    csv += `\n`

    csv += `Extrato de Lançamentos do Mês\n`
    csv += `Data,Tipo,Descrição,Categoria,Método,Valor\n`
    monthTransactions
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach(t => {
        const cat = categories.find(c => c.id === t.category)
        csv += `"${t.date}","${t.type === 'expense' ? 'Saída' : 'Entrada'}","${t.description.replace(/"/g, '""')}","${cat?.name || t.category}","${t.paymentMethod || t.source || 'Pix'}",${t.amount.toFixed(2)}\n`
      })

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Relatorio_Financeiro_${capitalizedMonth}_${selectedYear}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const currentDateFormatted = new Date().toLocaleDateString('pt-BR')

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white border border-stone-200 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Toolbar - Hidden during print */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-200 bg-stone-50 no-print shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center border border-orange-200 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 flex items-center space-x-2">
                <span>Relatório Executivo &bull; {capitalizedMonth} {selectedYear}</span>
              </h3>
              <p className="text-xs text-stone-500">Visualização consolidada e exportação profissional</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
              title="Baixar dados em formato CSV para Excel ou Planilhas"
            >
              <Download className="w-4 h-4 text-stone-500" />
              <span className="hidden sm:inline">Exportar</span>
              <span>CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
              title="Abre a janela de impressão do sistema com opção direta de Salvar como PDF"
            >
              <Printer className="w-4 h-4 text-stone-300" />
              <span>Salvar PDF / Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content Container (Printable Area) */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-6 flex-1 bg-stone-50/50" id="printable-report" ref={printAreaRef}>
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 uppercase tracking-wider">
                  Relatório Executivo
                </span>
                <span className="text-xs text-stone-400">&bull;</span>
                <span className="text-xs text-stone-500">Gestor Financeiro Pessoal</span>
              </div>
              <h1 className="text-2xl font-bold text-stone-900">
                Demonstrativo Financeiro de {capitalizedMonth} de {selectedYear}
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Período consolidado com fluxo de caixa, contas fixas e distribuição de orçamento.
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-stone-500 font-mono space-y-0.5">
              <div>Emissão: <strong className="text-stone-700">{currentDateFormatted}</strong></div>
              <div>Base de cálculo: <strong className="text-stone-700">{daysInMonth} dias</strong></div>
              <div>Privacidade: <strong className="text-emerald-700">100% Local</strong></div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-stone-500">Entradas</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-700">
                +{formatCurrency(totalIncomes)}
              </div>
              <span className="text-[10px] text-stone-400 block mt-1">
                Salários e rendimentos
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-stone-500">Saídas Totais</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-rose-700">
                -{formatCurrency(totalExpenses)}
              </div>
              <span className="text-[10px] text-stone-400 block mt-1">
                Fixos + Lançamentos diários
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-stone-500">Resultado Líquido</span>
                <Wallet className="w-4 h-4 text-stone-600" />
              </div>
              <div className={`text-lg sm:text-xl font-bold font-mono ${
                netResult >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {netResult >= 0 ? `+${formatCurrency(netResult)}` : formatCurrency(netResult)}
              </div>
              <span className="text-[10px] text-stone-400 block mt-1">
                {netResult >= 0 ? '✓ Superávit no mês' : '⚠ Déficit no mês'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-stone-500">Média Diária</span>
                <Calendar className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-stone-900">
                {formatCurrency(avgDailySpent)}<span className="text-xs text-stone-500 font-normal">/dia</span>
              </div>
              <span className={`text-[10px] block mt-1 font-semibold ${
                avgDailySpent <= dailyGoal ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                Meta: {formatCurrency(dailyGoal)}/dia ({avgDailySpent <= dailyGoal ? 'Dentro da meta' : 'Acima da meta'})
              </span>
            </div>
          </div>

          {/* Category Breakdown Section */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-orange-600" />
                <span>Distribuição de Despesas por Categoria</span>
              </h3>
              <span className="text-xs text-stone-400 font-mono">
                Total: {formatCurrency(totalExpenses)}
              </span>
            </div>

            {sortedCategories.length > 0 ? (
              <div className="space-y-3">
                {sortedCategories.map(cat => (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-semibold text-stone-800">{cat.name}</span>
                      </div>
                      <div className="space-x-2 font-mono">
                        <span className="text-stone-500 text-[11px] font-sans">({cat.pct}%)</span>
                        <span className="font-bold text-stone-900">{formatCurrency(cat.amount)}</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(2, cat.pct))}%`,
                          backgroundColor: cat.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 py-3 text-center">Nenhuma despesa registrada para este mês.</p>
            )}
          </div>

          {/* Recurring Expenses Table */}
          {recurringExp.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>Contas Fixas & Faturas Recorrentes do Mês</span>
                </h3>
                <span className="text-xs text-amber-800 font-mono font-bold">
                  -{formatCurrency(totalRecurringExp)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {recurringExp.map(rec => (
                  <div key={rec.id} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div>
                      <span className="font-semibold text-stone-800 block">{rec.description}</span>
                      <span className="text-[10px] text-stone-500 font-mono">Todo dia {rec.dayOfMonth}</span>
                    </div>
                    <span className="font-mono font-bold text-stone-900">
                      -{formatCurrency(rec.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Month Transactions List */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900">Extrato dos Lançamentos Diários</h3>
              <span className="text-xs text-stone-400 font-mono">{monthTransactions.length} lançamentos</span>
            </div>

            {monthTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-2 px-2">Data</th>
                      <th className="py-2 px-2">Descrição</th>
                      <th className="py-2 px-2">Categoria</th>
                      <th className="py-2 px-2">Método</th>
                      <th className="py-2 px-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {monthTransactions
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map(t => {
                        const cat = categories.find(c => c.id === t.category)
                        return (
                          <tr key={t.id} className="hover:bg-stone-50/50">
                            <td className="py-2 px-2 font-mono text-stone-500 text-[11px] whitespace-nowrap">
                              {t.date.split('-').reverse().slice(0, 2).join('/')}
                            </td>
                            <td className="py-2 px-2 font-medium text-stone-800">{t.description}</td>
                            <td className="py-2 px-2 text-stone-500 text-[11px]">
                              {cat?.name || t.category}
                            </td>
                            <td className="py-2 px-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200 font-medium">
                                {t.paymentMethod || t.source || 'Pix'}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold whitespace-nowrap">
                              <span className={t.type === 'expense' ? 'text-rose-700' : 'text-emerald-700'}>
                                {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-stone-400 py-3 text-center">Nenhum lançamento diário neste mês.</p>
            )}
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-stone-200 text-center text-[11px] text-stone-400">
            Relatório gerado em {currentDateFormatted} via Gestor Financeiro Pessoal &bull; capellarienrico/gestor-financeiro
          </div>
        </div>
      </div>
    </div>
  )
}
