/* ==========================================================================
   CALISTO GASTROBAR — APLICAÇÃO
   Shell (sidebar + topbar), navegação entre páginas, autenticação,
   persistência local, busca global e notificações.
   ========================================================================== */

/* ------------------------------ PERSISTÊNCIA ------------------------------ */
const Store = (() => {
  let mem = {}, ok = true;
  try { localStorage.setItem('__cg_t', '1'); localStorage.removeItem('__cg_t'); } catch (e) { ok = false; }
  return {
    available: ok,
    get(k) { try { if (ok) return localStorage.getItem(k); } catch (e) {} return mem[k] ?? null; },
    set(k, v) { try { if (ok) { localStorage.setItem(k, v); return; } } catch (e) {} mem[k] = v; },
    del(k) { try { if (ok) { localStorage.removeItem(k); return; } } catch (e) {} delete mem[k]; }
  };
})();

/* Restaura o banco salvo (converte strings ISO de volta para Date) */
(function restoreDB() {
  const raw = Store.get('cg_db');
  if (raw) {
    try {
      const saved = JSON.parse(raw, (k, v) =>
        (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) ? new Date(v) : v);
      Object.assign(DB, saved);
    } catch (e) { /* dados corrompidos: mantém o demo */ }
  }
  const nums = DB.comandas.map(c => parseInt(String(c.id).replace(/\D/g, ''), 10) || 0);
  cmdN = Math.max(cmdN, ...nums, 3200);
})();
function saveDB() { Store.set('cg_db', JSON.stringify(DB)); }
function saveDraftPos() { Store.set('cg_draft_pos', JSON.stringify(state.pos)); }

/* ------------------------------ PÁGINAS ------------------------------ */
const PAGES = {
  dashboard: 'dashboard.html', pos: 'pdv.html', tables: 'mesas.html', comandas: 'comandas.html',
  orders: 'pedidos.html', kds: 'cozinha.html', menu: 'cardapio.html', stock: 'estoque.html',
  recipes: 'fichas-tecnicas.html', purchases: 'compras.html', suppliers: 'fornecedores.html',
  clients: 'clientes.html', delivery: 'delivery.html', reservations: 'reservas.html',
  promos: 'promocoes.html', finance: 'financeiro.html', cashier: 'caixa.html',
  staff: 'funcionarios.html', analytics: 'analytics.html', reports: 'relatorios.html',
  settings: 'configuracoes.html', notifications: 'notificacoes.html'
};

/* ------------------------------ NAVEGAÇÃO ------------------------------ */
const NAV = [
  { g: 'Operação', items: [
    ['dashboard', 'Dashboard', 'dashboard'], ['pos', 'PDV / Caixa', 'pos'], ['tables', 'Mesas', 'tables'],
    ['comandas', 'Comandas', 'comanda'], ['orders', 'Pedidos', 'orders'],
    ['kds', 'Cozinha (KDS)', 'kitchen', () => DB.pedidos.filter(o => ['Novo', 'Em preparo', 'Pronto'].includes(o.status)).length]
  ]},
  { g: 'Catálogo & Estoque', items: [
    ['menu', 'Cardápio', 'menu'], ['stock', 'Estoque', 'stock'], ['recipes', 'Fichas Técnicas', 'knife'],
    ['purchases', 'Compras', 'purchases'], ['suppliers', 'Fornecedores', 'suppliers']
  ]},
  { g: 'Relacionamento', items: [
    ['clients', 'Clientes', 'clients'], ['delivery', 'Delivery', 'delivery'],
    ['reservations', 'Reservas', 'reserv'], ['promos', 'Promoções', 'promo']
  ]},
  { g: 'Gestão', items: [
    ['finance', 'Financeiro', 'finance'], ['cashier', 'Caixa', 'wallet'], ['staff', 'Funcionários', 'staff'],
    ['analytics', 'Analytics', 'analytics'], ['reports', 'Relatórios', 'reports'], ['settings', 'Configurações', 'settings']
  ]}
];
const MOBILE_NAV = [['dashboard', 'Início', 'dashboard'], ['pos', 'PDV', 'pos'], ['tables', 'Mesas', 'tables'], ['kds', 'Cozinha', 'kitchen'], ['orders', 'Pedidos', 'orders']];
const VIEW_META = {
  dashboard: ['Dashboard', 'Visão geral do negócio em tempo real'],
  pos: ['PDV / Caixa', 'Ponto de venda rápido e eficiente'],
  tables: ['Mesas', 'Gestão do salão e ocupação'],
  comandas: ['Comandas', 'Controle de contas em aberto'],
  orders: ['Pedidos', 'Acompanhe todos os pedidos'],
  kds: ['Cozinha (KDS)', 'Painel de preparo em tempo real'],
  menu: ['Cardápio', 'Produtos, preços e adicionais'],
  stock: ['Estoque', 'Controle de insumos e produtos'],
  recipes: ['Fichas Técnicas', 'Ingredientes, custos e margens'],
  purchases: ['Compras', 'Ordens de compra e recebimento'],
  suppliers: ['Fornecedores', 'Parceiros e histórico'],
  clients: ['Clientes', 'CRM e segmentação'],
  delivery: ['Delivery', 'Gestão de entregas'],
  reservations: ['Reservas', 'Agenda do salão'],
  promos: ['Promoções', 'Campanhas e descontos'],
  finance: ['Financeiro', 'Contas a pagar e receber'],
  cashier: ['Caixa', 'Abertura, sangria e fechamento'],
  staff: ['Funcionários', 'Equipe e permissões'],
  analytics: ['Business Analytics', 'Indicadores estratégicos'],
  reports: ['Relatórios', 'Exportação e análise'],
  settings: ['Configurações', 'Preferências do sistema'],
  notifications: ['Notificações', 'Central de avisos do sistema']
};

