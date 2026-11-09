/**
 * Gemini LLM Categorizer Service
 * Calls Google Gemini Flash API to categorize bank and credit card statement transactions
 */

export async function testGeminiApiKey(apiKey) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Chave de API do Gemini não informada.')
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`
  
  const payload = {
    contents: [{
      parts: [{ text: 'Responda apenas: OK' }]
    }]
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}))
    const message = errorJson.error?.message || `Erro ${res.status}: ${res.statusText}`
    throw new Error(message)
  }

  return true
}

export async function categorizeTransactionsWithGemini(transactions = [], categories = [], apiKey = '') {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Por favor, configure sua chave gratuita do Gemini em Configurações para usar a IA.')
  }

  if (!transactions.length) return []

  // Create prompt with available categories
  const categoriesList = categories.map(c => `"${c.id}": "${c.name}"`).join(', ')

  const sampleItems = transactions.map((t, index) => ({
    index,
    description: t.description || t.title || '',
    amount: t.amount
  }))

  const prompt = `Você é um especialista em finanças pessoais e extratos bancários brasileiros (cartões Nubank, Itaú, Inter, etc).
Classifique cada compra abaixo em EXATAMENTE UMA das seguintes categorias válidas:
{ ${categoriesList} }

Regras:
1. Deduza o tipo de comércio pelo nome brasileiro comum (ex: Padaria, Ifood, Mercado, Drogaria, Shell, 99app, Uber, Zara).
2. Se o nome tiver "PAG*", "MP*", "PAGAR.ME*", extraia o nome real do estabelecimento comercial.
3. Responda ESTRITAMENTE em formato JSON (sem markdown, sem texto antes ou depois) como um array de objetos:
[
  { "index": 0, "category": "alimentacao", "merchantClean": "Padaria Estrela" }
]

Itens para classificar:
${JSON.stringify(sampleItems, null, 2)}`

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 2048,
      responseMimeType: "application/json"
    }
  }

  const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash']
  let lastError = null

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}))
        throw new Error(errorJson.error?.message || `Status ${res.status}`)
      }

      const data = await res.json()
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
      
      // Clean JSON in case markdown fences are included
      const cleanedJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsedResults = JSON.parse(cleanedJsonText)

      return parsedResults
    } catch (err) {
      lastError = err
      console.warn(`Tentativa com modelo ${model} falhou:`, err.message)
    }
  }

  throw new Error(`Falha na IA do Gemini: ${lastError?.message || 'Erro desconhecido'}`)
}
