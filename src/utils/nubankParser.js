import { autoCategorize } from './categories'

/**
 * Parses Nubank Credit Card CSV or Checking Account CSV or standard OFX
 */
export function parseFinancialFile(fileContent, fileName = '') {
  const isOfx = fileName.toLowerCase().endsWith('.ofx') || fileContent.includes('<OFX>')
  if (isOfx) {
    return parseOFX(fileContent)
  }
  return parseCSV(fileContent)
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) {
    throw new Error('Arquivo CSV vazio ou sem transações.')
  }

  // Detect delimiter (, or ;)
  const firstLine = lines[0]
  const delimiter = firstLine.includes(';') ? ';' : ','
  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase())

  // Detect format:
  // Fatura Cartão Nubank: date, category, title, amount
  // Extrato Conta Nubank: data, valor, identificador, descrição
  const isCard = headers.includes('title') || headers.includes('título') || headers.includes('category')
  const transactions = []

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i]
    if (!rawLine) continue

    // Handle CSV quoted strings
    const cols = splitCSVLine(rawLine, delimiter)
    if (cols.length < 3) continue

    let dateStr = ''
    let description = ''
    let amount = 0
    let category = 'outros'

    if (isCard) {
      // date, category, title, amount
      const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('data'))
      const catIdx = headers.findIndex(h => h.includes('category') || h.includes('categoria'))
      const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('título') || h.includes('descricao') || h.includes('descrição'))
      const amtIdx = headers.findIndex(h => h.includes('amount') || h.includes('valor'))

      dateStr = cols[dateIdx] || ''
      description = cols[titleIdx] || 'Despesa Cartão'
      const rawCat = cols[catIdx] || ''
      const rawAmt = cols[amtIdx] || '0'
      amount = parseNumber(rawAmt)

      // In Nubank card statements, positive amount is expense, negative is payment/refund
      if (amount > 0) {
        category = autoCategorize(description + ' ' + rawCat)
      } else {
        category = 'outros_in'
      }
    } else {
      // Conta: Data, Valor, Identificador, Descrição
      const dateIdx = headers.findIndex(h => h.includes('data') || h.includes('date'))
      const valIdx = headers.findIndex(h => h.includes('valor') || h.includes('amount'))
      const descIdx = headers.findIndex(h => h.includes('descri') || h.includes('identificador') || h.includes('title'))

      dateStr = cols[dateIdx] || ''
      amount = parseNumber(cols[valIdx] || '0')
      description = cols[descIdx] || 'Transação Nubank'
      if (cols.length > 3 && cols[3]) {
        description += ' - ' + cols[3]
      }

      category = autoCategorize(description)
    }

    const normalizedDate = normalizeDate(dateStr)
    if (!normalizedDate) continue

    // Determine type:
    // For card: amount > 0 is expense
    // For account: amount < 0 is expense, amount > 0 is income
    const isExpense = isCard ? amount > 0 : amount < 0
    const absAmount = Math.abs(amount)

    if (absAmount === 0) continue

    transactions.push({
      id: 'nu-' + i + '-' + Math.random().toString(36).substr(2, 6),
      date: normalizedDate,
      description: cleanDescription(description),
      amount: absAmount,
      type: isExpense ? 'expense' : 'income',
      category: isExpense ? category : 'outros_in',
      source: isCard ? 'Nubank Cartão' : 'Nubank Conta'
    })
  }

  return analyzeTransactions(transactions)
}

function parseOFX(content) {
  const transactions = []
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi
  let match
  let i = 0

  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const trnContent = match[1]
    const trnType = (trnContent.match(/<TRNTYPE>([\s\S]*?)(\r?\n|<)/i) || [])[1]?.trim() || ''
    const dtPosted = (trnContent.match(/<DTPOSTED>([\s\S]*?)(\r?\n|<)/i) || [])[1]?.trim() || ''
    const trnAmt = (trnContent.match(/<TRNAMT>([\s\S]*?)(\r?\n|<)/i) || [])[1]?.trim() || '0'
    const memo = (trnContent.match(/<MEMO>([\s\S]*?)(\r?\n|<)/i) || [])[1]?.trim() || ''
    const name = (trnContent.match(/<NAME>([\s\S]*?)(\r?\n|<)/i) || [])[1]?.trim() || ''

    const description = cleanDescription(name || memo || 'Transação OFX')
    const rawNumber = parseNumber(trnAmt)
    const absAmount = Math.abs(rawNumber)
    const isExpense = rawNumber < 0 || trnType.toUpperCase() === 'DEBIT'

    const year = dtPosted.substring(0, 4)
    const month = dtPosted.substring(4, 6)
    const day = dtPosted.substring(6, 8)
    const date = `${year}-${month}-${day}`

    transactions.push({
      id: 'ofx-' + (i++) + '-' + Math.random().toString(36).substr(2, 6),
      date,
      description,
      amount: absAmount,
      type: isExpense ? 'expense' : 'income',
      category: isExpense ? autoCategorize(description) : 'outros_in',
      source: 'Extrato OFX'
    })
  }

  return analyzeTransactions(transactions)
}

