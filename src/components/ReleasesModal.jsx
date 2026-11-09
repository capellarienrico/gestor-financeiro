import React, { useState } from 'react'
import {
  X,
  Sparkles,
  Download,
  ExternalLink,
  Tag,
  CheckCircle2,
  Smartphone,
  CreditCard,
  Cloud,
  Layers,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { RELEASES } from '../data/releases'

export function ReleasesModal({ isOpen, onClose }) {
  const [selectedVersion, setSelectedVersion] = useState(RELEASES[0]?.version || '1.0.0')

  if (!isOpen) return null

  const currentRelease = RELEASES.find(r => r.version === selectedVersion) || RELEASES[0]

  const getCategoryIcon = (type) => {
    switch (type) {
      case 'feature':
        return <Layers className="w-4 h-4 text-emerald-400" />
      case 'card':
        return <CreditCard className="w-4 h-4 text-purple-400" />
      case 'ai':
        return <Sparkles className="w-4 h-4 text-amber-400" />
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-cyan-400" />
      case 'cloud':
        return <Cloud className="w-4 h-4 text-blue-400" />
      default:
        return <Tag className="w-4 h-4 text-slate-400" />
    }
  }

  const getCategoryBadgeColor = (type) => {
    switch (type) {
      case 'feature':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'card':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'ai':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'mobile':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
      case 'cloud':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Notas de Atualização & Versões</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Começa na v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Acompanhe o histórico de novidades, correções e versões disponíveis para download.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Version Selector Tabs if multiple */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto">
            {RELEASES.map(rel => (
              <button
                key={rel.version}
                onClick={() => setSelectedVersion(rel.version)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition cursor-pointer ${
                  selectedVersion === rel.version
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>v{rel.version}</span>
                {rel.isLatest && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                    selectedVersion === rel.version ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    Atual
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active Release Card */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                    v{currentRelease.version}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                    Lançamento Oficial
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mt-1">
                  {currentRelease.name}
                </h4>
                <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Lançado em {currentRelease.date}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                {currentRelease.apkDownloadUrl && (
                  <a
                    href={currentRelease.apkDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar APK (Android)</span>
                  </a>
                )}
                {currentRelease.githubReleaseUrl && (
                  <a
                    href={currentRelease.githubReleaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ver no GitHub</span>
                  </a>
                )}
              </div>
            </div>

            {/* Tagline */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              "{currentRelease.tagline}"
            </p>

            {/* Feature Categories */}
            <div className="space-y-4 pt-1">
              {currentRelease.categories.map((cat, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-slate-800/80">
                      {getCategoryIcon(cat.type)}
                    </div>
                    <h5 className="text-xs sm:text-sm font-bold text-white">
                      {cat.title}
                    </h5>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getCategoryBadgeColor(cat.type)}`}>
                      {cat.type.toUpperCase()}
                    </span>
                  </div>

                  <ul className="space-y-1.5 pl-2 sm:pl-7">
                    {cat.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start space-x-2 text-xs text-slate-300 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Versão em execução: <strong className="text-white font-mono">v1.0.0</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
