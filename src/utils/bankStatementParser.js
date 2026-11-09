/**
 * Universal Multi-Bank Statement Parser (OFX & CSV)
 * Supports all Brazilian banks: Nubank, Itaú, Bradesco, Santander,
 * Banco do Brasil, Inter, C6 Bank, BTG Pactual, Caixa, etc.
 */

import { autoCategorize } from './categories.js'

// Brazilian Bank Identification Map by COMPE code / Names
export const BRAZILIAN_BANKS = {
  '001': 'Banco do Brasil',
  '237': 'Bradesco',
  '341': 'Itaú Unibanco',
  '033': 'Santander',
  '260': 'Nubank',
  '077': 'Banco Inter',
  '336': 'C6 Bank',
  '208': 'BTG Pactual',
  '104': 'Caixa Econômica',
  '212': 'Banco Original',
  '290': 'PagBank',
  '380': 'PicPay',
  '655': 'Neon'
}

/**
 * Universal file entry point: parses OFX or CSV
 */
export function parseFinancialFile(fileContent, fileName = '', merchantRules = {}) {
  const content = (fileContent || '').replace(/^\uFEFF/, '').trim() // Remove UTF-8 BOM

  const isOfx = fileName.toLowerCase().endsWith('.ofx') ||
    content.includes('<OFX>') ||
    content.includes('<OFXHEADER>') ||
    content.includes('<STMTTRN>')

  if (isOfx) {
    return parseOFX(content, fileName, merchantRules)
  }

  return parseUniversalCSV(content, fileName, merchantRules)
}

/**
 * Robust Universal OFX Parser (supports both OFX 1.x SGML & OFX 2.x XML)
 */
