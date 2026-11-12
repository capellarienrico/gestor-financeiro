# 🚀 Histórico de Lançamentos & Releases

Todas as versões do **Gestor Financeiro & Runway** são documentadas neste arquivo, iniciando a partir da versão **1.0.0**.

---

## [v1.2.1] - 2026-11-11 — Ajuste de Área Segura (Safe Area) & Status Bar

### 📱 Ergonomia Mobile & Status Bar
- **Ajuste de Top Safe Area (`pt-safe`):** A barra superior do aplicativo agora respeita o espaçamento da barra de status do sistema e entalhes de câmera (notch / punch hole), impedindo sobreposição de ícones do sistema sobre o logo, versão e botão de saldo.
- **Plugin Nativo `@capacitor/status-bar`:** Detecção em tempo de execução da altura exata da barra de status com injeção automática da variável CSS `--status-bar-height` e piso de segurança para dispositivos móveis.
- **Estilo de Status Bar Claro:** Ícones escuros na barra de status para máxima visibilidade contra o cabeçalho Clean Light, além de meta tags `theme-color` e `apple-mobile-web-app-status-bar-style` atualizadas.

---

## [v1.2.0] - 2026-11-10 — Notificações Locais & Relatórios Executivos

### 🔔 Notificações Locais & Lembretes Diários (IMP-04)
- **Lembrete Diário no Horário Escolhido:** Notificação push configurável no horário desejado (ex: 21:00) para registrar as despesas do dia e manter a disciplina sem esquecimentos.
- **Aviso de Fatura de Cartão:** Notificação preventiva 2 dias antes do vencimento da fatura.
- **Alerta de Meta Diária:** Aviso instantâneo caso os gastos diários ultrapassem a meta definida (R$ 65/dia).
- **Botão de Demonstração & Teste:** Permite testar as notificações imediatamente nas Configurações.

### 📄 Relatório Executivo Consolidado (IMP-03)
- **Modal de Relatório Mensal:** Exibe visão executiva com KPIs de Entradas, Saídas, Resultado Líquido (Superávit/Déficit), Média Diária Real vs Meta e distribuição por categorias.
- **Exportação em PDF (`window.print`):** Layout otimizado em A4 com suporte nativo a "Salvar como PDF" tanto no celular quanto no PC, sem dependências pesadas.
- **Exportação CSV Direta:** Download de dados estruturados compatíveis com Excel e Google Planilhas.

---

## [v1.1.0] - 2026-11-10 — Redesign Clean Light & Simplificação de Caixa

### 🎨 Redesign Clean Light Mode
- Transição completa da antiga estética escura/neon para um design sóbrio, elegante e ergonômico (*warm stone*, *off-white*, grafite e acentos em laranja quente).
- Integração do botão `+` de Gasto Rápido no centro da dock inferior de navegação sem sobreposições.

### 💳 Fluxo de Caixa Direto (Débito, Pix e VR)
- Eliminação do conceito confuso de "Data da Compra vs Data de Liquidação" na planilha.
- O cartão de crédito passa a entrar como uma única saída no dia do vencimento da fatura.
- O importador de fatura de cartão opera como painel analítico com médias e divisão de categorias.
- Seletor de Horizonte de Projeção temporal no gráfico (1m, 3m, 6m, 1a, 3a).

---

## [v1.0.0] - 2026-11-09 — Lançamento Oficial

> **APK Android**: [Download GestorFinanceiro.apk (v1.0.0)](https://github.com/capellarienrico/gestor-financeiro/releases/download/v1.0.0/GestorFinanceiro.apk)  
> **Release GitHub**: [github.com/capellarienrico/gestor-financeiro/releases/tag/v1.0.0](https://github.com/capellarienrico/gestor-financeiro/releases/tag/v1.0.0)

### 📊 Planilha Mensal & Runway Pro
- **Projeção de Saldo Diário:** Acompanhamento dia a dia do saldo acumulado do mês considerando gastos lançados e recorrentes futuros.
- **Rendimento Ativo de CDI:** Projeção dinâmica de rendimento de reserva de emergência (~0,855% a.m.) no cálculo de meses de sobrevivência (Runway).
- **Coluna Fixa (*Sticky*) no Celular:** A coluna "Dia" permanece congelada durante a rolagem horizontal das categorias na planilha.
- **Valores Padrão Modestos e Realistas:** Configuração inicial de R$ 30.000 de caixa, R$ 5.000 de salário, R$ 1.500 de aluguel e meta diária de R$ 65/dia.

### 💳 Cartão de Crédito & Conciliador de Fatura
- **Ciclo de Fechamento vs. Vencimento:** Configuração dos dias do cartão com cálculo automático de liquidação bancária e estimativa do "melhor dia de compra".
- **Alternador de Visualização:** Alterne a visualização da planilha entre a *Data da Compra* e a *Data da Liquidação Bancária*.
- **Conciliador de Fatura:** Módulo que compara o valor consolidado de gastos do cartão no app com a fatura real fechada no banco e calcula a diferença não anotada, permitindo o lançamento em 1 clique.

### 🤖 Importação de Extratos & Inteligência Artificial
- **Parser Multi-Banco Universal:** Suporte para importação de extratos OFX e CSV de faturas de qualquer banco brasileiro (Nubank, Itaú, Inter, Bradesco, Santander, etc.).
- **Categorização em Lote com Google Gemini 2.5 Flash:** Integração direta com a API do Gemini Flash para categorizar automaticamente dezenas de transações.
- **Memória & Dicionário de Estabelecimentos:** Gravação local de nomes e lojas para categorização instantânea sem necessidade de consultar IA repetidamente.

### 📱 Experiência Mobile-First & Android APK
- **Botão Flutuante (FAB) de Lançamento Rápido:** Acesso instantâneo em qualquer tela, teclado numérico ativado por padrão (`inputMode="decimal"`), atalho de teclado `N` e botões rápidos para categorias frequentes (Café, Almoço, Mercado, Uber, Farmácia, Fatura Cartão, Pix).
- **Dock de Navegação Inferior:** Barra nativa mobile fixa no rodapé com suporte às áreas seguras (*Safe Area* de iOS e Android).
- **Compilação Automatizada no GitHub Actions:** Pipeline CI/CD que constrói o APK Android via Capacitor 8 com Java 21 Zulu e publica diretamente nas Releases do GitHub.

### 🔒 Nuvem Privada & Privacidade
- **Sincronização Direta com Google Drive:** Integração segura via Google Identity Services (`drive.file`) com auto-sync a cada 2,5 segundos e suporte a múltiplos aparelhos.
- **Zero Servidores Intermediários:** Todos os dados financeiros ficam criptografados e salvos unicamente no aparelho do usuário e no seu próprio Google Drive.
- **Simulador de Cenários ("E Se?"):** Testes de estresse financeiro com sliders interativos para prever o impacto de cortes de gastos ou emergências.
