export const RELEASES = [
  {
    version: '1.2.0',
    name: 'Notificações Locais & Relatórios Executivos',
    date: '10/11/2026',
    isLatest: true,
    tagline: 'Lembretes diários no horário escolhido pelo usuário e relatórios executivos em PDF/CSV.',
    apkDownloadUrl: 'https://github.com/capellarienrico/gestor-financeiro/releases/download/v1.2.0/GestorFinanceiro.apk',
    githubReleaseUrl: 'https://github.com/capellarienrico/gestor-financeiro/releases/tag/v1.2.0',
    categories: [
      {
        type: 'mobile',
        title: 'Notificações Locais & Lembretes Diários',
        items: [
          'Lembrete diário configurável no horário escolhido pelo usuário (ex: 21:00) para preencher os gastos do dia.',
          'Aviso prévio 2 dias antes do vencimento da fatura do cartão de crédito.',
          'Alerta imediato quando a meta diária (R$ 65/dia) for ultrapassada.',
          'Botão para testar notificações push na hora nas configurações.'
        ]
      },
      {
        type: 'feature',
        title: 'Relatório Executivo Consolidado',
        items: [
          'Relatório mensal executivo com KPIs de Entradas, Saídas, Resultado Líquido e Média Diária.',
          'Distribuição de despesas por categorias com gráficos de barra percentuais.',
          'Exportação direta em PDF formatada para papel A4 com suporte nativo de impressão.',
          'Exportação de dados estruturados em CSV compatíveis com Excel e Sheets.'
        ]
      }
    ]
  },
  {
    version: '1.1.0',
    name: 'Redesign Clean Light & Simplificação de Caixa',
    date: '10/11/2026',
    isLatest: false,
    tagline: 'Nova identidade visual Clean Light e fluxo de caixa direto focado em Débito, Pix e VR.',
    apkDownloadUrl: 'https://github.com/capellarienrico/gestor-financeiro/releases/download/v1.2.0/GestorFinanceiro.apk',
    githubReleaseUrl: 'https://github.com/capellarienrico/gestor-financeiro/releases/tag/v1.2.0',
    categories: [
      {
        type: 'feature',
        title: 'Design Clean Light & Ergonomia',
        items: [
          'Transição completa do tema escuro para Clean Light (off-white, pedra suave, grafite e laranja quente).',
          'Botão "+" de lançamento rápido integrado ao centro da barra de navegação sem sobreposições.',
          'Seletor de horizonte temporal na projeção do saldo (1 mês, 3 meses, 6 meses, 1 ano, 3 anos).'
        ]
      },
      {
        type: 'card',
        title: 'Fluxo de Caixa Simplificado',
        items: [
          'Foco direto em Débito, Pix e VR para compras do dia a dia.',
          'Fatura de cartão de crédito tratada como um único pagamento no vencimento.',
          'Importador de faturas operando como auditoria de categorias e cálculo de médias mensais.'
        ]
      }
    ]
  },
  {
    version: '1.0.0',
    name: 'Lançamento Oficial: Gestor Financeiro & Runway',
    date: '09/11/2026',
    isLatest: false,
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
