import React, { useState, useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { OverviewTab } from './components/OverviewTab'
import { DailyExpensesTab } from './components/DailyExpensesTab'
import { RecurringTab } from './components/RecurringTab'
import { DailyForecastAssistant } from './components/DailyForecastAssistant'
import { NubankImportModal } from './components/NubankImportModal'
import {
  loadFinancialData,
  saveFinancialData,
  exportBackup,
  resetToDefaults
} from './utils/storage'
import { calculateFinancialForecast, formatCurrency } from './utils/financialMath'

export function App() {
  const [data, setData] = useState(() => loadFinancialData())
  const [activeTab, setActiveTab] = useState('overview')
  const [isNubankModalOpen, setIsNubankModalOpen] = useState(false)

  // Persist to localStorage whenever data changes
  useEffect(() => {
    saveFinancialData(data)
  }, [data])

  const forecast = calculateFinancialForecast(data)

  // Handlers
  const handleUpdateBalance = (newBalance) => {
    setData(prev => ({ ...prev, currentBalance: newBalance }))
  }

  const handleUpdateDailyGoal = (newGoal) => {
    setData(prev => ({ ...prev, dailyBudgetGoal: newGoal }))
  }

  const handleAddTransaction = (newTx) => {
    setData(prev => {
      // If it's an expense, subtract from balance, if income, add to balance
      const balanceDelta = newTx.type === 'expense' ? -newTx.amount : newTx.amount
      return {
        ...prev,
        currentBalance: prev.currentBalance + balanceDelta,
        transactions: [newTx, ...prev.transactions]
      }
    })
  }

  const handleDeleteTransaction = (txId) => {
    setData(prev => {
      const tx = prev.transactions.find(t => t.id === txId)
      if (!tx) return prev
      // Revert balance delta
      const balanceRevert = tx.type === 'expense' ? tx.amount : -tx.amount
      return {
        ...prev,
        currentBalance: prev.currentBalance + balanceRevert,
        transactions: prev.transactions.filter(t => t.id !== txId)
      }
    })
  }

  const handleAddRecurringExpense = (item) => {
    setData(prev => ({
      ...prev,
      recurringExpenses: [...prev.recurringExpenses, item]
    }))
  }

  const handleDeleteRecurringExpense = (id) => {
    setData(prev => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.filter(i => i.id !== id)
    }))
  }

  const handleAddRecurringIncome = (item) => {
    setData(prev => ({
      ...prev,
      recurringIncomes: [...prev.recurringIncomes, item]
    }))
  }

  const handleDeleteRecurringIncome = (id) => {
    setData(prev => ({
      ...prev,
      recurringIncomes: prev.recurringIncomes.filter(i => i.id !== id)
    }))
  }

  // Quickly mark a recurring bill as paid today
  const handlePostRecurringToDaily = (recurringItem) => {
    const todayStr = new Date().toISOString().substring(0, 10)
    handleAddTransaction({
      id: 'tx-rec-' + Date.now(),
      date: todayStr,
      description: `[Fixo Pago] ${recurringItem.description}`,
      amount: recurringItem.amount,
      type: 'expense',
      category: recurringItem.category,
      source: 'Boleto/Débito'
    })
  }

  // Nubank Analysis Apply
  const handleApplyNubankAnalysis = (analysis) => {
    setData(prev => {
      const newDailyGoal = analysis.averageDailyExpense > 0 ? analysis.averageDailyExpense : prev.dailyBudgetGoal
      
      // Merge detected recurring items that don't already exist
      const existingDesc = new Set(prev.recurringExpenses.map(r => r.description.toLowerCase()))
      const newRecurringToAdd = analysis.detectedRecurring.filter(
        d => !existingDesc.has(d.description.toLowerCase())
      )

      return {
        ...prev,
        dailyBudgetGoal: newDailyGoal,
        recurringExpenses: [...prev.recurringExpenses, ...newRecurringToAdd],
        transactions: [...analysis.transactions, ...prev.transactions]
      }
    })
    alert(`Médias do Nubank aplicadas com sucesso! Meta diária ajustada para ${formatCurrency(analysis.averageDailyExpense)}/dia.`)
  }

  const handleImportTransactions = (txs) => {
    setData(prev => ({
      ...prev,
      transactions: [...txs, ...prev.transactions]
    }))
    alert(`${txs.length} transações importadas com sucesso!`)
  }

  const handleResetData = () => {
    if (confirm('Deseja resetar os dados para os valores padrão de transição pós-demissão?')) {
      const reset = resetToDefaults()
      setData(reset)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentBalance={data.currentBalance}
        onUpdateBalance={handleUpdateBalance}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNubankModal={() => setIsNubankModalOpen(true)}
        onExportBackup={() => exportBackup(data)}
        onResetData={handleResetData}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewTab
            data={data}
            forecast={forecast}
            onNavigateToForecast={() => setActiveTab('forecast')}
            onOpenNubankModal={() => setIsNubankModalOpen(true)}
          />
        )}

        {activeTab === 'forecast' && (
          <DailyForecastAssistant
            data={data}
            forecast={forecast}
            onUpdateDailyGoal={handleUpdateDailyGoal}
            onUpdateBalance={handleUpdateBalance}
          />
        )}

        {activeTab === 'daily' && (
          <DailyExpensesTab
            transactions={data.transactions}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'recurring' && (
          <RecurringTab
            recurringExpenses={data.recurringExpenses}
            recurringIncomes={data.recurringIncomes}
            onAddRecurringExpense={handleAddRecurringExpense}
            onDeleteRecurringExpense={handleDeleteRecurringExpense}
            onAddRecurringIncome={handleAddRecurringIncome}
            onDeleteRecurringIncome={handleDeleteRecurringIncome}
            onPostRecurringToDaily={handlePostRecurringToDaily}
          />
        )}
      </main>

      {/* Nubank Import Modal */}
      <NubankImportModal
        isOpen={isNubankModalOpen}
        onClose={() => setIsNubankModalOpen(false)}
        onApplyNubankAnalysis={handleApplyNubankAnalysis}
        onImportTransactions={handleImportTransactions}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Gestor Financeiro Pessoal & Previsão de Runway • 100% dos dados salvos no seu navegador de forma privada</p>
      </footer>
    </div>
  )
}

export default App
