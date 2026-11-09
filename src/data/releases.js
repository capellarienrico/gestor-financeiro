export const RELEASES = [
  {
    version: '1.0.0',
    name: 'Lançamento Oficial: Gestor Financeiro & Runway',
    date: '09/11/2026',
    isLatest: true,
    tagline: 'Primeira versão estável com projeção de runway, conciliação de cartão, IA e suporte nativo Android.',
    apkDownloadUrl: 'https://github.com/capellarienrico/gestor-financeiro/releases/download/v1.0.0/GestorFinanceiro.apk',
    githubReleaseUrl: 'https://github.com/capellarienrico/gestor-financeiro/releases/tag/v1.0.0',
    categories: [
      {
        type: 'feature',
        title: 'Planilha Mensal & Runway Pro',
        items: [
          'Projeção de saldo diário acumulado com rendimento ativo de CDI (~0,855% a.m.).',
          'Teto orçamentário diário dinâmico com indicador de dias até o dinheiro acabar (Runway).',
          'Coluna "Dia" com travamento horizontal (*sticky*) para navegação fluida em telas de celulares.',
          'Valores padrão realistas (R$ 30.000 de caixa inicial, R$ 5.000 de salário e meta de R$ 65/dia).'
        ]
      },
      {
        type: 'card',
        title: 'Cartão de Crédito & Conciliador de Fatura',
        items: [
          'Cálculo automático de Fechamento vs. Vencimento da fatura do cartão com estimativa do "melhor dia de compra".',
          'Visualização alternável na planilha: Data da Compra vs. Data de Liquidação Bancária.',
          'Conciliador de Fatura: compara o total lançado no app com o valor real da fatura do banco e lança a diferença em 1 clique.'
        ]
      },
      {
        type: 'ai',
        title: 'Importação Multi-Banco & IA Gemini Flash',
        items: [
          'Parser universal de arquivos OFX e CSV (Nubank, Itaú, Inter, Bradesco, Santander, etc.).',
          'Categorização inteligente em lote via Google Gemini 2.5 Flash direta no dispositivo.',
          'Dicionário com memória de estabelecimentos: o app grava lojas conhecidas e nunca mais repete perguntas.',
          'Limpeza automática de prefixos e sufixos bancários (ex: PAG*, MP*, -Me).'
        ]
      },
      {
        type: 'mobile',
        title: 'Experiência Mobile-First & Android Nativo',
        items: [
          'Botão Flutuante (FAB) de lançamento rápido com teclado numérico automático (`inputMode="decimal"`).',
          'Presets instantâneos de despesa (Café, Almoço, Mercado, Uber, Farmácia, Fatura Cartão, Pix).',
          'Barra de navegação inferior (Bottom Dock) estilo app nativo com suporte a iPhone/Android Safe Areas.',
          'Instalador APK Android autônomo gerado via GitHub Actions CI/CD (Node 22 + Java 21).'
        ]
      },
      {
        type: 'cloud',
        title: 'Nuvem Privada & Simulações',
        items: [
          'Sincronização automática com seu Google Drive pessoal (escopo seguro `drive.file`) com auto-sync a cada 2.5s.',
          'Simulador de Estresse Financeiro ("E Se?"): sliders para testar despesas extras e cortes de gastos em tempo real.',
          'Nenhum servidor intermediário: 100% dos dados permanecem estritamente sob o controle do usuário.'
        ]
      }
    ]
  }
]
