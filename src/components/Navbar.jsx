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
  X,
  Plus
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
  onOpenReleasesModal,
  onOpenQuickExpense
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

  const desktopTabs = [
    { id: 'spreadsheet', label: 'Planilha', fullLabel: 'Planilha Mensal', icon: FileSpreadsheet },
    { id: 'overview', label: 'Visão Geral', fullLabel: 'Visão Geral & Runway', icon: TrendingUp },
    { id: 'forecast', label: 'Simulador', fullLabel: 'Simulador Diário', icon: Sparkles },
    { id: 'recurring', label: 'Fixos', fullLabel: 'Recorrentes & Fixos', icon: CalendarCheck },
    { id: 'settings', label: 'Ajustes', fullLabel: 'Configurações', icon: Settings },
  ]

  return (
    <>
      {/* Top Header */}
      <header className="border-b border-stone-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-40 text-stone-900">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            {/* Logo & Versão */}
            <div className="flex items-center space-x-2 shrink-0">
              <div
                className="flex items-center space-x-2 cursor-pointer select-none active:scale-95 transition-transform"
                onClick={() => setActiveTab('spreadsheet')}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-600/25 shrink-0">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-sm sm:text-base text-stone-900 tracking-tight">
                      Finanças
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenReleasesModal?.()
                      }}
                      className="px-1.5 py-0.2 text-[9px] sm:text-[10px] font-mono font-bold rounded-full bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition cursor-pointer active:scale-95"
                      title="Ver notas de lançamento da versão 1.0.0"
                    >
                      v1.0.0
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Balance Pill */}
            <div className="flex-1 max-w-[190px] sm:max-w-xs flex justify-center">
              {isEditingBalance ? (
                <form onSubmit={handleSaveBalance} className="flex items-center space-x-1 bg-white border-2 border-orange-500 rounded-xl px-2 py-1 shadow-lg">
                  <span className="text-[10px] text-stone-400 font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    autoFocus
                    value={tempBalance}
                    onChange={e => setTempBalance(e.target.value)}
                    className="w-20 sm:w-28 bg-transparent text-stone-900 font-bold text-xs sm:text-sm focus:outline-none font-mono"
                  />
                  <button type="submit" className="p-1 rounded bg-orange-600 text-white hover:bg-orange-500">
                    <Check className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => setIsEditingBalance(false)} className="p-1 rounded bg-stone-100 text-stone-500 hover:text-stone-900">
                    <X className="w-3 h-3" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={handleStartEditBalance}
                  className="flex items-center space-x-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200/90 rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 transition cursor-pointer group shadow-xs"
                  title="Toque para editar seu saldo total"
                >
                  <span className="text-[10px] sm:text-xs text-stone-500 font-medium">Saldo:</span>
                  <span className="text-stone-900 font-extrabold font-mono text-xs sm:text-sm group-hover:text-orange-600 transition-colors">
                    {formatCurrency(currentBalance)}
                  </span>
                  <span className="text-[9px] text-stone-400 sm:inline hidden">✎</span>
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              {/* Desktop "+ Lançamento" Button */}
              <button
                type="button"
                onClick={onOpenQuickExpense}
                className="hidden md:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition shadow-sm shadow-orange-600/20 active:scale-95 cursor-pointer"
                title="Lançamento Rápido (Atalho: Tecla N)"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Novo Lançamento</span>
              </button>

              {/* Google Drive Status Button */}
              <button
                onClick={onOpenDriveModal}
                className={`flex items-center space-x-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl font-medium text-xs sm:text-sm transition cursor-pointer border active:scale-95 ${
                  googleUser
                    ? 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-600'
                }`}
                title={googleUser ? `Google Drive conectado (${googleUser.email || googleUser.name})` : "Conectar Google Drive"}
              >
                {googleUser ? (
                  <>
                    {googleUser.picture ? (
                      <img src={googleUser.picture} alt="" className="w-4 h-4 rounded-full" />
                    ) : (
                      <Cloud className="w-4 h-4 text-emerald-600" />
                    )}
                    <span className="hidden md:inline font-medium text-xs">{googleUser.name ? googleUser.name.split(' ')[0] : 'Nuvem'}</span>
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" title="Sincronizado na nuvem"></span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 text-stone-500" />
                    <span className="hidden sm:inline text-xs">Drive</span>
                  </>
                )}
              </button>

              {/* Import Button */}
              <button
                onClick={onOpenNubankModal}
                title="Importar Extrato Bancário (Nubank, Itaú, Inter, Bradesco, OFX, CSV)"
                className="flex items-center space-x-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs sm:text-sm transition shadow-sm cursor-pointer active:scale-95"
              >
                <UploadCloud className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Importar</span>
              </button>
            </div>
          </div>

          {/* Tab navigation (Desktop/Tablet) */}
          <div className="hidden md:flex space-x-1 border-t border-stone-100 pt-1 -mb-px overflow-x-auto">
            {desktopTabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2.5 px-3.5 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'border-orange-600 text-orange-600 bg-orange-50/40 font-semibold'
                      : 'border-transparent text-stone-500 hover:text-stone-900 hover:border-stone-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-stone-400'}`} />
                  <span>{tab.fullLabel}</span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Fixed Mobile Bottom Navigation Bar com Hero Center Button */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200/90 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)] text-stone-900">
        <div className="grid grid-cols-5 h-16 items-center">
          {/* 1. Planilha */}
          <button
            onClick={() => setActiveTab('spreadsheet')}
            className={`flex flex-col items-center justify-center space-y-1 relative transition-colors cursor-pointer select-none ${
              activeTab === 'spreadsheet' ? 'text-orange-600 font-bold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {activeTab === 'spreadsheet' && (
              <span className="absolute top-0 w-8 h-1 rounded-full bg-orange-600" />
            )}
            <FileSpreadsheet className={`w-5 h-5 ${activeTab === 'spreadsheet' ? 'text-orange-600' : 'text-stone-400'}`} />
            <span className="text-[10px] tracking-tight">Planilha</span>
          </button>

          {/* 2. Visão Geral */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center justify-center space-y-1 relative transition-colors cursor-pointer select-none ${
              activeTab === 'overview' ? 'text-orange-600 font-bold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {activeTab === 'overview' && (
              <span className="absolute top-0 w-8 h-1 rounded-full bg-orange-600" />
            )}
            <TrendingUp className={`w-5 h-5 ${activeTab === 'overview' ? 'text-orange-600' : 'text-stone-400'}`} />
            <span className="text-[10px] tracking-tight">Visão Geral</span>
          </button>

          {/* 3. HERO CENTER '+' BUTTON (Elevado e em Grande Destaque) */}
          <div className="flex items-center justify-center relative">
            <button
              type="button"
              onClick={onOpenQuickExpense}
              className="w-13 h-13 -mt-6 rounded-full bg-orange-600 hover:bg-orange-500 text-white shadow-xl shadow-orange-600/35 border-4 border-[#f8f7f4] flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
              title="Lançamento Rápido em 1 Toque"
            >
              <Plus className="w-6 h-6 text-white stroke-[2.5]" />
            </button>
          </div>

          {/* 4. Fixos */}
          <button
            onClick={() => setActiveTab('recurring')}
            className={`flex flex-col items-center justify-center space-y-1 relative transition-colors cursor-pointer select-none ${
              activeTab === 'recurring' ? 'text-orange-600 font-bold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {activeTab === 'recurring' && (
              <span className="absolute top-0 w-8 h-1 rounded-full bg-orange-600" />
            )}
            <CalendarCheck className={`w-5 h-5 ${activeTab === 'recurring' ? 'text-orange-600' : 'text-stone-400'}`} />
            <span className="text-[10px] tracking-tight">Fixos</span>
          </button>

          {/* 5. Ajustes */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center space-y-1 relative transition-colors cursor-pointer select-none ${
              activeTab === 'settings' ? 'text-orange-600 font-bold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {activeTab === 'settings' && (
              <span className="absolute top-0 w-8 h-1 rounded-full bg-orange-600" />
            )}
            <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'text-orange-600' : 'text-stone-400'}`} />
            <span className="text-[10px] tracking-tight">Ajustes</span>
          </button>
        </div>
      </nav>
    </>
  )
}