export function parseOFX(content, fileName = '', merchantRules = {}) {
  // Detect Bank Name from OFX tags
  const bankOrgMatch = content.match(/<ORG>([\s\S]*?)(\r?\n|<)/i)
  const bankIdMatch = content.match(/<BANKID>([\s\S]*?)(\r?\n|<)/i)
  const fidMatch = content.match(/<FID>([\s\S]*?)(\r?\n|<)/i)

  const orgName = bankOrgMatch ? bankOrgMatch[1].trim() : ''
  const bankCode = bankIdMatch ? bankIdMatch[1].trim() : ''
  const fidCode = fidMatch ? fidMatch[1].trim() : ''

  let bankName = 'Banco Brasileiro'
  if (BRAZILIAN_BANKS[bankCode]) {
    bankName = BRAZILIAN_BANKS[bankCode]
  } else if (orgName) {
    bankName = orgName
  } else if (BRAZILIAN_BANKS[fidCode]) {
    bankName = BRAZILIAN_BANKS[fidCode]
  } else {
    // Try filename inference
    const lowerName = fileName.toLowerCase()
    if (lowerName.includes('nu') || lowerName.includes('nubank')) bankName = 'Nubank'
    else if (lowerName.includes('itau')) bankName = 'Itaú'
    else if (lowerName.includes('bradesco')) bankName = 'Bradesco'
    else if (lowerName.includes('santander')) bankName = 'Santander'
    else if (lowerName.includes('bb') || lowerName.includes('brasil')) bankName = 'Banco do Brasil'
    else if (lowerName.includes('inter')) bankName = 'Banco Inter'
    else if (lowerName.includes('c6')) bankName = 'C6 Bank'
    else if (lowerName.includes('btg')) bankName = 'BTG Pactual'
    else if (lowerName.includes('caixa')) bankName = 'Caixa Econômica'
  }

  const transactions = []
  // Matches both <STMTTRN>...</STMTTRN> and unclosed SGML <STMTTRN>... up to next <STMTTRN> or </BANKTRANLIST>
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>|<\/BANKTRANLIST>|<\/CCSTMTTRN>|$))/gi
  let match
  let i = 0

  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const trnContent = match[1]
    if (!trnContent.trim()) continue

    const trnType = extractOfxTag(trnContent, 'TRNTYPE')
    const dtPosted = extractOfxTag(trnContent, 'DTPOSTED')
    const trnAmt = extractOfxTag(trnContent, 'TRNAMT') || '0'
    const memo = extractOfxTag(trnContent, 'MEMO')
    const name = extractOfxTag(trnContent, 'NAME')
    const fitId = extractOfxTag(trnContent, 'FITID')

    // Construct description
    let rawDesc = name || memo || 'Transação OFX'
    if (name && memo && name.toLowerCase() !== memo.toLowerCase()) {
      rawDesc = `${name} - ${memo}`
    }
    const description = cleanDescription(rawDesc)

    const rawNumber = parseNumber(trnAmt)
    const absAmount = Math.abs(rawNumber)
    if (absAmount === 0) continue

    // Determine if it's expense:
    // In OFX, debit/expense has negative TRNAMT or TRNTYPE is DEBIT / POS / FEE / PAYMENT
    const isDebitType = ['DEBIT', 'POS', 'PAYMENT', 'FEE', 'SRVCHG'].includes(trnType.toUpperCase())
    const isExpense = rawNumber < 0 || (rawNumber === 0 && isDebitType) || (rawNumber > 0 && isDebitType && !trnType.includes('CREDIT'))
      ? (rawNumber < 0 || isDebitType)
      : rawNumber < 0

    // Parse date: DTPOSTED is typically YYYYMMDDHHMMSS or YYYYMMDD
    let date = ''
    if (dtPosted.length >= 8) {
      const year = dtPosted.substring(0, 4)
      const month = dtPosted.substring(4, 6)
      const day = dtPosted.substring(6, 8)
      date = `${year}-${month}-${day}`
    } else {
      date = new Date().toISOString().substring(0, 10)
    }

    const isCard = content.includes('<CCSTMTTRN>') || fileName.toLowerCase().includes('cart') || description.toLowerCase().includes('fatura')

    let category = 'outros'
    if (isExpense) {
      category = autoCategorize(description, 'outros', null, merchantRules)
    } else {
      category = categorizeIncome(description)
    }

    transactions.push({
      id: fitId ? `ofx-${fitId}` : `ofx-${i++}-${Math.random().toString(36).substr(2, 6)}`,
      date,
      description,
      amount: absAmount,
      type: isExpense ? 'expense' : 'income',
      category,
      source: isCard ? `${bankName} Cartão` : `${bankName} Conta`,
      paymentMethod: isCard ? 'Cartão de Crédito' : 'Extrato Bancário'
    })
  }

  const result = analyzeTransactions(transactions)
  result.detectedBank = bankName
  result.detectedFormat = 'Extrato OFX Universal'
  return result
}

