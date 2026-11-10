import React, { useState } from 'react'
import { Plus, Trash2, Edit2, Calendar, Clock, CheckCircle2, ShieldCheck, TrendingUp, X } from 'lucide-react'
import { getCategoryById } from '../utils/categories'
import { formatCurrency, getMonthInfo } from '../utils/financialMath'

export function RecurringTab({
  recurringExpenses,
  recurringIncomes,
  categories,
  incomeCategories,
  onAddRecurringExpense,
  onEditRecurringExpense,
  onDeleteRecurringExpense,
  onAddRecurringIncome,
  onEditRecurringIncome,
  onDeleteRecurringIncome,
  onPostRecurringToDaily
}) {
  const { today, monthName } = getMonthInfo()

  // Recurring expense form state
  const [isExpFormOpen, setIsExpFormOpen] = useState(false)
  const [editingExpId, setEditingExpId] = useState(null)
  const [expDesc, setExpDesc] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expDay, setExpDay] = useState(10)
  const [expCategory, setExpCategory] = useState(categories[0]?.id || 'moradia')

  // Recurring income form state
  const [isIncFormOpen, setIsIncFormOpen] = useState(false)
  const [editingIncId, setEditingIncId] = useState(null)
  const [incDesc, setIncDesc] = useState('')
  const [incAmount, setIncAmount] = useState('')
  const [incDay, setIncDay] = useState(5)
  const [incCategory, setIncCategory] = useState(incomeCategories[0]?.id || 'rendimentos')
  const [incInstallments, setIncInstallments] = useState('')

  // Expense Handlers
  const handleOpenAddExp = () => {
    setEditingExpId(null)
    setExpDesc('')
    setExpAmount('')
    setExpDay(10)
    setExpCategory(categories[0]?.id || 'moradia')
    setIsExpFormOpen(true)
  }

  const handleStartEditExp = (item) => {
    setEditingExpId(item.id)
    setExpDesc(item.description)
    setExpAmount(item.amount.toString())
    setExpDay(item.dayOfMonth)
    setExpCategory(item.category)
    setIsExpFormOpen(true)
    setTimeout(() => {
      document.getElementById('recurring-expense-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
  }

  const handleSaveExp = (e) => {
    e.preventDefault()
    const amt = parseFloat(expAmount)
    if (!expDesc.trim() || isNaN(amt) || amt <= 0) return

    if (editingExpId) {
      onEditRecurringExpense({
        id: editingExpId,
        description: expDesc.trim(),
        amount: amt,
        dayOfMonth: parseInt(expDay, 10),
        category: expCategory
      })
    } else {
      onAddRecurringExpense({
        id: 'rec-exp-' + Date.now(),
        description: expDesc.trim(),
        amount: amt,
        dayOfMonth: parseInt(expDay, 10),
        category: expCategory
      })
    }

    setIsExpFormOpen(false)
    setEditingExpId(null)
  }

  // Income Handlers
  const handleOpenAddInc = () => {
    setEditingIncId(null)
    setIncDesc('')
    setIncAmount('')
    setIncDay(5)
    setIncCategory(incomeCategories[0]?.id || 'rendimentos')
    setIncInstallments('')
    setIsIncFormOpen(true)
  }

  const handleStartEditInc = (item) => {
    setEditingIncId(item.id)
    setIncDesc(item.description)
    setIncAmount(item.amount.toString())
    setIncDay(item.dayOfMonth)
    setIncCategory(item.category)
    setIncInstallments(item.totalInstallments ? item.totalInstallments.toString() : '')
    setIsIncFormOpen(true)
    setTimeout(() => {
      document.getElementById('recurring-income-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
  }

  const handleSaveInc = (e) => {
    e.preventDefault()
    const amt = parseFloat(incAmount)
    if (!incDesc.trim() || isNaN(amt) || amt <= 0) return

    const installments = incInstallments ? parseInt(incInstallments, 10) : null

    if (editingIncId) {
      onEditRecurringIncome({
        id: editingIncId,
        description: incDesc.trim(),
        amount: amt,
        dayOfMonth: parseInt(incDay, 10),
        category: incCategory,
        totalInstallments: installments,
        remainingInstallments: installments
      })
    } else {
      onAddRecurringIncome({
        id: 'rec-inc-' + Date.now(),
        description: incDesc.trim(),
        amount: amt,
        dayOfMonth: parseInt(incDay, 10),
        category: incCategory,
        totalInstallments: installments,
        remainingInstallments: installments
      })
    }

    setIsIncFormOpen(false)
    setEditingIncId(null)
  }

  const totalMonthlyExpenses = recurringExpenses.reduce((s, e) => s + e.amount, 0)
  const totalMonthlyIncomes = recurringIncomes.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Total Contas Fixas Mensais</span>
            <div className="text-2xl font-bold font-mono text-rose-700">{formatCurrency(totalMonthlyExpenses)}/mês</div>
            <p className="text-xs text-stone-500">{recurringExpenses.length} itens cadastrados</p>
          </div>
          <button
            onClick={handleOpenAddExp}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center space-x-1.5 transition border border-stone-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Gasto Fixo</span>
          </button>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Total Entradas Recorrentes</span>
            <div className="text-2xl font-bold font-mono text-teal-700">+{formatCurrency(totalMonthlyIncomes)}/mês</div>
            <p className="text-xs text-stone-500">Salários, rendimentos e recebíveis</p>
          </div>
          <button
            onClick={handleOpenAddInc}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center space-x-1.5 transition border border-stone-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Entrada Fixa</span>
          </button>
        </div>
      </div>

      {/* Formulário Novo / Edição de Gasto Fixo */}
      {isExpFormOpen && (
        <form id="recurring-expense-form" onSubmit={handleSaveExp} className="bg-white border border-stone-300 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <h3 className="text-base font-semibold text-stone-900">
              {editingExpId ? 'Editar Gasto Recorrente' : 'Cadastrar Gasto Recorrente (Todo dia X do mês)'}
            </h3>
            <button type="button" onClick={() => setIsExpFormOpen(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-stone-600 block mb-1">Descrição:</label>
              <input
                type="text"
                placeholder="Ex: Financiamento da casa, Internet, Condomínio..."
                value={expDesc}
                onChange={e => setExpDesc(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1">Valor Mensal (R$):</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 3200"
                value={expAmount}
                onChange={e => setExpAmount(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1">Dia do Vencimento (1 a 31):</label>
              <input
                type="number"
                min="1"
                max="31"
                value={expDay}
                onChange={e => setExpDay(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-stone-600 block mb-1">Categoria:</label>
              <select
                value={expCategory}
                onChange={e => setExpCategory(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsExpFormOpen(false)}
              className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
            >
              {editingExpId ? 'Salvar Alterações' : 'Salvar Gasto Fixo'}
            </button>
          </div>
        </form>
      )}

      {/* Formulário Novo / Edição de Entrada Fixa */}
      {isIncFormOpen && (
        <form id="recurring-income-form" onSubmit={handleSaveInc} className="bg-white border border-stone-300 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <h3 className="text-base font-semibold text-stone-900">
              {editingIncId ? 'Editar Entrada Recorrente' : 'Cadastrar Entrada Recorrente'}
            </h3>
            <button type="button" onClick={() => setIsIncFormOpen(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-stone-600 block mb-1">Descrição:</label>
              <input
                type="text"
                placeholder="Ex: Salário, Rendimentos, Aluguel recebido..."
                value={incDesc}
                onChange={e => setIncDesc(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1">Valor Mensal (R$):</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 2400"
                value={incAmount}
                onChange={e => setIncAmount(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1">Dia do Crédito (1 a 31):</label>
              <input
                type="number"
                min="1"
                max="31"
                value={incDay}
                onChange={e => setIncDay(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1">Nº de Parcelas (Opcional):</label>
              <input
                type="number"
                placeholder="Ex: 5"
                value={incInstallments}
                onChange={e => setIncInstallments(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsIncFormOpen(false)}
              className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
            >
              {editingIncId ? 'Salvar Alterações' : 'Salvar Entrada'}
            </button>
          </div>
        </form>
      )}

      {/* Tabela de Gastos Recorrentes */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-rose-600" />
            <h3 className="font-semibold text-stone-900">Gastos Recorrentes (Todo Mês)</h3>
          </div>
          <span className="text-xs text-stone-500">Hoje é dia {today} de {monthName}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                <th className="py-3 px-4">Dia do Mês</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Status Este Mês</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {recurringExpenses.sort((a, b) => a.dayOfMonth - b.dayOfMonth).map(item => {
                const cat = getCategoryById(item.category, 'expense', categories)
                const isPast = today > item.dayOfMonth
                const isToday = today === item.dayOfMonth

                return (
                  <tr key={item.id} className="hover:bg-stone-50 transition">
                    <td className="py-3.5 px-4 font-bold text-stone-700 whitespace-nowrap">
                      Todo dia {item.dayOfMonth}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-stone-900">
                      {item.description}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cat.bg}`}>
                        {cat.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isToday ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          Vence Hoje!
                        </span>
                      ) : isPast ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600">
                          Já Venceu este mês
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                          Previsto (Dia {item.dayOfMonth})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold font-mono text-rose-700 text-right whitespace-nowrap">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onPostRecurringToDaily(item)}
                          className="px-2.5 py-1 rounded bg-stone-100 hover:bg-emerald-600 hover:text-white text-stone-700 text-xs font-medium border border-stone-200 transition cursor-pointer"
                          title="Lançar como despesa paga hoje"
                        >
                          Lançar Pago
                        </button>
                        <button
                          onClick={() => handleStartEditExp(item)}
                          className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteRecurringExpense(item.id)}
                          className="p-1 rounded text-stone-400 hover:text-rose-600 transition cursor-pointer"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabela de Entradas Recorrentes */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-teal-700" />
            <h3 className="font-semibold text-stone-900">Entradas Recorrentes & Benefícios</h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">Fluxo Passivo Mensal</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                <th className="py-3 px-4">Dia do Mês</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Parcelas</th>
                <th className="py-3 px-4 text-right">Valor Mensal</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {recurringIncomes.map(item => (
                <tr key={item.id} className="hover:bg-stone-50 transition">
                  <td className="py-3.5 px-4 font-bold text-stone-700 whitespace-nowrap">
                    Todo dia {item.dayOfMonth}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-stone-900">
                    {item.description}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-stone-500">
                    {item.totalInstallments ? (
                      <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                        {item.remainingInstallments} de {item.totalInstallments} parcelas
                      </span>
                    ) : (
                      <span className="text-stone-400">Recorrente contínuo</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-semibold font-mono text-teal-700 text-right whitespace-nowrap">
                    +{formatCurrency(item.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => handleStartEditInc(item)}
                        className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteRecurringIncome(item.id)}
                        className="p-1 rounded text-stone-400 hover:text-rose-600 transition cursor-pointer"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
