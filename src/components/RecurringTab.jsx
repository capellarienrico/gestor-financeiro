import React, { useState } from 'react'
import { Plus, Trash2, Calendar, Clock, CheckCircle2, ShieldCheck, TrendingUp, AlertCircle } from 'lucide-react'
import { CATEGORIES, INCOME_CATEGORIES, getCategoryById } from '../utils/categories'
import { formatCurrency, getMonthInfo } from '../utils/financialMath'

export function RecurringTab({
  recurringExpenses,
  recurringIncomes,
  onAddRecurringExpense,
  onDeleteRecurringExpense,
  onAddRecurringIncome,
  onDeleteRecurringIncome,
  onPostRecurringToDaily
}) {
  const { today, monthName } = getMonthInfo()

  // New recurring expense modal/form
  const [isExpFormOpen, setIsExpFormOpen] = useState(false)
  const [expDesc, setExpDesc] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expDay, setExpDay] = useState(10)
  const [expCategory, setExpCategory] = useState('moradia')

  // New recurring income form
  const [isIncFormOpen, setIsIncFormOpen] = useState(false)
  const [incDesc, setIncDesc] = useState('')
  const [incAmount, setIncAmount] = useState('')
  const [incDay, setIncDay] = useState(5)
  const [incCategory, setIncCategory] = useState('rendimentos')
  const [incInstallments, setIncInstallments] = useState('')

  const handleAddExp = (e) => {
    e.preventDefault()
    const amt = parseFloat(expAmount)
    if (!expDesc.trim() || isNaN(amt) || amt <= 0) return

    onAddRecurringExpense({
      id: 'rec-exp-' + Date.now(),
      description: expDesc.trim(),
      amount: amt,
      dayOfMonth: parseInt(expDay, 10),
      category: expCategory
    })

    setExpDesc('')
    setExpAmount('')
    setIsExpFormOpen(false)
  }

  const handleAddInc = (e) => {
    e.preventDefault()
    const amt = parseFloat(incAmount)
    if (!incDesc.trim() || isNaN(amt) || amt <= 0) return

    const installments = incInstallments ? parseInt(incInstallments, 10) : null

    onAddRecurringIncome({
      id: 'rec-inc-' + Date.now(),
      description: incDesc.trim(),
      amount: amt,
      dayOfMonth: parseInt(incDay, 10),
      category: incCategory,
      totalInstallments: installments,
      remainingInstallments: installments
    })

    setIncDesc('')
    setIncAmount('')
    setIncInstallments('')
    setIsIncFormOpen(false)
  }

  const totalMonthlyExpenses = recurringExpenses.reduce((s, e) => s + e.amount, 0)
  const totalMonthlyIncomes = recurringIncomes.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Contas Fixas Mensais</span>
            <div className="text-2xl font-bold text-rose-400">{formatCurrency(totalMonthlyExpenses)}/mês</div>
            <p className="text-xs text-slate-500">{recurringExpenses.length} itens cadastrados</p>
          </div>
          <button
            onClick={() => setIsExpFormOpen(!isExpFormOpen)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Gasto Fixo</span>
          </button>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Entradas Recorrentes</span>
            <div className="text-2xl font-bold text-cyan-400">+{formatCurrency(totalMonthlyIncomes)}/mês</div>
            <p className="text-xs text-slate-500">Seguro-Desemprego + Rendimento CDI</p>
          </div>
          <button
            onClick={() => setIsIncFormOpen(!isIncFormOpen)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Entrada Fixa</span>
          </button>
        </div>
      </div>

      {/* Formulário Novo Gasto Fixo */}
      {isExpFormOpen && (
        <form onSubmit={handleAddExp} className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-semibold text-white">Cadastrar Gasto Recorrente (Todo dia X do mês)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Descrição:</label>
              <input
                type="text"
                placeholder="Ex: Financiamento da casa, Internet, Condomínio..."
                value={expDesc}
                onChange={e => setExpDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Valor Mensal (R$):</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 3200"
                value={expAmount}
                onChange={e => setExpAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Dia do Vencimento (1 a 31):</label>
              <input
                type="number"
                min="1"
                max="31"
                value={expDay}
                onChange={e => setExpDay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsExpFormOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
            >
              Salvar Gasto Fixo
            </button>
          </div>
        </form>
      )}

      {/* Formulário Nova Entrada Fixa */}
      {isIncFormOpen && (
        <form onSubmit={handleAddInc} className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-semibold text-white">Cadastrar Entrada Recorrente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Descrição:</label>
              <input
                type="text"
                placeholder="Ex: Aluguel recebido, Bico fixo..."
                value={incDesc}
                onChange={e => setIncDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Valor Mensal (R$):</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 2400"
                value={incAmount}
                onChange={e => setIncAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Dia do Crédito (1 a 31):</label>
              <input
                type="number"
                min="1"
                max="31"
                value={incDay}
                onChange={e => setIncDay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Nº de Parcelas (Opcional):</label>
              <input
                type="number"
                placeholder="Ex: 5 (seguro) ou deixe vazio"
                value={incInstallments}
                onChange={e => setIncInstallments(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsIncFormOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
            >
              Salvar Entrada
            </button>
          </div>
        </form>
      )}

      {/* Tabela de Gastos Recorrentes */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-rose-400" />
            <h3 className="font-semibold text-white">Gastos Recorrentes (Todo Mês)</h3>
          </div>
          <span className="text-xs text-slate-400">Hoje é dia {today} de {monthName}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Dia do Mês</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Status Este Mês</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {recurringExpenses.sort((a, b) => a.dayOfMonth - b.dayOfMonth).map(item => {
                const cat = getCategoryById(item.category)
                const isPast = today > item.dayOfMonth
                const isToday = today === item.dayOfMonth

                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-300 whitespace-nowrap">
                      Todo dia {item.dayOfMonth}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {item.description}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cat.bg}`}>
                        {cat.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isToday ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Vence Hoje!
                        </span>
                      ) : isPast ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                          Já Venceu este mês
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Previsto (Dia {item.dayOfMonth})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-rose-400 text-right whitespace-nowrap">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onPostRecurringToDaily(item)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-xs font-medium transition cursor-pointer"
                          title="Lançar como despesa paga hoje"
                        >
                          Lançar Pago
                        </button>
                        <button
                          onClick={() => onDeleteRecurringExpense(item.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer"
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

      {/* Tabela de Entradas Recorrentes (Seguro-Desemprego & Rendimento CDI) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-white">Entradas Recorrentes & Benefícios</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Fluxo Passivo Mensal</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Dia do Mês</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Parcelas</th>
                <th className="py-3 px-4 text-right">Valor Mensal</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {recurringIncomes.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-300 whitespace-nowrap">
                    Todo dia {item.dayOfMonth}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-200">
                    {item.description}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-400">
                    {item.totalInstallments ? (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                        {item.remainingInstallments} de {item.totalInstallments} parcelas
                      </span>
                    ) : (
                      <span className="text-slate-500">Recorrente contínuo</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-cyan-400 text-right whitespace-nowrap">
                    +{formatCurrency(item.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => onDeleteRecurringIncome(item.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
