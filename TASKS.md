# 📋 Quadro de Tarefas (TASKS.md)

Este arquivo coordena as tarefas executadas pelo **Antigravity** e orquestradas pelo **Hermes Agent**.

---

## 🚀 Concluído (v1.0.0)

- [x] Criação do repositório público `capellarienrico/gestor-financeiro` no GitHub.
- [x] Ajuste do CI/CD de compilação do APK Android no GitHub Actions (Node 22 + Java 21 Zulu).
- [x] Geração automática da release `v1.0.0` com download direto do `GestorFinanceiro.apk`.
- [x] Integração Google Identity Services + Google Drive API v3 para backup na nuvem (`drive.file`).
- [x] Remoção de termos sensíveis e substituição por nomenclatura financeira neutra.
- [x] Ajuste de valores iniciais realistas (Caixa: R$ 30k, Salário: R$ 5k, Aluguel: R$ 1.5k, Meta diária: R$ 65).
- [x] Botão Flutuante de Lançamento Rápido (Mobile FAB + Teclado Numérico + Atalho `N`).
- [x] Simulador de Cenários de Estresse financeiro ("E Se?").
- [x] Rendimento ativo de CDI no Runway (~0,855% a.m.).
- [x] Ciclo de Fatura do Cartão (Data de Fechamento vs. Vencimento / Projeção de Liquidação).
- [x] Conciliador de Fatura do Cartão na Planilha Mensal (ajuste em 1 clique para compras esquecidas).
- [x] Parser universal de extratos bancários (OFX / CSV) com memória persistente de estabelecimentos.
- [x] Categorização inteligente via IA (Google Gemini 2.5 Flash batch) com BYOK.
- [x] Dock de Navegação Mobile-First inferior e cabeçalho compacto.

---

## ⏳ Backlog & Melhorias Futuras

- [ ] **[IMP-01] Proxy Serverless Seguro para IA (Gemini Flash)**: Micro-serviço no Cloudflare Workers / Vercel para dispensar configuração manual de API key para novos usuários ([Ver doc](docs/improvements/01-gemini-ai-proxy-serverless.md)).
- [ ] **[IMP-02] Deploy Web Contínuo (GitHub Pages)**: Hospedagem web pública automática via GitHub Actions.
- [ ] **[IMP-03] Exportação de Relatórios**: Download de relatório mensal consolidado em PDF / CSV.
- [ ] **[IMP-04] Notificações Locais**: Lembrete no celular no dia do fechamento da fatura e limite de meta diária via Capacitor Local Notifications.
