const STORAGE_KEY = 'gestor_financeiro_data_v1'

export const DEFAULT_DATA = {
  currentBalance: 155000, // Saldo inicial considerando rescisão + FGTS
  dailyBudgetGoal: 120, // Meta de gasto diário flexível (alimentação/dia a dia)
  transactions: [
    {
      id: 'tx-1',
      date: new Date().toISOString().substring(0, 10),
      description: 'Supermercado da semana',
      amount: 285.50,
      type: 'expense',
      category: 'alimentacao',
      source: 'Pix'
    },
    {
      id: 'tx-2',
      date: new Date().toISOString().substring(0, 10),
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
      return { ...DEFAULT_DATA, ...parsed }
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

export function resetToDefaults() {
  localStorage.removeItem(STORAGE_KEY)
  return DEFAULT_DATA
}
