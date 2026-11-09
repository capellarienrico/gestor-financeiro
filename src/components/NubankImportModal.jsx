import React, { useState } from 'react'
import { X, UploadCloud, FileText, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react'
import { parseFinancialFile } from '../utils/nubankParser'
import { formatCurrency } from '../utils/financialMath'
import { CATEGORIES } from '../utils/categories'

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
        if (!result.transactions.length) {
          setError('Nenhuma transação válida encontrada no arquivo. Verifique se é um CSV de fatura/extrato do Nubank ou arquivo OFX.')
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-6 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Importador Inteligente Nubank (CSV / OFX)</h3>
              <p className="text-xs text-slate-400">Analise seu padrão de gastos real e calcule médias automaticamente</p>
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
          {/* Open Finance vs Extrato Local Explanation */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-semibold text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Seguro e Privado: Por que o extrato em CSV/OFX é ideal?</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              O Open Finance formal do Banco Central exige certificação de instituição bancária ou assinatura paga de agregadores corporativos. Com o arquivo CSV/OFX baixado direto do seu aplicativo Nubank (Conta ou Cartão), o processamento ocorre <strong className="text-white">100% no seu computador</strong>, sem expor suas credenciais e de forma instantânea.
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
                Arraste seu arquivo CSV ou OFX do Nubank aqui
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Suporta fatura do cartão (.csv) ou extrato da conta corrente (.csv ou .ofx)
              </p>

              <label className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer transition shadow-lg shadow-purple-600/20">
                <UploadCloud className="w-4 h-4" />
                <span>Escolher Arquivo do Computador</span>
                <input
                  type="file"
                  accept=".csv,.ofx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
                />
              </label>

              {/* Guia Rápido de como baixar no app Nubank */}
              <div className="mt-6 pt-6 border-t border-slate-800/80 text-left text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block mb-1">Como baixar no seu celular:</span>
                <p>• <strong>Fatura do Cartão:</strong> App Nubank &gt; Cartão de Crédito &gt; Escolha a fatura &gt; Baixar fatura (CSV).</p>
                <p>• <strong>Extrato da Conta:</strong> App Nubank &gt; Conta &gt; Pedir extrato &gt; Escolher período &gt; Formato CSV ou OFX.</p>
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
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Arquivo Analisado com Sucesso!</span>
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
                  <div className="text-xl font-bold text-rose-400">
                    {formatCurrency(analysis.averageMonthlyExpense)}
                  </div>
                  <span className="text-[11px] text-slate-500">Baseado no período analisado</span>
                </div>

                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
                  <span className="text-xs text-purple-300 block mb-1">Média Diária Calculada</span>
                  <div className="text-xl font-bold text-purple-400">
                    {formatCurrency(analysis.averageDailyExpense)}<span className="text-xs text-purple-300 font-normal">/dia</span>
                  </div>
                  <span className="text-[11px] text-purple-300">Pode virar sua meta de gastos</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Transações Processadas</span>
                  <div className="text-xl font-bold text-white">
                    {analysis.transactions.length}
                  </div>
                  <span className="text-[11px] text-slate-500">{analysis.monthsCount} mês(es)</span>
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
                        <span className="font-semibold text-rose-400">{formatCurrency(item.amount)}</span>
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
                  Importar apenas os lançamentos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
