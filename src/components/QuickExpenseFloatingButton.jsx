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
  isOpen: isOpenProp,
  onClose: onCloseProp,
  onOpen: onOpenProp,
  onAddTransaction,
  categories = DEFAULT_CATEGORIES
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof isOpenProp === 'boolean'
  const isOpen = isControlled ? isOpenProp : internalOpen

  const setIsOpen = (val) => {
    if (isControlled) {
      if (val) onOpenProp?.()
      else onCloseProp?.()
    } else {
      setInternalOpen(val)
    }
  }

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
      const timer = setTimeout(() => {
        if (amountInputRef.current) {
          amountInputRef.current.focus()
          amountInputRef.current.select()
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleApplyPreset = (preset) => {
    if (preset.amount) setAmount(preset.amount)
    if (preset.desc) setDescription(preset.desc)
    if (preset.category) setCategory(preset.category)
    if (preset.paymentMethod) setPaymentMethod(preset.paymentMethod)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const numericAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Por favor, informe um valor válido.')
      return
    }

    const descFinal = description.trim() || (type === 'expense' ? 'Gasto rápido' : 'Entrada rápida')

    onAddTransaction({
      id: 'quick-' + Date.now().toString(36),
      date: txDate,
      description: descFinal,
      amount: numericAmount,
      category: category,
      type: type,
      source: paymentMethod,
      paymentMethod: paymentMethod === 'Cartão Crédito' ? 'Cartão de Crédito' : 'À Vista / Pix'
    })

    setToastMessage(`${type === 'expense' ? 'Gasto' : 'Entrada'} de ${formatCurrency(numericAmount)} salvo!`)
    setTimeout(() => setToastMessage(''), 2500)

    setAmount('')
    setDescription('')
    setIsOpen(false)
  }

  return (
    <>
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-bounce border border-stone-800">
          <Check className="w-4 h-4 text-orange-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Desktop Floating Button (Atalho N) - Oculto no celular pois a barra inferior já possui o botão central destacado */}
      <div className="hidden md:flex fixed bottom-6 right-6 z-40 items-center space-x-3">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center space-x-2 px-5 py-3 rounded-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-xl shadow-orange-600/30 hover:scale-105 active:scale-95 transition cursor-pointer"
          title="Novo Lançamento Rápido (Atalho: Tecla N)"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" />
          </div>
          <span className="tracking-wide text-sm font-semibold">Novo Lançamento</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/20 text-white">
            N
          </span>
        </button>
      </div>

      {/* Modal / Bottom Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative z-10 w-full max-w-lg bg-white border-t sm:border border-stone-200 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[92vh] pb-safe text-stone-900">
            {/* Mobile Drag Handle */}
            <div className="w-10 h-1.5 rounded-full bg-stone-300 mx-auto mt-2.5 sm:hidden shrink-0" />

            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Novo Lançamento</h3>
                  <p className="text-xs text-stone-500">Registre saídas e entradas em segundos</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Type toggle: Gasto vs Entrada */}
                <div className="flex p-0.5 bg-stone-200/70 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      type === 'expense'
                        ? 'bg-white text-rose-600 shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      type === 'income'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Entrada
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              {/* Presets de 1 Clique */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="font-semibold uppercase tracking-wider flex items-center space-x-1.5 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    <span>Presets Rápidos (1 clique)</span>
                  </span>
                  <span className="text-[11px] text-stone-400">Preenchimento automático</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-stone-50 border border-stone-200/90 hover:border-orange-500 hover:bg-orange-50/50 transition cursor-pointer text-center group"
                    >
                      <span className="text-xl mb-0.5 group-hover:scale-110 transition-transform">{preset.icon}</span>
                      <span className="text-[11px] font-medium text-stone-800 line-clamp-1">{preset.label}</span>
                      {preset.amount ? (
                        <span className="text-[10px] text-emerald-700 font-bold font-mono mt-0.5">R$ {preset.amount}</span>
                      ) : (
                        <span className="text-[10px] text-stone-400 font-medium mt-0.5">Avulso</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor Principal (Foco Imediato) */}
              <div className="bg-stone-50 border border-stone-200 focus-within:border-orange-500/80 rounded-2xl p-4 transition shadow-inner">
                <label className="text-xs font-semibold text-stone-500 block mb-1">
                  Valor do Lançamento
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-stone-400 font-mono">R$</span>
                  <input
                    ref={amountInputRef}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    enterKeyHint="done"
                    placeholder="0,00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-transparent text-3xl font-extrabold text-stone-900 placeholder-stone-300 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              {/* Descrição Rápida & Data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Descrição rápida:</label>
                  <input
                    type="text"
                    placeholder="Ex: Padaria, Farmácia, Estacionamento..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Data:</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={e => setTxDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer font-mono"
                  />
                </div>
              </div>

              {/* Categorias em Chips Rápidos */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-500 block uppercase tracking-wider text-[11px]">
                  Categoria
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {categories.map(cat => {
                    const isSelected = category === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer border ${
                          isSelected
                            ? 'bg-orange-50 text-orange-800 border-orange-500 font-semibold shadow-sm'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color || '#ea580c' }}
                        />
                        <span>{cat.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-orange-600" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-500 block uppercase tracking-wider text-[11px]">
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
                        className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-medium transition cursor-pointer border ${
                          isSelected
                            ? 'bg-orange-50 text-orange-800 border-orange-500 font-semibold shadow-sm'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:text-stone-900'
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
                  className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition shadow-lg shadow-orange-600/30 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Salvar Lançamento</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/15 text-white/90 font-semibold">
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
