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
  Sparkles,
  Bell,
  Clock
} from 'lucide-react'
import { importBackup } from '../utils/storage'
import { DRIVE_FILENAME } from '../utils/googleDriveService'
import { calculateCreditCardDueDate, DEFAULT_CARD_SETTINGS } from '../utils/creditCardCycle'
import { testGeminiApiKey } from '../utils/geminiCategorizer'
import { cleanMerchantName } from '../utils/categories'
import { DEFAULT_NOTIFICATION_SETTINGS, triggerTestNotification } from '../utils/notifications'

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
  notificationSettings = DEFAULT_NOTIFICATION_SETTINGS,
  onUpdateNotificationSettings,
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

  // Local notification settings state
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(notificationSettings?.dailyReminderEnabled ?? true)
  const [dailyReminderTime, setDailyReminderTime] = useState(notificationSettings?.dailyReminderTime ?? '21:00')
  const [invoiceReminderEnabled, setInvoiceReminderEnabled] = useState(notificationSettings?.invoiceReminderEnabled ?? true)
  const [goalAlertEnabled, setGoalAlertEnabled] = useState(notificationSettings?.goalAlertEnabled ?? true)
  const [notificationSavedFeedback, setNotificationSavedFeedback] = useState(false)
  const [isTestingNotification, setIsTestingNotification] = useState(false)

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
      <div className="bg-white border border-stone-200 rounded-2xl p-6 flex items-center space-x-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-stone-900">Configurações & Categorias</h2>
          <p className="text-xs text-stone-500">
            Personalize suas categorias de despesas e receitas, gerencie backups e dados do sistema.
          </p>
        </div>
      </div>

      {/* Navigation SubTabs (Rolagem fluida no mobile) */}
      <div className="flex space-x-2 border-b border-stone-200 pb-2.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === 'expenses'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          Despesas ({categories.length})
        </button>
        <button
          onClick={() => setActiveSubTab('incomes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === 'incomes'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          Entradas ({incomeCategories.length})
        </button>
        <button
          onClick={() => setActiveSubTab('card')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
            activeSubTab === 'card'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Cartão de Crédito</span>
        </button>
        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
            activeSubTab === 'notifications'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-orange-600" />
          <span>Notificações & Lembretes</span>
        </button>
        <button
          onClick={() => setActiveSubTab('ai')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
            activeSubTab === 'ai'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>IA & Lojas ({Object.keys(merchantRules || {}).length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('general')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === 'general'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          Backup & Sistema
        </button>
      </div>

      {/* SubTab: Categories Management */}
      {(activeSubTab === 'expenses' || activeSubTab === 'incomes') && (
        <div className="space-y-6">
          {/* Adicionar Categoria Form */}
          <form onSubmit={handleAddCategory} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-semibold text-stone-900 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-orange-600" />
              <span>Adicionar Nova Categoria de {activeSubTab === 'expenses' ? 'Despesa' : 'Entrada'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="text-xs text-stone-600 block mb-1">Nome da Categoria:</label>
                <input
                  type="text"
                  placeholder="Ex: Pets, Investimentos, Delivery, Bicos..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-stone-600 block mb-1">Cor Identificadora:</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={e => setNewCatColor(e.target.value)}
                    className="w-10 h-10 rounded-lg bg-transparent border border-stone-300 cursor-pointer"
                  />
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition cursor-pointer shadow-sm"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Cores Pré-definidas Rápidas */}
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-[11px] text-stone-500">Cores sugeridas:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCatColor(c)}
                    className="w-5 h-5 rounded-full border border-stone-300 transition hover:scale-110 cursor-pointer"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </form>

          {/* Lista de Categorias Atuais */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
                Categorias Cadastradas ({currentList.length})
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {currentList.map(cat => (
                <div key={cat.id} className="p-3.5 flex items-center justify-between hover:bg-stone-50 transition">
                  {editingCat?.id === cat.id ? (
                    <div className="flex-1 flex items-center space-x-2 mr-3">
                      <input
                        type="color"
                        value={editColor}
                        onChange={e => setEditColor(e.target.value)}
                        className="w-8 h-8 rounded bg-transparent border border-stone-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1 bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1 text-stone-900 text-xs"
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="p-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 cursor-pointer shadow-sm"
                        title="Salvar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingCat(null)}
                        className="p-1.5 rounded-lg bg-stone-100 text-stone-600 hover:text-stone-900 cursor-pointer"
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
                      <span className="text-sm font-medium text-stone-800">{cat.name}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleStartEdit(cat)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                      title="Editar categoria"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                    <span>Fatura do Cartão de Crédito</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                      Vencimento & Pagamento
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Configure os dias do seu cartão. O valor entra como um lançamento único no vencimento, sem poluir seu dia a dia.
                  </p>
                </div>
              </div>

              {cardSavedFeedback && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl animate-fade-in">
                  ✓ Configurações Salvas!
                </span>
              )}
            </div>

            {/* Config Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                <label className="text-xs font-semibold text-stone-700 block">
                  Dia de Fechamento da Fatura (Melhor dia = Dia seguinte):
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-stone-500 font-mono">Dia:</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={cardClosingDay}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 1))
                      setCardClosingDay(v)
                    }}
                    className="w-24 bg-white border border-stone-300 rounded-lg p-2 text-stone-900 font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="text-xs text-stone-500">de cada mês</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Compras feitas até este dia entram na fatura atual. A partir do dia {cardClosingDay >= 31 ? 1 : cardClosingDay + 1}, caem na próxima fatura.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                <label className="text-xs font-semibold text-stone-700 block">
                  Dia de Vencimento / Pagamento da Fatura:
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-stone-500 font-mono">Dia:</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={cardDueDay}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 1))
                      setCardDueDay(v)
                    }}
                    className="w-24 bg-white border border-stone-300 rounded-lg p-2 text-stone-900 font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="text-xs text-stone-500">de cada mês</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Data em que o saldo bancário é efetivamente debitado para quitar o cartão.
                </p>
              </div>
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] text-stone-500 block font-medium">Ciclos mais comuns em bancos brasileiros:</span>
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
                        ? 'bg-purple-100 text-purple-800 border-purple-300 font-semibold'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
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
                <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 space-y-2">
                  <div className="flex items-center space-x-1.5 font-semibold text-purple-800">
                    <Info className="w-4 h-4 text-purple-700 shrink-0" />
                    <span>Como funciona a projeção dos seus gastos:</span>
                  </div>
                  <p className="text-stone-700 leading-relaxed">
                    Hoje é dia <strong>{todayDay}</strong>. Como o seu fechamento está configurado para o dia <strong>{cardClosingDay}</strong>:
                  </p>
                  <div className="p-3 rounded-lg bg-white border border-purple-200 font-mono text-xs space-y-1 shadow-sm">
                    <div>
                      • Uma compra feita <strong>hoje ({todayStr.split('-').reverse().join('/')})</strong> vencerá na fatura de:
                      <span className="ml-2 font-bold text-purple-800">{formattedDue}</span>
                      {isPastClosing ? (
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-sans">
                          Após o fechamento (Melhor dia! Ganha até 40 dias)
                        </span>
                      ) : (
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 font-sans">
                          Antes do fechamento (Fatura atual)
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    O cartão entra na sua planilha como um pagamento consolidado no dia do vencimento da fatura, mantendo seu fluxo de caixa diário 100% focado em Débito, Pix e VR sem poluição.
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
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition cursor-pointer shadow-sm flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Ciclo do Cartão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SubTab: Notificações & Lembretes Locais */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                    <span>Lembretes & Notificações</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
                      Capacitor / Android & Web
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Receba avisos no seu celular para registrar os gastos do dia e não acumular pendências.
                  </p>
                </div>
              </div>

              {notificationSavedFeedback && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl animate-fade-in">
                  ✓ Configurações Salvas!
                </span>
              )}
            </div>

            {/* Config List */}
            <div className="space-y-4 pt-2">
              {/* 1. Lembrete Diário para Preencher o Dia */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        Lembrete Diário para Preencher o Dia
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Avisa no seu celular no horário exato escolhido por você para registrar o dia
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dailyReminderEnabled}
                      onChange={(e) => setDailyReminderEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>

                {dailyReminderEnabled && (
                  <div className="pt-3 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-stone-600 font-medium">Horário Escolhido:</span>
                      <input
                        type="time"
                        value={dailyReminderTime}
                        onChange={(e) => setDailyReminderTime(e.target.value)}
                        className="bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer shadow-xs"
                      />
                    </div>
                    <div className="text-[11px] text-stone-600 bg-white px-3 py-1.5 rounded-lg border border-stone-200 font-sans">
                      💬 Mensagem: <em>"Hora do Fechamento Diário ☕ - Como foram seus gastos hoje?"</em>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Aviso de Fatura do Cartão */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">
                      Aviso de Vencimento da Fatura do Cartão
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Avisa 2 dias antes do vencimento (dia {cardDueDay}) para garantir o saldo em conta
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoiceReminderEnabled}
                    onChange={(e) => setInvoiceReminderEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-700"></div>
                </label>
              </div>

              {/* 3. Alerta de Meta Diária */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">
                      Alerta de Meta Diária Ultrapassada
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Notifica caso a soma dos gastos no débito/pix de hoje ultrapasse sua meta (R$ {dailyBudgetGoal}/dia)
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={goalAlertEnabled}
                    onChange={(e) => setGoalAlertEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-100">
              <button
                type="button"
                onClick={async () => {
                  setIsTestingNotification(true)
                  await triggerTestNotification({
                    dailyReminderTime
                  })
                  setIsTestingNotification(false)
                }}
                disabled={isTestingNotification}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center space-x-2 border border-stone-200 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Bell className="w-4 h-4 text-orange-600" />
                <span>{isTestingNotification ? 'Disparando...' : '🔔 Testar Notificação Agora'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateNotificationSettings?.({
                    dailyReminderEnabled,
                    dailyReminderTime,
                    invoiceReminderEnabled,
                    goalAlertEnabled
                  })
                  setNotificationSavedFeedback(true)
                  setTimeout(() => setNotificationSavedFeedback(false), 3000)
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition cursor-pointer shadow-sm flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Configurações de Notificação</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SubTab: IA & Regras de Estabelecimentos */}
      {activeSubTab === 'ai' && (
        <div className="space-y-6">
          {/* Card Configuração da API do Gemini */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-base flex items-center gap-2">
                    Inteligência Artificial (Google Gemini Flash)
                    {geminiApiKey && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        Chave Ativa
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Classifique faturas e compras do cartão em lote com IA gratuita.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">
                  Chave de API do Google Gemini (Gratuita):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={inputApiKey}
                    onChange={e => setInputApiKey(e.target.value)}
                    className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    onClick={handleSaveAndTestApiKey}
                    disabled={aiTestStatus === 'testing'}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <span>{aiTestStatus === 'testing' ? 'Testando...' : 'Salvar & Testar Chave'}</span>
                  </button>
                </div>
              </div>

              {aiTestStatus === 'success' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Conexão com a IA do Gemini realizada com sucesso!</span>
                </div>
              )}

              {aiTestStatus === 'error' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>Falha na verificação: {aiTestError}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-500 space-y-1">
                <span className="font-semibold text-stone-700 block">Como obter sua chave em 30 segundos (Grátis):</span>
                <p>1. Acesse o <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">Google AI Studio (aistudio.google.com)</a> com sua conta Google.</p>
                <p>2. Clique em <strong>"Create API Key"</strong> e copie a chave gerada.</p>
                <p>3. Cole no campo acima e clique em "Salvar & Testar". A cota pessoal gratuita da Google permite classificar milhares de compras por mês sem custo.</p>
              </div>
            </div>
          </div>

          {/* Dicionário de Estabelecimentos Memorizados */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200">
              <div>
                <h4 className="font-bold text-stone-900 text-base flex items-center gap-2">
                  Memória de Estabelecimentos (Merchants)
                  <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-normal">
                    {Object.keys(merchantRules || {}).length} regras salvas
                  </span>
                </h4>
                <p className="text-xs text-stone-500">
                  O app memoriza suas lojas favoritas. Compras futuras nesses locais são categorizadas no ato.
                </p>
              </div>

              <input
                type="text"
                placeholder="Filtrar lojas..."
                value={merchantSearch}
                onChange={e => setMerchantSearch(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-orange-500 w-full sm:w-48"
              />
            </div>

            {/* Form Adicionar Nova Regra */}
            <form onSubmit={handleAddMerchantRule} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row gap-2.5 items-end">
              <div className="flex-1 w-full">
                <label className="text-[11px] text-stone-600 block mb-1 font-medium">Nome do Estabelecimento / Loja:</label>
                <input
                  type="text"
                  placeholder="Ex: Padaria do Bairro, Posto Shell..."
                  value={newMerchantName}
                  onChange={e => setNewMerchantName(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="w-full sm:w-56">
                <label className="text-[11px] text-stone-600 block mb-1 font-medium">Categoria:</label>
                <select
                  value={newMerchantCategory}
                  onChange={e => setNewMerchantCategory(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center space-x-1 transition cursor-pointer shrink-0 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Salvar Regra</span>
              </button>
            </form>

            {/* Lista de Regras */}
            <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50 max-h-60 overflow-y-auto">
              {Object.keys(merchantRules || {}).length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-400">
                  Nenhum estabelecimento cadastrado ainda. Conforme você importa faturas, as regras aparecem aqui automaticamente.
                </div>
              ) : (
                <div className="divide-y divide-stone-200">
                  {Object.entries(merchantRules || {})
                    .filter(([key]) => !merchantSearch.trim() || key.includes(merchantSearch.toLowerCase()))
                    .map(([merchantKey, catId]) => {
                      const catObj = categories.find(c => c.id === catId)
                      return (
                        <div key={merchantKey} className="px-3.5 py-2 flex items-center justify-between text-xs hover:bg-white transition bg-stone-50">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-stone-800 capitalize">{merchantKey}</span>
                            <span className="text-stone-400">&rarr;</span>
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                              style={{
                                color: catObj?.color || '#57534e',
                                borderColor: (catObj?.color || '#57534e') + '44',
                                backgroundColor: (catObj?.color || '#57534e') + '15'
                              }}
                            >
                              {catObj?.name || catId}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteMerchantRule(merchantKey)}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
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
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-stone-900 text-base flex items-center gap-2">
                    Sincronização em Nuvem (Google Drive)
                    {googleUser && (
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Conectado
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-stone-500">
                    Mantenha seus registros sincronizados entre computador e celular de graça, salvando no seu próprio Drive.
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenDriveModal}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
              >
                {googleUser ? 'Gerenciar Nuvem' : 'Conectar Google Drive'}
              </button>
            </div>

            {googleUser && (
              <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
                <span>Conta: <strong className="text-stone-800">{googleUser.email}</strong></span>
                <span>Arquivo: <code className="text-blue-700 font-mono">{DRIVE_FILENAME}</code></span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exportar Backup */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center space-x-2 text-stone-800">
                <Download className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-stone-900 text-sm">Exportar Backup</h4>
              </div>
              <p className="text-xs text-stone-500">
                Gere um arquivo `.json` com todos os seus lançamentos, contas fixas, saldo e categorias salvas.
              </p>
              <button
                onClick={onExportBackup}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center space-x-2 border border-stone-200 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Backup (.json)</span>
              </button>
            </div>

            {/* Importar Backup */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center space-x-2 text-stone-800">
                <UploadCloud className="w-5 h-5 text-emerald-700" />
                <h4 className="font-semibold text-stone-900 text-sm">Restaurar Backup</h4>
              </div>
              <p className="text-xs text-stone-500">
                Restaure um arquivo `.json` salvo anteriormente para recuperar seus dados.
              </p>
              <label className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer">
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
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-stone-900 text-sm">Gestor Financeiro & Runway</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200">
                      v1.0.0
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Versão estável oficial com conciliação de faturas, rendimento CDI, IA Gemini e suporte nativo Android.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onOpenReleasesModal}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition cursor-pointer shadow-sm flex items-center space-x-1.5"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Ver Notas da Versão</span>
                </button>
              </div>
            </div>
          </div>

          {/* Resetar Dados */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center space-x-2 text-rose-700">
              <RotateCcw className="w-5 h-5" />
              <h4 className="font-semibold text-rose-900 text-sm">Restaurar Padrões de Fábrica</h4>
            </div>
            <p className="text-xs text-rose-700">
              Isso restaurará as categorias, metas e valores padrão do aplicativo.
            </p>
            <button
              onClick={onResetData}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              Restaurar Dados Padrões
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