function extractOfxTag(block, tagName) {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)(?:<\\/${tagName}>|\\r?\\n|<)`, 'i')
  const match = block.match(regex)
  return match ? match[1].trim() : ''
}

/**
 * Universal Multi-Bank CSV Parser
 * Automatically detects separator, headers, bank format, date formats and amount columns.
 */
export function parseUniversalCSV(content, fileName = '', merchantRules = {}) {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) {
    throw new Error('Arquivo CSV vazio ou sem dados suficientes.')
  }

  // Detect delimiter and header row
  const { headerRowIndex, delimiter, headers } = detectCSVHeader(lines)
  if (headerRowIndex === -1) {
    throw new Error('Não foi possível identificar o cabeçalho do arquivo CSV bancário.')
  }

  // Detect Bank and Type (Card vs Account)
  const lowerFileName = fileName.toLowerCase()
  const lowerContent = content.substring(0, 2000).toLowerCase()
  const bankName = detectBankName(lowerContent, lowerFileName, headers)

  // Map Column Indices
  const colMap = mapCSVColumns(headers)

  const transactions = []

  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const rawLine = lines[i]
    if (!rawLine) continue

    const cols = splitCSVLine(rawLine, delimiter)
    if (cols.length < 2) continue

    // Extract Date
    const rawDate = colMap.date !== -1 ? cols[colMap.date] : ''
    const normalizedDate = normalizeDate(rawDate)
    if (!normalizedDate) continue

    // Extract Description
    let description = ''
    if (colMap.description !== -1 && cols[colMap.description]) {
      description = cols[colMap.description]
    }
    // If there's an extra details/identifier column, append it
    if (colMap.details !== -1 && cols[colMap.details] && cols[colMap.details] !== description) {
      description = description ? `${description} - ${cols[colMap.details]}` : cols[colMap.details]
    }
    if (!description) description = `Transação ${bankName}`
    description = cleanDescription(description)

    // Extract Amount and determine Expense vs Income
    let amount = 0
    let isExpense = true

    if (colMap.debit !== -1 && colMap.credit !== -1) {
      // Split Debit and Credit columns (e.g. Bradesco, Santander, Banco do Brasil)
      const debitVal = parseNumber(cols[colMap.debit] || '0')
      const creditVal = parseNumber(cols[colMap.credit] || '0')

      if (Math.abs(debitVal) > 0) {
        amount = Math.abs(debitVal)
        isExpense = true
      } else if (Math.abs(creditVal) > 0) {
        amount = Math.abs(creditVal)
        isExpense = false
      } else {
        continue
      }
    } else if (colMap.amount !== -1) {
      const rawAmtStr = cols[colMap.amount] || '0'
      const rawNum = parseNumber(rawAmtStr)
      amount = Math.abs(rawNum)
      if (amount === 0) continue

      // Check for explicit indicator column (e.g. Tipo 'D'/'C', 'Débito'/'Crédito')
      let typeIndicator = ''
      if (colMap.typeIndicator !== -1 && cols[colMap.typeIndicator]) {
        typeIndicator = cols[colMap.typeIndicator].trim().toUpperCase()
      }

      if (typeIndicator === 'D' || typeIndicator.includes('DÉB') || typeIndicator.includes('DEB') || typeIndicator.includes('SAÍDA')) {
        isExpense = true
      } else if (typeIndicator === 'C' || typeIndicator.includes('CRÉD') || typeIndicator.includes('CRED') || typeIndicator.includes('ENTRADA')) {
        isExpense = false
      } else if (rawAmtStr.toUpperCase().includes('D')) {
        isExpense = true
      } else if (rawAmtStr.toUpperCase().includes('C')) {
        isExpense = false
      } else if (colMap.isNubankCard) {
        // In Nubank Credit Card statement: positive is expense, negative is invoice payment/refund
        isExpense = rawNum > 0
      } else {
        // Standard bank account: negative is expense, positive is income
        isExpense = rawNum < 0
      }
    } else {
      continue
    }

    // Category detection
    let category = 'outros'
    const rawCategory = colMap.category !== -1 ? cols[colMap.category] : ''

    if (isExpense) {
      category = autoCategorize(`${description} ${rawCategory}`, 'outros', null, merchantRules)
    } else {
      category = categorizeIncome(`${description} ${rawCategory}`)
    }

    const isCard = colMap.isNubankCard ||
      lowerFileName.includes('fatura') ||
      lowerFileName.includes('cart') ||
      description.toLowerCase().includes('compra com cartao') ||
      description.toLowerCase().includes('pagamento de fatura')

    transactions.push({
      id: `csv-${i}-${Math.random().toString(36).substr(2, 6)}`,
      date: normalizedDate,
      description,
      amount: Math.round(amount * 100) / 100,
      type: isExpense ? 'expense' : 'income',
      category,
      source: isCard ? `${bankName} Cartão` : `${bankName} Conta`,
      paymentMethod: isCard ? 'Cartão de Crédito' : 'Extrato Bancário'
    })
  }

  const result = analyzeTransactions(transactions)
  result.detectedBank = bankName
  result.detectedFormat = colMap.isNubankCard ? 'Fatura Cartão Nubank' : `Extrato CSV (${bankName})`
  return result
}

/**
 * Categorizes income entries into salario, rendimentos, beneficios or outros_in
 */
function categorizeIncome(text = '') {
  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  if (lower.includes('salario') || lower.includes('folha') || lower.includes('vencimento') || lower.includes('remunera') || lower.includes('pro-labore')) {
    return 'salario'
  }
  if (lower.includes('rendimento') || lower.includes('cdi') || lower.includes('aplicacao') || lower.includes('juros') || lower.includes('dividendo') || lower.includes('resgate')) {
    return 'rendimentos'
  }
  if (lower.includes('reembolso') || lower.includes('seguro') || lower.includes('inss') || lower.includes('beneficio') || lower.includes('fgts')) {
    return 'beneficios'
  }
  if (lower.includes('freela') || lower.includes('projeto') || lower.includes('servico prestado')) {
    return 'freelance'
  }
  return 'outros_in'
}

/**
 * Detects CSV delimiter and header row (handles preamble metadata)
 */
function detectCSVHeader(lines) {
  const delimiters = [';', ',', '\t', '|']

  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i]

    for (const d of delimiters) {
      if (!line.includes(d)) continue

      const parts = line.split(d).map(p => p.trim().replace(/^["']|["']$/g, '').toLowerCase())
      const matchScore = parts.filter(p =>
        p.includes('data') ||
        p.includes('date') ||
        p.includes('valor') ||
        p.includes('amount') ||
        p.includes('historico') ||
        p.includes('histórico') ||
        p.includes('descri') ||
        p.includes('lançamento') ||
        p.includes('lancamento') ||
        p.includes('title') ||
        p.includes('título') ||
        p.includes('debito') ||
        p.includes('débito') ||
        p.includes('credito') ||
        p.includes('crédito')
      ).length

      if (matchScore >= 2) {
        return {
          headerRowIndex: i,
          delimiter: d,
          headers: parts
        }
      }
    }
  }

  // Fallback to first line with ; or ,
  const firstLine = lines[0]
  const delim = firstLine.includes(';') ? ';' : ','
  return {
    headerRowIndex: 0,
    delimiter: delim,
    headers: firstLine.split(delim).map(p => p.trim().replace(/^["']|["']$/g, '').toLowerCase())
  }
}

/**
 * Identifies column roles from headers
 */
function mapCSVColumns(headers) {
  const isNubankCard = headers.includes('title') || headers.includes('título') || (headers.includes('category') && headers.includes('amount'))

  let dateIdx = headers.findIndex(h => h.includes('data') || h.includes('date') || h.includes('dt.'))
  let descIdx = headers.findIndex(h =>
    h.includes('descri') ||
    h.includes('hist') ||
    h.includes('lança') ||
    h.includes('lanca') ||
    h.includes('title') ||
    h.includes('título') ||
    h.includes('nome') ||
    h.includes('memo') ||
    h.includes('identificador')
  )
  let detailsIdx = headers.findIndex((h, idx) =>
    idx !== descIdx && (h.includes('detalhe') || h.includes('complemento') || h.includes('docto') || h.includes('documento'))
  )
  let catIdx = headers.findIndex(h => h.includes('categ') || h.includes('category'))

  // Split Debito / Credito columns (e.g. Bradesco / BB)
  let debitIdx = headers.findIndex(h => h.includes('débito') || h.includes('debito') || h.includes('saída') || h.includes('saida'))
  let creditIdx = headers.findIndex(h => h.includes('crédito') || h.includes('credito') || h.includes('entrada'))

  // Unified Amount column
  let amountIdx = headers.findIndex(h => h.includes('valor') || h.includes('amount') || h.includes('total') || h.includes('quantia'))

  // Type / Natureza column (e.g. Tipo D/C)
  let typeIdx = headers.findIndex(h => h.includes('tipo') || h === 'd/c' || h.includes('natureza') || h.includes('operacao') || h.includes('operação'))

  return {
    date: dateIdx,
    description: descIdx,
    details: detailsIdx,
    category: catIdx,
    debit: debitIdx,
    credit: creditIdx,
    amount: amountIdx,
    typeIndicator: typeIdx,
    isNubankCard
  }
}

/**
 * Detects bank from content, filename or headers
 */
function detectBankName(content, fileName, headers) {
  const text = `${content} ${fileName} ${headers.join(' ')}`.toLowerCase()

  if (text.includes('nubank') || text.includes('nu pagamentos') || text.includes('identificador')) return 'Nubank'
  if (text.includes('itau') || text.includes('itaú')) return 'Itaú'
  if (text.includes('bradesco')) return 'Bradesco'
  if (text.includes('santander')) return 'Santander'
  if (text.includes('banco do brasil') || text.includes('bb') || text.includes('bancodobrasil')) return 'Banco do Brasil'
  if (text.includes('inter') || text.includes('banco inter')) return 'Banco Inter'
  if (text.includes('c6') || text.includes('c6 bank')) return 'C6 Bank'
  if (text.includes('btg') || text.includes('pactual')) return 'BTG Pactual'
  if (text.includes('caixa') || text.includes('cef')) return 'Caixa Econômica'
  if (text.includes('pagbank') || text.includes('pagseguro')) return 'PagBank'
  if (text.includes('picpay')) return 'PicPay'
  if (text.includes('neon')) return 'Neon'

  return 'Extrato Bancário'
}

/**
 * Robust number parsing supporting R$, comma/dot decimals, negative brackets, trailing D/C
 */
export function parseNumber(str) {
  if (typeof str === 'number') return str
  if (!str) return 0

  let cleaned = String(str).trim()

  // Detect negative in parentheses: (120,50)
  const isParenNegative = /^\((.*)\)$/.test(cleaned)
  if (isParenNegative) {
    cleaned = cleaned.replace(/^\(|\)$/g, '')
  }

  // Check for trailing D or C
  const hasD = /[dD]\s*$/.test(cleaned)
  const hasC = /[cC]\s*$/.test(cleaned)

  cleaned = cleaned.replace(/["'R$\sA-Za-z]/g, '')

  // Format: 1.234,56
  if (cleaned.includes(',') && cleaned.includes('.')) {
    if (cleaned.indexOf('.') < cleaned.indexOf(',')) {
      // Brazilian: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      // International: 1,234.56
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.')
  }

  let val = parseFloat(cleaned)
  if (isNaN(val)) return 0

  if (isParenNegative || hasD) {
    val = -Math.abs(val)
  } else if (hasC) {
    val = Math.abs(val)
  }

  return val
}

/**
 * Normalizes dates to YYYY-MM-DD
 */
export function normalizeDate(str) {
  if (!str) return null
  const clean = String(str).replace(/["'\s]/g, '')

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    return clean.substring(0, 10)
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const parts = clean.split(/[/-]/)
  if (parts.length >= 3) {
    // Check if first part is YYYY
    if (parts[0].length === 4) {
      const y = parts[0]
      const m = parts[1].padStart(2, '0')
      const d = parts[2].padStart(2, '0')
      return `${y}-${m}-${d}`
    } else {
      // DD/MM/YYYY
      const d = parts[0].padStart(2, '0')
      const m = parts[1].padStart(2, '0')
      const y = parts[2].length === 2 ? '20' + parts[2] : parts[2].substring(0, 4)
      return `${y}-${m}-${d}`
    }
  }

  // YYYYMMDD
  if (/^\d{8}$/.test(clean)) {
    const y = clean.substring(0, 4)
    const m = clean.substring(4, 6)
    const d = clean.substring(6, 8)
    return `${y}-${m}-${d}`
  }

  return null
}

export function splitCSVLine(line, delimiter) {
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

export function cleanDescription(desc) {
  if (!desc) return ''
  return String(desc)
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
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
      totalIncomes: 0,
      monthsCount: 0
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

  // Detect likely recurring expenses
  const detectedRecurring = []
  for (const [key, item] of Object.entries(descriptionFrequency)) {
    if (item.count >= 2 || (item.count >= 1 && (
      key.includes('netflix') || key.includes('spotify') || key.includes('condominio') ||
      key.includes('internet') || key.includes('aluguel') || key.includes('seguro') ||
      key.includes('plano') || key.includes('claro') || key.includes('vivo') ||
      key.includes('enel') || key.includes('sabesp') || key.includes('tim')
    ))) {
      const avgAmount = item.amounts.reduce((a, b) => a + b, 0) / item.amounts.length
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
