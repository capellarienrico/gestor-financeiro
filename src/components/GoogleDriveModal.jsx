import React, { useState } from 'react'
import {
  Cloud,
  CloudCheck,
  RefreshCw,
  LogOut,
  Upload,
  Download,
  ExternalLink,
  Shield,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react'
import { DRIVE_FILENAME } from '../utils/googleDriveService'

export function GoogleDriveModal({
  isOpen,
  onClose,
  googleUser,
  isSyncing,
  lastSyncTime,
  syncError,
  fileId,
  onLogin,
  onLogout,
  onForceUpload,
  onForceDownload
}) {
  const [successMsg, setSuccessMsg] = useState('')

  if (!isOpen) return null

  const handleAction = async (fn, msg) => {
    try {
      setSuccessMsg('')
      await fn()
      setSuccessMsg(msg)
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch {
      // handled by parent error state
    }
  }

  const formatLastSync = (isoString) => {
    if (!isoString) return 'Nunca sincronizado'
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' de ' + d.toLocaleDateString('pt-BR')
    } catch {
      return isoString
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden pb-safe">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-slate-700 mx-auto mt-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Nuvem & Google Drive
                {googleUser && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Ativo
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Seus registros financeiros salvos com privacidade na sua conta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {syncError && (
            <div className="flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Erro na sincronização:</p>
                <p className="text-rose-400/90">{syncError}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!googleUser ? (
            /* Desconectado */
            <div className="text-center py-4 space-y-6">
              <div className="max-w-sm mx-auto space-y-2">
                <h3 className="text-sm font-semibold text-white">Sincronize entre Celular e Computador</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Faça login com a sua conta Google para salvar o arquivo de banco de dados diretamente no seu Google Drive. 
                  Zero custo, sem servidores de terceiros e 100% sob seu controle.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Privacidade Total
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    O app só acessa o arquivo <code className="text-slate-300">{DRIVE_FILENAME}</code> criado por ele mesmo.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
                    <RefreshCw className="w-4 h-4 text-blue-400" />
                    Auto Sync
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Toda alteração que você fizer é sincronizada automaticamente na nuvem.
                  </p>
                </div>
              </div>

              <button
                onClick={onLogin}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition shadow-lg shadow-white/10 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isSyncing ? 'Conectando...' : 'Conectar com Google Drive'}</span>
              </button>
            </div>
          ) : (
            /* Conectado */
            <div className="space-y-5">
              {/* Perfil Conectado */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-3">
                  {googleUser.picture ? (
                    <img
                      src={googleUser.picture}
                      alt={googleUser.name}
                      className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                      {googleUser.name ? googleUser.name.charAt(0) : 'U'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-white">{googleUser.name}</h4>
                    <p className="text-xs text-slate-400">{googleUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Desconectar da conta Google"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>

              {/* Status do Arquivo no Drive */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Arquivo de dados:</span>
                  <span className="font-mono text-slate-200 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
                    {DRIVE_FILENAME}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Última sincronização:</span>
                  <span className="text-slate-300 font-medium">{formatLastSync(lastSyncTime)}</span>
                </div>
                {fileId && (
                  <div className="pt-2 border-t border-slate-800/60 flex justify-end">
                    <a
                      href={`https://drive.google.com/file/d/${fileId}/view`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver arquivo no Google Drive</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Ações de Forçar Sincronização */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAction(onForceUpload, 'Dados locais enviados para o Google Drive!')}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 cursor-pointer disabled:opacity-50"
                  title="Salva seus dados atuais do computador/celular no Google Drive"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Enviar para Nuvem</span>
                </button>

                <button
                  onClick={() => handleAction(onForceDownload, 'Dados baixados do Google Drive com sucesso!')}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 cursor-pointer disabled:opacity-50"
                  title="Substitui os dados locais pelos dados salvos no Google Drive"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Baixar da Nuvem</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 text-center">
                💡 O aplicativo sincroniza automaticamente a cada alteração feita.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
