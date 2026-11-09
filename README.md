# Gestor Financeiro & Runway

Aplicativo web completo de gestão financeira pessoal e controle de gastos com foco em previsão, cálculo de **Runway** (fôlego financeiro) e importação inteligente de extratos do Nubank.

Desenvolvido para [capellarienrico](https://github.com/capellarienrico).

## Principais Funcionalidades

- **Visão Geral & Fôlego (Runway):** Cálculo em tempo real de quantos meses o seu patrimônio atual dura com base nos seus gastos fixos e variáveis.
- **Assistente & Simulador Diário:** Permite simular: *"Se eu gastar R$ Y por dia, com quanto saldo termino o mês?"* ou calcular o teto diário necessário para atingir uma meta de saldo no último dia do mês.
- **Gastos Diários & Entradas:** Lançamento rápido de despesas e receitas pontuais com categorização automática, filtros e histórico.
- **Gastos Recorrentes (Contas Fixas):** Gestão de despesas que vencem todo dia X (financiamento, condomínio, luz, internet, etc.) com acompanhamento de vencimento no mês.
- **Entradas Recorrentes & Benefícios:** Suporte a parcelas de Seguro-Desemprego (ex: 5 parcelas de R$ 2.400) e estimativa de rendimentos do CDI sobre o capital aplicado.
- **Importador Nubank (CSV / OFX):**
  - Lê faturas de cartão de crédito e extratos da NuConta em segundos.
  - 100% privado (processado localmente no navegador, sem tráfego de dados para servidores externos).
  - Detecta contas fixas automaticamente e calcula a média mensal e diária de gastos.

## Como Executar

```bash
cd C:\gestor-financeiro
npm run dev
```

Acesse no navegador: [http://localhost:5173](http://localhost:5173)
