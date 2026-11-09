/**
 * Compatibility Re-export for Bank Statement & Nubank Parser
 * Directs to the Universal Multi-Bank Statement Parser (OFX & CSV).
 */

export {
  parseFinancialFile,
  parseOFX,
  parseUniversalCSV,
  parseNumber,
  normalizeDate,
  cleanDescription,
  analyzeTransactions,
  BRAZILIAN_BANKS
} from './bankStatementParser'
