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
  geminiApiKey = ''
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] pb-safe animate-in fade-in zoom-in-95 duration-150">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-slate-700 mx-auto mt-2 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Importar Extrato & Fatura Bancária</h3>
              <p className="text-xs text-slate-400">Preencha os dias da planilha automaticamente e aprenda seus estabelecimentos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Suporte Multi-Bancos Chips */}
          {!analysis && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Bancos e formatos compatíveis:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUPPORTED_BANKS.map((b) => (
                  <span
                    key={b.name}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${b.color}`}
                  >
                    {b.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 100% Seguro e Privado Callout */}
          {!analysis && (
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-semibold text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Seguro e Privado: Processamento Local no seu Navegador</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Aceita faturas de cartão e extratos em <strong>.OFX</strong> ou <strong>.CSV</strong> de qualquer banco brasileiro (Nubank, Itaú, Inter, Bradesco, Santander, etc.). Os dados são processados <strong className="text-white">100% localmente</strong>.
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
                isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <FileText className="w-12 h-12 text-purple-400 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-white mb-1">
                Arraste seu arquivo .OFX ou .CSV de fatura/extrato aqui
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Nubank (fatura do cartão ou conta), Itaú, Inter, Bradesco, Santander, C6, etc.
              </p>

              <label className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer transition shadow-lg shadow-purple-600/20">
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
              <div className="mt-6 pt-6 border-t border-slate-800/80 text-left text-xs text-slate-400 space-y-1.5">
                <span className="font-semibold text-slate-300 block mb-1">Como baixar no seu app:</span>
                <p>• <strong>Nubank:</strong> Cartão de Crédito &gt; Baixar fatura &gt; Formato CSV ou OFX.</p>
                <p>• <strong>Itaú, Bradesco, Santander, BB:</strong> Cartões ou Extrato &gt; Exportar período &gt; OFX ou CSV.</p>
                <p>• <strong>Inter, C6 Bank:</strong> Menu Extrato / Fatura &gt; Exportar.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {aiSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{aiSuccessMessage}</span>
            </div>
          )}

          {/* Analysis & Review Workspace */}
          {analysis && (
            <div className="space-y-4">
              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-sm font-bold text-white block">
                      {reviewedItems.length} compras identificadas no arquivo
                    </span>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                        🏦 {analysis.detectedBank || 'Banco'}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        📄 {file?.name || 'Extrato'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => { setAnalysis(null); setFile(null); setReviewedItems([]); }}
                    className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  >
                    Trocar arquivo
                  </button>
                </div>
              </div>

              {/* Sub-tabs switch: Revisão vs Resumo */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('review')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                      activeTab === 'review'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Revisar e Lançar Compras ({reviewedItems.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                      activeTab === 'summary'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
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
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-purple-500/20 cursor-pointer disabled:opacity-50"
                    title={geminiApiKey ? "Classificar todas as compras automaticamente usando a IA do Gemini" : "Requer chave gratuita do Gemini em Configurações"}
                  >
                    {isAiLoading ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>{isAiLoading ? 'Classificando com IA...' : '✨ Categorizar com IA (Gemini)'}</span>
                  </button>
                )}
              </div>

              {/* TAB 1: REVISÃO DE COMPRAS (TABELA INTERATIVA) */}
              {activeTab === 'review' && (
                <div className="space-y-3">
                  {/* Filters & Search */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="flex items-center space-x-1.5 w-full sm:w-auto">
                      <button
                        onClick={() => setFilterType('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          filterType === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Todas ({reviewedItems.length})
                      </button>
                      <button
                        onClick={() => setFilterType('card')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          filterType === 'card' ? 'bg-purple-600/30 text-purple-300 font-bold border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Cartão ({reviewedItems.filter(i => i.isCard).length})
                      </button>
                      <button
                        onClick={() => setFilterType('uncategorized')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          filterType === 'uncategorized' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Sem categoria ({reviewedItems.filter(i => i.category === 'outros').length})
                      </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Buscar por loja..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Table of items */}
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60 max-h-72 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-900/90 sticky top-0 border-b border-slate-800 z-10 text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
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
                      <tbody className="divide-y divide-slate-850">
                        {filteredItems.map(item => {
                          const catObj = categories.find(c => c.id === item.category)
                          return (
                            <tr key={item.id} className="hover:bg-slate-800/30 transition">
                              <td className="py-2 px-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                                {item.date.split('-').reverse().slice(0, 2).join('/')}
                              </td>
                              <td className="py-2 px-3 text-slate-200 font-medium">
                                <div className="flex items-center space-x-1.5">
                                  <span>{item.description}</span>
                                  {item.aiCategorized && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold shrink-0">
                                      IA
                                    </span>
                                  )}
                                  {item.isCard && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 shrink-0">
                                      Crédito
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold whitespace-nowrap">
                                <span className={item.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}>
                                  {item.type === 'expense' ? '-' : '+'}{formatCurrency(item.amount)}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <select
                                  value={item.category}
                                  onChange={e => handleItemCategoryChange(item.id, e.target.value)}
                                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                                  style={{ color: catObj?.color || '#94a3b8' }}
                                >
                                  {categories.map(c => (
                                    <option key={c.id} value={c.id} style={{ color: c.color, backgroundColor: '#0f172a' }}>
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
                                  className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500 cursor-pointer"
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <p className="text-[11px] text-slate-400">
                      💡 Estabelecimentos com <strong>"Lembrar"</strong> ativado são memorizados pelo app e categorizados automaticamente no futuro.
                    </p>

                    <button
                      onClick={handleConfirmImport}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirmar e Lançar {reviewedItems.length} Compras na Planilha</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: RESUMO DE GASTOS & FIXOS DETECTADOS */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">Média Mensal de Gastos</span>
                      <div className="text-xl font-bold text-rose-400 font-mono">
                        {formatCurrency(analysis.averageMonthlyExpense)}
                      </div>
                      <span className="text-[11px] text-slate-500">Baseado no período analisado</span>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
                      <span className="text-xs text-purple-300 block mb-1">Média Diária Calculada</span>
                      <div className="text-xl font-bold text-purple-400 font-mono">
                        {formatCurrency(analysis.averageDailyExpense)}<span className="text-xs text-purple-300 font-normal">/dia</span>
                      </div>
                      <span className="text-[11px] text-purple-300">Pode virar sua meta de gastos</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">Transações Identificadas</span>
                      <div className="text-xl font-bold text-white font-mono">
                        {analysis.transactions.length}
                      </div>
                      <span className="text-[11px] text-slate-500">{analysis.monthsCount} mês(es) analisados</span>
                    </div>
                  </div>

                  {/* Recurring expenses detected */}
                  {analysis.detectedRecurring.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Contas Fixas & Assinaturas Detectadas Automaticamente:</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                        {analysis.detectedRecurring.map(item => (
                          <div key={item.id} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex justify-between items-center">
                            <div>
                              <span className="text-slate-200 font-medium block">{item.description}</span>
                              <span className="text-slate-500">Todo dia ~{item.dayOfMonth}</span>
                            </div>
                            <span className="font-semibold text-rose-400 font-mono">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={handleApplyAll}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center space-x-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
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
