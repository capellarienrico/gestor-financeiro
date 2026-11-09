import React, { useState, useEffect, useRef } from 'react'
import {
  Plus,
  Zap,
  X,
  Check,
  CreditCard,
  QrCode,
  Wallet,
  Banknote,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { formatCurrency } from '../utils/financialMath'
import { DEFAULT_CATEGORIES } from '../utils/categories'

const PRESETS = [
  { label: 'Café / Lanche', icon: '☕', amount: '15.00', category: 'alimentacao', desc: 'Café / Lanche' },
  { label: 'Almoço', icon: '🍽️', amount: '35.00', category: 'alimentacao', desc: 'Almoço' },
  { label: 'Mercado', icon: '🛒', amount: '150.00', category: 'alimentacao', desc: 'Mercado' },
  { label: 'Uber / Corrida', icon: '🚗', amount: '25.00', category: 'transporte', desc: 'Uber / Corrida' },
  { label: 'Farmácia', icon: '💊', amount: '40.00', category: 'saude', desc: 'Farmácia / Remédios' },
  { label: 'Fatura Cartão', icon: '💳', amount: '', category: 'outros', desc: 'Fatura do Cartão de Crédito', paymentMethod: 'Cartão Crédito' },
  { label: 'Pix Avulso', icon: '⚡', amount: '', category: 'outros', desc: 'Pix Avulso', paymentMethod: 'Pix' }
]

const PAYMENT_METHODS = [
  { id: 'Pix', label: 'Pix', icon: QrCode },
  { id: 'Cartão Crédito', label: 'Cartão Crédito', icon: CreditCard },
  { id: 'Débito', label: 'Débito', icon: Wallet },
  { id: 'Dinheiro', label: 'Dinheiro', icon: Banknote }
]

export function QuickExpenseFloatingButton({
  onAddTransaction,
  categories = DEFAULT_CATEGORIES
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(categories[0]?.id || 'alimentacao')
  const [paymentMethod, setPaymentMethod] = useState('Pix')
  const [type, setType] = useState('expense') // 'expense' | 'income'
  const [toastMessage, setToastMessage] = useState('')

  const amountInputRef = useRef(null)

  const todayIso = new Date().toISOString().substring(0, 10)
  const [txDate, setTxDate] = useState(todayIso)

  // Listen to keyboard shortcut 'N' to open modal, and 'Escape' to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger 'N' when user is typing in form controls
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable ||
        e.target.tagName === 'SELECT'
      ) {
        if (e.key === 'Escape' && isOpen) {
          setIsOpen(false)
        }
        return
      }

      if ((e.key === 'n' || e.key === 'N') && !isOpen) {
        e.preventDefault()
        setIsOpen(true)
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus amount input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTxDate(new Date().toISOString().substring(0, 10))
      // Delay slightly to ensure modal is rendered
      const timer = setTimeout(() => {
        if (amountInputRef.current) {
          amountInputRef.current.focus()
          amountInputRef.current.select()
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Apply a 1-click Preset
  const handleApplyPreset = (preset) => {
    if (preset.amount) {
      setAmount(preset.amount)
    }
    setDescription(preset.desc)
    
    // Check if preset category exists in categories list
    const foundCat = categories.find(c => c.id === preset.category)
    if (foundCat) {
      setCategory(foundCat.id)
    } else {
      setCategory(categories[0]?.id || 'alimentacao')
    }

    if (preset.paymentMethod) {
      setPaymentMethod(preset.paymentMethod)
    }

    // Keep focus on amount or description
    if (!preset.amount && amountInputRef.current) {
      amountInputRef.current.focus()
    }
  }

  // Handle Form Submit
  const handleSubmit = (e) => {
    if (e) e.preventDefault()

    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      amountInputRef.current?.focus()
      return
    }

    const fallbackCat = categories.find(c => c.id === category)
    const finalDesc = description.trim() || (fallbackCat ? fallbackCat.name : 'Gasto Avulso')

    const newTx = {
      id: 'tx-quick-' + Date.now(),
      date: txDate || todayIso,
      description: finalDesc,
      amount: parsedAmount,
      type: type,
      category: category,
      source: paymentMethod
    }

    onAddTransaction(newTx)

    // Reset and close
    setAmount('')
    setDescription('')
    setIsOpen(false)

    // Feedback Toast
    setToastMessage(`Lançado: R$ ${parsedAmount.toFixed(2)} (${finalDesc})`)
    setTimeout(() => {
      setToastMessage('')
    }, 3200)
  }

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center space-x-3">
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-bounce border border-emerald-400/40">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center space-x-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-bold text-sm shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-emerald-400/40"
          title="Lançamento Rápido em 1 Toque (Atalho: Tecla N)"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" />
          </div>
          <span className="tracking-wide text-xs sm:text-sm">+ Gasto Rápido</span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-200 border border-emerald-400/30">
            N
          </span>
        </button>
      </div>

      {/* Modal / Bottom Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          {/* Overlay click to close */}
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[92vh] pb-safe">
            {/* Mobile Drag Handle */}
            <div className="w-10 h-1 rounded-full bg-slate-700 mx-auto mt-2 sm:hidden shrink-0" />

            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Lançamento Rápido em 1 Toque</h3>
                  <p className="text-xs text-slate-400">Registre saídas e entradas do dia em segundos</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Type toggle: Gasto vs Entrada */}
                <div className="flex p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                      type === 'expense'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                      type === 'income'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Entrada
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto">
              {/* Presets de 1 Clique */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Presets Rápidos (1 clique)</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Preenchimento automático</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition cursor-pointer text-center group"
                    >
                      <span className="text-xl mb-1 group-hover:scale-110 transition-transform">{preset.icon}</span>
                      <span className="text-[11px] font-medium text-slate-200 line-clamp-1">{preset.label}</span>
                      {preset.amount ? (
                        <span className="text-[10px] text-emerald-400 font-bold mt-0.5">R$ {preset.amount}</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">Avulso</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor Principal (Foco Imediato) */}
              <div className="bg-slate-950 border border-slate-800 focus-within:border-emerald-500/60 rounded-2xl p-4 transition">
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Valor do Lançamento
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-slate-400">R$</span>
                  <input
                    ref={amountInputRef}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    enterKeyHint="done"
                    placeholder="0,00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-transparent text-3xl font-extrabold text-white placeholder-slate-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Descrição Rápida & Data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Descrição rápida:</label>
                  <input
                    type="text"
                    placeholder="Ex: Padaria, Farmácia, Estacionamento..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Data:</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={e => setTxDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Categorias em Chips Rápidos */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                  Categoria
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                  {categories.map(cat => {
                    const isSelected = category === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color || '#10b981' }}
                        />
                        <span>{cat.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Forma de Pagamento (Pílulas) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map(method => {
                    const Icon = method.icon
                    const isSelected = paymentMethod === method.id
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-medium transition cursor-pointer border ${
                          isSelected
                            ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 font-semibold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{method.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Botão Grande de Submissão */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Salvar Lançamento</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/20 text-slate-950/90 font-semibold">
                    Enter ↵
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
