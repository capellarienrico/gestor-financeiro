import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  X,
  ExternalLink
} from 'lucide-react'
import { formatCurrency } from '../utils/financialMath'
import { getCategoryById } from '../utils/categories'

export function SpreadsheetTab({
  data,
  categories,
  incomeCategories,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction
}) {
  const todayDate = new Date()
  const [selectedYear, setSelectedYear] = useState(todayDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(todayDate.getMonth())

  // Day Details / Breakdown Modal state
  const [selectedDayDetails, setSelectedDayDetails] = useState(null) // day number

  // Add / Edit Transaction Form Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [targetDay, setTargetDay] = useState(todayDate.getDate())
  const [formType, setFormType] = useState('expense')
  const [formDesc, setFormDesc] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCategory, setFormCategory] = useState('alimentacao')

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleDateString('pt-BR', { month: 'long' })
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const currentMonthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`

  const isCurrentActualMonth = todayDate.getFullYear() === selectedYear && todayDate.getMonth() === selectedMonth
  const todayNumber = todayDate.getDate()

  // Filter transactions for this month
  const monthTransactions = data.transactions.filter(t => t.date.startsWith(currentMonthKey))

  // Open Quick Add for a specific day
  const handleOpenQuickAdd = (day, defaultType = 'expense') => {
    setTargetDay(day)
    setEditingItem(null)
    setFormType(defaultType)
    setFormDesc('')
    setFormAmount('')
    setFormCategory(defaultType === 'expense' ? (categories[0]?.id || 'alimentacao') : (incomeCategories[0]?.id || 'salario'))
    setModalOpen(true)
  }

  // Open Edit for an existing transaction
  const handleOpenEdit = (tx) => {
    setEditingItem(tx)
    setTargetDay(parseInt(tx.date.substring(8, 10), 10) || 1)
    setFormType(tx.type)
    setFormDesc(tx.description)
    setFormAmount(tx.amount.toString())
    setFormCategory(tx.category)
    setModalOpen(true)
  }

  const handleSaveModal = (e) => {
    e.preventDefault()
    const amt = parseFloat(formAmount)
    if (!formDesc.trim() || isNaN(amt) || amt <= 0) return

    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`

    if (editingItem) {
      onEditTransaction({
        ...editingItem,
        date: dateStr,
        description: formDesc.trim(),
        amount: amt,
        type: formType,
        category: formCategory
      })
    } else {
      onAddTransaction({
        id: 'tx-' + Date.now(),
        date: dateStr,
        description: formDesc.trim(),
        amount: amt,
        type: formType,
        category: formCategory,
        source: 'Planilha'
      })
    }

    setModalOpen(false)
  }

  // Export spreadsheet as CSV
  const handleExportCSV = () => {
    let csv = `Dia,Entradas,Gastos Diários,Saídas Recorrentes,Saldo\n`
    let runningBalance = data.currentBalance

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0')
      const dateKey = `${currentMonthKey}-${dayStr}`
      const dayTxs = monthTransactions.filter(t => t.date === dateKey)
      const dayIncomes = dayTxs.filter(t => t.type === 'income')
      const dayExpenses = dayTxs.filter(t => t.type === 'expense')
      const dayRecurring = data.recurringExpenses.filter(r => r.dayOfMonth === day)

      const totalIn = dayIncomes.reduce((s, t) => s + t.amount, 0)
      const totalExp = dayExpenses.reduce((s, t) => s + t.amount, 0)
      const totalRec = dayRecurring.reduce((s, r) => s + r.amount, 0)

      runningBalance = runningBalance + totalIn - totalExp - totalRec

      csv += `"${day}","${totalIn}","${totalExp}","${totalRec}","${runningBalance.toFixed(2)}"\n`
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `planilha-${capitalizedMonth}-${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Calculate day-by-day rows
  let runningBalance = data.currentBalance
  let monthTotalIn = 0
  let monthTotalExp = 0
  let monthTotalRec = 0

  const rows = []
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0')
    const dateKey = `${currentMonthKey}-${dayStr}`
    const dayDate = new Date(selectedYear, selectedMonth, day)
    const weekDay = dayDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')

    const dayTxs = monthTransactions.filter(t => t.date === dateKey)
    const dayIncomes = dayTxs.filter(t => t.type === 'income')
    const dayExpenses = dayTxs.filter(t => t.type === 'expense')

    const dayRecurring = data.recurringExpenses.filter(r => r.dayOfMonth === day)
    const dayRecurringIn = data.recurringIncomes.filter(r => r.dayOfMonth === day)

    const sumIncomes = dayIncomes.reduce((s, t) => s + t.amount, 0) + dayRecurringIn.reduce((s, r) => s + r.amount, 0)
    const sumExpenses = dayExpenses.reduce((s, t) => s + t.amount, 0)
    const sumRecurring = dayRecurring.reduce((s, r) => s + r.amount, 0)

    monthTotalIn += sumIncomes
    monthTotalExp += sumExpenses
    monthTotalRec += sumRecurring

    runningBalance = runningBalance + sumIncomes - sumExpenses - sumRecurring

    rows.push({
      day,
      weekDay,
      dateKey,
      isToday: isCurrentActualMonth && day === todayNumber,
      isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
      dayIncomes,
      dayExpenses,
      dayRecurring,
      dayRecurringIn,
      sumIncomes,
      sumExpenses,
      sumRecurring,
      saldo: runningBalance
    })
  }

  // Selected Day Details Object
  const activeDayRow = selectedDayDetails ? rows.find(r => r.day === selectedDayDetails) : null

  return (
    <div className="space-y-6">
      {/* Top Header & Month Controller */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>Planilha Mensal de Gastos & Entradas</span>
            </h2>
            <p className="text-xs text-slate-400">
              Células com valores consolidados no estilo Excel. Clique em qualquer célula para ver a soma e detalhamento do dia.
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 rounded-xl p-1.5 shadow-inner">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center px-4">
            <span className="text-sm font-bold text-white capitalize block">{monthName}</span>
            <span className="text-[11px] text-slate-500 font-medium">{selectedYear}</span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700 cursor-pointer"
            title="Exportar como CSV compatível com Excel"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Planilha (CSV)</span>
          </button>
        </div>
      </div>

      {/* Excel Spreadsheet Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            {/* Header com o Mês centralizado */}
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800">
                <th
                  colSpan={5}
                  className="py-3 px-4 text-center font-bold text-base text-white tracking-wide uppercase bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800"
                >
                  {capitalizedMonth} / {selectedYear}
                </th>
              </tr>
              <tr className="bg-slate-950/80 border-b border-slate-700 text-slate-300 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-3 text-center w-20 border-r border-slate-800">Dia</th>
                <th className="py-3 px-4 w-1/4 border-r border-slate-800 text-right">Entrada</th>
                <th className="py-3 px-4 w-1/4 border-r border-slate-800 text-right">Gastos diários</th>
                <th className="py-3 px-4 w-1/4 border-r border-slate-800 text-right">Saídas recorrentes</th>
                <th className="py-3 px-4 text-right w-36">Saldo</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80 font-mono">
              {rows.map((row) => {
                const hasIncomes = row.sumIncomes > 0
                const hasExpenses = row.sumExpenses > 0
                const hasRecurring = row.sumRecurring > 0

                return (
                  <tr
                    key={row.day}
                    className={`transition group ${
                      row.isToday
                        ? 'bg-indigo-950/40 ring-1 ring-inset ring-indigo-500/40'
                        : row.isWeekend
                        ? 'bg-slate-950/30 hover:bg-slate-800/40'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Coluna 1: Dia */}
                    <td
                      onClick={() => setSelectedDayDetails(row.day)}
                      className="py-2.5 px-3 text-center border-r border-slate-800 font-bold whitespace-nowrap cursor-pointer hover:bg-slate-800/50"
                      title="Clique para ver os lançamentos deste dia"
                    >
                      <div className="flex items-center justify-center space-x-1.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                          row.isToday
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                            : 'text-slate-300'
                        }`}>
                          {row.day}
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal uppercase">
                          {row.weekDay}
                        </span>
                      </div>
                    </td>

                    {/* Coluna 2: Entrada (Apenas Consolidado) */}
                    <td
                      onClick={() => setSelectedDayDetails(row.day)}
                      className="py-2.5 px-4 border-r border-slate-800 text-right cursor-pointer hover:bg-emerald-500/5 transition group/cell"
                      title="Clique para ver a soma e detalhes das entradas"
                    >
                      {hasIncomes ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          {row.dayIncomes.length > 1 && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-sans border border-emerald-500/20">
                              {row.dayIncomes.length} itens
                            </span>
                          )}
                          <span className="font-semibold text-emerald-400">
                            +{formatCurrency(row.sumIncomes)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-sans">—</span>
                      )}
                    </td>

                    {/* Coluna 3: Gastos diários (Apenas Consolidado) */}
                    <td
                      onClick={() => setSelectedDayDetails(row.day)}
                      className="py-2.5 px-4 border-r border-slate-800 text-right cursor-pointer hover:bg-rose-500/5 transition group/cell"
                      title="Clique para ver a soma de cada gasto deste dia"
                    >
                      {hasExpenses ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          {row.dayExpenses.length > 1 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 font-sans border border-rose-500/20">
                              {row.dayExpenses.length} gastos
                            </span>
                          )}
                          <span className="font-semibold text-rose-400">
                            -{formatCurrency(row.sumExpenses)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-sans">—</span>
                      )}
                    </td>

                    {/* Coluna 4: Saídas recorrentes (Apenas Consolidado) */}
                    <td
                      onClick={() => setSelectedDayDetails(row.day)}
                      className="py-2.5 px-4 border-r border-slate-800 text-right cursor-pointer hover:bg-amber-500/5 transition group/cell"
                      title="Clique para ver as contas fixas agendadas deste dia"
                    >
                      {hasRecurring ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          {row.dayRecurring.length > 1 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-sans border border-amber-500/20">
                              {row.dayRecurring.length} contas
                            </span>
                          )}
                          <span className="font-semibold text-amber-400">
                            -{formatCurrency(row.sumRecurring)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-sans">—</span>
                      )}
                    </td>

                    {/* Coluna 5: Saldo */}
                    <td
                      onClick={() => setSelectedDayDetails(row.day)}
                      className="py-2.5 px-4 text-right font-bold font-mono whitespace-nowrap cursor-pointer hover:bg-slate-800/40"
                    >
                      <span className={row.saldo >= 0 ? 'text-slate-100' : 'text-rose-400'}>
                        {formatCurrency(row.saldo)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>

            {/* Footer Totalizador estilo Excel */}
            <tfoot>
              <tr className="bg-slate-950 border-t-2 border-slate-700 font-bold text-xs text-slate-200">
                <td className="py-3 px-3 text-center border-r border-slate-800 uppercase font-sans">
                  Total
                </td>
                <td className="py-3 px-4 border-r border-slate-800 text-right text-emerald-400 font-mono">
                  +{formatCurrency(monthTotalIn)}
                </td>
                <td className="py-3 px-4 border-r border-slate-800 text-right text-rose-400 font-mono">
                  -{formatCurrency(monthTotalExp)}
                </td>
                <td className="py-3 px-4 border-r border-slate-800 text-right text-amber-400 font-mono">
                  -{formatCurrency(monthTotalRec)}
                </td>
                <td className="py-3 px-4 text-right text-emerald-400 font-mono text-sm">
                  {formatCurrency(runningBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MODAL DETALHE DO DIA (Aparece ao clicar em qualquer célula do dia) */}
      {activeDayRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-5 p-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Header do Dia */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-base font-mono">
                  {activeDayRow.day}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>Detalhamento do Dia {activeDayRow.day} de {capitalizedMonth}</span>
                    <span className="text-xs font-normal text-slate-400 uppercase">({activeDayRow.weekDay})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Saldo ao fim deste dia: <strong className="text-emerald-400 font-mono">{formatCurrency(activeDayRow.saldo)}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SEÇÃO 1: Gastos Diários (com a soma no estilo 30 + 40 + 20 = 90) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center space-x-1">
                  <span>Gastos Diários:</span>
                  <span className="font-mono font-bold">-{formatCurrency(activeDayRow.sumExpenses)}</span>
                </span>
                <button
                  onClick={() => {
                    handleOpenQuickAdd(activeDayRow.day, 'expense')
                  }}
                  className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Gasto</span>
                </button>
              </div>

              {activeDayRow.dayExpenses.length > 0 ? (
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  {/* Fórmula Visual somada */}
                  <div className="text-xs font-mono text-slate-300 pb-2 border-b border-slate-800/80 flex flex-wrap items-center gap-1">
                    <span className="text-slate-500 font-sans text-[11px]">Soma do dia:</span>
                    {activeDayRow.dayExpenses.map((exp, idx) => (
                      <React.Fragment key={exp.id}>
                        <span className="font-bold text-rose-400">{formatCurrency(exp.amount)}</span>
                        {idx < activeDayRow.dayExpenses.length - 1 && (
                          <span className="text-slate-500 font-bold">+</span>
                        )}
                      </React.Fragment>
                    ))}
                    <span className="text-slate-500 font-bold">=</span>
                    <span className="font-bold text-rose-400 underline">{formatCurrency(activeDayRow.sumExpenses)}</span>
                  </div>

                  {/* Lista de itens para edição rápida */}
                  <div className="space-y-1.5 pt-1">
                    {activeDayRow.dayExpenses.map((exp) => {
                      const cat = getCategoryById(exp.category, 'expense', categories)
                      return (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="font-medium text-slate-200">{exp.description}</span>
                            <span className="text-[10px] text-slate-500 font-sans">({cat.name})</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="font-bold font-mono text-rose-400">-{formatCurrency(exp.amount)}</span>
                            <button
                              onClick={() => handleOpenEdit(exp)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                              title="Editar gasto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Excluir este gasto?')) {
                                  onDeleteTransaction(exp.id)
                                }
                              }}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-500">
                  Nenhum gasto diário registrado neste dia.
                </div>
              )}
            </div>

            {/* SEÇÃO 2: Entradas do Dia */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                  <span>Entradas:</span>
                  <span className="font-mono font-bold">+{formatCurrency(activeDayRow.sumIncomes)}</span>
                </span>
                <button
                  onClick={() => {
                    handleOpenQuickAdd(activeDayRow.day, 'income')
                  }}
                  className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Entrada</span>
                </button>
              </div>

              {activeDayRow.dayIncomes.length > 0 || activeDayRow.dayRecurringIn.length > 0 ? (
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  {/* Lançamentos normais de entrada */}
                  {activeDayRow.dayIncomes.map((inc) => (
                    <div
                      key={inc.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-medium text-slate-200 block">{inc.description}</span>
                        <span className="text-[10px] text-slate-500">{inc.source || 'Entrada manual'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold font-mono text-emerald-400">+{formatCurrency(inc.amount)}</span>
                        <button
                          onClick={() => handleOpenEdit(inc)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Excluir esta entrada?')) {
                              onDeleteTransaction(inc.id)
                            }
                          }}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Entradas recorrentes */}
                  {activeDayRow.dayRecurringIn.map((rIn) => (
                    <div
                      key={rIn.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-xs"
                    >
                      <div>
                        <span className="font-medium text-cyan-300 block">{rIn.description}</span>
                        <span className="text-[10px] text-cyan-400">Entrada Recorrente agendada</span>
                      </div>
                      <span className="font-bold font-mono text-cyan-400">+{formatCurrency(rIn.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-500">
                  Nenhuma entrada registrada neste dia.
                </div>
              )}
            </div>

            {/* SEÇÃO 3: Saídas Recorrentes (Contas Fixas do dia) */}
            {activeDayRow.dayRecurring.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                  Contas Fixas que vencem neste dia:
                </span>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  {activeDayRow.dayRecurring.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                    >
                      <span className="font-medium text-slate-200">{rec.description}</span>
                      <span className="font-bold font-mono text-amber-400">-{formatCurrency(rec.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR / EDITAR TRANSAÇÃO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>{editingItem ? 'Editar Lançamento' : `Novo Lançamento - Dia ${targetDay} de ${capitalizedMonth}`}</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Tipo */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tipo:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setFormType('expense'); setFormCategory(categories[0]?.id || 'alimentacao'); }}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer transition ${
                      formType === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Gasto Diário</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormType('income'); setFormCategory(incomeCategories[0]?.id || 'salario'); }}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer transition ${
                      formType === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Entrada</span>
                  </button>
                </div>
              </div>

              {/* Valor */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Valor (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 50.00"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  required
                  autoFocus
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Descrição:</label>
                <input
                  type="text"
                  placeholder="Ex: Almoço, Farmácia, Uber, Salário..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Categoria:</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {(formType === 'expense' ? categories : incomeCategories).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                {editingItem ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Deseja excluir este lançamento?')) {
                        onDeleteTransaction(editingItem.id)
                        setModalOpen(false)
                      }
                    }}
                    className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium flex items-center space-x-1 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                ) : <div />}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-lg shadow-emerald-600/20"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
