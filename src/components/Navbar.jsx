import React from 'react'
import {
  Wallet,
  UploadCloud,
  TrendingUp,
  Sparkles,
  FileSpreadsheet,
  CalendarCheck,
  Settings,
  Cloud
} from 'lucide-react'

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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo & Saldo */}
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div
                className="flex items-center space-x-2.5 cursor-pointer select-none active:scale-95 transition-transform"
                onClick={() => setActiveTab('spreadsheet')}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 shrink-0">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-sm sm:text-base text-white tracking-tight">Finanças & Runway</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenReleasesModal?.()
                      }}
                      className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition cursor-pointer active:scale-95 shadow-sm"
                      title="Ver notas de lançamento da versão 1.0.0"
                    >
                      v1.0.0
                    </button>
                  </div>
                  <span className="hidden sm:inline-block text-[10px] text-slate-400 font-medium">
                    Projeção Ativa & Saldo Real
                  </span>
                </div>
              </div>

              {/* Quick Balance Editor (Desktop) */}
              <div className="hidden lg:flex items-center space-x-2 bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5">
                <span className="text-xs text-slate-400 font-medium">Saldo:</span>
                <input
                  type="number"
                  value={currentBalance}
                  onChange={e => onUpdateBalance(parseFloat(e.target.value) || 0)}
                  className="w-28 bg-transparent text-emerald-400 font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1 font-mono"
                  title="Clique para editar seu saldo total líquido"
                />
              </div>
            </div>

            {/* Quick Actions (Mobile-Optimized) */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {/* Google Drive Status Button */}
              <button
                onClick={onOpenDriveModal}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition cursor-pointer border active:scale-95 ${
                  googleUser
                    ? 'bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-slate-200'
                    : 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30 text-blue-300'
                }`}
                title="Gerenciar sincronização com Google Drive"
              >
                {googleUser ? (
                  <>
                    {googleUser.picture ? (
                      <img src={googleUser.picture} alt="" className="w-4 h-4 rounded-full" />
                    ) : (
                      <Cloud className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="hidden md:inline font-medium">{googleUser.name ? googleUser.name.split(' ')[0] : 'Nuvem'}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Sincronizado na nuvem"></span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 text-blue-400" />
                    <span className="hidden sm:inline">Conectar</span>
                    <span className="sm:hidden text-[11px]">Drive</span>
                  </>
                )}
              </button>

              {/* Import Button */}
              <button
                onClick={onOpenNubankModal}
                title="Importar Extrato Bancário (Nubank, Itaú, Inter, Bradesco, OFX, CSV)"
                className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs sm:text-sm transition shadow-lg shadow-purple-600/20 cursor-pointer active:scale-95"
              >
                <UploadCloud className="w-4 h-4" />
                <span className="hidden sm:inline">Importar Extrato</span>
                <span className="sm:hidden text-[11px]">Extrato</span>
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