/* ------------------------------ ESTADO ------------------------------ */
const state = {
  view: 'dashboard', user: null,
  pos: { cat: 'all', tipo: 'Mesa', cart: [], cliente: '', mesa: '', garcom: 'Juliana Alves', desc: 0, obs: '', pay: 'PIX', split: [] },
  ordersFilter: 'Hoje', menuTab: 'produtos', stockTab: 'insumos', financeTab: 'pagar', cashTab: 'mov',
  settingsTab: 'negocio', chartPeriod: 'semana', mesaView: 'grid', selectedTable: null, comandaSel: null,
  clientFilter: null, staffTab: 'equipe', kdsTimer: null
};

/* ------------------------------ TEMPLATES ------------------------------ */
const SHELL_HTML = (user) => `
  <div id="shell" class="on">
    <div class="sb-back hidden" id="sbBack"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sb-head">
        <div class="flex ai-c gap-12">
          <div class="brand-mark">C</div>
          <div class="brand-text"><b>Calisto</b><span>Gastrobar</span></div>
        </div>
        <button class="sb-close" id="sbClose"></button>
      </div>
      <nav class="sb-scroll" id="nav"></nav>
      <div class="sb-foot">
        <div class="sb-user" id="sbUser">
          <div class="avatar" id="sbAvatar">${initials(user.nome)}</div>
          <div style="min-width:0"><b id="sbName">${esc(user.nome)}</b><small id="sbRole">${esc(user.cargo)}</small></div>
          <svg style="margin-left:auto;color:var(--muted)" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <button class="icon-btn burger" id="burger"></button>
        <div class="search-global">
          <div class="input-wrap">
            <span class="lead">${ICONS.search}</span>
            <input class="input" id="globalSearch" placeholder="Buscar produtos, pedidos, clientes, mesas..." autocomplete="off"/>
            <kbd>Ctrl K</kbd>
          </div>
          <div id="searchResults"></div>
        </div>
        <div class="top-right">
          <button class="icon-btn" id="btnKds" title="Cozinha (KDS)">${ICONS.kitchen}</button>
          <div style="position:relative">
            <button class="icon-btn" id="btnNotif" title="Notificações">${ICONS.bell}</button>
            <span class="badge-dot pulse" id="notifDot"></span>
          </div>
          <div style="position:relative">
            <button class="user-btn" id="btnUser">
              <div class="avatar sm">${initials(user.nome)}</div>
              <div class="who"><b>${esc(user.nome)}</b><small>${esc(user.cargo)}</small></div>
              <svg style="color:var(--muted)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </div>
        </div>
      </header>
      <main class="content" id="view"></main>
    </div>

    <nav class="mobile-nav" id="mobileNav"></nav>
  </div>
  <div id="modalRoot"></div>
  <div id="toasts"></div>`;

