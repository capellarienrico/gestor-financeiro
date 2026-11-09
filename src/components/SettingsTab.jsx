import React, { useState } from 'react'
import {
  Settings,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Download,
  UploadCloud,
  Palette,
  ShieldCheck
} from 'lucide-react'
import { importBackup } from '../utils/storage'

export function SettingsTab({
  categories,
  incomeCategories,
  onUpdateCategories,
  onUpdateIncomeCategories,
  currentBalance,
  onUpdateBalance,
  dailyBudgetGoal,
  onUpdateDailyGoal,
  onExportBackup,
  onRestoreBackup,
  onResetData
}) {
  // New category state
  const [activeSubTab, setActiveSubTab] = useState('expenses') // 'expenses' | 'incomes' | 'general'
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#3b82f6')

  // Edit category modal/state
  const [editingCat, setEditingCat] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const PRESET_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1',
    '#14b8a6', '#f97316', '#84cc16', '#64748b'
  ]

  // Add category
  const handleAddCategory = (e) => {
    e.preventDefault()
    if (!newCatName.trim()) return

    const id = newCatName.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '_' + Date.now().toString(36)
    const newCat = {
      id,
      name: newCatName.trim(),
      color: newCatColor,
      bg: `bg-[${newCatColor}]/10 text-[${newCatColor}] border-[${newCatColor}]/20`
    }

    if (activeSubTab === 'expenses') {
      onUpdateCategories([...categories, newCat])
    } else {
      onUpdateIncomeCategories([...incomeCategories, newCat])
    }

    setNewCatName('')
  }

  // Edit category
  const handleStartEdit = (cat) => {
    setEditingCat(cat)
    setEditName(cat.name)
    setEditColor(cat.color || '#3b82f6')
  }

  const handleSaveEdit = () => {
    if (!editName.trim() || !editingCat) return

    const updated = {
      ...editingCat,
      name: editName.trim(),
      color: editColor
    }

    if (activeSubTab === 'expenses') {
      onUpdateCategories(categories.map(c => c.id === editingCat.id ? updated : c))
    } else {
      onUpdateIncomeCategories(incomeCategories.map(c => c.id === editingCat.id ? updated : c))
    }

    setEditingCat(null)
  }

  // Delete category
  const handleDeleteCategory = (catId) => {
    if (confirm('Deseja realmente remover esta categoria?')) {
      if (activeSubTab === 'expenses') {
        onUpdateCategories(categories.filter(c => c.id !== catId))
      } else {
        onUpdateIncomeCategories(incomeCategories.filter(c => c.id !== catId))
      }
    }
  }

  // File import for backup
  const handleFileImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    importBackup(
      file,
      (data) => {
        onRestoreBackup(data)
        alert('Backup restaurado com sucesso!')
      },
      (err) => alert('Erro ao carregar arquivo de backup: ' + err)
    )
  }

  const currentList = activeSubTab === 'expenses' ? categories : incomeCategories

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Configurações & Categorias</h2>
          <p className="text-xs text-slate-400">
            Personalize suas categorias de despesas e receitas, gerencie backups e dados do sistema.
          </p>
        </div>
      </div>

      {/* Navigation SubTabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'expenses'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Categorias de Despesas ({categories.length})
        </button>
        <button
          onClick={() => setActiveSubTab('incomes')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'incomes'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Categorias de Entradas ({incomeCategories.length})
        </button>
        <button
          onClick={() => setActiveSubTab('general')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'general'
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Backup & Sistema
        </button>
      </div>

      {/* SubTab: Categories Management */}
      {(activeSubTab === 'expenses' || activeSubTab === 'incomes') && (
        <div className="space-y-6">
          {/* Adicionar Categoria Form */}
          <form onSubmit={handleAddCategory} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Adicionar Nova Categoria de {activeSubTab === 'expenses' ? 'Despesa' : 'Entrada'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400 block mb-1">Nome da Categoria:</label>
                <input
                  type="text"
                  placeholder="Ex: Pets, Investimentos, Delivery, Bicos..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Cor Identificadora:</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={e => setNewCatColor(e.target.value)}
                    className="w-10 h-10 rounded-lg bg-transparent border border-slate-800 cursor-pointer"
                  />
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shadow-lg shadow-emerald-600/20"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Cores Pré-definidas Rápidas */}
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-[11px] text-slate-500">Cores sugeridas:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCatColor(c)}
                    className="w-5 h-5 rounded-full border border-slate-700 transition hover:scale-110 cursor-pointer"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </form>

          {/* Lista de Categorias Atuais */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Categorias Cadastradas ({currentList.length})
              </span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {currentList.map(cat => (
                <div key={cat.id} className="p-3.5 flex items-center justify-between hover:bg-slate-800/20 transition">
                  {editingCat?.id === cat.id ? (
                    <div className="flex-1 flex items-center space-x-2 mr-3">
                      <input
                        type="color"
                        value={editColor}
                        onChange={e => setEditColor(e.target.value)}
                        className="w-8 h-8 rounded bg-transparent border border-slate-700 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs"
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                        title="Salvar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingCat(null)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title="Cancelar"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: cat.color || '#64748b' }}
                      />
                      <span className="text-sm font-medium text-slate-200">{cat.name}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleStartEdit(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      title="Editar categoria"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Excluir categoria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SubTab: Backup & Sistema */}
      {activeSubTab === 'general' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exportar Backup */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Download className="w-5 h-5" />
                <h4 className="font-semibold text-white text-sm">Exportar Backup</h4>
              </div>
              <p className="text-xs text-slate-400">
                Gere um arquivo `.json` com todos os seus lançamentos, contas fixas, saldo e categorias salvas.
              </p>
              <button
                onClick={onExportBackup}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-700 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Backup (.json)</span>
              </button>
            </div>

            {/* Importar Backup */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <UploadCloud className="w-5 h-5" />
                <h4 className="font-semibold text-white text-sm">Restaurar Backup</h4>
              </div>
              <p className="text-xs text-slate-400">
                Restaure um arquivo `.json` salvo anteriormente para recuperar seus dados.
              </p>
              <label className="w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer">
                <UploadCloud className="w-4 h-4" />
                <span>Carregar Arquivo .json</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileImport}
                />
              </label>
            </div>
          </div>

          {/* Resetar Dados */}
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-center space-x-2 text-rose-400">
              <RotateCcw className="w-5 h-5" />
              <h4 className="font-semibold text-white text-sm">Restaurar Padrões de Fábrica</h4>
            </div>
            <p className="text-xs text-slate-300">
              Isso apagará os lançamentos atuais e restaurará os dados padrões de transição pós-demissão (R$ 155.000 de saldo, Seguro-Desemprego e contas fixas recomendadas).
            </p>
            <button
              onClick={onResetData}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition cursor-pointer shadow-lg shadow-rose-600/20"
            >
              Restaurar Dados Padrões
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
