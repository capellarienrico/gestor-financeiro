import React, { useState } from 'react'
import {
  Settings,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Download,
  UploadCloud,
  Palette,
  ShieldCheck,
  Cloud,
  RefreshCw,
  ExternalLink,
  CreditCard,
  Info,
  Sparkles
} from 'lucide-react'
import { importBackup } from '../utils/storage'
import { DRIVE_FILENAME } from '../utils/googleDriveService'
import { calculateCreditCardDueDate, DEFAULT_CARD_SETTINGS } from '../utils/creditCardCycle'
import { testGeminiApiKey } from '../utils/geminiCategorizer'
import { cleanMerchantName } from '../utils/categories'

export function SettingsTab({
  categories,
  incomeCategories,
  creditCardSettings = DEFAULT_CARD_SETTINGS,
  onUpdateCreditCardSettings,
  onUpdateCategories,
  onUpdateIncomeCategories,
  currentBalance,
  onUpdateBalance,
  dailyBudgetGoal,
  onUpdateDailyGoal,
  onExportBackup,
  onRestoreBackup,
  onResetData,
  googleUser,
  lastSyncTime,
  onOpenDriveModal,
  merchantRules = {},
  onUpdateMerchantRules,
  geminiApiKey = '',
  onUpdateGeminiApiKey,
  onOpenReleasesModal
}) {
  // Navigation state
  const [activeSubTab, setActiveSubTab] = useState('expenses') // 'expenses' | 'incomes' | 'card' | 'ai' | 'general'
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#3b82f6')

  // Local card settings state
  const [cardClosingDay, setCardClosingDay] = useState(creditCardSettings?.closingDay ?? 15)
  const [cardDueDay, setCardDueDay] = useState(creditCardSettings?.dueDay ?? 25)
  const [cardSavedFeedback, setCardSavedFeedback] = useState(false)

  // Local AI & Merchant state
  const [inputApiKey, setInputApiKey] = useState(geminiApiKey || '')
  const [aiTestStatus, setAiTestStatus] = useState(null) // 'testing' | 'success' | 'error'
  const [aiTestError, setAiTestError] = useState('')
  const [merchantSearch, setMerchantSearch] = useState('')
  const [newMerchantName, setNewMerchantName] = useState('')
  const [newMerchantCategory, setNewMerchantCategory] = useState(categories[0]?.id || 'alimentacao')

  const handleSaveAndTestApiKey = async () => {
    if (!inputApiKey.trim()) {
      onUpdateGeminiApiKey('')
      setAiTestStatus(null)
      return
    }
    setAiTestStatus('testing')
    setAiTestError('')
    try {
      await testGeminiApiKey(inputApiKey)
      onUpdateGeminiApiKey(inputApiKey.trim())
      setAiTestStatus('success')
    } catch (err) {
      setAiTestStatus('error')
      setAiTestError(err.message)
    }
  }

  const handleAddMerchantRule = (e) => {
    e.preventDefault()
    if (!newMerchantName.trim()) return
    const cleanKey = cleanMerchantName(newMerchantName)
    const updated = {
      ...(merchantRules || {}),
      [cleanKey]: newMerchantCategory
    }
    onUpdateMerchantRules(updated)
    setNewMerchantName('')
  }

  const handleDeleteMerchantRule = (keyToDelete) => {
    const updated = { ...(merchantRules || {}) }
    delete updated[keyToDelete]
    onUpdateMerchantRules(updated)
  }

  // Edit category modal/state
  const [editingCat, setEditingCat] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const PRESET_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1',
    '#14b8a6', '#f97316', '#84cc16', '#64748b'
  ]

  // Add category
  const handleAddCategory = (e) => {
    e.preventDefault()
    if (!newCatName.trim()) return

    const id = newCatName.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '_' + Date.now().toString(36)
    const newCat = {
      id,
      name: newCatName.trim(),
      color: newCatColor,
      bg: `bg-[${newCatColor}]/10 text-[${newCatColor}] border-[${newCatColor}]/20`
    }

    if (activeSubTab === 'expenses') {
      onUpdateCategories([...categories, newCat])
    } else {
      onUpdateIncomeCategories([...incomeCategories, newCat])
    }

    setNewCatName('')
  }

  // Edit category
  const handleStartEdit = (cat) => {
    setEditingCat(cat)
    setEditName(cat.name)
    setEditColor(cat.color || '#3b82f6')
  }

  const handleSaveEdit = () => {
    if (!editName.trim() || !editingCat) return

    const updated = {
      ...editingCat,
      name: editName.trim(),
      color: editColor
    }

    if (activeSubTab === 'expenses') {
      onUpdateCategories(categories.map(c => c.id === editingCat.id ? updated : c))
    } else {
      onUpdateIncomeCategories(incomeCategories.map(c => c.id === editingCat.id ? updated : c))
    }

    setEditingCat(null)
  }

  // Delete category
  const handleDeleteCategory = (catId) => {
    if (confirm('Deseja realmente remover esta categoria?')) {
      if (activeSubTab === 'expenses') {
        onUpdateCategories(categories.filter(c => c.id !== catId))
      } else {
        onUpdateIncomeCategories(incomeCategories.filter(c => c.id !== catId))
      }
    }
  }

  // File import for backup
  const handleFileImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    importBackup(
      file,
      (data) => {
        onRestoreBackup(data)
        alert('Backup restaurado com sucesso!')
      },
      (err) => alert('Erro ao carregar arquivo de backup: ' + err)
    )
  }

  const currentList = activeSubTab === 'expenses' ? categories : incomeCategories

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Configurações & Categorias</h2>
          <p className="text-xs text-slate-400">
            Personalize suas categorias de despesas e receitas, gerencie backups e dados do sistema.
          </p>
        </div>
      </div>

      {/* Navigation SubTabs (Rolagem fluida no mobile) */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === 'expenses'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Despesas ({categories.length})
        </button>
        <button
          onClick={() => setActiveSubTab('incomes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === 'incomes'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Entradas ({incomeCategories.length})
        </button>
        <button
          onClick={() => setActiveSubTab('card')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
            activeSubTab === 'card'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Cartão de Crédito</span>
        </button>
        <button
          onClick={() => setActiveSubTab('ai')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
            activeSubTab === 'ai'
              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>IA & Lojas ({Object.keys(merchantRules || {}).length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('general')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === 'general'
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Backup & Sistema
        </button>
      </div>

      {/* SubTab: Categories Management */}
      {(activeSubTab === 'expenses' || activeSubTab === 'incomes') && (
        <div className="space-y-6">
          {/* Adicionar Categoria Form */}
          <form onSubmit={handleAddCategory} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Adicionar Nova Categoria de {activeSubTab === 'expenses' ? 'Despesa' : 'Entrada'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400 block mb-1">Nome da Categoria:</label>
                <input
                  type="text"
                  placeholder="Ex: Pets, Investimentos, Delivery, Bicos..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Cor Identificadora:</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={e => setNewCatColor(e.target.value)}
                    className="w-10 h-10 rounded-lg bg-transparent border border-slate-800 cursor-pointer"
                  />
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shadow-lg shadow-emerald-600/20"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Cores Pré-definidas Rápidas */}
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-[11px] text-slate-500">Cores sugeridas:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCatColor(c)}
                    className="w-5 h-5 rounded-full border border-slate-700 transition hover:scale-110 cursor-pointer"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </form>

          {/* Lista de Categorias Atuais */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Categorias Cadastradas ({currentList.length})
              </span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {currentList.map(cat => (
                <div key={cat.id} className="p-3.5 flex items-center justify-between hover:bg-slate-800/20 transition">
                  {editingCat?.id === cat.id ? (
                    <div className="flex-1 flex items-center space-x-2 mr-3">
                      <input
                        type="color"
                        value={editColor}
                        onChange={e => setEditColor(e.target.value)}
                        className="w-8 h-8 rounded bg-transparent border border-slate-700 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs"
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                        title="Salvar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingCat(null)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title="Cancelar"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: cat.color || '#64748b' }}
                      />
                      <span className="text-sm font-medium text-slate-200">{cat.name}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleStartEdit(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      title="Editar categoria"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Excluir categoria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SubTab: Cartão de Crédito (Fechamento vs Vencimento) */}
      {activeSubTab === 'card' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-950/40 via-slate-900/80 to-slate-900 border border-purple-500/30 rounded-2xl p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>Ciclo de Fatura do Cartão de Crédito</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Fechamento vs. Vencimento
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure os dias do seu cartão para que os gastos sejam liquidados no dia exato em que o dinheiro sai do seu saldo.
                  </p>
                </div>
              </div>

              {cardSavedFeedback && (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl animate-fade-in">
                  ✓ Configurações Salvas!
                </span>
              )}
            </div>

            {/* Config Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Dia de Fechamento da Fatura (Melhor dia = Dia seguinte):
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-mono">Dia:</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={cardClosingDay}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 1))
                      setCardClosingDay(v)
                    }}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="text-xs text-slate-400">de cada mês</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Compras feitas até este dia entram na fatura atual. A partir do dia {cardClosingDay >= 31 ? 1 : cardClosingDay + 1}, caem na próxima fatura.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Dia de Vencimento / Pagamento da Fatura:
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-mono">Dia:</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={cardDueDay}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 1))
                      setCardDueDay(v)
                    }}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="text-xs text-slate-400">de cada mês</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Data em que o saldo bancário é efetivamente debitado para quitar o cartão.
                </p>
              </div>
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] text-slate-400 block font-medium">Ciclos mais comuns em bancos brasileiros:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Fech. 15 / Venc. 25 (Nubank / Padrão)', c: 15, d: 25 },
                  { label: 'Fech. 28 / Venc. 05 (Início de Mês)', c: 28, d: 5 },
                  { label: 'Fech. 20 / Venc. 30 (Fim de Mês)', c: 20, d: 30 },
                  { label: 'Fech. 05 / Venc. 15 (Meio do Mês)', c: 5, d: 15 },
                  { label: 'Fech. 10 / Venc. 20 (Itaú / Inter)', c: 10, d: 20 }
                ].map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setCardClosingDay(p.c)
                      setCardDueDay(p.d)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      cardClosingDay === p.c && cardDueDay === p.d
                        ? 'bg-purple-600/30 text-purple-300 border-purple-500/50 font-semibold'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Exemplo Interativo com a Data de Hoje */}
            {(() => {
              const todayStr = new Date().toISOString().substring(0, 10)
              const todayDay = new Date().getDate()
              const estimatedDueDate = calculateCreditCardDueDate(todayStr, cardClosingDay, cardDueDay)
              const formattedDue = estimatedDueDate.split('-').reverse().join('/')
              const isPastClosing = todayDay > cardClosingDay

              return (
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200 space-y-2">
                  <div className="flex items-center space-x-1.5 font-semibold text-purple-300">
                    <Info className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Como funciona a projeção dos seus gastos:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Hoje é dia <strong>{todayDay}</strong>. Como o seu fechamento está configurado para o dia <strong>{cardClosingDay}</strong>:
                  </p>
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-xs space-y-1">
                    <div>
                      • Uma compra feita <strong>hoje ({todayStr.split('-').reverse().join('/')})</strong> vencerá na fatura de:
                      <span className="ml-2 font-bold text-purple-400">{formattedDue}</span>
                      {isPastClosing ? (
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                          Após o fechamento (Melhor dia! Ganha até 40 dias)
                        </span>
                      ) : (
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-sans">
                          Antes do fechamento (Fatura atual)
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Na <strong>Planilha Mensal</strong>, você pode alternar a visualização para "Data de Liquidação / Fatura" para enxergar o impacto exato no seu saldo bancário nesta data.
                  </p>
                </div>
              )
            })()}

            {/* Salvar Botão */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onUpdateCreditCardSettings({
                    closingDay: cardClosingDay,
                    dueDay: cardDueDay
                  })
                  setCardSavedFeedback(true)
                  setTimeout(() => setCardSavedFeedback(false), 3000)
                }}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition cursor-pointer shadow-lg shadow-purple-600/20 flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Ciclo do Cartão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SubTab: IA & Regras de Estabelecimentos */}
      {activeSubTab === 'ai' && (
        <div className="space-y-6">
          {/* Card Configuração da API do Gemini */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border border-purple-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    Inteligência Artificial (Google Gemini Flash)
                    {geminiApiKey && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        Chave Ativa
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Classifique faturas e compras do cartão em lote com IA gratuita.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">
                  Chave de API do Google Gemini (Gratuita):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={inputApiKey}
                    onChange={e => setInputApiKey(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleSaveAndTestApiKey}
                    disabled={aiTestStatus === 'testing'}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-lg shadow-purple-600/20 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <span>{aiTestStatus === 'testing' ? 'Testando...' : 'Salvar & Testar Chave'}</span>
                  </button>
                </div>
              </div>

              {aiTestStatus === 'success' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Conexão com a IA do Gemini realizada com sucesso!</span>
                </div>
              )}

              {aiTestStatus === 'error' && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Falha na verificação: {aiTestError}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">Como obter sua chave em 30 segundos (Grátis):</span>
                <p>1. Acesse o <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">Google AI Studio (aistudio.google.com)</a> com sua conta Google.</p>
                <p>2. Clique em <strong>"Create API Key"</strong> e copie a chave gerada.</p>
                <p>3. Cole no campo acima e clique em "Salvar & Testar". A cota pessoal gratuita da Google permite classificar milhares de compras por mês sem custo.</p>
              </div>
            </div>
          </div>

          {/* Dicionário de Estabelecimentos Memorizados */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  Memória de Estabelecimentos (Merchants)
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                    {Object.keys(merchantRules || {}).length} regras salvas
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  O app memoriza suas lojas favoritas. Compras futuras nesses locais são categorizadas no ato.
                </p>
              </div>

              <input
                type="text"
                placeholder="Filtrar lojas..."
                value={merchantSearch}
                onChange={e => setMerchantSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 w-full sm:w-48"
              />
            </div>

            {/* Form Adicionar Nova Regra */}
            <form onSubmit={handleAddMerchantRule} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row gap-2.5 items-end">
              <div className="flex-1 w-full">
                <label className="text-[11px] text-slate-400 block mb-1 font-medium">Nome do Estabelecimento / Loja:</label>
                <input
                  type="text"
                  placeholder="Ex: Padaria do Bairro, Posto Shell..."
                  value={newMerchantName}
                  onChange={e => setNewMerchantName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="w-full sm:w-56">
                <label className="text-[11px] text-slate-400 block mb-1 font-medium">Categoria:</label>
                <select
                  value={newMerchantCategory}
                  onChange={e => setNewMerchantCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id} style={{ color: c.color, backgroundColor: '#0f172a' }}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1 transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Salvar Regra</span>
              </button>
            </form>

            {/* Lista de Regras */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40 max-h-60 overflow-y-auto">
              {Object.keys(merchantRules || {}).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Nenhum estabelecimento cadastrado ainda. Conforme você importa faturas, as regras aparecem aqui automaticamente.
                </div>
              ) : (
                <div className="divide-y divide-slate-850">
                  {Object.entries(merchantRules || {})
                    .filter(([key]) => !merchantSearch.trim() || key.includes(merchantSearch.toLowerCase()))
                    .map(([merchantKey, catId]) => {
                      const catObj = categories.find(c => c.id === catId)
                      return (
                        <div key={merchantKey} className="px-3.5 py-2 flex items-center justify-between text-xs hover:bg-slate-800/20 transition">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-200 capitalize">{merchantKey}</span>
                            <span className="text-slate-500">&rarr;</span>
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                              style={{
                                color: catObj?.color || '#94a3b8',
                                borderColor: (catObj?.color || '#94a3b8') + '33',
                                backgroundColor: (catObj?.color || '#94a3b8') + '15'
                              }}
                            >
                              {catObj?.name || catId}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteMerchantRule(merchantKey)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-500/10 transition cursor-pointer"
                            title="Remover regra"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SubTab: Backup & Sistema */}
      {activeSubTab === 'general' && (
        <div className="space-y-6">
          {/* Card Nuvem Google Drive */}
          <div className="bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-slate-900 border border-blue-500/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-base flex items-center gap-2">
                    Sincronização em Nuvem (Google Drive)
                    {googleUser && (
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Conectado
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Mantenha seus registros sincronizados entre computador e celular de graça, salvando no seu próprio Drive.
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenDriveModal}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                {googleUser ? 'Gerenciar Nuvem' : 'Conectar Google Drive'}
              </button>
            </div>

            {googleUser && (
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Conta: <strong className="text-slate-200">{googleUser.email}</strong></span>
                <span>Arquivo: <code className="text-blue-400">{DRIVE_FILENAME}</code></span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exportar Backup */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Download className="w-5 h-5" />
                <h4 className="font-semibold text-white text-sm">Exportar Backup</h4>
              </div>
              <p className="text-xs text-slate-400">
                Gere um arquivo `.json` com todos os seus lançamentos, contas fixas, saldo e categorias salvas.
              </p>
              <button
                onClick={onExportBackup}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-700 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Backup (.json)</span>
              </button>
            </div>

            {/* Importar Backup */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <UploadCloud className="w-5 h-5" />
                <h4 className="font-semibold text-white text-sm">Restaurar Backup</h4>
              </div>
              <p className="text-xs text-slate-400">
                Restaure um arquivo `.json` salvo anteriormente para recuperar seus dados.
              </p>
              <label className="w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer">
                <UploadCloud className="w-4 h-4" />
                <span>Carregar Arquivo .json</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileImport}
                />
              </label>
            </div>
          </div>

          {/* Card Versão do Aplicativo & Releases */}
          <div className="bg-gradient-to-br from-emerald-950/30 via-slate-900/80 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-white text-sm">Gestor Financeiro & Runway</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      v1.0.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Versão estável oficial com conciliação de faturas, rendimento CDI, IA Gemini e suporte nativo Android.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onOpenReleasesModal}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center space-x-1.5"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Ver Notas da Versão</span>
                </button>
              </div>
            </div>
          </div>

          {/* Resetar Dados */}
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-center space-x-2 text-rose-400">
              <RotateCcw className="w-5 h-5" />
              <h4 className="font-semibold text-white text-sm">Restaurar Padrões de Fábrica</h4>
            </div>
            <p className="text-xs text-slate-300">
              Isso restaurará as categorias, metas e valores padrão do aplicativo.
            </p>
            <button
              onClick={onResetData}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition cursor-pointer shadow-lg shadow-rose-600/20"
            >
              Restaurar Dados Padrões
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
