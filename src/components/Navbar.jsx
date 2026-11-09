import React from 'react'
import { Wallet, UploadCloud, Download, RotateCcw, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react'
import { formatCurrency } from '../utils/financialMath'

export function Navbar({
  currentBalance,
  onUpdateBalance,
  activeTab,
  setActiveTab,
  onOpenNubankModal,
  onExportBackup,
  onResetData
}) {
  const tabs = [
    { id: 'overview', label: 'Visão Geral & Previsão', icon: TrendingUp },
    { id: 'forecast', label: 'Assistente & Simulador Diário', icon: Sparkles },
    { id: 'daily', label: 'Gastos & Entradas', icon: Wallet },
    { id: 'recurring', label: 'Recorrentes & Seguro', icon: ShieldCheck },
  ]

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Saldo */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
                <Wallet className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <span className="font-bold text-lg text-white tracking-tight">Finanças & Runway</span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Transição & Pós-Demissão
                </span>
              </div>
            </div>

            {/* Quick Balance Editor */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5">
              <span className="text-xs text-slate-400 font-medium">Saldo Atual:</span>
              <input
                type="number"
                value={currentBalance}
                onChange={e => onUpdateBalance(parseFloat(e.target.value) || 0)}
                className="w-28 bg-transparent text-emerald-400 font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1"
                title="Clique para editar seu saldo total líquido"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenNubankModal}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs sm:text-sm transition shadow-lg shadow-purple-600/20 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Importar Nubank (CSV/OFX)</span>
            </button>

            <button
              onClick={onExportBackup}
              title="Baixar backup dos dados"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onResetData}
              title="Resetar dados aos padrões"
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex space-x-1 border-t border-slate-800/60 pt-1 -mb-px overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
