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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white border border-stone-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-900">Notas de Atualização & Versões</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                  Começa na v1.0
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Acompanhe o histórico de novidades, correções e versões disponíveis para download.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Version Selector Tabs if multiple */}
          <div className="flex items-center space-x-2 border-b border-stone-200 pb-3 overflow-x-auto">
            {RELEASES.map(rel => (
              <button
                key={rel.version}
                onClick={() => setSelectedVersion(rel.version)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition cursor-pointer ${
                  selectedVersion === rel.version
                    ? 'bg-stone-900 text-white shadow-sm font-bold'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                }`}
              >
                <span>v{rel.version}</span>
                {rel.isLatest && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                    selectedVersion === rel.version ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700'
                  }`}>
                    Atual
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active Release Card */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl sm:text-2xl font-black text-stone-900 font-mono tracking-tight">
                    v{currentRelease.version}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    Lançamento Oficial
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-stone-800 mt-1">
                  {currentRelease.name}
                </h4>
                <div className="flex items-center space-x-2 text-xs text-stone-500 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
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
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-sm transition active:scale-95"
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
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-medium text-xs transition shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                    <span>Ver no GitHub</span>
                  </a>
                )}
              </div>
            </div>

            {/* Tagline */}
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
              "{currentRelease.tagline}"
            </p>

            {/* Feature Categories */}
            <div className="space-y-4 pt-1">
              {currentRelease.categories.map((cat, idx) => (
                <div key={idx} className="bg-white border border-stone-200 rounded-xl p-4 space-y-2.5 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-stone-100">
                      {getCategoryIcon(cat.type)}
                    </div>
                    <h5 className="text-xs sm:text-sm font-bold text-stone-900">
                      {cat.title}
                    </h5>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getCategoryBadgeColor(cat.type)}`}>
                      {cat.type.toUpperCase()}
                    </span>
                  </div>

                  <ul className="space-y-1.5 pl-2 sm:pl-7">
                    {cat.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start space-x-2 text-xs text-stone-600 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
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
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Versão em execução: <strong className="text-stone-900 font-mono">v1.0.0</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs border border-stone-200 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
