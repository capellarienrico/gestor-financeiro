import React, { useState, useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { OverviewTab } from './components/OverviewTab'
import { SpreadsheetTab } from './components/SpreadsheetTab'
import { DailyExpensesTab } from './components/DailyExpensesTab'
import { RecurringTab } from './components/RecurringTab'
import { DailyForecastAssistant } from './components/DailyForecastAssistant'
import { SettingsTab } from './components/SettingsTab'
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
  const [activeTab, setActiveTab] = useState('spreadsheet') // Start on spreadsheet as requested by user
  const [isNubankModalOpen, setIsNubankModalOpen] = useState(false)

  // Persist to localStorage whenever data changes
  useEffect(() => {
    saveFinancialData(data)
  }, [data])

  const forecast = calculateFinancialForecast(data)

  // Balance and Goal updates
  const handleUpdateBalance = (newBalance) => {
    setData(prev => ({ ...prev, currentBalance: newBalance }))
  }

  const handleUpdateDailyGoal = (newGoal) => {
    setData(prev => ({ ...prev, dailyBudgetGoal: newGoal }))
  }

  // Categories updates
  const handleUpdateCategories = (newCategories) => {
    setData(prev => ({ ...prev, categories: newCategories }))
  }

  const handleUpdateIncomeCategories = (newIncomeCategories) => {
    setData(prev => ({ ...prev, incomeCategories: newIncomeCategories }))
  }

  // Transactions: Add, Edit, Delete
  const handleAddTransaction = (newTx) => {
    setData(prev => {
      const balanceDelta = newTx.type === 'expense' ? -newTx.amount : newTx.amount
      return {
        ...prev,
        currentBalance: prev.currentBalance + balanceDelta,
        transactions: [newTx, ...prev.transactions]
      }
    })
  }

  const handleEditTransaction = (updatedTx) => {
    setData(prev => {
      const oldTx = prev.transactions.find(t => t.id === updatedTx.id)
      if (!oldTx) return prev

      // Calculate balance diff
      let balance = prev.currentBalance
      // Revert old
      balance += oldTx.type === 'expense' ? oldTx.amount : -oldTx.amount
      // Apply new
      balance += updatedTx.type === 'expense' ? -updatedTx.amount : updatedTx.amount

      return {
        ...prev,
        currentBalance: balance,
        transactions: prev.transactions.map(t => t.id === updatedTx.id ? updatedTx : t)
      }
    })
  }

  const handleDeleteTransaction = (txId) => {
    setData(prev => {
      const tx = prev.transactions.find(t => t.id === txId)
      if (!tx) return prev
      const balanceRevert = tx.type === 'expense' ? tx.amount : -tx.amount
      return {
        ...prev,
        currentBalance: prev.currentBalance + balanceRevert,
        transactions: prev.transactions.filter(t => t.id !== txId)
      }
    })
  }

  // Recurring Expenses: Add, Edit, Delete
  const handleAddRecurringExpense = (item) => {
    setData(prev => ({
      ...prev,
      recurringExpenses: [...prev.recurringExpenses, item]
    }))
  }

  const handleEditRecurringExpense = (updatedItem) => {
    setData(prev => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.map(item => item.id === updatedItem.id ? updatedItem : item)
    }))
  }

  const handleDeleteRecurringExpense = (id) => {
    setData(prev => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.filter(i => i.id !== id)
    }))
  }

  // Recurring Incomes: Add, Edit, Delete
  const handleAddRecurringIncome = (item) => {
    setData(prev => ({
      ...prev,
      recurringIncomes: [...prev.recurringIncomes, item]
    }))
  }

  const handleEditRecurringIncome = (updatedItem) => {
    setData(prev => ({
      ...prev,
      recurringIncomes: prev.recurringIncomes.map(item => item.id === updatedItem.id ? updatedItem : item)
    }))
  }

  const handleDeleteRecurringIncome = (id) => {
    setData(prev => ({
      ...prev,
      recurringIncomes: prev.recurringIncomes.filter(i => i.id !== id)
    }))
  }

  // Post recurring bill as paid today
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

  const handleRestoreBackup = (importedData) => {
    setData(importedData)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentBalance={data.currentBalance}
        onUpdateBalance={handleUpdateBalance}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNubankModal={() => setIsNubankModalOpen(true)}
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

        {activeTab === 'spreadsheet' && (
          <SpreadsheetTab
            data={data}
            categories={data.categories}
            incomeCategories={data.incomeCategories}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'daily' && (
          <DailyExpensesTab
            transactions={data.transactions}
            categories={data.categories}
            incomeCategories={data.incomeCategories}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'recurring' && (
          <RecurringTab
            recurringExpenses={data.recurringExpenses}
            recurringIncomes={data.recurringIncomes}
            categories={data.categories}
            incomeCategories={data.incomeCategories}
            onAddRecurringExpense={handleAddRecurringExpense}
            onEditRecurringExpense={handleEditRecurringExpense}
            onDeleteRecurringExpense={handleDeleteRecurringExpense}
            onAddRecurringIncome={handleAddRecurringIncome}
            onEditRecurringIncome={handleEditRecurringIncome}
            onDeleteRecurringIncome={handleDeleteRecurringIncome}
            onPostRecurringToDaily={handlePostRecurringToDaily}
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

        {activeTab === 'settings' && (
          <SettingsTab
            categories={data.categories}
            incomeCategories={data.incomeCategories}
            onUpdateCategories={handleUpdateCategories}
            onUpdateIncomeCategories={handleUpdateIncomeCategories}
            currentBalance={data.currentBalance}
            onUpdateBalance={handleUpdateBalance}
            dailyBudgetGoal={data.dailyBudgetGoal}
            onUpdateDailyGoal={handleUpdateDailyGoal}
            onExportBackup={() => exportBackup(data)}
            onRestoreBackup={handleRestoreBackup}
            onResetData={handleResetData}
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
        <p>Gestor Financeiro Pessoal & Planilha Mensal • 100% dos dados salvos no seu navegador de forma privada</p>
      </footer>
    </div>
  )
}

export default App