const LOGIN_HTML = `
  <div id="login">
    <div class="lg-bg"><div class="lg-orb o1"></div><div class="lg-orb o2"></div><div class="lg-orb o3"></div></div>
    <form class="login-card" id="loginForm" autocomplete="on">
      <div class="brand-lg">
        <div class="brand-mark">C</div>
        <div style="text-align:center">
          <b style="font-family:var(--font-display);font-size:20px;display:block">Calisto Gastrobar</b>
          <span style="font-size:10.5px;color:var(--amber);letter-spacing:3px;text-transform:uppercase;font-weight:700">Gestão Inteligente</span>
        </div>
      </div>
      <h1>Bem-vindo de volta</h1>
      <p class="sub">Acesse o painel para gerenciar seu gastrobar.</p>
      <div id="loginErr" class="login-err hidden">
        ${ICONS.alert}
        <span id="loginErrText">E-mail ou senha inválidos.</span>
      </div>
      <div class="field">
        <label>E-mail</label>
        <div class="input-wrap">
          <span class="lead">${ICONS.user}</span>
          <input class="input" type="email" id="lgEmail" placeholder="voce@calisto.com.br" value="admin@calisto.com.br" autocomplete="username"/>
        </div>
      </div>
      <div class="field">
        <label>Senha</label>
        <div class="input-wrap">
          <span class="lead">${ICONS.lock}</span>
          <input class="input eye" type="password" id="lgPass" placeholder="••••••••" value="calisto123" autocomplete="current-password"/>
          <button type="button" class="eye-btn" id="eyeBtn" title="Mostrar senha">${ICONS.eye}</button>
        </div>
      </div>
      <div class="login-row">
        <label class="check"><input type="checkbox" id="remember" checked/> Lembrar-me</label>
        <span class="link" id="forgot">Esqueci minha senha</span>
      </div>
      <button class="btn btn-primary btn-lg btn-block" id="loginBtn" type="submit">Entrar no painel</button>
      <div class="demo-hint">Ambiente de demonstração — use <b>admin@calisto.com.br</b> / <b>calisto123</b></div>
      <div class="login-foot"><span>v3.2.0 · ERP</span><span>© 2026 Calisto Gastrobar</span></div>
    </form>
  </div>`;

/* ------------------------------ SHELL ------------------------------ */
function buildShell() {
  $('#app').innerHTML = SHELL_HTML(state.user);
  bindShellEvents();
}
function buildNav() {
  $('#nav').innerHTML = NAV.map(g => `<div class="nav-group"><span>${g.g}</span>${g.items.map(it => {
    const badge = it[3] ? (typeof it[3] === 'function' ? it[3]() : it[3]) : null;
    return `<a class="nav-item" href="${PAGES[it[0]]}" data-view="${it[0]}">${ICONS[it[2]]}<span>${it[1]}</span>${badge ? `<span class="tag">${badge}</span>` : ''}</a>`;
  }).join('')}</div>`).join('');
  $('#mobileNav').innerHTML = MOBILE_NAV.map(it =>
    `<a href="${PAGES[it[0]]}" data-view="${it[0]}">${ICONS[it[2]]}<span>${it[1]}</span></a>`).join('');
  $('#mobileNav').style.textDecoration = 'none';
}
function markNav() {
  $$('#nav .nav-item, #mobileNav a').forEach(n => {
    n.classList.toggle('active', n.dataset.view === state.view);
    n.classList.toggle('on', n.dataset.view === state.view);
  });
}
function bindShellEvents() {
  const b = $('#burger'); if (b) b.onclick = () => { $('#sidebar').classList.add('open'); $('#sbBack').classList.remove('hidden'); };
  const sc = $('#sbClose'); if (sc) sc.onclick = closeSidebar;
  const bk = $('#sbBack'); if (bk) bk.onclick = closeSidebar;
  const kd = $('#btnKds'); if (kd) kd.onclick = () => navigate('kds');
  const su = $('#sbUser'); if (su) su.onclick = profileMenu;
  const uu = $('#btnUser'); if (uu) uu.onclick = profileMenu;
  const nb = $('#btnNotif'); if (nb) nb.onclick = toggleNotif;
  bindGlobalSearch();
  bindShortcuts();
}
function closeSidebar() { $('#sidebar').classList.remove('open'); $('#sbBack').classList.add('hidden'); }

