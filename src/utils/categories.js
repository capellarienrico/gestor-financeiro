export const DEFAULT_CATEGORIES = [
  { id: 'moradia', name: 'Moradia & Contas', color: '#3b82f6', icon: 'Home', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'alimentacao', name: 'Alimentação & Mercado', color: '#10b981', icon: 'Utensils', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'transporte', name: 'Transporte & Carro', color: '#f59e0b', icon: 'Car', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'saude', name: 'Saúde & Farmácia', color: '#ef4444', icon: 'HeartPulse', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { id: 'lazer', name: 'Lazer & Assinaturas', color: '#8b5cf6', icon: 'Tv', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'servicos', name: 'Serviços & Internet', color: '#06b6d4', icon: 'Wifi', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { id: 'educacao', name: 'Educação & Cursos', color: '#ec4899', icon: 'GraduationCap', bg: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  { id: 'pessoal', name: 'Compras & Pessoal', color: '#6366f1', icon: 'ShoppingBag', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { id: 'outros', name: 'Outros / Diversos', color: '#64748b', icon: 'Tag', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
]

export const DEFAULT_INCOME_CATEGORIES = [
  { id: 'rescisao', name: 'Rescisão & FGTS', color: '#10b981', icon: 'Briefcase', bg: 'bg-emerald-500/10 text-emerald-400' },
  { id: 'seguro', name: 'Seguro-Desemprego', color: '#06b6d4', icon: 'ShieldCheck', bg: 'bg-cyan-500/10 text-cyan-400' },
  { id: 'rendimentos', name: 'Rendimentos de Aplicações', color: '#3b82f6', icon: 'TrendingUp', bg: 'bg-blue-500/10 text-blue-400' },
  { id: 'salario', name: 'Salário / Prestação de Serviço', color: '#8b5cf6', icon: 'Wallet', bg: 'bg-purple-500/10 text-purple-400' },
  { id: 'outros_in', name: 'Outras Entradas', color: '#64748b', icon: 'ArrowDownLeft', bg: 'bg-slate-500/10 text-slate-400' },
]

export const CATEGORIES = DEFAULT_CATEGORIES
export const INCOME_CATEGORIES = DEFAULT_INCOME_CATEGORIES

export const CATEGORY_KEYWORDS = {
  moradia: ['aluguel', 'condominio', 'enel', 'luz', 'eletricidade', 'agua', 'sabesp', 'gas', 'comgas', 'financiamento', 'imobiliario', 'quintoandar', 'iptu', 'caixa habitacional'],
  alimentacao: ['ifood', 'rappi', 'mercado', 'supermercado', 'pao de acucar', 'carrefour', 'extra', 'mcdonald', 'burger', 'padaria', 'acougue', 'hortifruti', 'restaurante', 'cafe', 'starbucks', 'bobs', 'subway', 'outback'],
  transporte: ['uber', '99app', 'posto', 'gasolina', 'combustivel', 'etanol', 'shell', 'ipiranga', 'petrobras', 'sem parar', 'veloe', 'conectcar', 'pedagio', 'estacionamento', 'metro', 'onibus'],
  saude: ['drogaria', 'farmacia', 'raia', 'drogasil', 'pague menos', 'consulta', 'medico', 'dentista', 'hospital', 'laboratorio', 'fleury', 'unimed', 'amil', 'bradesco saude', 'sulamerica'],
  lazer: ['netflix', 'spotify', 'amazon prime', 'prime video', 'hbo', 'max', 'disney', 'youtube', 'deezer', 'apple music', 'steam', 'playstation', 'cinema', 'ingresso', 'teatro', 'show'],
  servicos: ['vivo', 'claro', 'tim', 'oi', 'internet', 'fibra', 'aws', 'google storage', 'icloud', 'dropbox', 'chatgpt', 'openai', 'github'],
  educacao: ['udemy', 'alura', 'faculdade', 'escola', 'curso', 'livro', 'amazon books', 'saraiva'],
  pessoal: ['zara', 'renner', 'riachuelo', 'mercado livre', 'shein', 'shopee', 'aliexpress', 'cabelo', 'barbearia', 'salao'],
}

export function autoCategorize(text = '', defaultCategory = 'outros', customList = null) {
  if (!text) return defaultCategory
  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return catId
      }
    }
  }
  return defaultCategory
}

export function getCategoryById(id, type = 'expense', customList = null) {
  const list = customList || (type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_CATEGORIES)
  const found = list.find(c => c.id === id)
  if (found) return found
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    color: '#64748b',
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }
}
