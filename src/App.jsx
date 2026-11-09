import React, { useState, useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { SpreadsheetTab } from './components/SpreadsheetTab'
import { OverviewTab } from './components/OverviewTab'
import { RecurringTab } from './components/RecurringTab'
import { DailyForecastAssistant } from './components/DailyForecastAssistant'
import { SettingsTab } from './components/SettingsTab'
import { NubankImportModal } from './components/NubankImportModal'
import { GoogleDriveModal } from './components/GoogleDriveModal'
import { ScenarioSimulatorModal } from './components/ScenarioSimulatorModal'
import { QuickExpenseFloatingButton } from './components/QuickExpenseFloatingButton'
import {
  loadFinancialData,
  saveFinancialData,
  exportBackup,
  resetToDefaults
} from './utils/storage'
import {
  requestGoogleLogin,
  logoutGoogle,
  getCachedGoogleUser,
  getValidAccessToken,
  syncDataWithDrive,
  updateDriveFile,
  readDriveFileContent,
  findDriveFile
} from './utils/googleDriveService'
import { calculateFinancialForecast, formatCurrency } from './utils/financialMath'

export function App() {
  const [data, setData] = useState(() => loadFinancialData())
  const [activeTab, setActiveTab] = useState('spreadsheet')
  const [isNubankModalOpen, setIsNubankModalOpen] = useState(false)
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false)
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false)

  // Google Drive Nuvem State
  const [googleUser, setGoogleUser] = useState(() => getCachedGoogleUser())
  const [driveFileId, setDriveFileId] = useState(() => localStorage.getItem('gdrive_file_id'))
  const [lastSyncTime, setLastSyncTime] = useState(() => localStorage.getItem('gdrive_last_sync'))
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState(null)

  // Persist to localStorage whenever data changes
  useEffect(() => {
    saveFinancialData(data)
  }, [data])

  // Auto-sync to Google Drive (debounced by 2.5s)
  useEffect(() => {
    const token = getValidAccessToken()
    if (!googleUser || !token || !driveFileId) return

    const timer = setTimeout(async () => {
      try {
        await updateDriveFile(token, driveFileId, data)
        const now = new Date().toISOString()
        setLastSyncTime(now)
      } catch (err) {
        console.warn('Auto-sync ao Google Drive falhou:', err)
      }
    }, 2500)

    return () => clearTimeout(timer)
  }, [data, googleUser, driveFileId])

  // Google Login & Initial Sync
  const handleGoogleLogin = async () => {
    try {
      setIsSyncing(true)
      setSyncError(null)
      const { token, user } = await requestGoogleLogin()
      setGoogleUser(user)

      // Search if file already exists in Drive
      const existing = await findDriveFile(token)
      if (existing) {
        setDriveFileId(existing.id)
        // Load remote data
        try {
          const remoteData = await readDriveFileContent(token, existing.id)
          if (remoteData && (remoteData.transactions || remoteData.currentBalance !== undefined)) {
            setData(remoteData)
            const now = new Date().toISOString()
            setLastSyncTime(now)
          }
        } catch (readErr) {
          console.error('Erro ao ler dados existentes do Drive:', readErr)
        }
      } else {
        // Create file in Drive with current local data
        const res = await syncDataWithDrive(token, data)
        setDriveFileId(res.fileId)
        setLastSyncTime(res.syncTime)
      }
    } catch (err) {
      console.error(err)
      setSyncError(err.message || 'Falha ao conectar com Google Drive')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleGoogleLogout = () => {
    logoutGoogle()
    setGoogleUser(null)
    setDriveFileId(null)
    setLastSyncTime(null)
  }

  const handleForceUpload = async () => {
    const token = getValidAccessToken()
    if (!token) throw new Error('Sessão expirada. Por favor, conecte-se novamente ao Google.')
    setIsSyncing(true)
    setSyncError(null)
    try {
      const res = await syncDataWithDrive(token, data, { forceUpload: true })
      setDriveFileId(res.fileId)
      setLastSyncTime(res.syncTime)
    } catch (err) {
      setSyncError(err.message)
      throw err
    } finally {
      setIsSyncing(false)
    }
  }

  const handleForceDownload = async () => {
    const token = getValidAccessToken()
    if (!token) throw new Error('Sessão expirada. Por favor, conecte-se novamente ao Google.')
    setIsSyncing(true)
    setSyncError(null)
    try {
      const res = await syncDataWithDrive(token, data, { forceDownload: true })
      if (res.data) {
        setData(res.data)
        setLastSyncTime(res.syncTime)
      }
    } catch (err) {
      setSyncError(err.message)
      throw err
    } finally {
      setIsSyncing(false)
    }
  }

  const forecast = calculateFinancialForecast(data)

  // Balance, Starting Point and Goal updates
  const handleUpdateBalance = (newBalance) => {
    setData(prev => ({
      ...prev,
      currentBalance: newBalance,
      startingPoint: {
        ...prev.startingPoint,
        balance: newBalance
      }
    }))
  }

  const handleUpdateStartingPoint = (newStartingPoint) => {
    setData(prev => ({
      ...prev,
      startingPoint: newStartingPoint,
      currentBalance: newStartingPoint.balance
    }))
  }

  const handleUpdateDailyGoal = (newGoal) => {
    setData(prev => ({ ...prev, dailyBudgetGoal: newGoal }))
  }

  const handleUpdateCreditCardSettings = (newSettings) => {
    setData(prev => ({
      ...prev,
      creditCardSettings: {
        ...prev.creditCardSettings,
        ...newSettings
      }
    }))
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

      let balance = prev.currentBalance
      balance += oldTx.type === 'expense' ? oldTx.amount : -oldTx.amount
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
    if (confirm('Deseja restaurar os dados para os valores e categorias padrão do aplicativo?')) {
      const reset = resetToDefaults()
      setData(reset)
    }
  }

  const handleRestoreBackup = (importedData) => {
    setData(importedData)
  }

  const handleApplySimulatedPlan = ({ newDailyGoal, extraIncome, oneTimeExpense }) => {
    setData(prev => {
      let updatedBalance = prev.currentBalance
      let updatedRecurringIncomes = [...prev.recurringIncomes]
      let updatedTransactions = [...prev.transactions]

      // 1. Meta Diária
      const updatedDailyGoal = newDailyGoal > 0 ? newDailyGoal : prev.dailyBudgetGoal

      // 2. Renda Extra Mensal (adiciona ou atualiza item recorrente)
      if (extraIncome > 0) {
        const existingIdx = updatedRecurringIncomes.findIndex(i => i.id === 'rec-inc-simulated-extra')
        const newExtraItem = {
          id: 'rec-inc-simulated-extra',
          description: `Renda Extra / Freela Simulado (+${formatCurrency(extraIncome)}/mês)`,
          amount: extraIncome,
          dayOfMonth: 5,
          category: 'outros',
          totalInstallments: null,
          remainingInstallments: null
        }
        if (existingIdx >= 0) {
          updatedRecurringIncomes[existingIdx] = newExtraItem
        } else {
          updatedRecurringIncomes.push(newExtraItem)
        }
      }

      // 3. Gasto Extra Pontual (deduz do saldo e gera transação de despesa)
      if (oneTimeExpense > 0) {
        updatedBalance = Math.max(0, updatedBalance - oneTimeExpense)
        const todayStr = new Date().toISOString().substring(0, 10)
        updatedTransactions = [
          {
            id: 'tx-sim-' + Date.now(),
            date: todayStr,
            description: `[Gasto Pontual Simulado] Compra/Imprevisto Aplicado`,
            amount: oneTimeExpense,
            type: 'expense',
            category: 'outros',
            source: 'Reserva'
          },
          ...updatedTransactions
        ]
      }

      return {
        ...prev,
        currentBalance: updatedBalance,
        dailyBudgetGoal: updatedDailyGoal,
        recurringIncomes: updatedRecurringIncomes,
        transactions: updatedTransactions
      }
    })
  }

  // Merchant rules & AI Key Handlers
  const handleUpdateMerchantRules = (newRules) => {
    setData(prev => ({ ...prev, merchantRules: newRules }))
  }

  const handleUpdateGeminiApiKey = (key) => {
    setData(prev => ({ ...prev, geminiApiKey: key }))
  }

  const handleSaveMerchantRules = (rulesToMerge) => {
    setData(prev => ({
      ...prev,
      merchantRules: {
        ...(prev.merchantRules || {}),
        ...rulesToMerge
      }
    }))
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentBalance={data.currentBalance}
        onUpdateBalance={handleUpdateBalance}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNubankModal={() => setIsNubankModalOpen(true)}
        googleUser={googleUser}
        isSyncing={isSyncing}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 md:pb-8">
        {activeTab === 'spreadsheet' && (
          <SpreadsheetTab
            data={data}
            categories={data.categories}
            incomeCategories={data.incomeCategories}
            creditCardSettings={data.creditCardSettings}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateStartingPoint={handleUpdateStartingPoint}
            onUpdateCreditCardSettings={handleUpdateCreditCardSettings}
          />
        )}

        {activeTab === 'overview' && (
          <OverviewTab
            data={data}
            forecast={forecast}
            onNavigateToForecast={() => setActiveTab('forecast')}
            onOpenNubankModal={() => setIsNubankModalOpen(true)}
            onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
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
            creditCardSettings={data.creditCardSettings}
            onUpdateCreditCardSettings={handleUpdateCreditCardSettings}
            onUpdateCategories={handleUpdateCategories}
            onUpdateIncomeCategories={handleUpdateIncomeCategories}
            currentBalance={data.currentBalance}
            onUpdateBalance={handleUpdateBalance}
            dailyBudgetGoal={data.dailyBudgetGoal}
            onUpdateDailyGoal={handleUpdateDailyGoal}
            onExportBackup={() => exportBackup(data)}
            onRestoreBackup={handleRestoreBackup}
            onResetData={handleResetData}
            googleUser={googleUser}
            lastSyncTime={lastSyncTime}
            onOpenDriveModal={() => setIsDriveModalOpen(true)}
            merchantRules={data.merchantRules}
            onUpdateMerchantRules={handleUpdateMerchantRules}
            geminiApiKey={data.geminiApiKey}
            onUpdateGeminiApiKey={handleUpdateGeminiApiKey}
          />
        )}
      </main>

      {/* Google Drive Modal */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        googleUser={googleUser}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        syncError={syncError}
        fileId={driveFileId}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
        onForceUpload={handleForceUpload}
        onForceDownload={handleForceDownload}
      />

      {/* Nubank Import Modal */}
      <NubankImportModal
        isOpen={isNubankModalOpen}
        onClose={() => setIsNubankModalOpen(false)}
        onApplyNubankAnalysis={handleApplyNubankAnalysis}
        onImportTransactions={handleImportTransactions}
        categories={data.categories}
        merchantRules={data.merchantRules}
        onSaveMerchantRules={handleSaveMerchantRules}
        geminiApiKey={data.geminiApiKey}
      />

      {/* Scenario Simulator Modal ('E Se?') */}
      <ScenarioSimulatorModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        data={data}
        forecast={forecast}
        onApplyPlan={handleApplySimulatedPlan}
      />

      {/* Quick Expense Floating Button (1-Click / Key 'N') */}
      <QuickExpenseFloatingButton
        onAddTransaction={handleAddTransaction}
        categories={data.categories}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Gestor Financeiro Pessoal & Planilha Mensal • 100% dos dados salvos no seu navegador e sincronizados no seu Google Drive</p>
      </footer>
    </div>
  )
}

export default App