/* ------------------------------ RENDER / NAVEGAÇÃO ------------------------------ */
function render() {
  const fn = VIEWS[state.view] || VIEWS.dashboard;
  $('#view').innerHTML = `<div class="view">${fn()}</div>`;
  bindView();
  markNav();
  saveDB();
}
function pageHead(extra = '', showMeta = true) {
  const [t, s] = VIEW_META[state.view] || ['', ''];
  return `<div class="page-head"><div><h2>${t}</h2>${showMeta ? `<p>${s}</p>` : ''}</div><div class="page-actions">${extra}</div></div>`;
}
function navigate(view, params) {
  const file = PAGES[view];
  if (!file) { render(); return; }
  saveDB();
  let url = file;
  if (params) url += '?' + new URLSearchParams(params).toString();
  location.href = url;
}
function bindView() {
  if (state.view === 'dashboard') {
    $$('#view .cdot').forEach(c => {
      c.style.transition = 'opacity .15s,transform .15s';
      c.addEventListener('mouseenter', () => {
        const svg = c.ownerSVGElement, tip = svg.parentElement.querySelector('.chart-tip');
        if (!tip) return;
        c.style.opacity = '1'; c.style.transform = 'scale(1.3)';
        tip.textContent = c.dataset.l + ' · ' + c.dataset.v; tip.style.opacity = '1';
        const r = svg.getBoundingClientRect();
        tip.style.left = (r.left + (+c.dataset.x) / 760 * r.width - 30) + 'px';
        tip.style.top = (r.top + (+c.dataset.y) / 230 * r.height - 34) + 'px';
      });
    });
  }
}

/* ------------------------------ AUTENTICAÇÃO ------------------------------ */
function initLogin() {
  $('#app').innerHTML = LOGIN_HTML + '<div id="modalRoot"></div><div id="toasts"></div>';
  let shown = false;
  $('#eyeBtn').onclick = () => { shown = !shown; $('#lgPass').type = shown ? 'text' : 'password'; $('#eyeBtn').innerHTML = shown ? ICONS.eyeoff : ICONS.eye; };
  $('#forgot').onclick = () => toast('Enviamos um link de redefinição para o seu e-mail.', 'info', 'Recuperação de senha');
  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = $('#lgEmail').value.trim(), pass = $('#lgPass').value, btn = $('#loginBtn');
    $('#loginErr').classList.add('hidden');
    btn.innerHTML = '<span class="spinner"></span> Entrando...'; btn.disabled = true;
    setTimeout(() => {
      const emp = DB.funcionarios.find(f => f.email === email);
      if (!emp || pass.length < 6) {
        btn.innerHTML = 'Entrar no painel'; btn.disabled = false;
        $('#loginErrText').textContent = !emp ? 'E-mail não cadastrado no sistema.' : 'Senha incorreta. Tente novamente.';
        $('#loginErr').classList.remove('hidden');
        return;
      }
      Store.set('cg_user', emp.id);
      $('#login').style.transition = 'opacity .45s,transform .45s';
      $('#login').style.opacity = '0'; $('#login').style.transform = 'scale(1.03)';
      setTimeout(() => { location.href = 'dashboard.html'; }, 420);
    }, 800);
  });
  setTimeout(() => { const em = $('#lgEmail'); if (em) { em.focus(); em.select(); } }, 500);
}
function logout() {
  confirmDialog('Encerrar sessão', 'Deseja realmente sair do painel? Você precisará fazer login novamente.', () => {
    Store.del('cg_user');
    toast('Sessão encerrada com segurança.', 'info', 'Até logo!');
    setTimeout(() => location.href = 'index.html', 500);
  }, { label: 'Sair', danger: true });
}
function profileMenu() {
  const u = state.user || DB.funcionarios[0];
  const o = openModal(`
    <div class="modal-head"><h3>Meu perfil</h3><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body">
      <div class="flex ai-c gap-16 mb-16"><div class="avatar lg">${initials(u.nome)}</div><div><b style="font-size:17px;font-family:var(--font-display)">${esc(u.nome)}</b><div class="muted small">${esc(u.cargo)} · ${esc(u.email)}</div><span class="badge b-green mt-8"><span class="dot"></span>Online</span></div></div>
      <div class="divider"></div>
      <div class="grid g-2">
        <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.check}</div><div><b>86%</b><small>Pedidos no prazo</small></div></div>
        <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.star}</div><div><b>4.9</b><small>Avaliação média</small></div></div>
      </div>
      <div class="divider"></div>
      <div class="set-nav">
        <button data-close>${ICONS.user} Editar dados pessoais</button>
        <button data-close>${ICONS.lock} Alterar senha</button>
        <button data-close>${ICONS.bell2} Preferências de notificação</button>
        <button data-close style="color:#ff8378" id="pmLogout">${ICONS.logout} Encerrar sessão</button>
      </div>
    </div>`, 'sm');
  o.querySelectorAll('[data-close]').forEach(b => { if (b.id !== 'pmLogout') b.onclick = closeModal; });
  const lg = o.querySelector('#pmLogout'); if (lg) lg.onclick = () => { closeModal(); logout(); };
}

