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

  // View Mode: 'purchase' (Data da Compra) vs 'settlement' (Data de Liquidação / Fatura)
  const [viewMode, setViewMode] = useState('purchase')

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

  // Credit Card Invoice Conciliator state
  const [bankInvoiceInput, setBankInvoiceInput] = useState('')
  const [showInvoiceConciliator, setShowInvoiceConciliator] = useState(false)

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

  // Map transactions to calculate credit card invoice due dates and effective date according to viewMode
  const effectiveTransactions = (data.transactions || []).map(t => {
    const isCard = isCreditCardTransaction(t)
    const dueDate = isCard
      ? calculateCreditCardDueDate(t.date, creditCardSettings?.closingDay || 15, creditCardSettings?.dueDay || 25)
      : t.date

    const effectiveDate = (viewMode === 'settlement' && isCard) ? dueDate : t.date

    return {
      ...t,
      isCard,
      calculatedDueDate: dueDate,
      effectiveDate
    }
  })

  // Filter transactions for this month based on effective date
  const monthTransactions = effectiveTransactions.filter(t => t.effectiveDate.startsWith(currentMonthKey))

  // Credit Card Invoice Conciliator Calculations for active month
  const invoiceDueDay = creditCardSettings?.dueDay || 25
  const invoiceTargetDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(invoiceDueDay).padStart(2, '0')}`

  const invoiceCardExpenses = (effectiveTransactions || []).filter(t => {
    return t.type === 'expense' && isCreditCardTransaction(t) && t.calculatedDueDate === invoiceTargetDate
  })
  const invoiceCardTotal = invoiceCardExpenses.reduce((acc, t) => acc + t.amount, 0)
  const parsedBankTotal = parseFloat(bankInvoiceInput.replace(',', '.')) || 0
  const invoiceDiff = parsedBankTotal - invoiceCardTotal

  const handleAddInvoiceAdjustment = () => {
    if (invoiceDiff <= 0.01) return
    onAddTransaction({
      id: 'tx-card-adj-' + Date.now(),
      date: invoiceTargetDate,
      description: 'Ajuste de Fatura: Gastos não anotados no cartão',
      amount: parseFloat(invoiceDiff.toFixed(2)),
      type: 'expense',
      category: 'outros',
      source: 'Cartão de Crédito',
      paymentMethod: 'credit_card'
    })
    setBankInvoiceInput('')
    alert(`Ajuste de ${formatCurrency(invoiceDiff)} lançado com sucesso na fatura do dia ${invoiceDueDay}!`)
  }

  const handleDiscountInvoiceAdjustment = () => {
    if (invoiceDiff >= -0.01) return
    const diffAbs = Math.abs(invoiceDiff)
    onAddTransaction({
      id: 'tx-card-disc-' + Date.now(),
      date: invoiceTargetDate,
      description: 'Ajuste de Fatura: Desconto / Diferença de conciliação',
      amount: parseFloat(diffAbs.toFixed(2)),
      type: 'income',
      category: 'outros_in',
      source: 'Cartão de Crédito',
      paymentMethod: 'credit_card'
    })
    setBankInvoiceInput('')
    alert(`Ajuste redutor de ${formatCurrency(diffAbs)} aplicado com sucesso à fatura!`)
  }

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
    setFormPaymentMethod(isCreditCardTransaction(tx) ? 'credit_card' : (tx.paymentMethod || 'pix'))
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
    const isCard = formPaymentMethod === 'credit_card'

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
        paymentMethod: isCard ? 'Cartão de Crédito' : 'À Vista / Pix',
        source: isCard ? 'Cartão de Crédito' : (editingItem.source || 'Planilha')
      })
    } else {
      onAddTransaction({
        id: 'tx-' + Date.now(),
        date: dateStr,
        description: formDesc.trim(),
        amount: amt,
        type: formType,
        category: formCategory,
        paymentMethod: isCard ? 'Cartão de Crédito' : 'À Vista / Pix',
        source: isCard ? 'Cartão de Crédito' : 'Planilha'
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

    const dayTxs = monthTransactions.filter(t => t.effectiveDate === dateKey)
    const dayIncomes = dayTxs.filter(t => t.type === 'income')
    const dayExpenses = dayTxs.filter(t => t.type === 'expense')
    const hasCardExpense = dayExpenses.some(t => t.isCard)

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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Flag className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Seu Ponto de Partida</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Projeção Ativa
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Defina a data exata e o saldo em conta inicial. A planilha projeta as metas e o saldo <strong className="text-white">apenas dali em diante</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Data de Partida */}
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-400 font-medium">Data:</span>
            <input
              type="date"
              value={startingPoint.date}
              onChange={e => onUpdateStartingPoint({ ...startingPoint, date: e.target.value })}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          {/* Saldo de Partida */}
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-400 font-medium">Saldo Inicial: R$</span>
            <input
              type="number"
              step="100"
              value={startingPoint.balance}
              onChange={e => onUpdateStartingPoint({ ...startingPoint, balance: parseFloat(e.target.value) || 0 })}
              className="w-28 bg-transparent text-emerald-400 text-xs font-bold font-mono focus:outline-none"
            />
          </div>

          {/* Botão Definir Hoje */}
          <button
            onClick={() => onUpdateStartingPoint({ date: todayIso, balance: data.currentBalance })}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
            title="Definir hoje como data de partida"
          >
            Partir de Hoje
          </button>
        </div>
      </div>

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
              Projeção diária com base na sua meta (<strong className="text-indigo-400">{formatCurrency(dailyBudgetGoal)}/dia</strong>) a partir do dia <strong className="text-white">{startingPoint.date.split('-').reverse().join('/')}</strong>.
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

        {/* View Mode Toggle: Data da Compra vs Data de Liquidação / Fatura */}
        <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1 shadow-inner">
          <button
            onClick={() => setViewMode('purchase')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
              viewMode === 'purchase'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Exibe os gastos no dia em que a compra foi efetuada"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Data da</span>
            <span>Compra</span>
          </button>

          <button
            onClick={() => setViewMode('settlement')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
              viewMode === 'settlement'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Exibe gastos no cartão no dia do vencimento da fatura (quando o dinheiro sai da conta)"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Data de</span>
            <span>Liquidação (Fatura)</span>
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

      {/* Banner explicativo do modo de visualização */}
      {viewMode === 'settlement' ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-slate-900 border border-purple-500/30 text-xs text-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              <strong>Visão por Data de Liquidação / Fatura Ativa:</strong> Compras feitas no Cartão de Crédito são contabilizadas no dia do vencimento (<strong className="text-white">dia {creditCardSettings?.dueDay || 25}</strong>), após o fechamento (<strong className="text-white">dia {creditCardSettings?.closingDay || 15}</strong>), para demonstrar a saída real de saldo.
            </span>
          </div>
          <button
            onClick={() => setViewMode('purchase')}
            className="text-[11px] font-semibold text-purple-300 hover:text-white underline cursor-pointer shrink-0"
          >
            Voltar para Data da Compra
          </button>
        </div>
      ) : (
        <div className="px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Visualizando por <strong>Data da Compra</strong>. Gastos no cartão exibem indicador da fatura prevista (<span className="text-purple-400 font-medium">d. {creditCardSettings?.dueDay || 25}</span>).
          </span>
          <button
            onClick={() => setViewMode('settlement')}
            className="text-purple-400 hover:text-purple-300 font-medium cursor-pointer ml-2 text-xs flex items-center gap-1"
          >
            <span>Ver quando o dinheiro sairá do saldo</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}

      {/* Card / Gaveta de Conciliação de Fatura */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/20 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-sm">Fatura do Cartão &bull; {capitalizedMonth}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                  Vence dia {invoiceDueDay}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Anotado no App: <strong className="text-purple-300 font-mono">{formatCurrency(invoiceCardTotal)}</strong>
                <span className="text-slate-500 ml-1.5">({invoiceCardExpenses.length} lançamentos no crédito)</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowInvoiceConciliator(prev => !prev)}
            className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer self-start sm:self-auto"
          >
            <span>{showInvoiceConciliator ? 'Fechar Conciliador' : 'Bater com a Fatura do Banco'}</span>
            <span className="text-[10px]">{showInvoiceConciliator ? '▲' : '▼'}</span>
          </button>
        </div>

        {showInvoiceConciliator && (
          <div className="pt-3 border-t border-purple-500/20 grid grid-cols-1 md:grid-cols-3 gap-4 items-end animate-in fade-in duration-150">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Valor Real Fechado no Banco (ex: Nubank):
              </label>
              <div className="flex items-center space-x-2 bg-slate-950 border border-purple-500/30 rounded-xl px-3 py-2">
                <span className="text-xs text-slate-500 font-mono">R$</span>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Ex: 1850.00"
                  value={bankInvoiceInput}
                  onChange={e => setBankInvoiceInput(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-white placeholder-slate-600 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-0.5">Diferença / Esquecidos</span>
              {parsedBankTotal > 0 ? (
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-mono font-bold ${
                    invoiceDiff > 0 ? 'text-amber-400' : invoiceDiff < 0 ? 'text-blue-400' : 'text-emerald-400'
                  }`}>
                    {invoiceDiff > 0 ? `+${formatCurrency(invoiceDiff)}` : formatCurrency(invoiceDiff)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {invoiceDiff > 0 ? 'não anotados' : invoiceDiff < 0 ? 'a mais no app' : '100% conciliado'}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-500">Digite o valor da fatura do banco</span>
              )}
            </div>

            <div>
              {invoiceDiff > 0.01 ? (
                <button
                  onClick={handleAddInvoiceAdjustment}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-lg shadow-amber-500/20 cursor-pointer"
                  title="Gera um gasto avulso no dia do vencimento da fatura com a diferença"
                >
                  <span>+ Lançar {formatCurrency(invoiceDiff)} de Esquecidos</span>
                </button>
              ) : invoiceDiff < -0.01 ? (
                <button
                  onClick={handleDiscountInvoiceAdjustment}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-lg shadow-blue-600/20 cursor-pointer"
                  title="Gera uma entrada redutora para bater com o valor real"
                >
                  <span>Ajustar Diferença (-{formatCurrency(Math.abs(invoiceDiff))})</span>
                </button>
              ) : parsedBankTotal > 0 ? (
                <div className="py-2.5 text-center text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  ✓ Fatura 100% conciliada com o banco!
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 text-center py-2">
                  Permite ajustar compras não anotadas sem precisar caçar cada comprovante.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Excel Spreadsheet Table (Consolidado: Dia | Entradas | Saídas | Saldo) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="w-full">
          <table className="w-full table-fixed text-left border-collapse font-sans text-xs">
            {/* Header com o Mês centralizado */}
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800">
                <th
                  colSpan={4}
                  className="py-3 px-4 text-center font-bold text-sm sm:text-base text-white tracking-wide uppercase bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800"
                >
                  {capitalizedMonth} / {selectedYear}
                </th>
              </tr>
              <tr className="bg-slate-950/80 border-b border-slate-700 text-slate-300 uppercase tracking-wider font-semibold text-[10px] sm:text-[11px]">
                <th className="py-2.5 px-1 sm:px-3 text-center w-[20%] sm:w-20 border-r border-slate-800">Dia</th>
                <th className="py-2.5 px-2 sm:px-4 w-[26%] sm:w-1/4 border-r border-slate-800 text-right">Entradas</th>
                <th className="py-2.5 px-2 sm:px-4 w-[27%] sm:w-1/4 border-r border-slate-800 text-right text-rose-400">Saídas</th>
                <th className="py-2.5 px-2 sm:px-4 w-[27%] sm:w-1/4 text-right">Saldo</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80 font-mono">
              {rows.map((row) => {
                const hasIncomes = row.sumIncomes > 0
                const hasOut = row.totalDayOut > 0

                return (
                  <tr
                    key={row.day}
                    onClick={() => setSelectedDayDetails(row.day)}
                    className={`transition group cursor-pointer ${
                      row.isStartingDate
                        ? 'bg-indigo-950/50 ring-2 ring-inset ring-indigo-500'
                        : row.isToday
                        ? 'bg-emerald-950/20 ring-1 ring-inset ring-emerald-500/40'
                        : row.isBeforeStartingDate
                        ? 'opacity-60 bg-slate-950/40'
                        : row.isWeekend
                        ? 'bg-slate-950/30 hover:bg-slate-800/40'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Coluna 1: Dia */}
                    <td
                      className={`py-2 px-1 sm:px-2.5 text-center border-r border-slate-800 font-bold whitespace-nowrap select-none ${
                        row.isStartingDate
                          ? 'bg-indigo-950 text-white'
                          : row.isToday
                          ? 'bg-emerald-950 text-white'
                          : row.isWeekend
                          ? 'bg-slate-950 text-slate-300'
                          : 'bg-slate-900 text-slate-300 group-hover:bg-slate-850'
                      }`}
                      title={row.isStartingDate ? 'Ponto de Partida do seu Saldo' : 'Clique para ver os lançamentos deste dia'}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        {row.isStartingDate && (
                          <Flag className="w-3 h-3 text-indigo-400 shrink-0" title="Ponto de partida" />
                        )}
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] sm:text-xs ${
                          row.isStartingDate
                            ? 'bg-indigo-600 text-white font-black shadow-md'
                            : row.isToday
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                            : 'text-slate-300'
                        }`}>
                          {row.day}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-slate-500 font-normal uppercase">
                          {row.weekDay}
                        </span>
                      </div>
                    </td>

                    {/* Coluna 2: Entradas (Consolidado: Manuais + Recorrentes) */}
                    <td
                      className="py-2 px-2 sm:px-4 border-r border-slate-800 text-right hover:bg-emerald-500/5 transition truncate"
                      title="Clique para ver detalhes das entradas"
                    >
                      {hasIncomes ? (
                        <span className="font-semibold text-emerald-400 font-mono text-[11px] sm:text-xs">
                          +{formatCurrency(row.sumIncomes)}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-sans text-[11px]">—</span>
                      )}
                    </td>

                    {/* Coluna 3: Saídas (Consolidado: Gastos Diários + Cartão + Recorrentes) */}
                    <td
                      className={`py-2 px-2 sm:px-4 border-r border-slate-800 text-right transition truncate ${
                        row.isUsingGoal && row.sumRecurring === 0
                          ? 'hover:bg-indigo-500/5'
                          : 'hover:bg-rose-500/5'
                      }`}
                      title="Clique para ver detalhes dos gastos e contas"
                    >
                      {row.isBeforeStartingDate && !row.dayExpenses.length ? (
                        <span className="text-slate-600 font-sans text-[11px]">—</span>
                      ) : hasOut ? (
                        <div className="flex items-center justify-end space-x-1">
                          {row.isUsingGoal && row.sumRecurring === 0 ? (
                            <>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hidden sm:inline">
                                meta
                              </span>
                              <span className="font-medium text-slate-400 font-mono text-[11px] sm:text-xs">
                                -{formatCurrency(row.totalDayOut)}
                              </span>
                            </>
                          ) : (
                            <>
                              {row.hasCardExpense && (
                                <CreditCard className="w-3 h-3 text-purple-400 shrink-0 hidden sm:inline" title="Contém compras no cartão" />
                              )}
                              {row.sumRecurring > 0 && (
                                <span className="text-[9px] text-amber-400 font-mono hidden sm:inline" title="Contém conta fixa">📌</span>
                              )}
                              <span className="font-semibold text-rose-400 font-mono text-[11px] sm:text-xs">
                                -{formatCurrency(row.totalDayOut)}
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 font-sans text-[11px]">R$ 0,00</span>
                      )}
                    </td>

                    {/* Coluna 4: Saldo Acumulado */}
                    <td
                      className="py-2 px-2 sm:px-4 text-right font-bold font-mono truncate hover:bg-slate-800/40"
                    >
                      {row.saldo !== null ? (
                        <span className={`text-[11px] sm:text-xs ${row.saldo >= 0 ? 'text-slate-100' : 'text-rose-400'}`}>
                          {formatCurrency(row.saldo)}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-sans text-[10px]">anterior</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>

            {/* Footer Totalizador estilo Excel */}
            <tfoot>
              <tr className="bg-slate-950 border-t-2 border-slate-700 font-bold text-xs text-slate-200">
                <td className="py-2.5 px-1 sm:px-3 text-center border-r border-slate-800 uppercase font-sans text-[10px] sm:text-[11px]">
                  Total
                </td>
                <td className="py-2.5 px-2 sm:px-4 border-r border-slate-800 text-right text-emerald-400 font-mono text-xs">
                  +{formatCurrency(monthTotalIn)}
                </td>
                <td className="py-2.5 px-2 sm:px-4 border-r border-slate-800 text-right text-rose-400 font-mono text-xs">
                  -{formatCurrency(monthTotalOut)}
                </td>
                <td className="py-2.5 px-2 sm:px-4 text-right text-emerald-400 font-mono text-xs sm:text-sm">
                  {runningBalance !== null ? formatCurrency(runningBalance) : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MODAL DETALHE DO DIA */}
      {activeDayRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-5 p-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Header do Dia */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base font-mono ${
                  activeDayRow.isStartingDate
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}>
                  {activeDayRow.day}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>Detalhamento do Dia {activeDayRow.day} de {capitalizedMonth}</span>
                    <span className="text-xs font-normal text-slate-400 uppercase">({activeDayRow.weekDay})</span>
                    {activeDayRow.isStartingDate && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Ponto de Partida
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeDayRow.saldo !== null ? (
                      <>Saldo ao fim deste dia: <strong className="text-emerald-400 font-mono">{formatCurrency(activeDayRow.saldo)}</strong></>
                    ) : (
                      <span className="text-slate-500">Dia anterior ao seu ponto de partida configurado.</span>
                    )}
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

            {/* SEÇÃO 1: Gastos Diários */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Gastos Diários:</span>
                  <span className="font-mono font-bold text-xs text-rose-400">-{formatCurrency(activeDayRow.effectiveExpense)}</span>
                  {activeDayRow.isUsingGoal && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Meta Estimada
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    handleOpenQuickAdd(activeDayRow.day, 'expense')
                  }}
                  className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{activeDayRow.isUsingGoal ? 'Registrar Gasto Real' : 'Adicionar Outro Gasto'}</span>
                </button>
              </div>

              {activeDayRow.dayExpenses.length > 0 ? (
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
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
                    <span className="font-bold text-rose-400 underline">{formatCurrency(activeDayRow.effectiveExpense)}</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {activeDayRow.dayExpenses.map((exp) => {
                      const cat = getCategoryById(exp.category, 'expense', categories)
                      return (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs"
                        >
                          <div className="flex flex-col space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span className="font-medium text-slate-200">{exp.description}</span>
                              <span className="text-[10px] text-slate-500 font-sans">({cat.name})</span>
                              {exp.isCard && (
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-sans inline-flex items-center gap-1 font-medium"
                                  title={`Fechamento: dia ${creditCardSettings?.closingDay || 15} • Vencimento: ${exp.calculatedDueDate?.split('-').reverse().join('/')}`}
                                >
                                  <CreditCard className="w-3 h-3 text-purple-400" />
                                  <span>Fatura d. {creditCardSettings?.dueDay || 25}</span>
                                </span>
                              )}
                            </div>
                            {exp.isCard && (
                              <div className="text-[10px] text-slate-400 pl-4">
                                {viewMode === 'settlement' ? (
                                  <span>Compra realizada em {exp.date.split('-').reverse().join('/')} &bull; Liquidada nesta fatura</span>
                                ) : (
                                  <span>Compra efetuada hoje &bull; Vencerá na fatura de <strong className="text-purple-300 font-mono">{exp.calculatedDueDate?.split('-').reverse().join('/')}</strong></span>
                                )}
                              </div>
                            )}
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
              ) : activeDayRow.isFromStartingDateOnwards ? (
                <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-indigo-400 font-medium">
                    <Sparkles className="w-4 h-4" />
                    <span>Usando Meta do Simulador Diário</span>
                  </div>
                  <p className="text-slate-400">
                    Nenhum gasto manual foi preenchido neste dia ainda. O saldo calcula automaticamente <strong className="text-indigo-300 font-mono">{formatCurrency(dailyBudgetGoal)}</strong> com base na sua meta.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-500">
                  Dia anterior ao seu ponto de partida. Não houve lançamentos manuais.
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

            {/* SEÇÃO 3: Saídas Recorrentes */}
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
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-slate-200">{rec.description}</span>
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded font-mono">
                          Conta Fixa
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold font-mono text-amber-400">-{formatCurrency(rec.amount)}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditRecurring(rec)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
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
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer"
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>
                  {editingItem?.isRecurring
                    ? `Editar Conta Fixa (Todo dia ${targetDay})`
                    : editingItem
                    ? 'Editar Lançamento'
                    : `Novo Lançamento - Dia ${targetDay} de ${capitalizedMonth}`}
                </span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
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

              {formType === 'expense' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Forma de Pagamento:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormPaymentMethod('pix')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer transition ${
                        formPaymentMethod !== 'credit_card'
                          ? 'bg-slate-800 text-white border border-slate-700'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <span>Pix / À Vista / Conta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPaymentMethod('credit_card')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer transition ${
                        formPaymentMethod === 'credit_card'
                          ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Cartão de Crédito</span>
                    </button>
                  </div>

                  {formPaymentMethod === 'credit_card' && (
                    <div className="mt-2 p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200 space-y-1">
                      <div className="flex items-center justify-between font-medium">
                        <span>Fechamento: <strong>dia {creditCardSettings?.closingDay || 15}</strong></span>
                        <span>Vencimento: <strong>dia {creditCardSettings?.dueDay || 25}</strong></span>
                      </div>
                      <div className="text-[11px] text-slate-300 pt-0.5">
                        • Previsão de débito no saldo: <strong className="text-purple-300 font-mono">{calculateCreditCardDueDate(`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`, creditCardSettings?.closingDay || 15, creditCardSettings?.dueDay || 25).split('-').reverse().join('/')}</strong>
                      </div>
                    </div>
                  )}
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
