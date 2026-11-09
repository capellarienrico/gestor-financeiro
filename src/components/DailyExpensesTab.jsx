import React, { useState } from 'react'
import { Plus, Trash2, Search, Filter, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react'
import { CATEGORIES, INCOME_CATEGORIES, getCategoryById } from '../utils/categories'
import { formatCurrency, getMonthInfo } from '../utils/financialMath'

export function DailyExpensesTab({
  transactions,
  onAddTransaction,
  onDeleteTransaction
}) {
  const { currentMonthKey, monthName } = getMonthInfo()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all') // 'all', 'expense', 'income'

  // New transaction form state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [type, setType] = useState('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10))
  const [category, setCategory] = useState('alimentacao')
  const [source, setSource] = useState('Pix')

  const handleSubmit = (e) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) {
      alert('Por favor, informe uma descrição e um valor válido.')
      return
    }

    onAddTransaction({
      id: 'tx-' + Date.now(),
      date,
      description: description.trim(),
      amount: numAmount,
      type,
      category,
      source
    })

    // Reset
    setDescription('')
    setAmount('')
    setIsFormOpen(false)
  }

  // Filter transactions
  const filtered = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || t.type === selectedType
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory
    return matchesSearch && matchesType && matchesCategory
  }).sort((a, b) => b.date.localeCompare(a.date))

  // Monthly totals
  const monthlyExpenses = transactions
    .filter(t => t.date.startsWith(currentMonthKey) && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const monthlyIncomes = transactions
    .filter(t => t.date.startsWith(currentMonthKey) && t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-white">Lançamentos do Dia a Dia</h2>
          <p className="text-slate-400 text-sm">
            Registre despesas diárias (almoço, farmácia, compras) e entradas pontuais.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Gastos Lançados em {monthName}:</span>
            <span className="text-lg font-bold text-rose-400">{formatCurrency(monthlyExpenses)}</span>
          </div>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition flex items-center space-x-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Form de Adicionar (colapsável) */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-semibold text-white flex items-center space-x-2">
            <span>Adicionar Novo Lançamento</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Tipo */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Tipo:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategory('alimentacao'); }}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer transition ${
                    type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Despesa</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategory('outros_in'); }}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer transition ${
                    type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
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
                placeholder="Ex: 85.50"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Data */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Data:</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Categoria:</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {(type === 'expense' ? CATEGORIES : INCOME_CATEGORIES).map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Descrição */}
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Descrição:</label>
              <input
                type="text"
                placeholder="Ex: Almoço restaurante, Farmácia, Uber..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Forma de Pagamento */}
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Forma de Pagamento / Origem:</label>
              <input
                type="text"
                placeholder="Ex: Pix, Cartão Nubank, Débito..."
                value={source}
                onChange={e => setSource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
            >
              Salvar Lançamento
            </button>
          </div>
        </form>
      )}

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Tipo Filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">Todos os tipos</option>
            <option value="expense">Apenas Despesas</option>
            <option value="income">Apenas Entradas</option>
          </select>

          {/* Categoria Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">Todas as categorias</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Origem</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filtered.map(t => {
                const cat = getCategoryById(t.category, t.type)
                const isExpense = t.type === 'expense'

                return (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {t.description}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cat.bg || 'bg-slate-800 text-slate-300'}`}>
                        {cat.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {t.source || 'Manual'}
                    </td>
                    <td className={`py-3.5 px-4 font-semibold text-right whitespace-nowrap ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isExpense ? '-' : '+'}{formatCurrency(t.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onDeleteTransaction(t.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Remover lançamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