/* ------------------------------ NOTIFICAÇÕES ------------------------------ */
function renderNotifMenu() {
  const unread = DB.notifs.filter(n => n.unread).length;
  const dot = $('#notifDot'); if (dot) dot.style.display = unread ? 'block' : 'none';
  return `
  <div class="dropdown" id="notifDd">
    <div class="dd-head"><b>Notificações ${unread ? `<span class="badge b-amber" style="margin-left:6px">${unread} novas</span>` : ''}</b><span class="link small" data-markall>Marcar todas como lidas</span></div>
    <div class="dd-body">${DB.notifs.slice(0, 7).map(n => `
      <div class="dd-item ${n.unread ? 'unread' : ''}">
        <div class="ico" style="background:var(--${n.color}-soft);color:var(--${n.color})">${ICONS[n.ico]}</div>
        <div style="min-width:0;flex:1"><b>${esc(n.titulo)}</b><p>${esc(n.msg)}</p></div>
        <time>${timeAgo(n.hora)}</time>
      </div>`).join('')}</div>
    <div class="dd-foot" data-gonotif>Ver todas as notificações</div>
  </div>`;
}
function toggleNotif(e) {
  e.stopPropagation();
  const ex = $('#notifDd'); if (ex) { ex.remove(); return; }
  const old = $('#btnUser') && $('#btnUser').parentElement.querySelector('.dropdown'); if (old) old.remove();
  $('#btnNotif').parentElement.insertAdjacentHTML('afterbegin', renderNotifMenu());
  const dd = $('#notifDd');
  dd.querySelector('[data-markall]').onclick = () => { DB.notifs.forEach(n => n.unread = false); saveDB(); dd.remove(); toast('Todas as notificações foram marcadas como lidas.', 'success'); };
  dd.querySelector('[data-gonotif]').onclick = () => { dd.remove(); navigate('notifications'); };
  dd.onclick = ev => ev.stopPropagation();
}
document.addEventListener('click', () => {
  const nd = $('#notifDd'); if (nd) nd.remove();
  const sr = $('#searchResults'); if (sr) sr.innerHTML = '';
});

