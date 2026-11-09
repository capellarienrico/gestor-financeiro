import { DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from './categories'

const STORAGE_KEY = 'gestor_financeiro_data_v1'

const todayIso = new Date().toISOString().substring(0, 10)

export const DEFAULT_DATA = {
  currentBalance: 30000,
  dailyBudgetGoal: 65,
  startingPoint: {
    date: todayIso,
    balance: 30000
  },
  creditCardSettings: {
    closingDay: 15,
    dueDay: 25
  },
  categories: DEFAULT_CATEGORIES,
  incomeCategories: DEFAULT_INCOME_CATEGORIES,
  transactions: [
    {
      id: 'tx-1',
      date: todayIso,
      description: 'Supermercado da semana',
      amount: 145.20,
      type: 'expense',
      category: 'alimentacao',
      source: 'Pix'
    },
    {
      id: 'tx-2',
      date: todayIso,
      description: 'Farmácia',
      amount: 38.50,
      type: 'expense',
      category: 'saude',
      source: 'Cartão de Crédito'
    }
  ],
  recurringExpenses: [
    { id: 'rec-exp-1', description: 'Aluguel', amount: 1500, dayOfMonth: 10, category: 'moradia' },
    { id: 'rec-exp-2', description: 'Condomínio', amount: 350, dayOfMonth: 10, category: 'moradia' },
    { id: 'rec-exp-3', description: 'Energia Elétrica', amount: 160, dayOfMonth: 15, category: 'moradia' },
    { id: 'rec-exp-4', description: 'Internet Fibra', amount: 120, dayOfMonth: 20, category: 'servicos' },
    { id: 'rec-exp-5', description: 'Plano de Saúde', amount: 380, dayOfMonth: 8, category: 'saude' },
    { id: 'rec-exp-6', description: 'Streaming & Assinaturas', amount: 65, dayOfMonth: 12, category: 'lazer' },
  ],
  recurringIncomes: [
    {
      id: 'rec-inc-1',
      description: 'Salário / Entrada Mensal',
      amount: 5000,
      dayOfMonth: 5,
      category: 'salario',
      totalInstallments: null,
      remainingInstallments: null
    },
    {
      id: 'rec-inc-2',
      description: 'Rendimento Reserva CDI',
      amount: 250,
      dayOfMonth: 30,
      category: 'rendimentos',
      totalInstallments: null,
      remainingInstallments: null
    }
  ],
  budgets: {
    moradia: 2200,
    alimentacao: 1200,
    transporte: 400,
    saude: 500,
    lazer: 300,
    servicos: 200,
    pessoal: 300,
    outros: 200
  },
  merchantRules: {
    'ifood': 'alimentacao',
    'uber': 'transporte',
    'netflix': 'lazer',
    'spotify': 'lazer',
    'droga raia': 'saude',
    'drogasil': 'saude',
    'mercado livre': 'pessoal'
  },
  geminiApiKey: ''
}

export function loadFinancialData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      
      // Auto-migrate from old 155k template to new realistic starter values (30k, 5k salary, 1.5k rent)
      if (parsed.currentBalance === 155000 || parsed.startingPoint?.balance === 155000) {
        return DEFAULT_DATA
      }

      const startingPoint = parsed.startingPoint || {
        date: todayIso,
        balance: parsed.currentBalance || 30000
      }

      const creditCardSettings = parsed.creditCardSettings || {
        closingDay: 15,
        dueDay: 25
      }

      const merchantRules = {
        ...DEFAULT_DATA.merchantRules,
        ...(parsed.merchantRules || {})
      }

      return {
        ...DEFAULT_DATA,
        ...parsed,
        startingPoint,
        creditCardSettings,
        merchantRules,
        geminiApiKey: parsed.geminiApiKey || '',
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
