import React, { useState } from 'react'
import {
  Wallet,
  UploadCloud,
  TrendingUp,
  Sparkles,
  FileSpreadsheet,
  CalendarCheck,
  Settings,
  Cloud,
  Check,
  X
} from 'lucide-react'
import { formatCurrency } from '../utils/financialMath'

export function Navbar({
  currentBalance,
  onUpdateBalance,
  activeTab,
  setActiveTab,
  onOpenNubankModal,
  googleUser,
  isSyncing,
  onOpenDriveModal,
  onOpenReleasesModal
}) {
  const [isEditingBalance, setIsEditingBalance] = useState(false)
  const [tempBalance, setTempBalance] = useState('')

  const handleStartEditBalance = () => {
    setTempBalance(currentBalance.toString())
    setIsEditingBalance(true)
  }

  const handleSaveBalance = (e) => {
    e?.preventDefault()
    const val = parseFloat(tempBalance)
    if (!isNaN(val)) {
      onUpdateBalance(val)
    }
    setIsEditingBalance(false)
  }

  const tabs = [
    { id: 'spreadsheet', label: 'Planilha', fullLabel: 'Planilha Mensal', icon: FileSpreadsheet, badge: 'Principal' },
    { id: 'overview', label: 'Visão Geral', fullLabel: 'Visão Geral & Runway', icon: TrendingUp },
    { id: 'forecast', label: 'Simulador', fullLabel: 'Simulador Diário', icon: Sparkles },
    { id: 'recurring', label: 'Fixos', fullLabel: 'Recorrentes & Fixos', icon: CalendarCheck },
    { id: 'settings', label: 'Ajustes', fullLabel: 'Configurações', icon: Settings },
  ]

  return (
    <>
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-13 sm:h-16 gap-1.5 sm:gap-4">
            {/* Logo & Versão */}
            <div className="flex items-center space-x-2 shrink-0">
              <div
                className="flex items-center space-x-2 cursor-pointer select-none active:scale-95 transition-transform"
                onClick={() => setActiveTab('spreadsheet')}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 shrink-0">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center space-x-1 sm:space-x-1.5">
                    <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                      Finanças
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenReleasesModal?.()
                      }}
                      className="px-1.5 py-0.2 text-[9px] sm:text-[10px] font-mono font-bold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition cursor-pointer active:scale-95 shadow-sm"
                      title="Ver notas de lançamento da versão 1.0.0"
                    >
                      v1.0.0
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Balance Pill (Visível no Celular e Desktop) */}
            <div className="flex-1 max-w-[200px] sm:max-w-xs flex justify-center">
              {isEditingBalance ? (
                <form onSubmit={handleSaveBalance} className="flex items-center space-x-1 bg-slate-950 border border-emerald-500/50 rounded-xl px-2 py-1 shadow-lg">
                  <span className="text-[10px] text-slate-400 font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    autoFocus
                    value={tempBalance}
                    onChange={e => setTempBalance(e.target.value)}
                    className="w-20 sm:w-28 bg-transparent text-emerald-400 font-bold text-xs sm:text-sm focus:outline-none font-mono"
                  />
                  <button type="submit" className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500">
                    <Check className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => setIsEditingBalance(false)} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={handleStartEditBalance}
                  className="flex items-center space-x-1.5 bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 transition cursor-pointer group"
                  title="Toque para editar seu saldo total"
                >
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Saldo:</span>
                  <span className="text-emerald-400 font-bold font-mono text-xs sm:text-sm group-hover:underline">
                    {formatCurrency(currentBalance)}
                  </span>
                  <span className="text-[9px] text-slate-500 sm:inline hidden">✎</span>
                </button>
              )}
            </div>

            {/* Quick Actions (Mobile-Optimized) */}
            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
              {/* Google Drive Status Button */}
              <button
                onClick={onOpenDriveModal}
                className={`flex items-center space-x-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl font-medium text-xs sm:text-sm transition cursor-pointer border active:scale-95 ${
                  googleUser
                    ? 'bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-slate-200'
                    : 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30 text-blue-300'
                }`}
                title={googleUser ? `Google Drive sincronizado (${googleUser.email || googleUser.name})` : "Conectar Google Drive"}
              >
                {googleUser ? (
                  <>
                    {googleUser.picture ? (
                      <img src={googleUser.picture} alt="" className="w-4 h-4 rounded-full" />
                    ) : (
                      <Cloud className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="hidden md:inline font-medium">{googleUser.name ? googleUser.name.split(' ')[0] : 'Nuvem'}</span>
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" title="Sincronizado na nuvem"></span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 text-blue-400" />
                    <span className="hidden sm:inline">Drive</span>
                  </>
                )}
              </button>

              {/* Import Button */}
              <button
                onClick={onOpenNubankModal}
                title="Importar Extrato Bancário (Nubank, Itaú, Inter, Bradesco, OFX, CSV)"
                className="flex items-center space-x-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs sm:text-sm transition shadow-lg shadow-purple-600/20 cursor-pointer active:scale-95"
              >
                <UploadCloud className="w-4 h-4" />
                <span className="hidden sm:inline">Importar</span>
              </button>
            </div>
          </div>

          {/* Tab navigation (Desktop/Tablet) */}
          <div className="hidden md:flex space-x-1 border-t border-slate-800/60 pt-1 -mb-px overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2.5 px-3.5 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{tab.fullLabel}</span>
                  {tab.badge && (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Fixed Mobile Bottom Navigation Bar (Dock Nativo Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 pb-safe shadow-2xl">
        <div className="grid grid-cols-5 h-16">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center space-y-1 relative transition-colors cursor-pointer select-none ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 w-8 h-1 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50" />
                )}
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-emerald-400' : 'text-slate-400'}`} />
                <span className={`text-[10px] tracking-tight ${isActive ? 'font-bold text-emerald-400' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