/* ------------------------------ BUSCA GLOBAL ------------------------------ */
function bindGlobalSearch() {
  const inp = $('#globalSearch'); if (!inp) return;
  inp.addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase(), box = $('#searchResults');
    if (q.length < 2) { box.innerHTML = ''; return; }
    const res = [];
    DB.produtos.filter(p => p.nome.toLowerCase().includes(q)).slice(0, 4)
      .forEach(p => res.push(['produto', p.emoji, p.nome, () => navigate('menu'), BRL(p.preco)]));
    DB.pedidos.filter(o => String(o.num).includes(q) || o.cliente.toLowerCase().includes(q)).slice(0, 4)
      .forEach(o => res.push(['pedido', '🧾', 'Pedido #' + o.num + ' — ' + o.cliente, () => navigate('orders', { open: o.id }), o.status]));
    DB.clientes.filter(c => c.nome.toLowerCase().includes(q)).slice(0, 3)
      .forEach(c => res.push(['cliente', '👤', c.nome, () => navigate('clients', { open: c.id }), c.bairro]));
    DB.funcionarios.filter(f => f.nome.toLowerCase().includes(q)).slice(0, 2)
      .forEach(f => res.push(['funcionário', '🧑‍🍳', f.nome, () => navigate('staff'), f.cargo]));
    box.innerHTML = res.length
      ? `<div class="search-results">${res.map((r, i) => `<div class="sr-item" data-si="${i}">${r[1] !== '🧾' && r[1] !== '👤' ? `<span class="thumb" style="width:26px;height:26px;font-size:13px;border-radius:8px">${r[1]}</span>` : `<span style="width:26px;text-align:center">${r[1]}</span>`}<span>${esc(r[2])}</span><span class="kind">${r[0]} · ${esc(r[4])}</span></div>`).join('')}</div>`
      : `<div class="search-results"><div class="empty" style="padding:26px"><p>Nenhum resultado para “${esc(q)}”.</p></div></div>`;
    box.querySelectorAll('.sr-item').forEach(el => el.onclick = () => { const r = res[+el.dataset.si]; box.innerHTML = ''; inp.value = ''; r[3](); });
  });
  inp.addEventListener('click', e => e.stopPropagation());
}
function bindShortcuts() {
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); const i = $('#globalSearch'); if (i) i.focus(); }
    if (e.key === 'Escape') { closeModal(); const sr = $('#searchResults'); if (sr) sr.innerHTML = ''; const nd = $('#notifDd'); if (nd) nd.remove(); }
    if (e.key === 'F2') { e.preventDefault(); navigate('pos'); }
    if (e.key === 'F3') { e.preventDefault(); navigate('tables'); }
  });
}

/* ------------------------------ VIEW REGISTRY ------------------------------ */
const VIEWS = {
  dashboard: vDashboard, pos: vPos, tables: vTables, comandas: vComandas, orders: vOrders, kds: vKds,
  menu: vMenu, stock: vStock, recipes: vRecipes, purchases: vPurchases, suppliers: vSuppliers,
  clients: vClients, delivery: vDelivery, reservations: vReservations, promos: vPromos,
  finance: vFinance, cashier: vCashier, staff: vStaff, analytics: vAnalytics, reports: vReports,
  settings: vSettings, notifications: vNotifications
};

/* ------------------------------ INIT ------------------------------ */
(function initApp() {
  const page = (document.body.dataset.page || 'dashboard');
  if (page === 'login' || page === 'index') { initLogin(); return; }

  let user = null;
  const uidRaw = Store.get('cg_user');
  if (uidRaw) user = DB.funcionarios.find(f => f.id === uidRaw) || null;
  if (!user) {
    if (Store.available) { location.replace('index.html'); return; }
    user = DB.funcionarios[0]; /* fallback: storage indisponível (ex.: file:// restrito) */
  }
  state.user = user;
  state.view = VIEW_META[page] ? page : 'dashboard';

  /* carrinho vindo da tela de Mesas */
  if (state.view === 'pos') {
    const d = Store.get('cg_draft_pos');
    if (d) { try { Object.assign(state.pos, JSON.parse(d)); } catch (e) {} Store.del('cg_draft_pos'); }
  }

  buildShell();
  buildNav();
  render();

  /* deep-link (?open=id) vindo da busca global */
  const open = new URLSearchParams(location.search).get('open');
  if (open) setTimeout(() => {
    if (state.view === 'orders') orderDetail(open);
    else if (state.view === 'clients') clientProfile(open);
  }, 200);

  window.addEventListener('beforeunload', saveDB);
  console.log('%cCalisto Gastrobar — Gestão Inteligente v3.2.0', 'color:#f7a633;font-weight:bold;font-size:14px');
})();
