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
  Sparkles,
  Flag,
  CreditCard
} from 'lucide-react'
import { formatCurrency } from '../utils/financialMath'
import { getCategoryById } from '../utils/categories'
import {
  calculateCreditCardDueDate,
  isCreditCardTransaction,
  DEFAULT_CARD_SETTINGS
} from '../utils/creditCardCycle'

export function SpreadsheetTab({
  data,
  categories,
  incomeCategories,
  creditCardSettings = DEFAULT_CARD_SETTINGS,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onEditRecurringExpense,
  onDeleteRecurringExpense,
  onUpdateStartingPoint,
  onUpdateCreditCardSettings
}) {
  const todayDate = new Date()
  const todayIso = todayDate.toISOString().substring(0, 10)
  
  const [selectedYear, setSelectedYear] = useState(todayDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(todayDate.getMonth())

  // Day Details / Breakdown Modal state
  const [selectedDayDetails, setSelectedDayDetails] = useState(null)

  // Add / Edit Transaction Form Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [targetDay, setTargetDay] = useState(todayDate.getDate())
  const [formType, setFormType] = useState('expense')
  const [formDesc, setFormDesc] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCategory, setFormCategory] = useState('alimentacao')
  const [formPaymentMethod, setFormPaymentMethod] = useState('pix')

  const dailyBudgetGoal = data.dailyBudgetGoal || 65
  const startingPoint = data.startingPoint || { date: todayIso, balance: data.currentBalance || 30000 }

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

  // Filter transactions directly for this month by date
  const monthTransactions = (data.transactions || []).filter(t => t.date && t.date.startsWith(currentMonthKey))

  // Open Quick Add for a specific day
  const handleOpenQuickAdd = (day, defaultType = 'expense') => {
    setTargetDay(day)
    setEditingItem(null)
    setFormType(defaultType)
    setFormDesc('')
    setFormAmount('')
    setFormCategory(defaultType === 'expense' ? (categories[0]?.id || 'alimentacao') : (incomeCategories[0]?.id || 'salario'))
    setFormPaymentMethod('pix')
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
    const m = (tx.paymentMethod || tx.source || 'pix').toLowerCase()
    if (m.includes('vr')) setFormPaymentMethod('vr')
    else if (m.includes('deb') || m.includes('déb')) setFormPaymentMethod('debito')
    else setFormPaymentMethod('pix')
    setModalOpen(true)
  }

  // Open Edit for a recurring expense
  const handleOpenEditRecurring = (rec) => {
    setEditingItem({ ...rec, isRecurring: true })
    setTargetDay(rec.dayOfMonth)
    setFormType('expense')
    setFormDesc(rec.description)
    setFormAmount(rec.amount.toString())
    setFormCategory(rec.category || categories[0]?.id || 'alimentacao')
    setFormPaymentMethod('pix')
    setModalOpen(true)
  }

  const handleSaveModal = (e) => {
    e.preventDefault()
    const amt = parseFloat(formAmount)
    if (!formDesc.trim() || isNaN(amt) || amt <= 0) return

    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`
    const paymentLabel = formPaymentMethod === 'vr' ? 'VR' : formPaymentMethod === 'debito' ? 'Débito' : 'Pix'

    if (editingItem?.isRecurring) {
      onEditRecurringExpense?.({
        ...editingItem,
        description: formDesc.trim(),
        amount: amt,
        dayOfMonth: parseInt(targetDay, 10),
        category: formCategory
      })
    } else if (editingItem) {
      onEditTransaction({
        ...editingItem,
        date: dateStr,
        description: formDesc.trim(),
        amount: amt,
        type: formType,
        category: formCategory,
        paymentMethod: formPaymentMethod,
        source: paymentLabel
      })
    } else {
      onAddTransaction({
        id: 'tx-' + Date.now(),
        date: dateStr,
        description: formDesc.trim(),
        amount: amt,
        type: formType,
        category: formCategory,
        paymentMethod: formPaymentMethod,
        source: paymentLabel
      })
    }

    setModalOpen(false)
  }

  // Calculate day-by-day rows based on Starting Point!
  let runningBalance = null
  let monthTotalIn = 0
  let monthTotalExp = 0
  let monthTotalRec = 0

  const rows = []
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0')
    const dateKey = `${currentMonthKey}-${dayStr}`
    const dayDate = new Date(selectedYear, selectedMonth, day)
    const weekDay = dayDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')

    const isStartingDate = dateKey === startingPoint.date
    const isBeforeStartingDate = dateKey < startingPoint.date
    const isFromStartingDateOnwards = dateKey >= startingPoint.date

    const dayTxs = monthTransactions.filter(t => t.date === dateKey)
    const dayIncomes = dayTxs.filter(t => t.type === 'income')
    const dayExpenses = dayTxs.filter(t => t.type === 'expense')
    const hasCardExpense = dayExpenses.some(t => (t.paymentMethod || t.source || '').toLowerCase().includes('cart'))

    const dayRecurring = data.recurringExpenses.filter(r => r.dayOfMonth === day)
    const dayRecurringIn = data.recurringIncomes.filter(r => r.dayOfMonth === day)

    const sumIncomes = dayIncomes.reduce((s, t) => s + t.amount, 0) + (isFromStartingDateOnwards ? dayRecurringIn.reduce((s, r) => s + r.amount, 0) : 0)
    
    const hasManualExpenses = dayExpenses.length > 0
    let effectiveExpense = 0
    let isUsingGoal = false

    if (hasManualExpenses) {
      effectiveExpense = dayExpenses.reduce((s, t) => s + t.amount, 0)
    } else if (isFromStartingDateOnwards) {
      // Only project simulator meta for days from starting point onwards!
      effectiveExpense = dailyBudgetGoal
      isUsingGoal = true
    }

    const sumRecurring = isFromStartingDateOnwards
      ? dayRecurring.reduce((s, r) => s + r.amount, 0)
      : 0

    if (isStartingDate) {
      // Start balance initializes here!
      runningBalance = startingPoint.balance + sumIncomes - effectiveExpense - sumRecurring
    } else if (isFromStartingDateOnwards && runningBalance !== null) {
      runningBalance = runningBalance + sumIncomes - effectiveExpense - sumRecurring
    }

    if (isFromStartingDateOnwards) {
      monthTotalIn += sumIncomes
      monthTotalExp += effectiveExpense
      monthTotalRec += sumRecurring
    }

    const totalDayOut = effectiveExpense + sumRecurring

    rows.push({
      day,
      weekDay,
      dateKey,
      isToday: isCurrentActualMonth && day === todayNumber,
      isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
      isStartingDate,
      isBeforeStartingDate,
      isFromStartingDateOnwards,
      dayIncomes,
      dayExpenses,
      hasCardExpense,
      dayRecurring,
      dayRecurringIn,
      sumIncomes,
      effectiveExpense,
      isUsingGoal,
      sumRecurring,
      totalDayOut,
      saldo: isFromStartingDateOnwards ? runningBalance : null
    })
  }

  const monthTotalOut = monthTotalExp + monthTotalRec
  const activeDayRow = selectedDayDetails ? rows.find(r => r.day === selectedDayDetails) : null

  // Export spreadsheet as CSV
  const handleExportCSV = () => {
    let csv = `Dia,Entradas,Saídas,Saldo\n`
    for (const r of rows) {
      const inVal = r.sumIncomes > 0 ? r.sumIncomes : 0
      const outVal = r.totalDayOut > 0 ? r.totalDayOut : 0
      const salVal = r.saldo !== null ? r.saldo.toFixed(2) : ''
      csv += `"${r.day}","${inVal}","${outVal}","${salVal}"\n`
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `planilha-${capitalizedMonth}-${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* BARRA DE DEFINIÇÃO DO PONTO DE PARTIDA */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
            <Flag className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
              <span>Seu Ponto de Partida</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                Projeção Ativa
              </span>
            </h3>
            <p className="text-xs text-stone-500">
              Defina a data exata e o saldo em conta inicial. A planilha projeta as metas e o saldo <strong className="text-stone-800">apenas dali em diante</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Data de Partida */}
          <div className="flex items-center space-x-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
            <span className="text-xs text-stone-500 font-medium">Data:</span>
            <input
              type="date"
              value={startingPoint.date}
              onChange={e => onUpdateStartingPoint({ ...startingPoint, date: e.target.value })}
              className="bg-transparent text-stone-900 text-xs font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          {/* Saldo de Partida */}
          <div className="flex items-center space-x-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
            <span className="text-xs text-stone-500 font-medium">Saldo Inicial: R$</span>
            <input
              type="number"
              step="100"
              value={startingPoint.balance}
              onChange={e => onUpdateStartingPoint({ ...startingPoint, balance: parseFloat(e.target.value) || 0 })}
              className="w-28 bg-transparent text-emerald-700 text-xs font-bold font-mono focus:outline-none"
            />
          </div>

          {/* Botão Definir Hoje */}
          <button
            onClick={() => onUpdateStartingPoint({ date: todayIso, balance: data.currentBalance })}
            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200 transition cursor-pointer"
            title="Definir hoje como data de partida"
          >
            Partir de Hoje
          </button>
        </div>
      </div>

      {/* Top Header & Month Controller */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 flex items-center space-x-2">
              <span>Planilha Mensal de Gastos & Entradas</span>
            </h2>
            <p className="text-xs text-stone-500">
              Projeção diária com base na sua meta (<strong className="text-orange-600">{formatCurrency(dailyBudgetGoal)}/dia</strong>) a partir do dia <strong className="text-stone-800">{startingPoint.date.split('-').reverse().join('/')}</strong>.
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center space-x-3 bg-stone-50 border border-stone-200 rounded-xl p-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition cursor-pointer"
            title="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center px-4">
            <span className="text-sm font-bold text-stone-900 capitalize block">{monthName}</span>
            <span className="text-[11px] text-stone-500 font-medium">{selectedYear}</span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition cursor-pointer"
            title="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center space-x-1.5 transition border border-stone-200 cursor-pointer"
            title="Exportar como CSV compatível com Excel"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Planilha (CSV)</span>
          </button>
        </div>
      </div>

      {/* Excel Spreadsheet Table (Consolidado: Dia | Entradas | Saídas | Saldo) */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="w-full">
          <table className="w-full table-fixed text-left border-collapse font-sans text-xs">
            {/* Header com o Mês centralizado */}
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200">
                <th
                  colSpan={4}
                  className="py-3 px-4 text-center font-bold text-sm sm:text-base text-stone-800 tracking-wide uppercase border-b border-stone-200"
                >
                  {capitalizedMonth} / {selectedYear}
                </th>
              </tr>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase tracking-wider font-semibold text-[10px] sm:text-[11px]">
                <th className="py-2.5 px-1 sm:px-3 text-center w-[20%] sm:w-20 border-r border-stone-200">Dia</th>
                <th className="py-2.5 px-2 sm:px-4 w-[26%] sm:w-1/4 border-r border-stone-200 text-right">Entradas</th>
                <th className="py-2.5 px-2 sm:px-4 w-[27%] sm:w-1/4 border-r border-stone-200 text-right text-rose-700">Saídas</th>
                <th className="py-2.5 px-2 sm:px-4 w-[27%] sm:w-1/4 text-right">Saldo</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 font-mono">
              {rows.map((row) => {
                const hasIncomes = row.sumIncomes > 0
                const hasOut = row.totalDayOut > 0

                return (
                  <tr
                    key={row.day}
                    onClick={() => setSelectedDayDetails(row.day)}
                    className={`transition group cursor-pointer ${
                      row.isStartingDate
                        ? 'bg-orange-50/70 ring-1 ring-inset ring-orange-400'
                        : row.isToday
                        ? 'bg-amber-50/80 ring-1 ring-inset ring-amber-400'
                        : row.isBeforeStartingDate
                        ? 'opacity-60 bg-stone-50/60'
                        : row.isWeekend
                        ? 'bg-stone-50/50 hover:bg-stone-100/70'
                        : 'hover:bg-stone-50'
                    }`}
                  >
                    {/* Coluna 1: Dia */}
                    <td
                      className={`py-2 px-1 sm:px-2.5 text-center border-r border-stone-200 font-bold whitespace-nowrap select-none ${
                        row.isStartingDate
                          ? 'bg-orange-100 text-orange-900'
                          : row.isToday
                          ? 'bg-amber-100 text-amber-900'
                          : row.isWeekend
                          ? 'bg-stone-100/60 text-stone-600'
                          : 'bg-white text-stone-700 group-hover:bg-stone-50'
                      }`}
                      title={row.isStartingDate ? 'Ponto de Partida do seu Saldo' : 'Clique para ver os lançamentos deste dia'}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        {row.isStartingDate && (
                          <Flag className="w-3 h-3 text-orange-600 shrink-0" title="Ponto de partida" />
                        )}
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] sm:text-xs ${
                          row.isStartingDate
                            ? 'bg-orange-600 text-white font-bold shadow-sm'
                            : row.isToday
                            ? 'bg-amber-500 text-stone-900 font-bold shadow-sm'
                            : 'text-stone-700'
                        }`}>
                          {row.day}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-stone-400 font-normal uppercase">
                          {row.weekDay}
                        </span>
                      </div>
                    </td>

                    {/* Coluna 2: Entradas (Consolidado: Manuais + Recorrentes) */}
                    <td
                      className="py-2 px-2 sm:px-4 border-r border-stone-200 text-right hover:bg-emerald-50/50 transition truncate"
                      title="Clique para ver detalhes das entradas"
                    >
                      {hasIncomes ? (
                        <span className="font-semibold text-emerald-700 font-mono text-[11px] sm:text-xs">
                          +{formatCurrency(row.sumIncomes)}
                        </span>
                      ) : (
                        <span className="text-stone-300 font-sans text-[11px]">—</span>
                      )}
                    </td>

                    {/* Coluna 3: Saídas (Consolidado: Gastos Diários + Cartão + Recorrentes) */}
                    <td
                      className={`py-2 px-2 sm:px-4 border-r border-stone-200 text-right transition truncate ${
                        row.isUsingGoal && row.sumRecurring === 0
                          ? 'hover:bg-stone-100/50'
                          : 'hover:bg-rose-50/50'
                      }`}
                      title="Clique para ver detalhes dos gastos e contas"
                    >
                      {row.isBeforeStartingDate && !row.dayExpenses.length ? (
                        <span className="text-stone-300 font-sans text-[11px]">—</span>
                      ) : hasOut ? (
                        <div className="flex items-center justify-end space-x-1">
                          {row.isUsingGoal && row.sumRecurring === 0 ? (
                            <>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200 hidden sm:inline">
                                meta
                              </span>
                              <span className="font-medium text-stone-500 font-mono text-[11px] sm:text-xs">
                                -{formatCurrency(row.totalDayOut)}
                              </span>
                            </>
                          ) : (
                            <>
                              {row.hasCardExpense && (
                                <CreditCard className="w-3 h-3 text-purple-600 shrink-0 hidden sm:inline" title="Contém compras no cartão" />
                              )}
                              {row.sumRecurring > 0 && (
                                <span className="text-[9px] text-amber-600 font-mono hidden sm:inline" title="Contém conta fixa">📌</span>
                              )}
                              <span className="font-semibold text-rose-700 font-mono text-[11px] sm:text-xs">
                                -{formatCurrency(row.totalDayOut)}
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-stone-400 font-sans text-[11px]">R$ 0,00</span>
                      )}
                    </td>

                    {/* Coluna 4: Saldo Acumulado */}
                    <td
                      className="py-2 px-2 sm:px-4 text-right font-bold font-mono truncate hover:bg-stone-50"
                    >
                      {row.saldo !== null ? (
                        <span className={`text-[11px] sm:text-xs ${row.saldo >= 0 ? 'text-stone-900' : 'text-rose-700'}`}>
                          {formatCurrency(row.saldo)}
                        </span>
                      ) : (
                        <span className="text-stone-400 font-sans text-[10px]">anterior</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>

            {/* Footer Totalizador estilo Excel */}
            <tfoot>
              <tr className="bg-stone-100 border-t-2 border-stone-300 font-bold text-xs text-stone-800">
                <td className="py-2.5 px-1 sm:px-3 text-center border-r border-stone-200 uppercase font-sans text-[10px] sm:text-[11px]">
                  Total
                </td>
                <td className="py-2.5 px-2 sm:px-4 border-r border-stone-200 text-right text-emerald-700 font-mono text-xs">
                  +{formatCurrency(monthTotalIn)}
                </td>
                <td className="py-2.5 px-2 sm:px-4 border-r border-stone-200 text-right text-rose-700 font-mono text-xs">
                  -{formatCurrency(monthTotalOut)}
                </td>
                <td className="py-2.5 px-2 sm:px-4 text-right text-stone-900 font-mono text-xs sm:text-sm">
                  {runningBalance !== null ? formatCurrency(runningBalance) : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MODAL DETALHE DO DIA */}
      {activeDayRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-5 p-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Header do Dia */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base font-mono ${
                  activeDayRow.isStartingDate
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-orange-50 text-orange-700 border border-orange-200'
                }`}>
                  {activeDayRow.day}
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                    <span>Detalhamento do Dia {activeDayRow.day} de {capitalizedMonth}</span>
                    <span className="text-xs font-normal text-stone-500 uppercase">({activeDayRow.weekDay})</span>
                    {activeDayRow.isStartingDate && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                        Ponto de Partida
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {activeDayRow.saldo !== null ? (
                      <>Saldo ao fim deste dia: <strong className="text-emerald-700 font-mono">{formatCurrency(activeDayRow.saldo)}</strong></>
                    ) : (
                      <span className="text-stone-400">Dia anterior ao seu ponto de partida configurado.</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SEÇÃO 1: Gastos Diários */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Gastos Diários:</span>
                  <span className="font-mono font-bold text-xs text-rose-700">-{formatCurrency(activeDayRow.effectiveExpense)}</span>
                  {activeDayRow.isUsingGoal && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200">
                      Meta Estimada
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    handleOpenQuickAdd(activeDayRow.day, 'expense')
                  }}
                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{activeDayRow.isUsingGoal ? 'Registrar Gasto Real' : 'Adicionar Outro Gasto'}</span>
                </button>
              </div>

              {activeDayRow.dayExpenses.length > 0 ? (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="text-xs font-mono text-stone-700 pb-2 border-b border-stone-200 flex flex-wrap items-center gap-1">
                    <span className="text-stone-500 font-sans text-[11px]">Soma do dia:</span>
                    {activeDayRow.dayExpenses.map((exp, idx) => (
                      <React.Fragment key={exp.id}>
                        <span className="font-bold text-rose-700">{formatCurrency(exp.amount)}</span>
                        {idx < activeDayRow.dayExpenses.length - 1 && (
                          <span className="text-stone-400 font-bold">+</span>
                        )}
                      </React.Fragment>
                    ))}
                    <span className="text-stone-400 font-bold">=</span>
                    <span className="font-bold text-rose-700 underline">{formatCurrency(activeDayRow.effectiveExpense)}</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {activeDayRow.dayExpenses.map((exp) => {
                      const cat = getCategoryById(exp.category, 'expense', categories)
                      return (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white hover:bg-stone-100/80 border border-stone-200 text-xs"
                        >
                          <div className="flex flex-col space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span className="font-medium text-stone-800">{exp.description}</span>
                              <span className="text-[10px] text-stone-500 font-sans">({cat.name})</span>
                              {(exp.paymentMethod || exp.source) && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200 font-medium">
                                  {exp.source || exp.paymentMethod}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="font-bold font-mono text-rose-700">-{formatCurrency(exp.amount)}</span>
                            <button
                              onClick={() => handleOpenEdit(exp)}
                              className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
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
                              className="p-1 rounded text-stone-400 hover:text-rose-600 transition cursor-pointer"
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
              ) : activeDayRow.isFromStartingDateOnwards ? (
                <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200 text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-orange-700 font-medium">
                    <Sparkles className="w-4 h-4" />
                    <span>Usando Meta do Simulador Diário</span>
                  </div>
                  <p className="text-stone-600">
                    Nenhum gasto manual foi preenchido neste dia ainda. O saldo calcula automaticamente <strong className="text-orange-700 font-mono">{formatCurrency(dailyBudgetGoal)}</strong> com base na sua meta.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-400">
                  Dia anterior ao seu ponto de partida. Não houve lançamentos manuais.
                </div>
              )}
            </div>

            {/* SEÇÃO 2: Entradas do Dia */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center space-x-1">
                  <span>Entradas:</span>
                  <span className="font-mono font-bold">+{formatCurrency(activeDayRow.sumIncomes)}</span>
                </span>
                <button
                  onClick={() => {
                    handleOpenQuickAdd(activeDayRow.day, 'income')
                  }}
                  className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Entrada</span>
                </button>
              </div>

              {activeDayRow.dayIncomes.length > 0 || activeDayRow.dayRecurringIn.length > 0 ? (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                  {activeDayRow.dayIncomes.map((inc) => (
                    <div
                      key={inc.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-stone-200 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-medium text-stone-800 block">{inc.description}</span>
                        <span className="text-[10px] text-stone-500">{inc.source || 'Entrada manual'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold font-mono text-emerald-700">+{formatCurrency(inc.amount)}</span>
                        <button
                          onClick={() => handleOpenEdit(inc)}
                          className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Excluir esta entrada?')) {
                              onDeleteTransaction(inc.id)
                            }
                          }}
                          className="p-1 rounded text-stone-400 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {activeDayRow.dayRecurringIn.map((rIn) => (
                    <div
                      key={rIn.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-teal-50 border border-teal-200 text-xs"
                    >
                      <div>
                        <span className="font-medium text-teal-800 block">{rIn.description}</span>
                        <span className="text-[10px] text-teal-600">Entrada Recorrente agendada</span>
                      </div>
                      <span className="font-bold font-mono text-teal-700">+{formatCurrency(rIn.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-400">
                  Nenhuma entrada registrada neste dia.
                </div>
              )}
            </div>

            {/* SEÇÃO 3: Saídas Recorrentes */}
            {activeDayRow.dayRecurring.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">
                  Contas Fixas que vencem neste dia:
                </span>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                  {activeDayRow.dayRecurring.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-stone-200 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-stone-800">{rec.description}</span>
                        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-mono">
                          Conta Fixa
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold font-mono text-amber-700">-{formatCurrency(rec.amount)}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditRecurring(rec)}
                          className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                          title="Editar conta fixa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remover conta fixa "${rec.description}"?`)) {
                              onDeleteRecurringExpense?.(rec.id)
                            }
                          }}
                          className="p-1 rounded text-stone-400 hover:text-rose-600 transition cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold border border-stone-200 transition cursor-pointer"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR / EDITAR TRANSAÇÃO */}
      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                <span>
                  {editingItem?.isRecurring
                    ? `Editar Conta Fixa (Todo dia ${targetDay})`
                    : editingItem
                    ? 'Editar Lançamento'
                    : `Novo Lançamento - Dia ${targetDay} de ${capitalizedMonth}`}
                </span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="text-xs text-stone-600 block mb-1">Tipo:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setFormType('expense'); setFormCategory(categories[0]?.id || 'alimentacao'); }}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer transition ${
                      formType === 'expense' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Gasto Diário</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormType('income'); setFormCategory(incomeCategories[0]?.id || 'salario'); }}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer transition ${
                      formType === 'income' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Entrada</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-600 block mb-1">Valor (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 50.00"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-stone-600 block mb-1">Descrição:</label>
                <input
                  type="text"
                  placeholder="Ex: Almoço, Farmácia, Uber, Salário..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-stone-600 block mb-1">Categoria:</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  {(formType === 'expense' ? categories : incomeCategories).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {formType === 'expense' && (
                <div>
                  <label className="text-xs text-stone-600 block mb-1">Forma de Pagamento:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormPaymentMethod('pix')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer transition ${
                        formPaymentMethod === 'pix'
                          ? 'bg-stone-900 text-white shadow-sm'
                          : 'bg-stone-100 text-stone-600 border border-stone-200 hover:text-stone-900'
                      }`}
                    >
                      <span>Pix</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPaymentMethod('debito')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer transition ${
                        formPaymentMethod === 'debito'
                          ? 'bg-stone-900 text-white shadow-sm'
                          : 'bg-stone-100 text-stone-600 border border-stone-200 hover:text-stone-900'
                      }`}
                    >
                      <span>Débito</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPaymentMethod('vr')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer transition ${
                        formPaymentMethod === 'vr'
                          ? 'bg-stone-900 text-white shadow-sm'
                          : 'bg-stone-100 text-stone-600 border border-stone-200 hover:text-stone-900'
                      }`}
                    >
                      <span>VR</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {editingItem ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Deseja excluir este item?')) {
                        if (editingItem.isRecurring) {
                          onDeleteRecurringExpense?.(editingItem.id)
                        } else {
                          onDeleteTransaction(editingItem.id)
                        }
                        setModalOpen(false)
                      }
                    }}
                    className="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium flex items-center space-x-1 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                ) : <div />}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
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
