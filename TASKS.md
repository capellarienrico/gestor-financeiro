# 📋 Quadro de Tarefas (TASKS.md)

Este arquivo coordena as tarefas executadas pelo **Antigravity** e orquestradas pelo **Hermes Agent**.

---

## 🚀 Concluído (v1.0.0 & v1.1.0)

- [x] Criação do repositório público `capellarienrico/gestor-financeiro` no GitHub.
- [x] Ajuste do CI/CD de compilação do APK Android no GitHub Actions (Node 22 + Java 21 Zulu).
- [x] Geração automática da release `v1.0.0` com download direto do `GestorFinanceiro.apk`.
- [x] Integração Google Identity Services + Google Drive API v3 para backup na nuvem (`drive.file`).
- [x] Remoção de termos sensíveis e substituição por nomenclatura financeira neutra.
- [x] Ajuste de valores iniciais realistas (Caixa: R$ 30k, Salário: R$ 5k, Aluguel: R$ 1.5k, Meta diária: R$ 65).
- [x] Botão de Lançamento Rápido integrado no centro da barra de navegação inferior (sem sobreposições).
- [x] Simulador de Cenários de Estresse financeiro ("E Se?").
- [x] Rendimento ativo de CDI no Runway (~0,855% a.m.).
- [x] Redesign Clean Light Mode (warm stone + off-white + charcoal + warm orange) eliminando estética vibecoded escura/neon.
- [x] Correção integral da tela de Ajustes/Configurações (todas as abas operacionais).
- [x] Simplificação da Planilha Mensal (consolidação em Entradas, Saídas e Saldo).
- [x] Correção de botões de edição de transações e contas fixas.
- [x] Seletor de Horizonte de Projeção no gráfico de saldo (1 mês, 3 meses, 6 meses, 1 ano, 3 anos).
- [x] Simplificação do Fluxo de Caixa Diário: focado em Débito, Pix e VR.
- [x] Tratamento de Cartão de Crédito como lançamento único no vencimento, com importador de faturas servindo para diagnóstico de categorias e médias mensais.
- [x] Parser universal de extratos bancários (OFX / CSV) com memória persistente de estabelecimentos.
- [x] Categorização inteligente via IA (Google Gemini 2.5 Flash batch) com BYOK.
- [x] Modal e Histórico de Releases integrado diretamente no app.

---

## ⏳ Em Aberto & Backlog Prioritário

- [ ] **[FEAT-01] Alocação de Saldo (Liquidez Diária vs. Investido)**: Dividir o saldo atual entre caixa livre para o dia a dia e dinheiro guardado/investido que rende CDI, prevenindo gasto acidental da reserva.
- [ ] **[IMP-01] Proxy Serverless Seguro para IA (Gemini Flash)**: Micro-serviço no Cloudflare Workers / Vercel para dispensar configuração manual de API key para novos usuários ([Ver doc](docs/improvements/01-gemini-ai-proxy-serverless.md)).
- [ ] **[IMP-02] Deploy Web Contínuo (GitHub Pages)**: Hospedagem web pública automática via GitHub Actions para testar direto no navegador sem instalar APK.
- [ ] **[IMP-03] Exportação de Relatórios Avançados**: Download de relatório mensal consolidado em PDF além do CSV.
- [ ] **[IMP-04] Notificações Locais**: Lembrete no celular no dia do vencimento da fatura e limite de meta diária via Capacitor Local Notifications.
