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
  FileSpreadsheet
} from 'lucide-react'
import { formatCurrency } from '../utils/financialMath'
import { getCategoryById } from '../utils/categories'

export function SpreadsheetTab({
  data,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  categories,
  incomeCategories
}) {
  // Current displayed month state (defaults to today's month)
  const todayDate = new Date()
  const [selectedYear, setSelectedYear] = useState(todayDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(todayDate.getMonth()) // 0-indexed

  // Quick Add / Edit Modal for a specific day
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null) // null = new, object = edit
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

      const inDesc = dayIncomes.map(i => `${i.description} (${i.amount})`).join('; ')
      const expDesc = dayExpenses.map(e => `${e.amount}`).join(' + ')
      const recDesc = dayRecurring.map(r => `${r.description} (${r.amount})`).join('; ')

      csv += `"${day}","${inDesc}","${expDesc}","${recDesc}","${runningBalance.toFixed(2)}"\n`
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
  // Adjust starting balance so that by today it matches currentBalance
  // Or compute running balance progressively
  let monthTotalIn = 0
  let monthTotalExp = 0
  let monthTotalRec = 0

  const rows = []
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0')
    const dateKey = `${currentMonthKey}-${dayStr}`
    const dayDate = new Date(selectedYear, selectedMonth, day)
    const weekDay = dayDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')

    // Transactions for this day
    const dayTxs = monthTransactions.filter(t => t.date === dateKey)
    const dayIncomes = dayTxs.filter(t => t.type === 'income')
    const dayExpenses = dayTxs.filter(t => t.type === 'expense')

    // Recurring expenses on this day
    const dayRecurring = data.recurringExpenses.filter(r => r.dayOfMonth === day)
    // Recurring incomes on this day
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
              Visualização diária em formato de planilha (estilo Excel), com cálculo de saldo cumulativo.
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
            {/* Super Header com o Mês (estilo o print) */}
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
                <th className="py-3 px-3 text-center w-16 border-r border-slate-800">Dia</th>
                <th className="py-3 px-4 w-1/4 border-r border-slate-800">Entrada</th>
                <th className="py-3 px-4 w-1/3 border-r border-slate-800">Gastos diários</th>
                <th className="py-3 px-4 w-1/4 border-r border-slate-800">Saídas recorrentes</th>
                <th className="py-3 px-4 text-right w-36">Saldo</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80 font-mono">
              {rows.map((row) => {
                const hasIncomes = row.dayIncomes.length > 0 || row.dayRecurringIn.length > 0
                const hasExpenses = row.dayExpenses.length > 0
                const hasRecurring = row.dayRecurring.length > 0

                return (
                  <tr
                    key={row.day}
                    className={`transition group ${
                      row.isToday
                        ? 'bg-indigo-950/30 ring-1 ring-inset ring-indigo-500/40'
                        : row.isWeekend
                        ? 'bg-slate-950/40 hover:bg-slate-800/40'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Coluna 1: Dia */}
                    <td className="py-2.5 px-2 text-center border-r border-slate-800 font-bold whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
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

                    {/* Coluna 2: Entrada */}
                    <td className="py-2 px-3 border-r border-slate-800 relative group/cell">
                      <div className="flex flex-wrap items-center gap-1.5 min-h-[26px]">
                        {/* Lançamentos manuais de entrada */}
                        {row.dayIncomes.map((inc) => (
                          <div
                            key={inc.id}
                            onClick={() => handleOpenEdit(inc)}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer transition text-[11px]"
                            title="Clique para editar"
                          >
                            <span className="font-sans font-medium">{inc.description}</span>
                            <span className="font-bold font-mono">({formatCurrency(inc.amount)})</span>
                          </div>
                        ))}

                        {/* Entradas recorrentes que caem neste dia */}
                        {row.dayRecurringIn.map((rIn) => (
                          <div
                            key={rIn.id}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px]"
                            title="Entrada Recorrente agendada"
                          >
                            <span className="font-sans font-medium">{rIn.description}</span>
                            <span className="font-bold font-mono">({formatCurrency(rIn.amount)})</span>
                          </div>
                        ))}

                        {/* Botão de adicionar entrada rápida */}
                        <button
                          onClick={() => handleOpenQuickAdd(row.day, 'income')}
                          className="opacity-0 group-hover/cell:opacity-100 p-0.5 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 transition cursor-pointer"
                          title={`Adicionar entrada no dia ${row.day}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Coluna 3: Gastos Diários (Fórmula ex: 30 + 40 + 20 + 10) */}
                    <td className="py-2 px-3 border-r border-slate-800 relative group/cell">
                      <div className="flex flex-wrap items-center gap-1.5 min-h-[26px]">
                        {hasExpenses ? (
                          <div className="flex flex-wrap items-center gap-1 text-[11px]">
                            {/* Render cada gasto com possibilidade de clique para editar */}
                            {row.dayExpenses.map((exp, idx) => (
                              <React.Fragment key={exp.id}>
                                <button
                                  onClick={() => handleOpenEdit(exp)}
                                  className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 cursor-pointer transition font-mono"
                                  title={`${exp.description} - Clique para editar`}
                                >
                                  <span className="font-semibold text-rose-400">{exp.amount}</span>
                                  <span className="text-[10px] text-slate-400 font-sans truncate max-w-[80px]">
                                    ({exp.description})
                                  </span>
                                </button>
                                {idx < row.dayExpenses.length - 1 && (
                                  <span className="text-slate-500 font-bold font-mono">+</span>
                                )}
                              </React.Fragment>
                            ))}
                            {row.dayExpenses.length > 1 && (
                              <span className="font-bold text-rose-400 ml-1 font-mono">
                                = {formatCurrency(row.sumExpenses)}
                              </span>
                            )}
                          </div>
                        ) : null}

                        {/* Botão de adicionar gasto rápido */}
                        <button
                          onClick={() => handleOpenQuickAdd(row.day, 'expense')}
                          className="opacity-0 group-hover/cell:opacity-100 p-0.5 rounded bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 transition cursor-pointer"
                          title={`Adicionar gasto no dia ${row.day}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Coluna 4: Saídas Recorrentes (e.g. conta de luz) */}
                    <td className="py-2 px-3 border-r border-slate-800">
                      <div className="flex flex-wrap items-center gap-1.5 min-h-[26px]">
                        {row.dayRecurring.map((rec) => (
                          <div
                            key={rec.id}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]"
                            title={`Contas fixa agendada dia ${rec.dayOfMonth}`}
                          >
                            <span className="font-sans font-medium">{rec.description}</span>
                            <span className="font-bold font-mono">({formatCurrency(rec.amount)})</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Coluna 5: Saldo */}
                    <td className="py-2 px-4 text-right font-bold text-slate-200 font-mono whitespace-nowrap">
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
                <td className="py-3 px-4 border-r border-slate-800 text-emerald-400 font-mono">
                  +{formatCurrency(monthTotalIn)}
                </td>
                <td className="py-3 px-4 border-r border-slate-800 text-rose-400 font-mono">
                  -{formatCurrency(monthTotalExp)}
                </td>
                <td className="py-3 px-4 border-r border-slate-800 text-amber-400 font-mono">
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

      {/* Modal para Adicionar / Editar Lançamento da Planilha */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>{editingItem ? 'Editar Lançamento' : `Novo Lançamento - Dia ${targetDay} de ${capitalizedMonth}`}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
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
                  placeholder="Ex: Almoço, Uber, Salário, Freelance..."
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
