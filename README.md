# Calisto Gastrobar — Gestão Inteligente

ERP completo para gastrobar (mesas, balcão, retirada e delivery), 100% em **Português (PT-BR)**.
Interface escura premium, sem dependências externas além das fontes do Google.

## Como rodar

Não há build nem servidor obrigatório:

1. Abra **`index.html`** no navegador.
2. Entre com:
   - **E-mail:** `admin@calisto.com.br`
   - **Senha:** `calisto123`

> Dica: para evitar restrições de `file://` no navegador, rode um servidor local simples
> na pasta do projeto: `python3 -m http.server 8080` e acesse `http://localhost:8080`.

## Organização

```
calisto-gastrobar/
├── assets/
│   ├── css/
│   │   └── styles.css          # Design system completo (tema escuro premium)
│   ├── img/
│   │   ├── favicon.svg         # Ícone do sistema
│   │   └── logo-calisto.svg    # Logotipo da marca
│   └── js/
│       ├── icons.js            # Ícones SVG inline
│       ├── core.js             # Helpers, formatação, toasts e modais
│       ├── data.js             # Dados de demonstração (produtos, pedidos…)
│       ├── charts.js           # Gráficos SVG (área, rosca, barras)
│       ├── views.js            # Uma função de render por módulo
│       ├── actions.js          # PDV, pagamento dividido e eventos delegados
│       └── app.js              # Shell, navegação, login e persistência
├── index.html                  # Login
├── dashboard.html              # Dashboard
├── pdv.html                    # PDV / Caixa
├── mesas.html                  # Mesas (grade + mapa do salão)
├── comandas.html               # Comandas
├── pedidos.html                # Pedidos
├── cozinha.html                # Cozinha (KDS)
├── cardapio.html               # Cardápio e adicionais
├── estoque.html                # Estoque e movimentações
├── fichas-tecnicas.html        # Fichas técnicas / receitas
├── compras.html                # Compras
├── fornecedores.html           # Fornecedores
├── clientes.html               # Clientes (CRM)
├── delivery.html               # Delivery
├── reservas.html               # Reservas
├── promocoes.html              # Promoções
├── financeiro.html             # Financeiro
├── caixa.html                  # Caixa
├── funcionarios.html           # Funcionários e permissões
├── analytics.html              # Business Analytics
├── relatorios.html             # Relatórios
├── configuracoes.html          # Configurações
├── notificacoes.html           # Central de notificações
└── README.md
```

### Camadas do JavaScript

| Arquivo | Responsabilidade |
|---|---|
| `icons.js` | Biblioteca de ícones SVG |
| `core.js` | `$`, `$$`, formatação BRL/data, `toast`, `openModal`, `confirmDialog` |
| `data.js` | Banco de dados de demonstração em memória |
| `charts.js` | `areaChart`, `donut`, `barRows`, `vBars`, `sparkline` |
| `views.js` | `vDashboard`, `vPos`, `vTables`, … uma função por módulo |
| `actions.js` | Ações do PDV (checkout, pagamento dividido, adicionais) e eventos delegados |
| `app.js` | Shell, menu, navegação entre páginas, login, busca global e persistência |

Cada página HTML é enxuta: contém apenas `data-page` e os `<script>`s compartilhados.
O **shell** (sidebar, topbar, menu mobile) é injetado por `app.js`, garantindo consistência.

## Persistência

Os dados são salvos em `localStorage` (`cg_db`), então **sobrevivem à navegação entre páginas
e ao recarregar**. O carrinho montado na tela de Mesas é levado para o PDV via rascunho.
Para voltar ao estado inicial de demonstração, limpe o `localStorage` do site
(DevTools → Application → Local Storage → remover `cg_db`).

## Atalhos

| Tecla | Ação |
|---|---|
| `Ctrl + K` | Busca global |
| `F2` | PDV / Caixa |
| `F3` | Mesas |
| `Esc` | Fechar modal / busca / notificações |

## Módulos

Dashboard · PDV/Caixa · Mesas · Comandas · Pedidos · Cozinha (KDS) · Cardápio ·
Estoque · Fichas Técnicas · Compras · Fornecedores · Clientes · Delivery · Reservas ·
Promoções · Financeiro · Caixa · Funcionários · Analytics (BI) · Relatórios ·
Notificações · Configurações

---
© 2026 Calisto Gastrobar — Gestão Inteligente v3.2.0
