import React, { useState } from 'react'
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Building2,
  CreditCard,
  Search,
  Filter,
  Check,
  Bot,
  RotateCw,
  HelpCircle,
  Tag
} from 'lucide-react'
import { parseFinancialFile } from '../utils/bankStatementParser'
import { formatCurrency } from '../utils/financialMath'
import { CATEGORIES, DEFAULT_INCOME_CATEGORIES, cleanMerchantName } from '../utils/categories'
import { categorizeTransactionsWithGemini } from '../utils/geminiCategorizer'

const SUPPORTED_BANKS = [
  { name: 'Nubank', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { name: 'Itaú', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { name: 'Bradesco', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { name: 'Santander', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  { name: 'Banco do Brasil', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { name: 'Inter', color: 'bg-amber-600/10 text-amber-500 border-amber-600/20' },
  { name: 'C6 Bank', color: 'bg-slate-400/10 text-slate-300 border-slate-400/20' },
  { name: 'BTG Pactual', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { name: 'Caixa', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { name: 'OFX Universal', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
]

export function NubankImportModal({
  isOpen,
  onClose,
  onApplyNubankAnalysis,
  onImportTransactions,
  categories = CATEGORIES,
  merchantRules = {},
  onSaveMerchantRules,
  geminiApiKey = '',
  creditCardSettings = { dueDay: 25, closingDay: 15 }
}) {
  const [file, setFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // Sub-tabs in result view: 'review' (Tabela de compras) vs 'summary' (Médias & Fixos)
  const [activeTab, setActiveTab] = useState('review')

  // Reviewed items state
  const [reviewedItems, setReviewedItems] = useState([])
  const [filterType, setFilterType] = useState('all') // 'all' | 'card' | 'uncategorized'
  const [searchTerm, setSearchTerm] = useState('')

  // AI categorization loading & status
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiSuccessMessage, setAiSuccessMessage] = useState('')

  if (!isOpen) return null

  const handleProcessFile = (uploadedFile) => {
    setError('')
    setFile(uploadedFile)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target.result
        const result = parseFinancialFile(content, uploadedFile.name, merchantRules)
        if (!result.transactions || !result.transactions.length) {
          setError('Nenhuma transação válida encontrada no arquivo. Verifique se é um arquivo .OFX ou .CSV de extrato ou fatura bancária.')
          return
        }
        setAnalysis(result)

        // Initialize reviewed items with merchant rules applied
        const items = result.transactions.map((t, idx) => ({
          id: t.id || `import-${idx}`,
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
          source: t.source || 'Importação',
          isCard: t.isCard || t.source?.toLowerCase().includes('cart') || uploadedFile.name.toLowerCase().includes('fatura'),
          rememberMerchant: true,
          aiCategorized: false
        }))
        setReviewedItems(items)
      } catch (err) {
        console.error(err)
        setError('Erro ao processar o arquivo: ' + err.message)
      }
    }
    reader.onerror = () => {
      setError('Erro ao ler arquivo local.')
    }
    reader.readAsText(uploadedFile)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0])
    }
  }

  // Update category of a specific item
  const handleItemCategoryChange = (id, newCategory) => {
    setReviewedItems(prev => prev.map(item => item.id === id ? { ...item, category: newCategory } : item))
  }

  // Toggle "remember merchant"
  const handleToggleRemember = (id) => {
    setReviewedItems(prev => prev.map(item => item.id === id ? { ...item, rememberMerchant: !item.rememberMerchant } : item))
  }

  // AI Categorization via Gemini Flash
  const handleCategorizeWithAI = async () => {
    if (!geminiApiKey || !geminiApiKey.trim()) {
      alert('Chave de API do Gemini não configurada!\n\nVocê pode obter uma chave 100% gratuita no Google AI Studio (aistudio.google.com) e adicioná-la na aba "Configurações > IA & Estabelecimentos".')
      return
    }

    try {
      setIsAiLoading(true)
      setError('')
      setAiSuccessMessage('')

      // Filter items to categorize (prioritize 'outros' or unclassified)
      const itemsToCategorize = reviewedItems.filter(item => item.type === 'expense')
      if (!itemsToCategorize.length) {
        alert('Não há compras para categorizar.')
        return
      }

      const predictions = await categorizeTransactionsWithGemini(itemsToCategorize, categories, geminiApiKey)
      
      let updatedCount = 0
      const newMerchantRulesToLearn = {}

      setReviewedItems(prev => {
        return prev.map(item => {
          const matchIndex = itemsToCategorize.findIndex(t => t.id === item.id)
          if (matchIndex !== -1) {
            const pred = predictions.find(p => p.index === matchIndex)
            if (pred && pred.category) {
              updatedCount++
              if (item.rememberMerchant) {
                const cleanKey = cleanMerchantName(pred.merchantClean || item.description)
                if (cleanKey.length >= 3) {
                  newMerchantRulesToLearn[cleanKey] = pred.category
                }
              }
              return {
                ...item,
                category: pred.category,
                aiCategorized: true
              }
            }
          }
          return item
        })
      })

      // Auto-learn newly deduced merchants
      if (Object.keys(newMerchantRulesToLearn).length > 0 && onSaveMerchantRules) {
        onSaveMerchantRules(newMerchantRulesToLearn)
      }

      setAiSuccessMessage(`✨ ${updatedCount} compras categorizadas com sucesso pela IA do Gemini!`)
      setTimeout(() => setAiSuccessMessage(''), 5000)
    } catch (err) {
      console.error(err)
      setError(`Erro na IA do Gemini: ${err.message}`)
    } finally {
      setIsAiLoading(false)
    }
  }

  // Confirm import and insert transactions into spreadsheet
  const handleConfirmImport = () => {
    if (!reviewedItems.length) return

    // 1. Collect merchant rules to save
    const newRules = {}
    for (const item of reviewedItems) {
      if (item.rememberMerchant && item.category && item.category !== 'outros') {
        const clean = cleanMerchantName(item.description)
        if (clean.length >= 3) {
          newRules[clean] = item.category
        }
      }
    }

    if (Object.keys(newRules).length > 0 && onSaveMerchantRules) {
      onSaveMerchantRules(newRules)
    }

    // 2. Prepare transactions to inject into spreadsheet
    const formattedTransactions = reviewedItems.map(item => ({
      id: item.id.startsWith('tx-') ? item.id : `tx-imp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      date: item.date,
      description: item.description,
      amount: item.amount,
      type: item.type,
      category: item.category,
      source: item.isCard ? 'Cartão de Crédito' : item.source,
      paymentMethod: item.isCard ? 'credit_card' : 'pix'
    }))

    onImportTransactions(formattedTransactions)
    onClose()
  }

  const isCardInvoice = reviewedItems.some(i => i.isCard) || (file && file.name.toLowerCase().includes('fatura'))
  const invoiceTotal = reviewedItems
    .filter(i => i.type === 'expense')
    .reduce((sum, i) => sum + i.amount, 0)

  const handleLaunchInvoicePayment = () => {
    if (!reviewedItems.length) return

    // 1. Collect merchant rules to save
    const newRules = {}
    for (const item of reviewedItems) {
      if (item.rememberMerchant && item.category && item.category !== 'outros') {
        const clean = cleanMerchantName(item.description)
        if (clean.length >= 3) {
          newRules[clean] = item.category
        }
      }
    }
    if (Object.keys(newRules).length > 0 && onSaveMerchantRules) {
      onSaveMerchantRules(newRules)
    }

    // 2. Calculate due date
    const today = new Date()
    const dueDay = creditCardSettings?.dueDay || 25
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const invoiceDueDate = `${y}-${m}-${String(dueDay).padStart(2, '0')}`

    const invoicePaymentTx = {
      id: `tx-card-invoice-${Date.now()}`,
      date: invoiceDueDate,
      description: `Pagamento Fatura ${analysis?.bankName || 'Cartão de Crédito'}`,
      amount: parseFloat(invoiceTotal.toFixed(2)),
      type: 'expense',
      category: 'outros',
      source: 'Débito',
      paymentMethod: 'Débito'
    }

    onImportTransactions([invoicePaymentTx])
    onClose()
  }

  const handleApplyAll = () => {
    if (!analysis) return
    onApplyNubankAnalysis(analysis)
    onClose()
  }

  // Filter items for display
  const filteredItems = reviewedItems.filter(item => {
    if (filterType === 'card' && !item.isCard) return false
    if (filterType === 'uncategorized' && item.category !== 'outros') return false

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      return item.description.toLowerCase().includes(q) || item.date.includes(q)
    }
    return true
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border-t sm:border border-stone-200 rounded-t-3xl sm:rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] pb-safe animate-in fade-in zoom-in-95 duration-150">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-stone-300 mx-auto mt-2 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-stone-200 bg-stone-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200 shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">Importar Extrato & Fatura Bancária</h3>
              <p className="text-xs text-stone-500">Preencha os dias da planilha automaticamente e aprenda seus estabelecimentos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Suporte Multi-Bancos Chips */}
          {!analysis && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Bancos e formatos compatíveis:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUPPORTED_BANKS.map((b) => (
                  <span
                    key={b.name}
                    className="text-[11px] px-2.5 py-0.5 rounded-full border border-stone-200 bg-stone-50 text-stone-700 font-medium"
                  >
                    {b.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 100% Seguro e Privado Callout */}
          {!analysis && (
            <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 text-xs text-orange-950 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-semibold text-orange-800">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                <span>100% Seguro e Privado: Processamento Local no seu Navegador</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Aceita faturas de cartão e extratos em <strong>.OFX</strong> ou <strong>.CSV</strong> de qualquer banco brasileiro (Nubank, Itaú, Inter, Bradesco, Santander, etc.). Os dados são processados <strong className="text-stone-900">100% localmente</strong>.
              </p>
            </div>
          )}

          {/* Upload Drop Zone */}
          {!analysis && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${
                isDragging ? 'border-orange-500 bg-orange-50/50' : 'border-stone-300 hover:border-stone-400 bg-stone-50'
              }`}
            >
              <FileText className="w-12 h-12 text-orange-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-stone-900 mb-1">
                Arraste seu arquivo .OFX ou .CSV de fatura/extrato aqui
              </h4>
              <p className="text-xs text-stone-500 mb-4">
                Nubank (fatura do cartão ou conta), Itaú, Inter, Bradesco, Santander, C6, etc.
              </p>

              <label className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold cursor-pointer transition shadow-sm">
                <UploadCloud className="w-4 h-4" />
                <span>Escolher Arquivo (.OFX ou .CSV)</span>
                <input
                  type="file"
                  accept=".csv,.ofx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
                />
              </label>

              {/* Guia Rápido */}
              <div className="mt-6 pt-6 border-t border-stone-200 text-left text-xs text-stone-500 space-y-1.5">
                <span className="font-semibold text-stone-700 block mb-1">Como baixar no seu app:</span>
                <p>• <strong>Nubank:</strong> Cartão de Crédito &gt; Baixar fatura &gt; Formato CSV ou OFX.</p>
                <p>• <strong>Itaú, Bradesco, Santander, BB:</strong> Cartões ou Extrato &gt; Exportar período &gt; OFX ou CSV.</p>
                <p>• <strong>Inter, C6 Bank:</strong> Menu Extrato / Fatura &gt; Exportar.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {aiSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{aiSuccessMessage}</span>
            </div>
          )}

          {/* Analysis & Review Workspace */}
          {analysis && (
            <div className="space-y-4">
              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 gap-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-sm font-bold text-stone-900 block">
                      {reviewedItems.length} compras identificadas no arquivo
                    </span>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                        🏦 {analysis.detectedBank || 'Banco'}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                        📄 {file?.name || 'Extrato'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => { setAnalysis(null); setFile(null); setReviewedItems([]); }}
                    className="text-xs text-stone-500 hover:text-stone-800 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                  >
                    Trocar arquivo
                  </button>
                </div>
              </div>

              {/* Sub-tabs switch: Revisão vs Resumo */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('review')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                      activeTab === 'review'
                        ? 'bg-stone-900 text-white shadow-sm'
                        : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Revisar e Lançar Compras ({reviewedItems.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                      activeTab === 'summary'
                        ? 'bg-stone-900 text-white shadow-sm'
                        : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Médias & Contas Fixas</span>
                  </button>
                </div>

                {/* AI Categorization Button */}
                {activeTab === 'review' && (
                  <button
                    onClick={handleCategorizeWithAI}
                    disabled={isAiLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    title={geminiApiKey ? "Classificar todas as compras automaticamente usando a IA do Gemini" : "Requer chave gratuita do Gemini em Configurações"}
                  >
                    {isAiLoading ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    )}
                    <span>{isAiLoading ? 'Classificando com IA...' : '✨ Categorizar com IA (Gemini)'}</span>
                  </button>
                )}
              </div>

              {/* TAB 1: REVISÃO DE COMPRAS (TABELA INTERATIVA) */}
              {activeTab === 'review' && (
                <div className="space-y-3">
                  {/* Banner Diagnóstico da Fatura de Cartão */}
                  {isCardInvoice && (
                    <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs text-stone-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-stone-900 block text-sm">Fatura de Cartão Detectada</span>
                            <span className="text-[11px] text-stone-600">
                              O cartão entra como um lançamento único no vencimento (dia {creditCardSettings?.dueDay || 25}). Use a auditoria abaixo para categorizar e analisar suas médias.
                            </span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right shrink-0 bg-white/80 sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-purple-200">
                          <span className="text-[10px] uppercase font-bold text-stone-500 block">Total da Fatura</span>
                          <span className="text-base font-bold font-mono text-purple-900">{formatCurrency(invoiceTotal)}</span>
                        </div>
                      </div>

                      {/* Top Categorias da Fatura */}
                      <div className="pt-2 border-t border-purple-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(
                          reviewedItems
                            .filter(i => i.type === 'expense')
                            .reduce((acc, i) => {
                              acc[i.category] = (acc[i.category] || 0) + i.amount
                              return acc
                            }, {})
                        )
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 4)
                          .map(([catId, sum]) => {
                            const cat = categories.find(c => c.id === catId)
                            const pct = invoiceTotal > 0 ? Math.round((sum / invoiceTotal) * 100) : 0
                            return (
                              <div key={catId} className="bg-white border border-purple-100 rounded-xl p-2 shadow-xs">
                                <span className="text-[10px] text-stone-500 truncate block font-medium">{cat?.name || catId}</span>
                                <div className="flex items-baseline justify-between mt-0.5">
                                  <span className="font-mono font-bold text-stone-900 text-xs">{formatCurrency(sum)}</span>
                                  <span className="text-[10px] text-purple-700 font-semibold">{pct}%</span>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}

                  {/* Filters & Search */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="flex items-center space-x-1.5 w-full sm:w-auto">
                      <button
                        onClick={() => setFilterType('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          filterType === 'all' ? 'bg-stone-900 text-white font-bold shadow-sm' : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Todas ({reviewedItems.length})
                      </button>
                      <button
                        onClick={() => setFilterType('card')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          filterType === 'card' ? 'bg-purple-100 text-purple-800 font-bold border border-purple-200' : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Cartão ({reviewedItems.filter(i => i.isCard).length})
                      </button>
                      <button
                        onClick={() => setFilterType('uncategorized')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          filterType === 'uncategorized' ? 'bg-amber-100 text-amber-800 font-bold border border-amber-200' : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Sem categoria ({reviewedItems.filter(i => i.category === 'outros').length})
                      </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Buscar por loja..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Table of items */}
                  <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white max-h-72 overflow-y-auto shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-stone-50 sticky top-0 border-b border-stone-200 z-10 text-stone-600 uppercase tracking-wider text-[10px] font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Data</th>
                          <th className="py-2.5 px-3">Estabelecimento</th>
                          <th className="py-2.5 px-3 text-right">Valor</th>
                          <th className="py-2.5 px-3">Categoria</th>
                          <th className="py-2.5 px-3 text-center" title="Salva este estabelecimento no dicionário para nunca mais precisar classificar">
                            Lembrar?
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredItems.map(item => {
                          const catObj = categories.find(c => c.id === item.category)
                          return (
                            <tr key={item.id} className="hover:bg-stone-50 transition">
                              <td className="py-2 px-3 text-stone-500 whitespace-nowrap font-mono text-[11px]">
                                {item.date.split('-').reverse().slice(0, 2).join('/')}
                              </td>
                              <td className="py-2 px-3 text-stone-800 font-medium">
                                <div className="flex items-center space-x-1.5">
                                  <span>{item.description}</span>
                                  {item.aiCategorized && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-orange-50 text-orange-700 border border-orange-200 font-bold shrink-0">
                                      IA
                                    </span>
                                  )}
                                  {item.isCard && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                                      Crédito
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold whitespace-nowrap">
                                <span className={item.type === 'expense' ? 'text-rose-700' : 'text-emerald-700'}>
                                  {item.type === 'expense' ? '-' : '+'}{formatCurrency(item.amount)}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <select
                                  value={item.category}
                                  onChange={e => handleItemCategoryChange(item.id, e.target.value)}
                                  className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-[11px] text-stone-800 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                                >
                                  {categories.map(c => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={item.rememberMerchant}
                                  onChange={() => handleToggleRemember(item.id)}
                                  title="Lembrar este estabelecimento para faturas futuras"
                                  className="w-4 h-4 rounded text-orange-600 bg-white border-stone-300 focus:ring-orange-500 cursor-pointer"
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <p className="text-[11px] text-stone-500">
                      💡 Estabelecimentos com <strong>"Lembrar"</strong> ativado são memorizados pelo app e categorizados automaticamente no futuro.
                    </p>

                    {isCardInvoice ? (
                      <button
                        onClick={handleLaunchInvoicePayment}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition active:scale-95"
                        title="Lança apenas 1 saída no dia do vencimento da fatura com o total consolidado"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>💳 Lançar Pagamento da Fatura na Planilha ({formatCurrency(invoiceTotal)})</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleConfirmImport}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirmar e Lançar {reviewedItems.length} Compras na Planilha</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: RESUMO DE GASTOS & FIXOS DETECTADOS */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                      <span className="text-xs text-stone-500 block mb-1">Média Mensal de Gastos</span>
                      <div className="text-xl font-bold text-rose-700 font-mono">
                        {formatCurrency(analysis.averageMonthlyExpense)}
                      </div>
                      <span className="text-[11px] text-stone-400">Baseado no período analisado</span>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                      <span className="text-xs text-purple-700 block mb-1">Média Diária Calculada</span>
                      <div className="text-xl font-bold text-purple-800 font-mono">
                        {formatCurrency(analysis.averageDailyExpense)}<span className="text-xs text-purple-600 font-normal">/dia</span>
                      </div>
                      <span className="text-[11px] text-purple-600">Pode virar sua meta de gastos</span>
                    </div>

                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                      <span className="text-xs text-stone-500 block mb-1">Transações Identificadas</span>
                      <div className="text-xl font-bold text-stone-900 font-mono">
                        {analysis.transactions.length}
                      </div>
                      <span className="text-[11px] text-stone-400">{analysis.monthsCount} mês(es) analisados</span>
                    </div>
                  </div>

                  {/* Recurring expenses detected */}
                  {analysis.detectedRecurring.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4 text-orange-600" />
                        <span>Contas Fixas & Assinaturas Detectadas Automaticamente:</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                        {analysis.detectedRecurring.map(item => (
                          <div key={item.id} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs flex justify-between items-center">
                            <div>
                              <span className="text-stone-800 font-medium block">{item.description}</span>
                              <span className="text-stone-500">Todo dia ~{item.dayOfMonth}</span>
                            </div>
                            <span className="font-semibold text-rose-700 font-mono">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-stone-200 flex justify-end">
                    <button
                      onClick={handleApplyAll}
                      className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition flex items-center space-x-2 shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aplicar Médias & Fixos no Simulador Diário</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
