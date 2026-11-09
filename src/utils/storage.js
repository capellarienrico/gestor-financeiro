import { DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from './categories'

const STORAGE_KEY = 'gestor_financeiro_data_v1'

const todayIso = new Date().toISOString().substring(0, 10)

export const DEFAULT_DATA = {
  currentBalance: 155000,
  dailyBudgetGoal: 120,
  startingPoint: {
    date: todayIso,
    balance: 155000
  },
  categories: DEFAULT_CATEGORIES,
  incomeCategories: DEFAULT_INCOME_CATEGORIES,
  transactions: [
    {
      id: 'tx-1',
      date: todayIso,
      description: 'Supermercado da semana',
      amount: 285.50,
      type: 'expense',
      category: 'alimentacao',
      source: 'Pix'
    },
    {
      id: 'tx-2',
      date: todayIso,
      description: 'Farmácia',
      amount: 45.90,
      type: 'expense',
      category: 'saude',
      source: 'Cartão'
    }
  ],
  recurringExpenses: [
    { id: 'rec-exp-1', description: 'Financiamento Imobiliário', amount: 3200, dayOfMonth: 10, category: 'moradia' },
    { id: 'rec-exp-2', description: 'Condomínio', amount: 850, dayOfMonth: 5, category: 'moradia' },
    { id: 'rec-exp-3', description: 'Energia Elétrica & Gás', amount: 280, dayOfMonth: 15, category: 'moradia' },
    { id: 'rec-exp-4', description: 'Internet Fibra', amount: 130, dayOfMonth: 20, category: 'servicos' },
    { id: 'rec-exp-5', description: 'Plano de Saúde / Seguro', amount: 650, dayOfMonth: 8, category: 'saude' },
    { id: 'rec-exp-6', description: 'Assinaturas (Netflix, Spotify)', amount: 95, dayOfMonth: 12, category: 'lazer' },
  ],
  recurringIncomes: [
    {
      id: 'rec-inc-1',
      description: 'Seguro-Desemprego (Parcela Teto)',
      amount: 2400,
      dayOfMonth: 10,
      category: 'seguro',
      totalInstallments: 5,
      remainingInstallments: 5
    },
    {
      id: 'rec-inc-2',
      description: 'Rendimento Líquido Aplicações (100% CDI)',
      amount: 1300,
      dayOfMonth: 30,
      category: 'rendimentos',
      totalInstallments: null,
      remainingInstallments: null
    }
  ],
  budgets: {
    moradia: 4500,
    alimentacao: 2500,
    transporte: 800,
    saude: 800,
    lazer: 400,
    servicos: 300,
    pessoal: 500,
    outros: 400
  }
}

export function loadFinancialData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const startingPoint = parsed.startingPoint || {
        date: todayIso,
        balance: parsed.currentBalance || 155000
      }

      return {
        ...DEFAULT_DATA,
        ...parsed,
        startingPoint,
        categories: parsed.categories && parsed.categories.length ? parsed.categories : DEFAULT_CATEGORIES,
        incomeCategories: parsed.incomeCategories && parsed.incomeCategories.length ? parsed.incomeCategories : DEFAULT_INCOME_CATEGORIES
      }
    }
  } catch (err) {
    console.error('Erro ao ler localStorage:', err)
  }
  return DEFAULT_DATA
}

export function saveFinancialData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err)
  }
}

export function exportBackup(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `backup-financas-${new Date().toISOString().substring(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importBackup(file, onSuccess, onError) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result)
      if (!parsed || typeof parsed !== 'object') throw new Error('Formato inválido')
      onSuccess(parsed)
    } catch (err) {
      onError(err.message || 'Erro ao carregar arquivo de backup')
    }
  }
  reader.onerror = () => onError('Erro na leitura do arquivo')
  reader.readAsText(file)
}

export function resetToDefaults() {
  localStorage.removeItem(STORAGE_KEY)
  return DEFAULT_DATA
}
