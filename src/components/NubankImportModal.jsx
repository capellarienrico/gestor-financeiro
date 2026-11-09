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
  CreditCard
} from 'lucide-react'
import { parseFinancialFile } from '../utils/bankStatementParser'
import { formatCurrency } from '../utils/financialMath'
import { CATEGORIES } from '../utils/categories'

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
  onImportTransactions
}) {
  const [file, setFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  if (!isOpen) return null

  const handleProcessFile = (uploadedFile) => {
    setError('')
    setFile(uploadedFile)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target.result
        const result = parseFinancialFile(content, uploadedFile.name)
        if (!result.transactions || !result.transactions.length) {
          setError('Nenhuma transação válida encontrada no arquivo. Verifique se é um arquivo .OFX ou .CSV de extrato ou fatura bancária.')
          return
        }
        setAnalysis(result)
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

  const handleApplyAll = () => {
    if (!analysis) return
    onApplyNubankAnalysis(analysis)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Importar Extrato Bancário (Nubank, Itaú, Inter, Bradesco, OFX, CSV)</h3>
              <p className="text-xs text-slate-400">Analise seus gastos reais, descubra contas fixas e alimente sua planilha automaticamente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Suporte Multi-Bancos Chips */}
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

          {/* 100% Seguro e Privado Callout */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-semibold text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Seguro e Privado: Processamento Local no seu Navegador</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Aceita qualquer arquivo <strong>.OFX</strong> ou <strong>.CSV</strong> de bancos brasileiros (Itaú, Bradesco, Santander, Banco do Brasil, Inter, C6, BTG, Nubank, Caixa). O processamento ocorre <strong className="text-white">100% no seu computador</strong>, sem intermediários, sem enviar seus dados bancários para a internet e sem expor senhas.
            </p>
          </div>

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
                Arraste seu arquivo .OFX ou .CSV de qualquer banco aqui
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Suporta extrato de conta corrente, poupança e faturas de cartão de crédito (.ofx ou .csv)
              </p>

              <label className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer transition shadow-lg shadow-purple-600/20">
                <UploadCloud className="w-4 h-4" />
                <span>Escolher Arquivo do Computador (.OFX ou .CSV)</span>
                <input
                  type="file"
                  accept=".csv,.ofx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
                />
              </label>

              {/* Guia Rápido de como baixar nos apps bancários */}
              <div className="mt-6 pt-6 border-t border-slate-800/80 text-left text-xs text-slate-400 space-y-1.5">
                <span className="font-semibold text-slate-300 block mb-1">Como baixar no seu banco:</span>
                <p>• <strong>Nubank:</strong> App Nubank &gt; Cartão de Crédito ou Conta &gt; Baixar fatura ou Pedir extrato &gt; CSV ou OFX.</p>
                <p>• <strong>Itaú, Bradesco, Santander, BB:</strong> Internet Banking ou App &gt; Extrato &gt; Exportar/Salvar em OFX (Money) ou CSV.</p>
                <p>• <strong>Inter, C6 Bank, BTG:</strong> Menu Extrato &gt; Exportar período &gt; OFX ou CSV.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Analysis Results View */}
          {analysis && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-sm font-bold text-white block">Arquivo Analisado com Sucesso!</span>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                        🏦 {analysis.detectedBank || 'Banco Brasileiro'}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        📄 {analysis.detectedFormat || 'Extrato Bancário'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setAnalysis(null); setFile(null); }}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Trocar arquivo
                </button>
              </div>

              {/* Metric Highlights */}
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

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={handleApplyAll}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aplicar Médias & Fixos no Meu Planejamento</span>
                </button>
                <button
                  onClick={() => {
                    onImportTransactions(analysis.transactions)
                    onClose()
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition cursor-pointer"
                >
                  Importar apenas os {analysis.transactions.length} lançamentos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