function cleanDescription(desc) {
  return desc
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseNumber(str) {
  if (typeof str === 'number') return str
  let cleaned = str.replace(/["'R$\s]/g, '')
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // 1.234,56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.')
  }
  const val = parseFloat(cleaned)
  return isNaN(val) ? 0 : val
}

function normalizeDate(str) {
  if (!str) return null
  const clean = str.replace(/["'\s]/g, '')
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    return clean.substring(0, 10)
  }
  // DD/MM/YYYY
  const parts = clean.split('/')
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0')
    const m = parts[1].padStart(2, '0')
    const y = parts[2].length === 2 ? '20' + parts[2] : parts[2]
    return `${y}-${m}-${d}`
  }
  return null
}

function splitCSVLine(line, delimiter) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

/**
 * Calculates statistical metrics, monthly averages, daily burn rate, and detects recurring items
 */
export function analyzeTransactions(transactions) {
  if (!transactions.length) {
    return {
      transactions: [],
      monthlyData: {},
      averageMonthlyExpense: 0,
      averageDailyExpense: 0,
      detectedRecurring: [],
      categoryBreakdown: {},
      totalExpenses: 0,
      totalIncomes: 0
    }
  }

  // Sort by date ascending
  transactions.sort((a, b) => a.date.localeCompare(b.date))

  const monthlyData = {}
  const categoryBreakdown = {}
  const descriptionFrequency = {}

  let totalExpenses = 0
  let totalIncomes = 0

  for (const t of transactions) {
    const monthKey = t.date.substring(0, 7) // YYYY-MM
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { expenses: 0, incomes: 0, count: 0, daysCount: new Set() }
    }

    if (t.type === 'expense') {
      totalExpenses += t.amount
      monthlyData[monthKey].expenses += t.amount
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount

      // Track recurring candidate
      const descKey = t.description.toLowerCase().replace(/\d+/g, '').trim()
      if (!descriptionFrequency[descKey]) {
        descriptionFrequency[descKey] = {
          count: 0,
          amounts: [],
          dates: [],
          originalDescription: t.description,
          category: t.category
        }
      }
      descriptionFrequency[descKey].count++
      descriptionFrequency[descKey].amounts.push(t.amount)
      descriptionFrequency[descKey].dates.push(t.date)
    } else {
      totalIncomes += t.amount
      monthlyData[monthKey].incomes += t.amount
    }

    monthlyData[monthKey].count++
    monthlyData[monthKey].daysCount.add(t.date)
  }

  const monthsCount = Object.keys(monthlyData).length || 1
  const averageMonthlyExpense = totalExpenses / monthsCount
  const averageDailyExpense = averageMonthlyExpense / 30

  // Detect likely recurring expenses (subscriptions, rent, gym, internet, etc.)
  const detectedRecurring = []
  for (const [key, item] of Object.entries(descriptionFrequency)) {
    // If it appears multiple times or has high recurring probability keywords
    const isKw = autoCategorize(key) !== 'outros'
    if (item.count >= 2 || (item.count >= 1 && (key.includes('netflix') || key.includes('spotify') || key.includes('condominio') || key.includes('internet') || key.includes('aluguel') || key.includes('seguro') || key.includes('plano') || key.includes('claro') || key.includes('vivo')))) {
      const avgAmount = item.amounts.reduce((a, b) => a + b, 0) / item.amounts.length
      // find most common day of month
      const days = item.dates.map(d => parseInt(d.substring(8, 10), 10)).filter(d => !isNaN(d))
      const avgDay = days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 10

      detectedRecurring.push({
        id: 'rec-' + Math.random().toString(36).substr(2, 6),
        description: item.originalDescription,
        amount: Math.round(avgAmount * 100) / 100,
        dayOfMonth: Math.min(Math.max(avgDay, 1), 31),
        category: item.category,
        detectedFrequency: item.count
      })
    }
  }

  return {
    transactions,
    monthlyData,
    averageMonthlyExpense: Math.round(averageMonthlyExpense * 100) / 100,
    averageDailyExpense: Math.round(averageDailyExpense * 100) / 100,
    detectedRecurring,
    categoryBreakdown,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalIncomes: Math.round(totalIncomes * 100) / 100,
    monthsCount
  }
}
