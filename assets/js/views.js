/* ==========================================================================
   CALISTO GASTROBAR — VIEWS (uma função de render por módulo)
   ========================================================================== */

/* ------------------------------ METRICS ------------------------------ */
function metrics(){
  const pd=DB.pedidos.filter(o=>o.status!=='Cancelado');
  const vendas=sum(pd,o=>o.total);
  const fatHoje=8412.90;
  const fatMes=131480.55;
  const pedidosHoje=pd.length+27;
  const ticket=fatHoje/pedidosHoje;
  const custo=fatMes*0.348;
  const lucro=fatMes-custo-38200;
  const mesasOcupadas=DB.mesas.filter(m=>m.min>0).length;
  const comandasAbertas=DB.comandas.filter(c=>c.status!=='Finalizada'&&c.status!=='Cancelada').length;
  const contasAbertas=sum(DB.comandas.filter(c=>c.status!=='Finalizada'),c=>sum(c.itens,i=>i.preco*i.qtd)*(1-c.desc/100));
  const estoqueBaixo=DB.produtos.filter(p=>p.estoque<=p.min).length + DB.ingredientes.filter(i=>i.estoque<=i.min).length;
  const payPend=DB.payables.filter(p=>p.status==='Pendente');
  const despHoje=sum(payPend.filter(p=>new Date(p.venc)<=new Date()),p=>p.valor);
  return {vendas,fatHoje,fatMes,pedidosHoje,ticket,custo,lucro,mesasOcupadas,comandasAbertas,contasAbertas,estoqueBaixo,payPend,despHoje};
}
function payMethods(){
  const base=[['Dinheiro',2140,'#f7a633'],['PIX',3480,'#3ecf8e'],['Débito',1290,'#5b9cf6'],['Crédito',2760,'#a97bf0'],['Outros',640,'#8b8b96']];
  return base.map(([n,v,c])=>({n,v,c}));
}
const STATUS_COLOR={'Novo':'blue','Confirmado':'purple','Em preparo':'amber','Pronto':'green','Saiu para entrega':'purple','Entregue':'green','Finalizado':'gray','Cancelado':'red','Aberta':'blue','Em andamento':'amber','Aguardando pagamento':'amber','Finalizada':'gray','Cancelada':'red'};
const badge=(s)=>{const c=STATUS_COLOR[s]||'gray';return `<span class="badge b-${c}"><span class="dot"></span>${esc(s)}</span>`};
const MESA_STATUS=m=>m.min>0?(m.min>600?'Aguardando pagamento':'Ocupada'):(m.reservada?'Reservada':'Livre');
const MESA_COLOR={Livre:'#3ecf8e',Ocupada:'#f7a633','Aguardando pagamento':'#5b9cf6',Reservada:'#a97bf0',Limpeza:'#8b8b96'};

/* ------------------------------ DASHBOARD ------------------------------ */
function vDashboard(){
  const m=metrics();const pm=payMethods();const period=state.chartPeriod;
  const serie=period==='dia'?DB.serie.semana:period==='mes'?DB.serie.mes:DB.serie.semana;
  const labels={dia:'por dia',sem:'por dia',mes:'por dia'};
  const best=[...DB.produtos].map(p=>({...p,v:Math.round(p.preco*(28+ (p.id.charCodeAt(2)%9)*7))})).sort((a,b)=>b.v-a.v).slice(0,5);
  const catVals=CATS.filter(c=>['hamb','porc','beb','drink','cerve','sobre'].includes(c.id)).map((c,i)=>({n:c.nome,v:[12840,7320,5980,6410,7240,3180][i],c:['#f7a633','#e0574f','#5b9cf6','#a97bf0','#3ecf8e','#ef6da0'][i]}));
  const recent=DB.pedidos.slice(0,6);
  const kpi=(label,val,delta,up,ico,color,spark)=>{const c=`var(--${color})`,bg=`var(--${color}-soft)`;
    return `<div class="card kpi" style="--k:${c};--kbg:${bg}"><div class="kpi-top"><span class="kpi-ico">${ICONS[ico]}</span>${delta!=null?`<span class="delta ${up?'up':'down'}">${up?ICONS.trendUp:ICONS.trendDown}${delta}</span>`:''}</div><div class="kpi-label">${label}</div><div class="kpi-val">${val}</div>${spark?sparkline(spark,color==='amber'?'#f7a633':color==='green'?'#3ecf8e':color==='blue'?'#5b9cf6':'#a97bf0'):''}</div>`};
  const alerts=[
    [m.estoqueBaixo+' produtos estão com estoque baixo','alert','red',`Repor insumos críticos antes do fim do dia`],
    ['3 contas vencem hoje','wallet','amber','Total de '+BRL(m.despHoje)+' em contas a pagar'],
    ['2 pedidos aguardando pagamento','pos','blue','Comandas abertas há mais de 1 hora'],
    [DB.pedidos.filter(o=>o.status==='Novo').length+' pedidos aguardando preparo','kitchen','amber','Fila da cozinha em atenção']
  ];
  return `${pageHead(`
    <div class="seg" data-seg="chartPeriod">
      <button data-val="dia" class="${period==='dia'?'on':''}">Dia</button>
      <button data-val="sem" class="${period==='semana'?'on':''}">Semana</button>
      <button data-val="mes" class="${period==='mes'?'on':''}">Mês</button>
    </div>
    <button class="btn btn-ghost btn-sm" data-action="export">${ICONS.download} Exportar</button>
    <button class="btn btn-primary btn-sm" data-action="neworder">${ICONS.plus} Novo pedido</button>`)}
  <div class="grid g-4 mb-16">
    ${kpi('Faturamento hoje',BRL(m.fatHoje),'12,4%',true,'money','amber',[42,48,44,58,52,66,72,68,84])}
    ${kpi('Faturamento do mês',BRL(m.fatMes),'8,7%',true,'trendUp','green',[60,64,58,70,74,72,82,88,94])}
    ${kpi('Pedidos hoje',NUM(m.pedidosHoje),'5,2%',true,'orders','blue',[12,18,14,22,26,20,28,32,30])}
    ${kpi('Ticket médio',BRL(m.ticket),'2,1%',false,'cart','purple',[56,54,58,52,50,54,49,52,48])}
  </div>
  <div class="grid g-4 mb-16">
    ${kpi('Lucro estimado',BRL(m.lucro),'15,8%',true,'chart','green',[30,36,34,42,46,44,52,58,62])}
    ${kpi('Mesas ocupadas',m.mesasOcupadas+' / '+DB.mesas.length,null,false,'tables','amber',[])}
    ${kpi('Contas em aberto',BRL(m.contasAbertas),null,false,'wallet','blue',[])}
    ${kpi('Estoque baixo',m.estoqueBaixo+' itens',null,false,'alert','red',[])}
  </div>

  <div class="grid" style="grid-template-columns:1.7fr 1fr;margin-bottom:16px" id="dashCharts">
    <div class="card">
      <div class="card-head"><div><h3>${ICONS.chart} Vendas ${period==='dia'?'do dia':period==='semana'?'da semana':'do mês'}</h3><div class="sub">Faturamento consolidado de todos os canais</div></div>
        <span class="badge b-green"><span class="dot"></span>+12,4% vs. período anterior</span></div>
      <div class="card-body">${areaChart(period==='mes'?DB.serie.mes:period==='dia'?DB.serie.hoje:DB.serie.semana,{h:250})}
        <div class="flex gap-16 mt-16 wrap" style="font-size:12px">
          <div><span class="muted">Total do período</span><b style="display:block;font-family:var(--font-display);font-size:17px">${BRL(sum(serie,d=>d.v))}</b></div>
          <div><span class="muted">Média por ponto</span><b style="display:block;font-family:var(--font-display);font-size:17px">${BRL(sum(serie,d=>d.v)/serie.length)}</b></div>
          <div><span class="muted">Pico</span><b style="display:block;font-family:var(--font-display);font-size:17px">${BRL(Math.max(...serie.map(d=>d.v)))}</b></div>
        </div></div>
    </div>
    <div class="card">
      <div class="card-head"><h3>${ICONS.wallet} Formas de pagamento</h3></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:18px">
        <div style="position:relative;width:100%;display:flex;justify-content:center">
          ${donut(pm.map(p=>({v:p.v,c:p.c})),{size:190,thick:24,center:`<text x="95" y="88" text-anchor="middle" fill="#8b8b96" font-size="11">Total hoje</text><text x="95" y="110" text-anchor="middle" fill="#f4f4f6" font-size="17" font-weight="700" font-family="Sora">${BRL(sum(pm,p=>p.v))}</text>`})}
        </div>
        <div class="legend">${pm.map(p=>`<div class="legend-row"><span class="sq" style="background:${p.c}"></span>${p.n}<span class="v">${BRL(p.v)}</span></div>`).join('')}</div>
      </div>
    </div>
  </div>

  <div class="grid" style="grid-template-columns:1fr 1fr;margin-bottom:16px" id="dashCharts2">
    <div class="card"><div class="card-head"><h3>${ICONS.flame} Produtos mais vendidos</h3><span class="sub">Hoje</span></div>
      <div class="card-body">${barRows(best.map(p=>({n:p.emoji+' '+p.nome,v:p.v,lbl:NUM(Math.round(p.v/p.preco))+' un · '+BRL(p.v)})))}
      </div></div>
    <div class="card"><div class="card-head"><h3>${ICONS.tag} Vendas por categoria</h3><span class="sub">Hoje</span></div>
      <div class="card-body">${barRows(catVals.map(c=>({n:c.n,v:c.v,c:c.c,c2:c.c})))}</div></div>
  </div>

  <div class="grid" style="grid-template-columns:1.5fr 1fr" id="dashCharts3">
    <div class="card">
      <div class="card-head"><h3>${ICONS.clock} Pedidos recentes</h3><button class="link small" data-action="allorders">Ver todos</button></div>
      <div class="tbl-wrap"><table><thead><tr><th>Pedido</th><th>Cliente / Mesa</th><th>Valor</th><th>Status</th><th>Horário</th></tr></thead><tbody>
        ${recent.map(o=>`<tr style="cursor:pointer" data-order="${o.id}"><td><b class="mono">#${o.num}</b></td><td><div class="cell-prod"><span class="thumb" style="font-size:15px">${o.emoji[0]||'🧾'}</span><span>${esc(o.cliente)}<br><small class="muted">${o.tipo}</small></span></div></td><td><b class="num">${BRL(o.total)}</b></td><td>${badge(o.status)}</td><td class="muted small">${timeAgo(o.mins)} atrás</td></tr>`).join('')}
      </tbody></table></div>
    </div>
    <div class="card">
      <div class="card-head"><h3>${ICONS.bell} Alertas e pendências</h3><span class="badge b-red">${alerts.length} itens</span></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:11px">
        ${alerts.map(a=>`<div class="notif" style="cursor:default"><div class="ni" style="background:var(--${a[2]}-soft);color:var(--${a[2]})">${ICONS[a[1]]}</div><div><b>${a[0]}</b><p>${a[3]}</p></div></div>`).join('')}
      </div>
    </div>
  </div>`;
}

/* ------------------------------ PDV ------------------------------ */
function posTotals(){
  const c=state.pos;const sub=sum(c.cart,i=>i.preco*i.qtd);
  const descAmt=sub*c.desc/100;
  const serv=c.tipo==='Mesa'?sub*0.10:0;
  const entrega=c.tipo==='Delivery'?8.90:0;
  const total=Math.max(0,sub-descAmt+serv+entrega);
  return {sub,descAmt,serv,entrega,total};
}
function vPos(){
  const c=state.pos;
  const prods=DB.produtos.filter(p=>p.ativo&&(c.cat==='all'||p.categoria===c.cat));
  const cats=[{id:'all',nome:'Todos os itens',ico:'🍽️'},...CATS];
  const t=posTotals();
  return `${pageHead(`
    <span class="badge b-green"><span class="dot"></span>Caixa aberto · ${BRL(DB.caixa.saldoInicial)}</span>
    <button class="btn btn-ghost btn-sm" data-action="kds">${ICONS.kitchen} Cozinha</button>`)}
  <div class="pdv">
    <div class="pdv-cats">${cats.map(cat=>{const n=cat.id==='all'?DB.produtos.length:DB.produtos.filter(p=>p.categoria===cat.id).length;
      return `<button class="cat-btn ${c.cat===cat.id?'on':''}" data-pcat="${cat.id}"><span>${cat.ico}</span>${cat.nome}<span class="c">${n}</span></button>`}).join('')}</div>
    <div class="pdv-main">
      <div class="flex between ai-c gap-12 wrap">
        <div class="chips"><span class="chip on">${prods.length} itens</span><span class="chip" data-emptycat style="cursor:default">Favoritos ⭐</span></div>
        <span class="muted small">Clique no produto para adicionar · <b style="color:var(--amber)">F2</b> atalho PDV</span>
      </div>
      <div class="pdv-grid">
        ${prods.length?prods.map(p=>{const off=p.estoque<=0;const low=p.estoque<=p.min;
          return `<button class="prod-card ${off?'off':''}" data-add="${p.id}" ${off?'disabled':''}>
            ${low?`<span class="pc-badge" style="background:var(--red-soft);color:#ff8378">Estoque baixo</span>`:''}
            <div class="pc-img">${p.emoji}</div>
            <div class="pc-name">${esc(p.nome)}</div>
            <div class="pc-price">${BRL(p.preco)}</div>
            <div class="pc-meta"><span>${CATS.find(x=>x.id===p.categoria)?.nome||''}</span><span>${off?'Esgotado':p.estoque+' un'}</span></div>
          </button>`}).join(''):'<div class="empty"><div class="ei">📦</div><h4>Nenhum produto nesta categoria</h4><p>Selecione outra categoria para visualizar os itens do cardápio.</p></div>'}
      </div>
    </div>
    <div class="cart">
      <div class="cart-head"><b>${ICONS.cart} Comanda atual</b><span class="badge b-amber" id="cartCount">${sum(c.cart,i=>i.qtd)} itens</span></div>
      <div class="cart-type">${['Mesa','Balcão','Delivery','Retirada'].map(tp=>`<button data-ptipo="${tp}" class="${c.tipo===tp?'on':''}">${tp}</button>`).join('')}</div>
      <div style="padding:11px 14px 2px">
        <div class="grid g-2" style="gap:8px">
          <select class="input" style="padding:8px 30px 8px 10px;font-size:12.5px" data-psel="cliente">
            <option value="">Cliente não informado</option>
            ${DB.clientes.map(cl=>`<option value="${cl.id}" ${c.cliente===cl.id?'selected':''}>${esc(cl.nome)}</option>`).join('')}
          </select>
          <select class="input" style="padding:8px 30px 8px 10px;font-size:12.5px" data-psel="mesa" ${c.tipo!=='Mesa'?'disabled':''}>
            <option value="">Selecione a mesa</option>
            ${DB.mesas.map(me=>`<option value="${me.num}" ${c.mesa===me.num?'selected':''}>Mesa ${me.num} · ${me.lugares} lugares</option>`).join('')}
          </select>
          <select class="input" style="padding:8px 30px 8px 10px;font-size:12.5px" data-psel="garcom">
            ${DB.funcionarios.filter(f=>['Garçom','Gerente','Caixa','Proprietário'].includes(f.cargo)).map(f=>`<option ${c.garcom===f.nome?'selected':''}>${esc(f.nome)}</option>`).join('')}
          </select>
          <input class="input" style="padding:8px 30px 8px 10px;font-size:12.5px" placeholder="Desconto %" type="number" min="0" max="100" value="${c.desc||''}" data-psel="desc"/>
        </div>
      </div>
      <div class="cart-items" id="cartItems">
        ${c.cart.length?c.cart.map((it,i)=>`
          <div class="ci">
            <div class="ci-top"><b>${it.emoji} ${esc(it.nome)}</b><span class="strong num">${BRL(it.preco*it.qtd)}</span></div>
            ${it.mods&&it.mods.length?`<div class="ci-mods">+ ${it.mods.map(m=>esc(m.n)).join(', ')}</div>`:''}
            ${it.obs?`<div class="ci-obs">${ICONS.info} ${esc(it.obs)}</div>`:''}
            <div class="ci-foot"><div class="qty"><button data-qty="${i}|-1">−</button><span>${it.qtd}</span><button data-qty="${i}|1">+</button></div>
            <div class="flex gap-8"><button class="btn btn-xs btn-ghost" data-obs="${i}">Obs.</button><button class="btn btn-xs btn-ghost" data-mods="${i}">Adicionais</button><button class="icon-btn" style="width:26px;height:26px" data-del="${i}">${ICONS.trash}</button></div></div>
          </div>`).join(''):'<div class="empty" style="padding:34px"><div class="ei">🛒</div><h4>Comanda vazia</h4><p>Selecione produtos ao lado para montar o pedido.</p></div>'}
      </div>
      <div class="cart-foot">
        <div class="sum-row"><span>Subtotal</span><span class="num">${BRL(t.sub)}</span></div>
        ${c.desc?`<div class="sum-row"><span>Desconto (${c.desc}%)</span><span class="num" style="color:#ff8378">− ${BRL(t.descAmt)}</span></div>`:''}
        ${t.serv?`<div class="sum-row"><span>Taxa de serviço (10%)</span><span class="num">${BRL(t.serv)}</span></div>`:''}
        ${t.entrega?`<div class="sum-row"><span>Taxa de entrega</span><span class="num">${BRL(t.entrega)}</span></div>`:''}
        <div class="sum-row total"><span>Total</span><span class="num">${BRL(t.total)}</span></div>
        <div class="cart-actions">
          <button class="btn btn-ghost" data-action="clearcart" ${c.cart.length?'':'disabled'}>${ICONS.trash} Limpar</button>
          <button class="btn btn-ghost" data-action="splitpay" ${c.cart.length?'':'disabled'}>${ICONS.wallet} Dividir</button>
          <button class="btn btn-primary full btn-lg" data-action="checkout" ${c.cart.length?'':'disabled'}>${ICONS.check} Finalizar venda · ${BRL(t.total)}</button>
        </div>
      </div>
    </div>
  </div>`;
}

/* ------------------------------ MESAS ------------------------------ */
function comandaTotal(c){const s=sum(c.itens,i=>i.preco*i.qtd);return s-(s*(c.desc||0)/100)}
function vTables(){
  const view=state.mesaView;
  const stats={Livre:0,Ocupada:0,'Aguardando pagamento':0,Reservada:0};
  DB.mesas.forEach(m=>stats[MESA_STATUS(m)]=(stats[MESA_STATUS(m)]||0)+1);
  const occupiedVal=sum(DB.mesas.filter(m=>m.min>0),m=>{const c=DB.comandas.find(x=>x.mesa===m.num);return c?comandaTotal(c):0});
  return `${pageHead(`
    <div class="seg" data-seg="mesaView"><button data-val="grid" class="${view==='grid'?'on':''}">Grade</button><button data-val="map" class="${view==='map'?'on':''}">Mapa do salão</button></div>
    <button class="btn btn-ghost btn-sm" data-action="newtable">${ICONS.plus} Nova mesa</button>`)}
  <div class="grid g-4 mb-16">
    <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.check}</div><div><b>${stats['Livre']}</b><small>Mesas livres</small></div></div>
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.tables}</div><div><b>${stats['Ocupada']}</b><small>Mesas ocupadas</small></div></div>
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.wallet}</div><div><b>${BRL(occupiedVal)}</b><small>Consumo em aberto</small></div></div>
    <div class="stat"><div class="si" style="background:var(--purple-soft);color:var(--purple)">${ICONS.clock}</div><div><b>${stats['Aguardando pagamento']}</b><small>Ag. pagamento</small></div></div>
  </div>
  ${view==='grid'?`
  <div class="grid g-4" style="grid-template-columns:repeat(2,1fr);margin-bottom:16px">
    <div class="card pad flex ai-c gap-12 wrap"><span class="muted small">Legenda:</span>${Object.entries(MESA_COLOR).map(([k,c])=>`<span class="badge" style="background:${c}1f;color:${c}"><span class="dot" style="background:${c}"></span>${k}</span>`).join('')}</div>
    <div class="card pad flex ai-c gap-12 wrap"><span class="muted small">Ações rápidas:</span><button class="btn btn-xs btn-ghost" data-action="transfer">${ICONS.arrowRight} Transferir</button><button class="btn btn-xs btn-ghost" data-action="jointables">${ICONS.plus} Juntar</button><button class="btn btn-xs btn-ghost" data-action="split table">${ICONS.minus} Dividir</button></div>
  </div>
  <div class="floor-grid">${DB.mesas.map(m=>{const st=MESA_STATUS(m);const c=DB.comandas.find(x=>x.mesa===m.num);const val=c?comandaTotal(c):0;const color=MESA_COLOR[st];
    return `<div class="table-card ${state.selectedTable===m.id?'sel':''}" style="--tc:${color}" data-table="${m.id}">
      <div class="tc-head"><div><div class="tc-num" style="color:${color}">Mesa ${m.num}</div><div class="tc-seats">${ICONS.user} ${m.lugares} lugares</div></div>${ICONS.tables}</div>
      ${badge(st)}
      ${val?`<div class="tc-val">${BRL(val)}</div><div class="tc-time">${timeAgo(m.min)} em aberto${m.garcom?' · '+esc(m.garcom.split(' ')[0]):''}</div>`:`<div class="tc-val" style="color:var(--muted);font-size:13px">Sem consumo</div><div class="tc-time">Disponível agora</div>`}
      <div class="tc-dots">${[1,2,3,4,5,6,7,8].map(i=>`<i class="${i<=m.lugares?'f':''}"></i>`).join('')}</div>
    </div>`}).join('')}</div>`
  :`<div class="card pad" style="padding:12px">
    <div class="floor-map">
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:var(--muted-2);font-size:11px;letter-spacing:3px;text-transform:uppercase">Entrada / Bar</div>
      ${DB.mesas.map(m=>{const st=MESA_STATUS(m);const color=MESA_COLOR[st];const c=DB.comandas.find(x=>x.mesa===m.num);const val=c?comandaTotal(c):0;
        return `<div class="map-table ${m.lugares>=6?'round':''}" style="--tc:${color};left:${m.x}px;top:${m.y}px;width:${m.lugares>=6?110:90}px;height:${m.lugares>=6?110:90}px" data-table="${m.id}" title="Mesa ${m.num} · ${st}${val?' · '+BRL(val):''}">
          <b>M${m.num}</b><small>${m.lugares} lug.</small>${val?`<small style="color:${color}">${BRL(val)}</small>`:''}
        </div>`}).join('')}
    </div></div>`}`;
}
function tableDetail(id){
  const m=DB.mesas.find(x=>x.id===id);const st=MESA_STATUS(m);const c=DB.comandas.find(x=>x.mesa===m.num);
  const val=c?comandaTotal(c):0;
  const o=openModal(`
    <div class="modal-head"><div><h3>Mesa ${m.num} · ${m.lugares} lugares</h3><span class="badge b-${STATUS_COLOR[st]||'gray'}" style="margin-top:5px"><span class="dot"></span>${st}</span></div><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body">
      ${c?`
      <div class="card" style="background:var(--surface-2);margin-bottom:16px"><div class="card-head"><b style="font-size:13.5px">${ICONS.comanda} ${esc(c.id)}</b><span class="muted small">Aberta às ${new Date(c.aberta).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span></div>
        <div class="card-body" style="padding:14px">
          <div class="flex between small" style="margin-bottom:10px"><span class="muted">Cliente</span><b>${esc(c.cliente)}</b></div>
          <div class="flex between small" style="margin-bottom:14px"><span class="muted">Garçom</span><b>${esc(c.garcom)}</b></div>
          ${c.itens.map(i=>`<div class="flex between" style="font-size:12.5px;padding:6px 0;border-bottom:1px solid var(--border)"><span>${i.emoji} ${i.qtd}× ${esc(i.nome)}</span><span class="num strong">${BRL(i.preco*i.qtd)}</span></div>`).join('')}
          <div class="flex between" style="margin-top:12px;font-family:var(--font-display);font-size:17px;font-weight:700"><span>Total</span><span style="color:var(--amber-2)">${BRL(val)}</span></div>
        </div></div>
      <div class="grid g-2" style="gap:8px">
        <button class="btn btn-ghost btn-sm" data-act="additem">${ICONS.plus} Adicionar itens</button>
        <button class="btn btn-ghost btn-sm" data-act="addcliente">${ICONS.user} Alterar cliente</button>
        <button class="btn btn-ghost btn-sm" data-act="transfer">${ICONS.arrowRight} Transferir mesa</button>
        <button class="btn btn-ghost btn-sm" data-act="print">${ICONS.print} Imprimir conta</button>
      </div>`
      :`<div class="empty"><div class="ei">🍽️</div><h4>Mesa disponível</h4><p>Abra a mesa para iniciar uma nova comanda e começar a lançar os itens.</p></div>`}
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-close>Fechar</button>
      ${c?`<button class="btn btn-danger" data-act="cancelcmd">Cancelar comanda</button><button class="btn btn-primary" data-act="closecmd">${ICONS.check} Fechar mesa · ${BRL(val)}</button>`
        :`<button class="btn btn-primary" data-act="open">${ICONS.plus} Abrir mesa</button>`}
    </div>`,'wide');
  o.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  const a=n=>o.querySelector(`[data-act="${n}"]`);
  if(a('open'))a('open').onclick=()=>{openTable(m);closeModal()};
  if(a('additem'))a('additem').onclick=()=>{closeModal();state.pos.cat='all';if(c){state.pos.cart=c.itens.map(i=>({...i}));state.pos.tipo='Mesa';state.pos.mesa=m.num;state.pos.cliente=DB.clientes.find(x=>x.nome===c.cliente)?.id||'';saveDraftPos()}navigate('pos')};
  if(a('addcliente'))a('addcliente').onclick=()=>{const nome=prompt('Nome do cliente:',c?c.cliente:'');if(nome&&c){c.cliente=nome;m.cliente=nome;toast('Cliente da mesa atualizado.','success');closeModal();render()}};
  if(a('transfer'))a('transfer').onclick=()=>{closeModal();transferDialog(m)};
  if(a('print'))a('print').onclick=()=>{toast('Conta enviada para a impressora térmica.','info','Impressão')};
  if(a('cancelcmd'))a('cancelcmd').onclick=()=>{closeModal();confirmDialog('Cancelar comanda','Todos os itens da '+c.id+' serão removidos e a mesa ficará livre.',()=>{DB.comandas=DB.comandas.filter(x=>x.id!==c.id);m.min=0;m.garcom=null;m.cliente=null;m.comanda=null;toast('Comanda cancelada.','warn');render()},{danger:true,label:'Cancelar comanda'})};
  if(a('closecmd'))a('closecmd').onclick=()=>{closeModal();closeTableDialog(m,c)};
}
function openTable(m){
  m.min=1;m.garcom=state.user?.nome||'Juliana Alves';m.cliente='Mesa '+m.num;m.comanda='CMD-'+(++cmdN);
  DB.comandas.unshift({id:m.comanda,mesa:m.num,cliente:m.cliente,garcom:m.garcom,aberta:new Date(),itens:[],status:'Aberta',desc:0,pgto:null});
  toast('Mesa '+m.num+' aberta · '+m.comanda,'success','Mesa aberta');render();
}
function transferDialog(m){
  const others=DB.mesas.filter(x=>x.id!==m.id&&x.min===0);
  const o=openModal(`
    <div class="modal-head"><h3>Mover Mesa ${m.num}</h3><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body"><p class="muted small mb-12">Selecione a mesa de destino. Os itens e a comanda serão transferidos.</p>
      <div class="chips">${others.map(x=>`<button class="chip" data-dest="${x.id}">Mesa ${x.num} · ${x.lugares} lug.</button>`).join('')||'<span class="muted small">Nenhuma mesa livre disponível.</span>'}</div></div>`,'sm');
  o.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  o.querySelectorAll('[data-dest]').forEach(b=>b.onclick=()=>{
    const dest=DB.mesas.find(x=>x.id===b.dataset.dest);const cmd=DB.comandas.find(x=>x.mesa===m.num);
    if(cmd){cmd.mesa=dest.num;cmd.cliente='Mesa '+dest.num}
    dest.min=m.min;dest.garcom=m.garcom;dest.cliente=m.cliente;dest.comanda=m.comanda;
    m.min=0;m.garcom=null;m.cliente=null;m.comanda=null;
    closeModal();toast('Mesa '+m.num+' transferida para Mesa '+dest.num+'.','success','Transferência');render();
  });
}
function closeTableDialog(m,c){
  const val=c?comandaTotal(c):0;
  const o=openModal(`
    <div class="modal-head"><h3>Fechar Mesa ${m.num}</h3><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body">
      <div class="card" style="background:var(--surface-2);margin-bottom:16px"><div class="card-body" style="padding:16px">
        <div class="flex between" style="font-size:13px;padding:5px 0"><span class="muted">Subtotal (${c.itens.length} itens)</span><b class="num">${BRL(sum(c.itens,i=>i.preco*i.qtd))}</b></div>
        <div class="flex between" style="font-size:13px;padding:5px 0"><span class="muted">Taxa de serviço (10%)</span><b class="num">${BRL(sum(c.itens,i=>i.preco*i.qtd)*0.10)}</b></div>
        <div class="flex between" style="font-size:13px;padding:5px 0"><span class="muted">Desconto</span><b class="num" style="color:#ff8378">− ${BRL(sum(c.itens,i=>i.preco*i.qtd)*(c.desc||0)/100)}</b></div>
        <div class="flex between" style="margin-top:10px;padding-top:12px;border-top:1px dashed var(--border-2);font-family:var(--font-display);font-size:20px;font-weight:700"><span>Total</span><span style="color:var(--amber-2)" id="fechTotal">${BRL(val*1.1)}</span></div>
      </div></div>
      <div class="field"><label>Forma de pagamento</label><div class="chips" id="fechPay">${['Dinheiro','PIX','Débito','Crédito'].map((p,i)=>`<button class="chip ${i===1?'on':''}" data-pay="${p}">${p}</button>`).join('')}</div></div>
      <label class="check mt-16"><input type="checkbox" id="fechPrint" checked/> Imprimir comprovante</label>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok>${ICONS.check} Fechar e receber ${BRL(val*1.1)}</button></div>`,'sm');
  let pay='PIX';
  o.querySelectorAll('.chip[data-pay]').forEach(b=>b.onclick=()=>{o.querySelectorAll('.chip[data-pay]').forEach(x=>x.classList.remove('on'));b.classList.add('on');pay=b.dataset.pay});
  o.querySelector('[data-close]').onclick=closeModal;
  o.querySelector('[data-ok]').onclick=()=>{
    const total=val*1.1;m.min=0;m.garcom=null;m.cliente=null;m.comanda=null;
    DB.comandas=DB.comandas.filter(x=>x.id!==c.id);
    DB.caixa.movimentos.push({id:uid('cx'),tipo:'Venda',desc:'Fechamento Mesa '+m.num,valor:total,hora:new Date().toISOString(),resp:state.user?.nome||'Rafael Lima'});
    closeModal();toast('Mesa '+m.num+' fechada · '+BRL(total)+' recebido via '+pay,'success','Pagamento confirmado');navigate('tables');
  };
}

/* ------------------------------ COMANDAS ------------------------------ */
function vComandas(){
  const list=DB.comandas;
  const open=sum(list,c=>comandaTotal(c));
  const byStatus=s=>list.filter(c=>c.status===s).length;
  const tab=state.comandaSel;
  if(tab){
    const c=list.find(x=>x.id===tab);if(!c){state.comandaSel=null;return vComandas()}
    const sub=sum(c.itens,i=>i.preco*i.qtd);
    return `${pageHead(`<button class="btn btn-ghost btn-sm" data-action="backcom">${ICONS.arrowLeft} Voltar</button>`)}
    <div class="grid" style="grid-template-columns:1.6fr 1fr">
      <div class="card">
        <div class="card-head"><div><h3>${ICONS.comanda} ${esc(c.id)} ${badge(c.status)}</h3><div class="sub">Mesa ${c.mesa} · ${esc(c.cliente)} · Garçom ${esc(c.garcom)}</div></div>
          <button class="btn btn-ghost btn-sm" data-action="additem">${ICONS.plus} Item</button></div>
        <div class="tbl-wrap"><table><thead><tr><th>Item</th><th>Qtd</th><th>Unitário</th><th>Obs.</th><th class="right">Total</th></tr></thead><tbody>
          ${c.itens.map(i=>`<tr><td><b>${i.emoji} ${esc(i.nome)}</b></td><td>${i.qtd}</td><td class="num">${BRL(i.preco)}</td><td class="muted small">${esc(i.obs||'—')}</td><td class="right num strong">${BRL(i.preco*i.qtd)}</td></tr>`).join('')}
        </tbody></table></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card pad">
          <h3 style="font-size:14px;margin-bottom:14px">Resumo da conta</h3>
          <div class="sum-row"><span>Subtotal</span><span class="num">${BRL(sub)}</span></div>
          <div class="sum-row"><span>Taxa de serviço (10%)</span><span class="num">${BRL(sub*0.1)}</span></div>
          <div class="sum-row"><span>Desconto (${c.desc||0}%)</span><span class="num" style="color:#ff8378">− ${BRL(sub*(c.desc||0)/100)}</span></div>
          <div class="sum-row total"><span>Total</span><span class="num">${BRL(sub*1.1*(1-(c.desc||0)/100))}</span></div>
          <div class="cart-actions"><button class="btn btn-ghost full" data-action="splitbill">${ICONS.wallet} Dividir conta</button>
            <button class="btn btn-primary full" data-action="paycom">${ICONS.check} Receber pagamento</button></div>
        </div>
        <div class="card"><div class="card-head"><h3>Informações</h3></div><div class="card-body">
          <div class="flex between small" style="padding:6px 0"><span class="muted">Abertura</span><b>${new Date(c.aberta).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</b></div>
          <div class="flex between small" style="padding:6px 0"><span class="muted">Tempo em aberto</span><b>${timeAgo(Math.round((Date.now()-new Date(c.aberta))/60000))}</b></div>
          <div class="flex between small" style="padding:6px 0"><span class="muted">Itens</span><b>${sum(c.itens,i=>i.qtd)}</b></div>
          <div class="flex between small" style="padding:6px 0"><span class="muted">Mesa</span><b>${c.mesa==='—'?'Balcão':'Mesa '+c.mesa}</b></div>
        </div></div>
      </div>
    </div>`;
  }
  return `${pageHead(`<button class="btn btn-ghost btn-sm" data-action="export">${ICONS.download} Exportar</button><button class="btn btn-primary btn-sm" data-action="newcmd">${ICONS.plus} Nova comanda</button>`)}
  <div class="grid g-4 mb-16">
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.comanda}</div><div><b>${list.length}</b><small>Comandas ativas</small></div></div>
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.money}</div><div><b>${BRL(open)}</b><small>Valor em aberto</small></div></div>
    <div class="stat"><div class="si" style="background:var(--purple-soft);color:var(--purple)">${ICONS.clock}</div><div><b>${byStatus('Aguardando pagamento')}</b><small>Ag. pagamento</small></div></div>
    <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.check}</div><div><b>${byStatus('Em andamento')}</b><small>Em andamento</small></div></div>
  </div>
  <div class="card"><div class="tbl-wrap"><table><thead><tr><th>Comanda</th><th>Cliente</th><th>Mesa</th><th>Garçom</th><th>Abertura</th><th>Itens</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>
    ${list.map(c=>`<tr><td><b class="mono">${c.id}</b></td><td><b>${esc(c.cliente)}</b></td><td>${c.mesa==='—'?'<span class="muted">Balcão</span>':'Mesa '+c.mesa}</td><td class="small">${esc(c.garcom)}</td><td class="muted small">${new Date(c.aberta).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · ${timeAgo(Math.round((Date.now()-new Date(c.aberta))/60000))}</td><td>${sum(c.itens,i=>i.qtd)}</td><td><b class="num">${BRL(comandaTotal(c))}</b></td><td>${badge(c.status)}</td><td><button class="btn btn-xs btn-ghost" data-com="${c.id}">Abrir</button></td></tr>`).join('')}
  </tbody></table></div></div>`;
}

/* ------------------------------ PEDIDOS ------------------------------ */
function orderItemsLines(o){return o.itens.map(i=>`<div class="flex between" style="font-size:12.5px;padding:5px 0"><span>${i.emoji} <b>${i.qtd}×</b> ${esc(i.nome)}</span><span class="num">${BRL(i.preco*i.qtd)}</span></div>`).join('')}
function orderTimeline(o){
  const flow=['Novo','Confirmado','Em preparo','Pronto','Entregue','Finalizado'];
  let idx=flow.indexOf(o.status);if(o.status==='Saiu para entrega')idx=3;if(o.status==='Cancelado')idx=-1;
  const labels={'Novo':'Pedido recebido','Confirmado':'Confirmado pela loja','Em preparo':'Em preparo na cozinha','Pronto':'Pronto para entrega','Entregue':'Entregue ao cliente','Finalizado':'Pagamento finalizado'};
  const times=[0,1,4,14,22,30];
  return `<div class="timeline">${flow.map((f,i)=>`<div class="tl-item ${idx>i?'done':idx===i?'now':''}"><b>${labels[f]}</b><small>${idx>=i?new Date(o.criado.getTime()+times[i]*60000).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'Pendente'}</small></div>`).join('')}</div>`;
}
function orderDetail(id){
  const o=DB.pedidos.find(x=>x.id===id);if(!o)return;
  const o_=openModal(`
    <div class="modal-head"><div><h3>Pedido #${o.num}</h3><div class="flex gap-8" style="margin-top:6px">${badge(o.status)}<span class="badge b-gray">${o.tipo}</span></div></div><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body">
      <div class="grid g-2" style="gap:16px">
        <div><h4 style="font-size:13px;margin-bottom:12px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Itens do pedido</h4>
          <div class="card" style="background:var(--surface-2)"><div class="card-body" style="padding:14px">${orderItemsLines(o)}<div class="divider" style="margin:10px 0"></div>
            <div class="flex between small"><span class="muted">Subtotal</span><b class="num">${BRL(o.subtotal)}</b></div>
            ${o.entrega?`<div class="flex between small"><span class="muted">Entrega</span><b class="num">${BRL(o.entrega)}</b></div>`:''}
            ${o.servTipo?`<div class="flex between small"><span class="muted">Serviço</span><b class="num">${BRL(o.subtotal*0.1)}</b></div>`:''}
            <div class="flex between" style="margin-top:8px;font-family:var(--font-display);font-size:17px;font-weight:700"><span>Total</span><span style="color:var(--amber-2)">${BRL(o.total)}</span></div>
          </div></div>
          <h4 style="font-size:13px;margin:16px 0 10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Informações</h4>
          <div class="card" style="background:var(--surface-2)"><div class="card-body" style="padding:14px">
            <div class="flex between small" style="padding:4px 0"><span class="muted">Cliente</span><b>${esc(o.cliente)}</b></div>
            <div class="flex between small" style="padding:4px 0"><span class="muted">Garçom/Resp.</span><b>${esc(o.garcom)}</b></div>
            <div class="flex between small" style="padding:4px 0"><span class="muted">Pagamento</span><b>${o.pm||'A definir'}</b></div>
            <div class="flex between small" style="padding:4px 0"><span class="muted">Criado</span><b>${o.criado.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</b></div>
            ${o.endereco?`<div class="flex between small" style="padding:4px 0"><span class="muted">Endereço</span><b style="text-align:right">${esc(o.endereco)} — ${esc(o.bairro)}</b></div>`:''}
          </div></div>
        </div>
        <div><h4 style="font-size:13px;margin-bottom:12px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Linha do tempo</h4>${orderTimeline(o)}</div>
      </div>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Fechar</button>${nextStatusBtn(o)}</div>`,'wide');
  o_.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  const nb=o_.querySelector('[data-next]');if(nb)nb.onclick=()=>{advanceOrder(o);closeModal()};
}
function nextStatusBtn(o){
  const next={'Novo':['Confirmado','Confirmar pedido'],'Confirmado':['Em preparo','Iniciar preparo'],'Em preparo':['Pronto','Marcar como pronto'],'Pronto':[o.tipo==='Delivery'?'Saiu para entrega':'Entregue',o.tipo==='Delivery'?'Despachar entrega':'Marcar entregue'],'Saiu para entrega':['Entregue','Confirmar entrega'],'Entregue':['Finalizado','Finalizar pedido']};
  const n=next[o.status];if(!n)return '';
  return `<button class="btn btn-primary" data-next>${ICONS.arrowRight} ${n[1]}</button>`;
}
function advanceOrder(o){
  const next={'Novo':'Confirmado','Confirmado':'Em preparo','Em preparo':'Pronto','Pronto':o.tipo==='Delivery'?'Saiu para entrega':'Entregue','Saiu para entrega':'Entregue','Entregue':'Finalizado'};
  o.status=next[o.status];
  if(o.status==='Finalizado'){o.pago=true;DB.caixa.movimentos.push({id:uid('cx'),tipo:'Venda',desc:'Pedido #'+o.num,valor:o.total,hora:new Date().toISOString(),resp:state.user?.nome||'Rafael Lima'})}
  toast('Pedido #'+o.num+' → '+o.status,'success','Status atualizado');render();
}
function vOrders(){
  const f=state.ordersFilter;
  let list=DB.pedidos.slice();
  if(f==='Hoje')list=list.filter(o=>true);
  else if(f==='Ontem')list=list.slice(5,9);
  else if(f==='Semana')list=list;
  else if(f==='Mês')list=list;
  const counts={};DB.pedidos.forEach(o=>counts[o.status]=(counts[o.status]||0)+1);
  const total=sum(list.filter(o=>o.status!=='Cancelado'),o=>o.total);
  return `${pageHead(`
    <div class="seg" data-seg="ordersFilter">${['Hoje','Ontem','Semana','Mês'].map(x=>`<button data-val="${x}" class="${f===x?'on':''}">${x}</button>`).join('')}</div>
    <button class="btn btn-ghost btn-sm" data-action="filter">${ICONS.filter} Filtros</button>
    <button class="btn btn-primary btn-sm" data-action="neworder">${ICONS.plus} Novo pedido</button>`)}
  <div class="grid g-4 mb-16">
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.orders}</div><div><b>${list.length}</b><small>Pedidos no período</small></div></div>
    <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.money}</div><div><b>${BRL(total)}</b><small>Faturamento</small></div></div>
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.kitchen}</div><div><b>${(counts['Em preparo']||0)+(counts['Novo']||0)}</b><small>Em produção</small></div></div>
    <div class="stat"><div class="si" style="background:var(--purple-soft);color:var(--purple)">${ICONS.delivery}</div><div><b>${(counts['Saiu para entrega']||0)}</b><small>Em rota</small></div></div>
  </div>
  <div class="chips mb-16">${['Todos',...Object.keys(counts)].map(s=>`<span class="chip ${s==='Todos'?'on':''}" data-ostatus="${s}">${s}${s!=='Todos'?` (${counts[s]})`:''}</span>`).join('')}</div>
  <div class="card">
    <div class="card-head"><h3>${ICONS.orders} Lista de pedidos</h3><span class="muted small">${list.length} registros</span></div>
    <div class="tbl-wrap"><table><thead><tr><th>Pedido</th><th>Tipo</th><th>Cliente / Mesa</th><th>Itens</th><th>Total</th><th>Pagamento</th><th>Status</th><th>Tempo</th><th></th></tr></thead><tbody>
      ${list.map(o=>`<tr><td><b class="mono">#${o.num}</b></td><td><span class="badge b-gray">${o.tipo}</span></td><td><b>${esc(o.cliente)}</b></td><td class="small muted">${o.itens.length} itens</td><td><b class="num">${BRL(o.total)}</b></td><td>${o.pm?`<span class="badge b-gray">${o.pm}</span>`:'<span class="muted small">—</span>'}</td><td>${badge(o.status)}</td><td class="muted small">${timeAgo(o.mins)}</td><td><button class="btn btn-xs btn-ghost" data-order="${o.id}">Detalhes</button></td></tr>`).join('')}
    </tbody></table></div>
  </div>`;
}

/* ------------------------------ KDS ------------------------------ */
const KDS_COLS=[['Novo','NOVOS','var(--blue)'],['Em preparo','EM PREPARO','var(--amber)'],['Pronto','PRONTOS','var(--green)']];
function vKds(){
  const cols=KDS_COLS;
  const total=DB.pedidos.filter(o=>['Novo','Em preparo','Pronto'].includes(o.status)).length;
  return `${pageHead(`
    <span class="badge b-green pulse" style="animation:pulse 2s infinite"><span class="dot"></span>Painel em tempo real</span>
    <span class="muted small">Atualiza automaticamente · ${total} pedidos na fila</span>
    <button class="btn btn-ghost btn-sm" data-action="refresh">${ICONS.refresh} Atualizar</button>`)}
  <div class="kds">
    ${cols.map(([st,title,col])=>{const list=DB.pedidos.filter(o=>o.status===st);
      return `<div class="kds-col"><div class="kds-col-head"><b style="color:${col}">${title}</b><span class="cnt">${list.length}</span></div>
        <div class="kds-body">
          ${list.length?list.map(o=>`
            <div class="kds-card ${o.mins>20?'late':''}">
              <div class="kds-top"><div><div class="kds-num">Pedido #${o.num}</div><div class="muted small">${esc(o.cliente)} · ${o.tipo}${o.mesa?' '+o.mesa:''}</div></div>
                <span class="timer" style="color:${o.mins>20?'#ff8378':'var(--muted)'}">${ICONS.clock}${timeAgo(o.mins)}</span></div>
              <div class="kds-items">${o.itens.map(i=>`<div class="kds-item"><b>${i.qtd}×</b><span>${esc(i.nome)}</span></div>`).join('')}</div>
              ${o.itens.some(i=>i.obs)?`<div class="kds-obs">${ICONS.alert} ${esc(o.itens.filter(i=>i.obs).map(i=>i.obs).join(' · '))}</div>`:''}
              ${o.mins>20?`<div class="kds-obs">${ICONS.alert} Tempo de preparo acima da média (${timeAgo(o.mins)})</div>`:''}
              <div class="grid g-2" style="gap:8px">
                <button class="btn btn-sm btn-ghost" data-order="${o.id}">Detalhes</button>
                <button class="btn btn-sm ${st==='Pronto'?'btn-success':'btn-primary'}" data-advance="${o.id}">${st==='Novo'?ICONS.flame+' Iniciar':st==='Em preparo'?ICONS.check+' Pronto':ICONS.arrowRight+' Entregar'}</button>
              </div>
            </div>`).join(''):`<div class="empty" style="padding:40px 16px"><div class="ei">${ICONS[st==='Pronto'?'check':'kitchen']}</div><h4>Nenhum pedido</h4><p>${st==='Novo'?'Aguardando novos pedidos chegarem.':st==='Em preparo'?'Ninguém em preparo no momento.':'Pedidos prontos aparecerão aqui.'}</p></div>`}
        </div></div>`}).join('')}
  </div>`;
}

/* ------------------------------ CARDÁPIO ------------------------------ */
function catName(id){return CATS.find(c=>c.id===id)?.nome||'—'}
function catIco(id){return CATS.find(c=>c.id===id)?.ico||'🍽️'}
function vMenu(){
  const tab=state.menuTab;
  const ativos=DB.produtos.filter(p=>p.ativo).length;
  const estoqueBaixo=DB.produtos.filter(p=>p.estoque<=p.min).length;
  const margem=sum(DB.produtos,p=>p.margem)/DB.produtos.length;
  return `${pageHead(`
    <button class="btn btn-ghost btn-sm" data-action="modifiers">${ICONS.tag} Adicionais</button>
    <button class="btn btn-ghost btn-sm" data-action="export">${ICONS.download} Exportar</button>
    <button class="btn btn-primary btn-sm" data-action="newprod">${ICONS.plus} Novo produto</button>`)}
  <div class="grid g-4 mb-16">
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.menu}</div><div><b>${DB.produtos.length}</b><small>Produtos cadastrados</small></div></div>
    <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.check}</div><div><b>${ativos}</b><small>Ativos no cardápio</small></div></div>
    <div class="stat"><div class="si" style="background:var(--red-soft);color:var(--red)">${ICONS.alert}</div><div><b>${estoqueBaixo}</b><small>Estoque baixo</small></div></div>
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.chart}</div><div><b>${PCT(margem)}</b><small>Margem média</small></div></div>
  </div>
  <div class="tabs">${[['produtos','Produtos'],['categorias','Categorias'],['modificadores','Adicionais & Modificadores']].map(([k,l])=>`<button class="tab ${tab===k?'on':''}" data-mtab="${k}">${l}</button>`).join('')}</div>
  ${tab==='produtos'?`
  <div class="card"><div class="tbl-wrap"><table><thead><tr><th>Produto</th><th>Categoria</th><th>SKU</th><th>Custo</th><th>Preço</th><th>Margem</th><th>Estoque</th><th>Status</th><th></th></tr></thead><tbody>
    ${DB.produtos.map(p=>`<tr><td><div class="cell-prod"><span class="thumb">${p.emoji}</span><span><b>${esc(p.nome)}</b><br><small class="muted">${p.tempo} min de preparo</small></span></div></td>
      <td><span class="badge b-gray">${catIco(p.categoria)} ${catName(p.categoria)}</span></td><td class="mono muted small">${p.sku}</td><td class="num">${BRL(p.custo)}</td><td><b class="num">${BRL(p.preco)}</b></td>
      <td><span class="badge ${p.margem>60?'b-green':p.margem>45?'b-amber':'b-red'}">${PCT(p.margem)}</span></td>
      <td><span class="${p.estoque<=p.min?'strong':''}" style="color:${p.estoque<=0?'#ff8378':p.estoque<=p.min?'var(--amber)':'inherit'}">${p.estoque} un ${p.estoque<=p.min?'⚠':''}</span><div class="hint">mín. ${p.min}</div></td>
      <td>${p.ativo?'<span class="badge b-green"><span class="dot"></span>Ativo</span>':'<span class="badge b-gray"><span class="dot"></span>Arquivado</span>'}</td>
      <td><div class="flex gap-8"><button class="icon-btn" style="width:30px;height:30px" data-editprod="${p.id}" title="Editar">${ICONS.edit}</button><button class="icon-btn" style="width:30px;height:30px" data-dupprod="${p.id}" title="Duplicar">${ICONS.plus}</button><button class="icon-btn" style="width:30px;height:30px" data-delprod="${p.id}" title="Excluir">${ICONS.trash}</button></div></td></tr>`).join('')}
  </tbody></table></div></div>`
  :tab==='categorias'?`<div class="grid g-auto">${CATS.map(c=>{const ps=DB.produtos.filter(p=>p.categoria===c.id);const avg=ps.length?sum(ps,p=>p.preco)/ps.length:0;
    return `<div class="card hover pad"><div class="flex between ai-c mb-12"><span class="thumb lg" style="font-size:26px">${c.ico}</span><button class="icon-btn" data-action="editcat">${ICONS.edit}</button></div><b style="font-family:var(--font-display);font-size:15px">${c.nome}</b><div class="muted small mt-8">${ps.length} produtos · ticket médio ${BRL(avg)}</div></div>`}).join('')}</div>`
  :`<div class="card"><div class="card-head"><h3>${ICONS.tag} Grupos de modificadores</h3><button class="btn btn-primary btn-sm" data-action="newmod">${ICONS.plus} Novo grupo</button></div>
    <div class="card-body"><div class="grid g-2">${DB.mods.map(m=>`<div class="card" style="background:var(--surface-2)"><div class="card-head"><b style="font-size:13.5px">${esc(m.nome)}</b><span class="badge ${m.tipo==='add'?'b-green':m.tipo==='remove'?'b-red':'b-blue'}">${m.tipo==='add'?'Adicionais':m.tipo==='remove'?'Remoções':'Escolha única'}</span></div>
      <div class="card-body" style="padding:14px">${m.opts.map(o=>`<div class="flex between" style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px"><span>${esc(o.n)}</span><span class="num" style="color:${o.p?'var(--amber-2)':'var(--muted)'}">${o.p?'+ '+BRL(o.p):'Grátis'}</span></div>`).join('')}
      <div class="hint" style="margin-top:10px">Mínimo ${m.min} · Máximo ${m.max} opções</div></div></div>`).join('')}</div></div></div>`}
  `;
}
function productForm(id){
  const p=id?DB.produtos.find(x=>x.id===id):null;
  const o=openModal(`
    <div class="modal-head"><h3>${p?'Editar produto':'Novo produto'}</h3><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="field full"><label>Nome do produto *</label><input class="input" name="nome" value="${p?esc(p.nome):''}" placeholder="Ex: X-Burger Especial" required/></div>
        <div class="field"><label>Categoria *</label><select class="input" name="categoria">${CATS.map(c=>`<option value="${c.id}" ${p&&p.categoria===c.id?'selected':''}>${c.ico} ${c.nome}</option>`).join('')}</select></div>
        <div class="field"><label>SKU / Código</label><input class="input" name="sku" value="${p?esc(p.sku):''}" placeholder="CG-000"/></div>
        <div class="field full"><label>Descrição</label><textarea class="input" name="desc" placeholder="Descrição exibida no cardápio">${p?esc(p.obs):''}</textarea></div>
        <div class="field"><label>Preço de venda *</label><input class="input" type="number" step="0.01" name="preco" value="${p?p.preco:''}" placeholder="0,00" required/></div>
        <div class="field"><label>Custo</label><input class="input" type="number" step="0.01" name="custo" value="${p?p.custo:''}" placeholder="0,00"/></div>
        <div class="field"><label>Quantidade em estoque</label><input class="input" type="number" name="estoque" value="${p?p.estoque:0}"/></div>
        <div class="field"><label>Estoque mínimo</label><input class="input" type="number" name="min" value="${p?p.min:5}"/></div>
        <div class="field"><label>Tempo de preparo (min)</label><input class="input" type="number" name="tempo" value="${p?p.tempo:12}"/></div>
        <div class="field"><label>Status</label><select class="input" name="ativo"><option value="1" ${!p||p.ativo?'selected':''}>Ativo</option><option value="0" ${p&&!p.ativo?'selected':''}>Arquivado</option></select></div>
      </div>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-save>${ICONS.check} ${p?'Salvar alterações':'Criar produto'}</button></div>`,`wide`);
  o.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  o.querySelector('[data-save]').onclick=()=>{
    const g=n=>o.querySelector(`[name="${n}"]`).value;
    if(!g('nome')||!g('preco')){toast('Preencha nome e preço de venda.','error');return}
    const data={nome:g('nome'),categoria:g('categoria'),sku:g('sku')||'CG-'+uid('x').slice(2,6).toUpperCase(),obs:g('desc'),preco:+g('preco'),custo:+g('custo')||0,estoque:+g('estoque')||0,min:+g('min')||0,tempo:+g('tempo')||10,ativo:g('ativo')==='1',emoji:catIco(g('categoria'))};
    data.margem=((data.preco-data.custo)/data.preco)*100;
    if(p)Object.assign(p,data);else DB.produtos.push({id:uid('p'),...data});
    closeModal();toast('Produto '+(p?'atualizado':'criado')+' com sucesso.','success');render();
  };
}

/* ------------------------------ ESTOQUE ------------------------------ */
function vStock(){
  const tab=state.stockTab;
  const valIns=sum(DB.ingredientes,i=>i.custo*i.estoque);
  const valProd=sum(DB.produtos,p=>p.custo*p.estoque);
  const lowIns=DB.ingredientes.filter(i=>i.estoque<=i.min).length;
  const lowProd=DB.produtos.filter(p=>p.estoque<=p.min).length;
  const out=DB.ingredientes.filter(i=>i.estoque<=0).length+DB.produtos.filter(p=>p.estoque<=0).length;
  const rows=tab==='insumos'?DB.ingredientes:DB.produtos;
  return `${pageHead(`
    <button class="btn btn-ghost btn-sm" data-action="movement">${ICONS.refresh} Movimentar estoque</button>
    <button class="btn btn-primary btn-sm" data-action="newing">${ICONS.plus} Novo insumo</button>`)}
  <div class="grid g-4 mb-16">
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.money}</div><div><b>${BRL(valIns+valProd)}</b><small>Valor total em estoque</small></div></div>
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.box}</div><div><b>${DB.ingredientes.length+DB.produtos.length}</b><small>Itens catalogados</small></div></div>
    <div class="stat"><div class="si" style="background:var(--red-soft);color:var(--red)">${ICONS.alert}</div><div><b>${lowIns+lowProd}</b><small>Estoque baixo</small></div></div>
    <div class="stat"><div class="si" style="background:var(--red-soft);color:var(--red)">${ICONS.x}</div><div><b>${out}</b><small>Itens esgotados</small></div></div>
  </div>
  <div class="tabs">${[['insumos','Insumos / Ingredientes'],['produtos','Produtos Acabados'],['movimentos','Histórico de Movimentações']].map(([k,l])=>`<button class="tab ${tab===k?'on':''}" data-stab="${k}">${l}</button>`).join('')}</div>
  ${tab==='movimentos'?`<div class="card"><div class="card-head"><h3>${ICONS.clock} Movimentações recentes</h3><span class="muted small">últimos 7 dias</span></div>
    <div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Item</th><th>Tipo</th><th>Qtd</th><th>Responsável</th><th>Observação</th></tr></thead><tbody>
      ${DB.movimentos.map(m=>`<tr><td class="muted small">${fmtDate(m.data)}</td><td><b>${esc(m.prod)}</b></td><td><span class="badge ${m.qtd>=0?'b-green':'b-red'}">${m.tipo}</span></td><td><b class="num" style="color:${m.qtd>=0?'var(--green)':'#ff8378'}">${m.qtd>0?'+':''}${NUM(m.qtd)}</b></td><td class="small">${esc(m.resp)}</td><td class="muted small">${esc(m.obs||'—')}</td></tr>`).join('')}
    </tbody></table></div></div>`
  :`<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Item</th>${tab==='insumos'?'<th>Fornecedor</th>':'<th>Categoria</th>'}<th>Unidade</th><th>Estoque</th><th>Mín / Máx</th><th>Custo unit.</th><th>Valor total</th><th>Nível</th><th></th></tr></thead><tbody>
    ${rows.map(it=>{const low=it.estoque<=it.min;const pct=clamp(it.estoque/(it.max||it.min*4)*100,0,100);
      return `<tr><td><b>${it.emoji||'📦'} ${esc(it.nome)}</b></td><td class="muted small">${esc(tab==='insumos'?it.forn:catName(it.categoria))}</td><td>${it.un||'un'}</td>
      <td><b class="num" style="color:${low?'#ff8378':'inherit'}">${NUM(it.estoque)}</b></td><td class="muted small">${NUM(it.min)} / ${NUM(it.max)}</td><td class="num">${BRL(it.custo)}</td><td><b class="num">${BRL(it.custo*it.estoque)}</b></td>
      <td style="min-width:110px"><div class="bar ${low?'r':'g'}"><i style="width:${pct}%"></i></div><span class="hint">${pct.toFixed(0)}% do máximo</span></td>
      <td><button class="btn btn-xs btn-ghost" data-movitem="${esc(it.nome)}">Movimentar</button></td></tr>`}).join('')}
  </tbody></table></div></div>`}`;
}
function movementDialog(item){
  const o=openModal(`
    <div class="modal-head"><h3>Movimentação de estoque</h3><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body"><div class="form-grid">
      <div class="field full"><label>Item</label><input class="input" id="mvItem" value="${esc(item||'')}" placeholder="Nome do item"/></div>
      <div class="field"><label>Tipo de movimentação *</label><select class="input" id="mvTipo">${['Entrada por Compra','Venda','Ajuste de Inventário','Perda / Quebra','Vencimento','Consumo Interno'].map(t=>`<option>${t}</option>`).join('')}</select></div>
      <div class="field"><label>Quantidade *</label><input class="input" type="number" id="mvQtd" placeholder="0"/></div>
      <div class="field"><label>Responsável</label><select class="input" id="mvResp">${DB.funcionarios.map(f=>`<option>${esc(f.nome)}</option>`).join('')}</select></div>
      <div class="field"><label>Motivo / Observação</label><input class="input" id="mvObs" placeholder="Ex: NF 12345, produto vencido..."/></div>
    </div></div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-save>${ICONS.check} Registrar movimentação</button></div>`);
  o.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  o.querySelector('[data-save]').onclick=()=>{
    const nome=$('#mvItem').value.trim(),tipo=$('#mvTipo').value,qtd=+$('#mvQtd').value;
    if(!nome||!qtd){toast('Informe o item e a quantidade.','error');return}
    const neg=tipo==='Venda'||tipo.includes('Perda')||tipo==='Vencimento'||tipo==='Consumo Interno';
    const delta=neg?-Math.abs(qtd):Math.abs(qtd);
    const ing=DB.ingredientes.find(i=>i.nome===nome)||DB.produtos.find(p=>p.nome===nome);
    if(ing)ing.estoque=Math.max(0,ing.estoque+delta);
    DB.movimentos.unshift({id:uid('mov'),data:todayISO(),prod:nome,tipo:tipo.split(' ')[0],qtd:delta,resp:$('#mvResp').value,obs:$('#mvObs').value||'Ajuste manual'});
    closeModal();toast('Movimentação registrada: '+nome+' ('+(delta>0?'+':'')+NUM(delta)+')','success');render();
  };
}
function ingredientForm(){
  const o=openModal(`<div class="modal-head"><h3>Novo insumo</h3><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body"><div class="form-grid">
      <div class="field full"><label>Nome do insumo *</label><input class="input" id="inNome" placeholder="Ex: Queijo Mussarela"/></div>
      <div class="field"><label>Unidade</label><select class="input" id="inUn"><option>un</option><option>g</option><option>kg</option><option>ml</option><option>L</option></select></div>
      <div class="field"><label>Custo unitário (R$)</label><input class="input" type="number" step="0.001" id="inCusto" placeholder="0,00"/></div>
      <div class="field"><label>Estoque atual</label><input class="input" type="number" id="inEst" value="0"/></div>
      <div class="field"><label>Estoque mínimo</label><input class="input" type="number" id="inMin" value="0"/></div>
      <div class="field"><label>Estoque máximo</label><input class="input" type="number" id="inMax" value="1000"/></div>
      <div class="field"><label>Fornecedor</label><select class="input" id="inForn">${DB.fornecedores.map(f=>`<option>${esc(f.fantasia)}</option>`).join('')}</select></div>
    </div></div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-save>${ICONS.check} Criar insumo</button></div>`);
  o.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  o.querySelector('[data-save]').onclick=()=>{
    const nome=$('#inNome').value.trim();if(!nome){toast('Informe o nome do insumo.','error');return}
    DB.ingredientes.push({id:uid('i'),nome,un:$('#inUn').value,custo:+$('#inCusto').value||0,estoque:+$('#inEst').value||0,min:+$('#inMin').value||0,max:+$('#inMax').value||1000,forn:$('#inForn').value});
    closeModal();toast('Insumo cadastrado com sucesso.','success');render();
  };
}

/* ------------------------------ FICHAS TÉCNICAS ------------------------------ */
function recipeCost(pid){const r=DB.receitas[pid];if(!r)return 0;return sum(r,([iid,q])=>{const i=DB.ingredientes.find(x=>x.id===iid);return i?i.custo*q:0})}
function vRecipes(){
  const prods=DB.produtos.filter(p=>DB.receitas[p.id]);
  const totalCost=sum(prods,p=>recipeCost(p.id));
  const avgMargin=prods.length?sum(prods,p=>((p.preco-recipeCost(p.id))/p.preco)*100)/prods.length:0;
  return `${pageHead(`
    <span class="badge b-amber"><span class="dot"></span>Módulo de baixa automática ativo</span>
    <button class="btn btn-ghost btn-sm" data-action="export">${ICONS.download} Exportar</button>
    <button class="btn btn-primary btn-sm" data-action="newrecipe">${ICONS.plus} Nova ficha técnica</button>`)}
  <div class="grid g-4 mb-16">
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.knife}</div><div><b>${prods.length}</b><small>Fichas técnicas ativas</small></div></div>
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.money}</div><div><b>${BRL(totalCost)}</b><small>Custo somado das receitas</small></div></div>
    <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.trendUp}</div><div><b>${PCT(avgMargin)}</b><small>Margem bruta média</small></div></div>
    <div class="stat"><div class="si" style="background:var(--purple-soft);color:var(--purple)">${ICONS.check}</div><div><b>${DB.ingredientes.length}</b><small>Insumos vinculados</small></div></div>
  </div>
  <div class="grid g-auto-lg">${prods.map(p=>{const cost=recipeCost(p.id);const marg=(p.preco-cost)/p.preco*100;const profit=p.preco-cost;
    return `<div class="card hover"><div class="card-head"><div class="cell-prod"><span class="thumb">${p.emoji}</span><div><b>${esc(p.nome)}</b><div class="sub">${DB.receitas[p.id].length} ingredientes</div></div></div><button class="icon-btn" style="width:30px;height:30px" data-recipe="${p.id}">${ICONS.edit}</button></div>
      <div class="card-body" style="padding:14px">
        <div class="grid g-2" style="gap:8px;margin-bottom:14px">
          <div><div class="muted small">Custo da receita</div><b style="font-family:var(--font-display);font-size:16px">${BRL(cost)}</b></div>
          <div><div class="muted small">Preço de venda</div><b style="font-family:var(--font-display);font-size:16px">${BRL(p.preco)}</b></div>
          <div><div class="muted small">Lucro estimado</div><b style="font-family:var(--font-display);font-size:16px;color:var(--green)">${BRL(profit)}</b></div>
          <div><div class="muted small">Margem bruta</div><b style="font-family:var(--font-display);font-size:16px;color:${marg>60?'var(--green)':'var(--amber)'}">${PCT(marg)}</b></div>
        </div>
        <div class="bar g"><i style="width:${clamp(marg,0,100)}%"></i></div>
        <div class="hint mt-8">Custo representa ${PCT(100-marg)} do preço de venda</div>
      </div></div>`}).join('')}</div>`;
}
function recipeDialog(pid){
  const p=DB.produtos.find(x=>x.id===pid)||DB.produtos[0];
  const rec=DB.receitas[pid]||[];
  const o=openModal(`
    <div class="modal-head"><div><h3>${ICONS.knife} Ficha técnica · ${esc(p.nome)}</h3><div class="sub" style="color:var(--muted);font-size:12px">Baixa automática ao vender este item</div></div><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body">
      <div class="flex between mb-12"><span class="muted small">Custo total da receita</span><b id="recCost" style="font-family:var(--font-display);font-size:18px;color:var(--amber-2)">${BRL(recipeCost(pid))}</b></div>
      ${rec.map(([iid,q],idx)=>{const i=DB.ingredientes.find(x=>x.id===iid)||{nome:iid,un:'un',custo:0};
        return `<div class="flex between ai-c" style="padding:9px 0;border-bottom:1px solid var(--border)"><span><b>${esc(i.nome)}</b><div class="hint">${BRL(i.custo)} / ${i.un}</div></span><span class="badge b-gray">${q} ${i.un}</span><span class="num strong" style="min-width:80px;text-align:right">${BRL(i.custo*q)}</span></div>`}).join('')||'<p class="muted small">Nenhum ingrediente vinculado.</p>'}
      <div class="mt-20"><button class="btn btn-ghost btn-sm full" data-action="adding">${ICONS.plus} Adicionar ingrediente</button></div>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Fechar</button><button class="btn btn-primary" data-save>${ICONS.check} Salvar ficha</button></div>`,'wide');
  o.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  o.querySelector('[data-action="adding"]').onclick=()=>{const ing=DB.ingredientes.find(i=>!(DB.receitas[pid]||[]).some(r=>r[0]===i.id));if(!ing){toast('Todos os insumos já foram vinculados.','info');return}DB.receitas[pid]=[...(DB.receitas[pid]||[]),[ing.id,1]];closeModal();recipeDialog(pid);toast('Ingrediente vinculado à ficha técnica.','success')};
  o.querySelector('[data-save]').onclick=()=>{closeModal();toast('Ficha técnica salva. Baixa automática configurada.','success');render()};
}

/* ------------------------------ COMPRAS ------------------------------ */
const PURCH_STATUS={'Pendente':'amber','Recebido':'green','Parcial':'blue','Cancelado':'red'};
function purchTotal(cp){return sum(cp.itens,i=>i.qtd*i.custo)}
function vPurchases(){
  const total=sum(DB.compras.filter(c=>c.status!=='Cancelado'),purchTotal);
  const pend=DB.compras.filter(c=>c.status==='Pendente').length;
  return `${pageHead(`
    <button class="btn btn-ghost btn-sm" data-action="export">${ICONS.download} Exportar</button>
    <button class="btn btn-primary btn-sm" data-action="newpurchase">${ICONS.plus} Nova ordem de compra</button>`)}
  <div class="grid g-4 mb-16">
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.purchases}</div><div><b>${DB.compras.length}</b><small>Ordens de compra</small></div></div>
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.money}</div><div><b>${BRL(total)}</b><small>Valor total comprado</small></div></div>
    <div class="stat"><div class="si" style="background:var(--red-soft);color:var(--red)">${ICONS.clock}</div><div><b>${pend}</b><small>Aguardando recebimento</small></div></div>
    <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.check}</div><div><b>${DB.compras.filter(c=>c.status==='Recebido').length}</b><small>Recebidas no mês</small></div></div>
  </div>
  <div class="card"><div class="tbl-wrap"><table><thead><tr><th>Nº / Data</th><th>Fornecedor</th><th>Itens</th><th>Total</th><th>Pagamento</th><th>Vencimento</th><th>Status</th><th></th></tr></thead><tbody>
    ${DB.compras.map(cp=>{const f=DB.fornecedores.find(x=>x.id===cp.forn);const st=PURCH_STATUS[cp.status]||'gray';
      return `<tr><td><b class="mono">${cp.num}</b><br><small class="muted">${fmtDate(cp.data)}</small></td>
      <td><b>${esc(f?f.fantasia:'—')}</b><br><small class="muted">${esc(f?f.contato:'')}</small></td>
      <td class="small muted">${cp.itens.map(i=>i.n).join(', ')}</td>
      <td><b class="num">${BRL(purchTotal(cp))}</b></td><td><span class="badge b-gray">${cp.pag}</span></td>
      <td class="small">${fmtDate(cp.venc)}</td><td><span class="badge b-${st}"><span class="dot"></span>${cp.status}</span></td>
      <td>${cp.status==='Pendente'?`<button class="btn btn-xs btn-success" data-receive="${cp.id}">Receber</button>`:`<button class="btn btn-xs btn-ghost" data-vpurchase="${cp.id}">Ver</button>`}</td></tr>`}).join('')}
  </tbody></table></div></div>`;
}
function receivePurchase(id){
  const cp=DB.compras.find(x=>x.id===id);
  confirmDialog('Confirmar recebimento','Ao confirmar, os itens da ordem <b>'+cp.num+'</b> serão adicionados automaticamente ao estoque e uma conta a pagar será gerada.',()=>{
    cp.status='Recebido';
    cp.itens.forEach(it=>{const ing=DB.ingredientes.find(i=>i.nome===it.n);if(ing)ing.estoque+=it.qtd;
      DB.movimentos.unshift({id:uid('mov'),data:todayISO(),prod:it.n,tipo:'Compra',qtd:it.qtd,resp:state.user?.nome||'Lucas Martins',obs:cp.num+' · '+(DB.fornecedores.find(f=>f.id===cp.forn)?.fantasia||'')})});
    DB.payables.unshift({id:uid('ap'),desc:cp.num+' - '+(DB.fornecedores.find(f=>f.id===cp.forn)?.fantasia||''),cat:'Fornecedores',valor:purchTotal(cp),venc:cp.venc,status:'Pendente',forn:DB.fornecedores.find(f=>f.id===cp.forn)?.fantasia||'—',pago:null,obs:'Gerado automaticamente'});
    toast('Estoque atualizado e conta a pagar gerada.','success','Recebimento confirmado');render();
  },{label:'Confirmar recebimento'});
}
function vPurchaseDialog(cp){
  const f=DB.fornecedores.find(x=>x.id===cp.forn);
  const o=openModal(`<div class="modal-head"><div><h3>${cp.num}</h3><div class="muted small">${esc(f?f.fantasia:'')} · ${fmtDate(cp.data)}</div></div><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body"><div class="tbl-wrap"><table><thead><tr><th>Item</th><th>Qtd</th><th>Custo unit.</th><th class="right">Total</th></tr></thead><tbody>
      ${cp.itens.map(i=>`<tr><td><b>${esc(i.n)}</b></td><td>${NUM(i.qtd)}</td><td class="num">${BRL(i.custo)}</td><td class="right num strong">${BRL(i.qtd*i.custo)}</td></tr>`).join('')}
    </tbody></table></div>
    <div class="flex between" style="margin-top:16px;font-family:var(--font-display);font-size:18px;font-weight:700"><span>Total</span><span style="color:var(--amber-2)">${BRL(purchTotal(cp))}</span></div></div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Fechar</button></div>`);
  o.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
}

/* ------------------------------ FORNECEDORES ------------------------------ */
function vSuppliers(){
  return `${pageHead(`
    <button class="btn btn-ghost btn-sm" data-action="export">${ICONS.download} Exportar</button>
    <button class="btn btn-primary btn-sm" data-action="newsupplier">${ICONS.plus} Novo fornecedor</button>`)}
  <div class="grid g-4 mb-16">
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.suppliers}</div><div><b>${DB.fornecedores.length}</b><small>Fornecedores ativos</small></div></div>
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.purchases}</div><div><b>${DB.compras.length}</b><small>Compras no mês</small></div></div>
    <div class="stat"><div class="si" style="background:var(--red-soft);color:var(--red)">${ICONS.wallet}</div><div><b>${BRL(sum(DB.payables.filter(p=>p.status==='Pendente'&&p.cat==='Fornecedores'),p=>p.valor))}</b><small>A pagar a fornecedores</small></div></div>
    <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.check}</div><div><b>${PCT(96)}</b><small>Entregas no prazo</small></div></div>
  </div>
  <div class="grid g-auto-lg">${DB.fornecedores.map(f=>{const comps=DB.compras.filter(c=>c.forn===f.id);const tot=sum(comps,purchTotal);
    return `<div class="card hover"><div class="card-body">
      <div class="flex ai-c gap-12 mb-12"><div class="avatar neutral" style="width:44px;height:44px;border-radius:13px">${initials(f.fantasia)}</div><div style="flex:1;min-width:0"><b style="font-family:var(--font-display);font-size:14.5px;display:block">${esc(f.fantasia)}</b><small class="muted">${esc(f.contato)}</small></div>
        <button class="icon-btn" style="width:30px;height:30px" data-supplier="${f.id}">${ICONS.eye}</button></div>
      <div class="hint mb-12">${esc(f.cnpj)}</div>
      <div class="flex gap-8 wrap" style="font-size:11.5px"><span class="badge b-gray">${ICONS.phone} ${esc(f.tel)}</span><span class="badge b-green">WhatsApp</span><span class="badge b-blue">${esc(f.pag)}</span></div>
      <div class="divider"></div>
      <div class="flex between" style="font-size:12.5px"><span class="muted">Compras</span><b>${comps.length} ordens</b></div>
      <div class="flex between" style="font-size:12.5px;margin-top:6px"><span class="muted">Valor total</span><b style="color:var(--amber-2)">${BRL(tot)}</b></div>
    </div></div>`}).join('')}</div>`;
}
function supplierDetail(id){
  const f=DB.fornecedores.find(x=>x.id===id);
  const comps=DB.compras.filter(c=>c.forn===f.id);
  const o=openModal(`
    <div class="modal-head"><div><h3>${esc(f.fantasia)}</h3><div class="muted small">${esc(f.razao)} · ${esc(f.cnpj)}</div></div><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body">
      <div class="grid g-2" style="gap:10px;margin-bottom:18px">
        <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.user}</div><div><b style="font-size:13px">${esc(f.contato)}</b><small>Contato comercial</small></div></div>
        <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.phone}</div><div><b style="font-size:13px">${esc(f.tel)}</b><small>${esc(f.wa)}</small></div></div>
      </div>
      <div class="card" style="background:var(--surface-2);margin-bottom:16px"><div class="card-body" style="padding:14px">
        <div class="flex between small" style="padding:4px 0"><span class="muted">Endereço</span><b>${esc(f.end)}</b></div>
        <div class="flex between small" style="padding:4px 0"><span class="muted">E-mail</span><b>${esc(f.email)}</b></div>
        <div class="flex between small" style="padding:4px 0"><span class="muted">Condição de pagamento</span><b>${esc(f.pag)}</b></div>
        <div class="flex between small" style="padding:4px 0"><span class="muted">Observações</span><b>${esc(f.obs||'—')}</b></div>
      </div></div>
      <h4 style="font-size:13px;margin-bottom:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Histórico de compras</h4>
      <div class="tbl-wrap"><table><thead><tr><th>Ordem</th><th>Data</th><th>Valor</th><th>Status</th></tr></thead><tbody>
        ${comps.map(c=>`<tr><td class="mono">${c.num}</td><td class="muted small">${fmtDate(c.data)}</td><td><b class="num">${BRL(purchTotal(c))}</b></td><td><span class="badge b-${PURCH_STATUS[c.status]}">${c.status}</span></td></tr>`).join('')||'<tr><td colspan="4" class="muted">Nenhuma compra registrada.</td></tr>'}
      </tbody></table></div>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Fechar</button><button class="btn btn-primary" data-action="newpurchase">${ICONS.plus} Nova compra</button></div>`,'wide');
  o.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  o.querySelector('[data-action="newpurchase"]').onclick=()=>{closeModal();newPurchaseDialog()};
}
function newPurchaseDialog(){
  const o=openModal(`<div class="modal-head"><h3>Nova ordem de compra</h3><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body"><div class="form-grid">
      <div class="field"><label>Fornecedor *</label><select class="input" id="npForn">${DB.fornecedores.map(f=>`<option value="${f.id}">${esc(f.fantasia)}</option>`).join('')}</select></div>
      <div class="field"><label>Data</label><input class="input" type="date" id="npData" value="${todayISO()}"/></div>
      <div class="field"><label>Item *</label><select class="input" id="npItem">${DB.ingredientes.map(i=>`<option>${esc(i.nome)}</option>`).join('')}</select></div>
      <div class="field"><label>Quantidade</label><input class="input" type="number" id="npQtd" value="100"/></div>
      <div class="field"><label>Custo unitário (R$)</label><input class="input" type="number" step="0.01" id="npCusto" value="1.00"/></div>
      <div class="field"><label>Forma de pagamento</label><select class="input" id="npPag">${['PIX','Boleto','Cartão','À vista','Transferência'].map(p=>`<option>${p}</option>`).join('')}</select></div>
      <div class="field"><label>Vencimento</label><input class="input" type="date" id="npVenc" value="${daysAgo(-30)}"/></div>
    </div></div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-save>${ICONS.check} Criar ordem de compra</button></div>`);
  o.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  o.querySelector('[data-save]').onclick=()=>{
    const num='OC-2026-0'+(147+DB.compras.length);
    DB.compras.unshift({id:uid('cp'),num,forn:$('#npForn').value,data:$('#npData').value,previsao:daysAgo(-3),itens:[{n:$('#npItem').value,qtd:+$('#npQtd').value,custo:+$('#npCusto').value}],pag:$('#npPag').value,venc:$('#npVenc').value,status:'Pendente'});
    closeModal();toast('Ordem '+num+' criada com sucesso.','success');render();
  };
}

/* ------------------------------ CLIENTES ------------------------------ */
function clientStats(c){
  const seed=(c.id.charCodeAt(1)+c.id.charCodeAt(2))%7;
  const orders=6+seed*3;const ticket=[48,62,75,88,54,110,69][seed];
  return {orders,total:orders*ticket,ticket,last:daysAgo(seed+1),segment:seed>=5?'VIP':seed>=2?'Regular':seed===1?'Novo':'Inativo'};
}
const SEG_COLOR={VIP:'amber',Regular:'green',Novo:'blue',Inativo:'gray'};
function vClients(){
  const segs={VIP:0,Regular:0,Novo:0,Inativo:0};DB.clientes.forEach(c=>segs[clientStats(c).segment]++);
  let list=DB.clientes.slice();if(state.clientFilter)list=list.filter(c=>clientStats(c).segment===state.clientFilter);
  return `${pageHead(`
    <button class="btn btn-ghost btn-sm" data-action="export">${ICONS.download} Exportar</button>
    <button class="btn btn-primary btn-sm" data-action="newclient">${ICONS.plus} Novo cliente</button>`)}
  <div class="grid g-4 mb-16">
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.clients}</div><div><b>${DB.clientes.length}</b><small>Clientes cadastrados</small></div></div>
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.star}</div><div><b>${segs.VIP}</b><small>Clientes VIP</small></div></div>
    <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.trendUp}</div><div><b>${segs.Regular}</b><small>Clientes recorrentes</small></div></div>
    <div class="stat"><div class="si" style="background:var(--purple-soft);color:var(--purple)">${ICONS.money}</div><div><b>${BRL(sum(DB.clientes,c=>clientStats(c).total))}</b><small>LTV total da base</small></div></div>
  </div>
  <div class="chips mb-16">${['Todos','VIP','Regular','Novo','Inativo'].map(s=>`<span class="chip ${(state.clientFilter||'Todos')===s?'on':''}" data-cseg="${s}">${s}${s!=='Todos'?` (${segs[s]||0})`:''}</span>`).join('')}</div>
  <div class="grid g-auto-lg">${list.map(c=>{const st=clientStats(c);const col=SEG_COLOR[st.segment];
    return `<div class="card hover" style="cursor:pointer" data-client="${c.id}">
      <div class="card-body">
        <div class="flex ai-c gap-12 mb-12"><div class="avatar" style="width:44px;height:44px;border-radius:13px">${initials(c.nome)}</div>
          <div style="flex:1;min-width:0"><b style="font-family:var(--font-display);font-size:14.5px;display:block">${esc(c.nome)}</b><small class="muted">${esc(c.bairro)} · ${esc(c.cidade)}</small></div>
          <span class="badge b-${col}">${st.segment}</span></div>
        <div class="grid g-2" style="gap:8px">
          <div><div class="muted small">Pedidos</div><b>${st.orders}</b></div>
          <div><div class="muted small">Ticket médio</div><b>${BRL(st.ticket)}</b></div>
          <div><div class="muted small">Total gasto</div><b style="color:var(--amber-2)">${BRL(st.total)}</b></div>
          <div><div class="muted small">Última compra</div><b class="small">${fmtDate(st.last)}</b></div>
        </div>
      </div></div>`}).join('')}</div>`;
}
function clientProfile(id){
  const c=DB.clientes.find(x=>x.id===id);const st=clientStats(c);
  const fav=[...DB.produtos].sort(()=>Math.random()-.5).slice(0,4);
  const o=openModal(`
    <div class="modal-head"><div class="flex ai-c gap-12"><div class="avatar lg">${initials(c.nome)}</div><div><h3>${esc(c.nome)}</h3><div class="flex gap-8" style="margin-top:5px"><span class="badge b-${SEG_COLOR[st.segment]}"><span class="dot"></span>${st.segment}</span><span class="muted small">${esc(c.cpf)}</span></div></div></div><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body">
      <div class="grid g-4" style="gap:10px;margin-bottom:18px">
        <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.orders}</div><div><b>${st.orders}</b><small>Pedidos</small></div></div>
        <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.money}</div><div><b>${BRL(st.ticket)}</b><small>Ticket médio</small></div></div>
        <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.wallet}</div><div><b>${BRL(st.total)}</b><small>Total gasto</small></div></div>
        <div class="stat"><div class="si" style="background:var(--purple-soft);color:var(--purple)">${ICONS.clock}</div><div><b class="small">${fmtDate(st.last)}</b><small>Última compra</small></div></div>
      </div>
      <div class="grid g-2" style="gap:16px">
        <div><h4 style="font-size:13px;margin-bottom:12px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Dados de contato</h4>
          <div class="card" style="background:var(--surface-2)"><div class="card-body" style="padding:14px">
            <div class="flex between small" style="padding:4px 0"><span class="muted">Telefone</span><b>${esc(c.tel)}</b></div>
            <div class="flex between small" style="padding:4px 0"><span class="muted">E-mail</span><b>${esc(c.email)}</b></div>
            <div class="flex between small" style="padding:4px 0"><span class="muted">Aniversário</span><b>${fmtDate(c.nasc)}</b></div>
            <div class="flex between small" style="padding:4px 0"><span class="muted">Endereço</span><b style="text-align:right">${esc(c.endereco)} — ${esc(c.bairro)}</b></div>
          </div></div>
          <div class="grid g-2 mt-16" style="gap:8px"><button class="btn btn-ghost btn-sm" data-action="msg">${ICONS.phone} WhatsApp</button><button class="btn btn-ghost btn-sm" data-action="neworder">${ICONS.plus} Novo pedido</button></div>
        </div>
        <div><h4 style="font-size:13px;margin-bottom:12px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Produtos favoritos</h4>
          <div class="card" style="background:var(--surface-2)"><div class="card-body" style="padding:14px">
            ${fav.map(p=>`<div class="flex between ai-c" style="padding:8px 0;border-bottom:1px solid var(--border);font-size:13px"><span>${p.emoji} ${esc(p.nome)}</span><b class="num">${BRL(p.preco)}</b></div>`).join('')}
          </div></div>
          <div class="card mt-16" style="background:var(--surface-2)"><div class="card-body" style="padding:14px">
            <b style="font-size:13px">Segmentação automática</b><p class="muted small mt-8">Cliente classificado como <b style="color:var(--amber-2)">${st.segment}</b> com base em frequência, ticket médio e recência de compra.</p>
          </div></div>
        </div>
      </div>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Fechar</button><button class="btn btn-primary" data-action="editclient">${ICONS.edit} Editar cliente</button></div>`,'wide');
  o.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  o.querySelectorAll('[data-action="msg"]').forEach(b=>b.onclick=()=>toast('Abrindo conversa no WhatsApp com '+c.nome,'info'));
  o.querySelectorAll('[data-action="neworder"]').forEach(b=>b.onclick=()=>{closeModal();navigate('pos')});
  o.querySelectorAll('[data-action="editclient"]').forEach(b=>b.onclick=()=>toast('Formulário de edição aberto (demo).','info'));
}

/* ------------------------------ DELIVERY ------------------------------ */
const DELIV_ST=[['Novo','Novo','blue'],['Confirmado','Confirmado','purple'],['Em preparo','Em preparo','amber'],['Pronto','Pronto','green'],['Saiu para entrega','Em rota','purple'],['Entregue','Entregue','green']];
function vDelivery(){
  const dl=DB.pedidos.filter(o=>o.tipo==='Delivery');
  const emRota=dl.filter(o=>o.status==='Saiu para entrega').length;
  const taxa=sum(dl,o=>o.entrega);
  const tempo=38;
  return `${pageHead(`
    <span class="badge b-green"><span class="dot"></span>Rota ativa</span>
    <button class="btn btn-ghost btn-sm" data-action="export">${ICONS.download} Exportar</button>`)}
  <div class="grid g-4 mb-16">
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.delivery}</div><div><b>${dl.length}</b><small>Pedidos delivery hoje</small></div></div>
    <div class="stat"><div class="si" style="background:var(--purple-soft);color:var(--purple)">${ICONS.map}</div><div><b>${emRota}</b><small>Em rota agora</small></div></div>
    <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.clock}</div><div><b>${tempo} min</b><small>Tempo médio de entrega</small></div></div>
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.money}</div><div><b>${BRL(taxa)}</b><small>Taxas de entrega</small></div></div>
  </div>
  <div class="card mb-16"><div class="card-head"><h3>${ICONS.map} Entregadores em operação</h3></div><div class="card-body">
    <div class="grid g-3">${['Diego Ferreira','Rafael Lima','Pedro Santos'].map((n,i)=>{const active=i<2;
      return `<div class="card" style="background:var(--surface-2)"><div class="card-body" style="padding:14px"><div class="flex ai-c gap-12"><div class="avatar sm">${initials(n)}</div><div style="flex:1"><b style="font-size:13.5px">${n}</b><div class="muted small">${active?(2-i)+' entregas em rota':'Disponível'}</div></div><span class="badge ${active?'b-green':'b-gray'}"><span class="dot"></span>${active?'Em rota':'Livre'}</span></div>
        <div class="bar ${active?'':'g'}" style="margin-top:12px"><i style="width:${active?65-i*18:20}%"></i></div></div></div>`}).join('')}</div>
  </div></div>
  <div class="kds" style="grid-template-columns:repeat(3,1fr);height:auto">
    ${[['Novo','NOVOS',['Novo','Confirmado']],['Em preparo','EM PREPARO',['Em preparo','Pronto']],['Saiu para entrega','EM ROTA / ENTREGUES',['Saiu para entrega','Entregue']]].map(([k,title,sts])=>{const list=dl.filter(o=>sts.includes(o.status));
      return `<div class="kds-col"><div class="kds-col-head"><b>${title}</b><span class="cnt">${list.length}</span></div><div class="kds-body" style="max-height:420px">
        ${list.length?list.map(o=>`<div class="kds-card"><div class="kds-top"><div><div class="kds-num">#${o.num}</div><div class="muted small">${esc(o.cliente)}</div></div>${badge(o.status)}</div>
          <div class="muted small" style="display:flex;gap:6px;align-items:flex-start">${ICONS.map}<span>${esc(o.endereco||'—')}<br>${esc(o.bairro||'')}</span></div>
          <div class="flex between mt-8" style="font-size:12.5px"><span class="muted">${o.itens.length} itens · ${o.pm||'PIX'}</span><b>${BRL(o.total)}</b></div>
          <div class="grid g-2" style="gap:8px;margin-top:10px"><button class="btn btn-xs btn-ghost" data-order="${o.id}">Detalhes</button><button class="btn btn-xs btn-primary" data-advance="${o.id}">Avançar</button></div>
        </div>`).join(''):`<div class="empty" style="padding:30px 12px"><div class="ei">${ICONS.delivery}</div><h4>Nenhum pedido</h4><p>Nada nesta etapa.</p></div>`}
      </div></div>`}).join('')}
  </div>`;
}

/* ------------------------------ RESERVAS ------------------------------ */
const RES_COLOR={'Confirmada':'green','Aguardando':'amber','Chegou':'blue','Concluída':'gray','Cancelada':'red'};
function vReservations(){
  const list=DB.reservas.slice().sort((a,b)=>a.data.localeCompare(b.data)||a.hora.localeCompare(b.hora));
  const hoje=list.filter(r=>r.data===todayISO()).length;
  const pessoas=sum(list.filter(r=>r.status!=='Cancelada'),r=>r.pessoas);
  return `${pageHead(`
    <div class="seg" data-seg="resView"><button class="on">Lista</button><button data-val="agenda">Agenda</button></div>
    <button class="btn btn-primary btn-sm" data-action="newres">${ICONS.plus} Nova reserva</button>`)}
  <div class="grid g-4 mb-16">
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.reserv}</div><div><b>${list.length}</b><small>Reservas ativas</small></div></div>
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.clock}</div><div><b>${hoje}</b><small>Reservas para hoje</small></div></div>
    <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.clients}</div><div><b>${pessoas}</b><small>Pessoas esperadas</small></div></div>
    <div class="stat"><div class="si" style="background:var(--purple-soft);color:var(--purple)">${ICONS.tables}</div><div><b>${list.filter(r=>r.status==='Confirmada').length}</b><small>Confirmadas</small></div></div>
  </div>
  <div class="card">
    <div class="card-head"><h3>${ICONS.reserv} Agenda de reservas</h3><span class="muted small">Próximos 5 dias</span></div>
    <div class="tbl-wrap"><table><thead><tr><th>Data / Hora</th><th>Cliente</th><th>Pessoas</th><th>Mesa</th><th>Telefone</th><th>Observações</th><th>Status</th><th></th></tr></thead><tbody>
      ${list.map(r=>`<tr><td><b>${fmtDate(r.data)}</b><br><small class="muted">${r.hora}</small></td>
        <td><b>${esc(r.cliente)}</b></td><td><span class="badge b-gray">${ICONS.user} ${r.pessoas}</span></td>
        <td>Mesa ${r.mesa}</td><td class="small muted">${esc(r.tel)}</td><td class="muted small">${esc(r.obs||'—')}</td>
        <td><span class="badge b-${RES_COLOR[r.status]}${r.status==='Confirmada'?'':''}"><span class="dot"></span>${r.status}</span></td>
        <td><div class="flex gap-8"><button class="btn btn-xs btn-ghost" data-rescheck="${r.id}">Chegou</button><button class="btn btn-xs btn-ghost" data-resdel="${r.id}">${ICONS.trash}</button></div></td></tr>`).join('')}
    </tbody></table></div>
  </div>`;
}

/* ------------------------------ PROMOÇÕES ------------------------------ */
const PROMO_TIPO={percent:'Desconto %',fixed:'Desconto fixo',combo:'Combo',bxgy:'Leve X Pague Y',coupon:'Cupom',happy:'Happy Hour'};
function vPromos(){
  const ativas=DB.promo.filter(p=>p.ativo).length;
  const usos=sum(DB.promo,p=>p.usos);
  return `${pageHead(`
    <button class="btn btn-ghost btn-sm" data-action="export">${ICONS.download} Exportar</button>
    <button class="btn btn-primary btn-sm" data-action="newpromo">${ICONS.plus} Nova promoção</button>`)}
  <div class="grid g-4 mb-16">
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.promo}</div><div><b>${DB.promo.length}</b><small>Campanhas criadas</small></div></div>
    <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.check}</div><div><b>${ativas}</b><small>Campanhas ativas</small></div></div>
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.tag}</div><div><b>${NUM(usos)}</b><small>Utilizações totais</small></div></div>
    <div class="stat"><div class="si" style="background:var(--purple-soft);color:var(--purple)">${ICONS.trendUp}</div><div><b>${BRL(usos*12.4)}</b><small>Receita incremental est.</small></div></div>
  </div>
  <div class="grid g-auto-lg">${DB.promo.map(p=>`<div class="card hover">
    <div class="card-head"><div class="flex ai-c gap-12"><div class="avatar" style="background:linear-gradient(135deg,#e0574f,#f7a633)">%</div><div><b style="font-family:var(--font-display);font-size:14.5px">${esc(p.nome)}</b><div class="sub">${PROMO_TIPO[p.tipo]||p.tipo}${p.valor?' · '+p.valor+(p.tipo==='percent'||p.tipo==='coupon'?'%':' R$'):''}</div></div></div>
      <span class="badge ${p.ativo?'b-green':'b-gray'}"><span class="dot"></span>${p.ativo?'Ativa':'Inativa'}</span></div>
    <div class="card-body" style="padding:14px">
      <p class="muted small" style="min-height:36px">${esc(p.desc)}</p>
      <div class="divider"></div>
      <div class="flex between small" style="padding:3px 0"><span class="muted">Vigência</span><b>${fmtDate(p.ini)} → ${fmtDate(p.fim)}</b></div>
      <div class="flex between small" style="padding:3px 0"><span class="muted">Produtos</span><b>${esc(p.prod)}</b></div>
      <div class="flex between small" style="padding:3px 0"><span class="muted">Compra mínima</span><b>${p.min?BRL(p.min):'Sem mínimo'}</b></div>
      <div class="flex between small" style="padding:3px 0"><span class="muted">Utilizações</span><b style="color:var(--amber-2)">${NUM(p.usos)}</b></div>
      <div class="cart-actions"><button class="btn btn-ghost btn-sm" data-promotoggle="${p.id}">${p.ativo?'Pausar':'Ativar'}</button><button class="btn btn-ghost btn-sm" data-promoedit="${p.id}">${ICONS.edit} Editar</button></div>
    </div></div>`).join('')}</div>`;
}

/* ------------------------------ FINANCEIRO ------------------------------ */
function vFinance(){
  const tab=state.financeTab;
  const pagar=DB.payables.filter(p=>p.status==='Pendente');
  const receber=DB.receivables.filter(p=>p.status==='Pendente');
  const totalPagar=sum(pagar,p=>p.valor),totalReceber=sum(receber,p=>p.valor);
  const vencidas=pagar.filter(p=>new Date(p.venc)<new Date()).length;
  const fluxo=[{d:'Sem 1',rec:28400,desp:19200},{d:'Sem 2',rec:31200,desp:22400},{d:'Sem 3',rec:26800,desp:24800},{d:'Sem 4',rec:34600,desp:23900}];
  const saldo=sum(fluxo,f=>f.rec-f.desp);
  return `${pageHead(`
    <button class="btn btn-ghost btn-sm" data-action="export">${ICONS.download} Exportar</button>
    <button class="btn btn-ghost btn-sm" data-action="newpayable">${ICONS.plus} Conta a pagar</button>
    <button class="btn btn-primary btn-sm" data-action="newreceivable">${ICONS.plus} Conta a receber</button>`)}
  <div class="grid g-4 mb-16">
    <div class="stat"><div class="si" style="background:var(--red-soft);color:var(--red)">${ICONS.trendDown}</div><div><b>${BRL(totalPagar)}</b><small>A pagar (${pagar.length})</small></div></div>
    <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.trendUp}</div><div><b>${BRL(totalReceber)}</b><small>A receber (${receber.length})</small></div></div>
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.wallet}</div><div><b>${BRL(saldo)}</b><small>Resultado líquido do mês</small></div></div>
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.alert}</div><div><b>${vencidas}</b><small>Contas vencidas</small></div></div>
  </div>
  ${state.financeTab!=='fluxo'?`<div class="grid" style="grid-template-columns:1.5fr 1fr;margin-bottom:16px">
    <div class="card"><div class="card-head"><h3>${ICONS.chart} Receitas × Despesas</h3><span class="sub">Últimas 4 semanas</span></div><div class="card-body">
      ${vBars(fluxo.map((f,i)=>({d:f.d,v:f.rec})),{color:'#3ecf8e'})}
      <div class="divider"></div>
      ${vBars(fluxo.map(f=>({d:f.d,v:f.desp})),{color:'#e0574f'})}
    </div></div>
    <div class="card"><div class="card-head"><h3>${ICONS.wallet} Fluxo de caixa</h3></div><div class="card-body"><div class="legend">
      ${fluxo.map(f=>`<div class="flex between" style="padding:9px 0;border-bottom:1px solid var(--border)"><div><b style="font-size:13px">${f.d}</b><div class="muted small">Receitas ${BRL(f.rec)}</div></div><b class="num" style="color:${f.rec-f.desp>=0?'var(--green)':'#ff8378'}">${f.rec-f.desp>=0?'+':'−'}${BRL(Math.abs(f.rec-f.desp))}</b></div>`).join('')}
      <div class="flex between" style="padding:12px 0 0;font-family:var(--font-display);font-size:17px;font-weight:700"><span>Resultado</span><span style="color:var(--green)">${BRL(saldo)}</span></div>
    </div></div></div>
  </div>`:''}
  <div class="tabs">${[['pagar','Contas a Pagar'],['receber','Contas a Receber'],['fluxo','Fluxo de Caixa']].map(([k,l])=>`<button class="tab ${tab===k?'on':''}" data-ftab="${k}">${l}</button>`).join('')}</div>
  ${tab==='pagar'?`<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Descrição</th><th>Categoria</th><th>Fornecedor</th><th>Valor</th><th>Vencimento</th><th>Status</th><th></th></tr></thead><tbody>
    ${DB.payables.map(p=>{const late=p.status==='Pendente'&&new Date(p.venc)<new Date();
      return `<tr><td><b>${esc(p.desc)}</b>${p.obs?`<br><small class="muted">${esc(p.obs)}</small>`:''}</td><td><span class="badge b-gray">${esc(p.cat)}</span></td><td class="small">${esc(p.forn)}</td><td><b class="num">${BRL(p.valor)}</b></td>
      <td class="small" style="color:${late?'#ff8378':'inherit'}">${fmtDate(p.venc)}${late?' ⚠':''}</td>
      <td><span class="badge ${p.status==='Pago'?'b-green':'b-amber'}"><span class="dot"></span>${p.status}</span></td>
      <td>${p.status==='Pendente'?`<button class="btn btn-xs btn-success" data-pay="${p.id}">Pagar</button>`:`<span class="muted small">${fmtDate(p.pago)}</span>`}</td></tr>`}).join('')}
  </tbody></table></div></div>`
  :tab==='receber'?`<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Cliente</th><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th><th></th></tr></thead><tbody>
    ${DB.receivables.map(r=>`<tr><td><b>${esc(r.cliente)}</b></td><td class="small">${esc(r.desc)}</td><td><b class="num">${BRL(r.valor)}</b></td><td class="small">${fmtDate(r.venc)}</td>
      <td><span class="badge ${r.status==='Pago'?'b-green':'b-amber'}"><span class="dot"></span>${r.status}</span></td><td>${r.status==='Pendente'?`<button class="btn btn-xs btn-success" data-receive2="${r.id}">Receber</button>`:`<span class="muted small">${fmtDate(r.pago)}</span>`}</td></tr>`).join('')}
  </tbody></table></div></div>`
  :`<div class="grid g-2">
    <div class="card"><div class="card-head"><h3>${ICONS.chart} Receitas por categoria</h3></div><div class="card-body">${barRows([{n:'Salão / Mesas',v:68400,c:'#3ecf8e'},{n:'Balcão / Retirada',v:32400,c:'#5b9cf6'},{n:'Delivery próprio',v:21800,c:'#f7a633'},{n:'iFood / Apps',v:28600,c:'#a97bf0'}])}</div></div>
    <div class="card"><div class="card-head"><h3>${ICONS.wallet} Despesas por categoria</h3></div><div class="card-body">${barRows(DB.payables.filter(p=>p.status==='Pendente').map(p=>({n:p.cat,v:p.valor,c:'#e0574f'})))}</div></div>
  </div>`}`;
}

/* ------------------------------ CAIXA ------------------------------ */
function vCashier(){
  const cx=DB.caixa;
  const vendas=sum(cx.movimentos.filter(m=>m.tipo==='Venda'),m=>m.valor);
  const sangrias=sum(cx.movimentos.filter(m=>m.valor<0),m=>m.valor);
  const supr=sum(cx.movimentos.filter(m=>m.valor>0&&m.tipo!=='Venda'),m=>m.valor);
  const esperado=cx.saldoInicial+vendas+sangrias+supr;
  return `${pageHead(`
    <span class="badge ${cx.aberto?'b-green':'b-red'} pulse"><span class="dot"></span>${cx.aberto?'Caixa aberto':'Caixa fechado'}</span>
    <button class="btn btn-ghost btn-sm" data-action="sangria">${ICONS.minus} Sangria</button>
    <button class="btn btn-ghost btn-sm" data-action="suprimento">${ICONS.plus} Suprimento</button>
    <button class="btn btn-primary btn-sm" data-action="closecash">${ICONS.lock} Fechar caixa</button>`)}
  <div class="grid g-4 mb-16">
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.wallet}</div><div><b>${BRL(esperado)}</b><small>Saldo esperado</small></div></div>
    <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.money}</div><div><b>${BRL(vendas)}</b><small>Vendas do turno</small></div></div>
    <div class="stat"><div class="si" style="background:var(--red-soft);color:var(--red)">${ICONS.trendDown}</div><div><b>${BRL(Math.abs(sangrias))}</b><small>Sangrias</small></div></div>
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.clock}</div><div><b>${new Date(cx.abertoEm).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</b><small>Abertura do caixa</small></div></div>
  </div>
  <div class="grid" style="grid-template-columns:1.5fr 1fr">
    <div class="card"><div class="card-head"><h3>${ICONS.clock} Movimentações do turno</h3><span class="muted small">${state.user?state.user.nome:'Rafael Lima'}</span></div>
      <div class="tbl-wrap"><table><thead><tr><th>Tipo</th><th>Descrição</th><th>Responsável</th><th>Hora</th><th class="right">Valor</th></tr></thead><tbody>
        <tr><td><span class="badge b-blue">Abertura</span></td><td><b>Fundo de troco inicial</b></td><td class="small">${state.user?state.user.nome:'Rafael Lima'}</td><td class="muted small">11:00</td><td class="right num strong">${BRL(cx.saldoInicial)}</td></tr>
        ${cx.movimentos.map(m=>`<tr><td><span class="badge ${m.valor>=0?'b-green':'b-red'}">${m.tipo}</span></td><td class="small">${esc(m.desc)}</td><td class="small muted">${esc(m.resp)}</td><td class="muted small">${new Date(m.hora).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td><td class="right num strong" style="color:${m.valor>=0?'var(--green)':'#ff8378'}">${m.valor>=0?'+':'−'}${BRL(Math.abs(m.valor))}</td></tr>`).join('')}
      </tbody></table></div></div>
    <div class="card"><div class="card-head"><h3>${ICONS.print} Resumo do turno</h3></div><div class="card-body">
      <div class="sum-row"><span>Fundo inicial</span><span class="num">${BRL(cx.saldoInicial)}</span></div>
      <div class="sum-row"><span>Vendas (${cx.movimentos.filter(m=>m.tipo==='Venda').length})</span><span class="num" style="color:var(--green)">+ ${BRL(vendas)}</span></div>
      <div class="sum-row"><span>Suprimentos</span><span class="num" style="color:var(--green)">+ ${BRL(supr)}</span></div>
      <div class="sum-row"><span>Sangrias</span><span class="num" style="color:#ff8378">− ${BRL(Math.abs(sangrias))}</span></div>
      <div class="sum-row total"><span>Saldo esperado</span><span class="num">${BRL(esperado)}</span></div>
      <div class="mt-16"><div class="field"><label>Contagem cega do operador</label><input class="input" type="number" step="0.01" id="cashCount" placeholder="0,00"/></div>
      <button class="btn btn-ghost btn-sm full" data-action="diffcalc">Calcular diferença</button></div>
    </div></div>
  </div>`;
}
function closeCashDialog(){
  const cx=DB.caixa;
  const vendas=sum(cx.movimentos.filter(m=>m.tipo==='Venda'),m=>m.valor);
  const sangrias=sum(cx.movimentos.filter(m=>m.valor<0),m=>m.valor);
  const esperado=cx.saldoInicial+vendas+sangrias;
  const o=openModal(`
    <div class="modal-head"><h3>Fechamento de caixa</h3><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body">
      <div class="card" style="background:var(--surface-2);margin-bottom:16px"><div class="card-body" style="padding:16px">
        <div class="flex between" style="font-size:13px;padding:5px 0"><span class="muted">Saldo esperado (sistema)</span><b class="num">${BRL(esperado)}</b></div>
        <div class="field" style="margin-top:12px"><label>Saldo contado (dinheiro na gaveta)</label><input class="input" type="number" step="0.01" id="ccCount" value="${esperado.toFixed(2)}"/></div>
        <div class="flex between" style="font-size:13px;padding:5px 0"><span class="muted">Diferença</span><b id="ccDiff" class="num" style="color:var(--green)">R$ 0,00</b></div>
      </div></div>
      <label class="check"><input type="checkbox" id="ccReport" checked/> Gerar relatório de fechamento em PDF</label>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok>${ICONS.check} Confirmar fechamento</button></div>`,'sm');
  o.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  const upd=()=>{const d=+$('#ccCount').value-esperado;const el=$('#ccDiff');el.textContent=(d>=0?'+':'-')+BRL(Math.abs(d));el.style.color=d===0?'var(--green)':d>0?'var(--blue)':'#ff8378'};
  $('#ccCount').oninput=upd;upd();
  o.querySelector('[data-ok]').onclick=()=>{
    DB.caixa.aberto=false;closeModal();
    toast('Caixa fechado. Relatório gerado e enviado para impressão.','success','Fechamento concluído');render();
  };
}

/* ------------------------------ FUNCIONÁRIOS ------------------------------ */
const ROLE_PERMS={
 'Proprietário':{desc:'Acesso total ao sistema',perms:['Visualizar','Criar','Editar','Excluir','Exportar','Financeiro','Relatórios','Funcionários','Estoque'],color:'amber'},
 'Gerente':{desc:'Acesso quase total, exceto exclusões críticas',perms:['Visualizar','Criar','Editar','Exportar','Financeiro','Relatórios','Funcionários','Estoque'],color:'purple'},
 'Caixa':{desc:'PDV, caixa e recebimento',perms:['Visualizar','Criar','Editar'],color:'blue'},
 'Garçom':{desc:'Mesas, comandas e pedidos',perms:['Visualizar','Criar','Editar'],color:'green'},
 'Churrasqueiro':{desc:'Painel da cozinha (KDS)',perms:['Visualizar','Editar'],color:'blue'},
 'Cozinha':{desc:'Painel da cozinha (KDS)',perms:['Visualizar','Editar'],color:'blue'},
 'Entregador':{desc:'Delivery e rotas',perms:['Visualizar','Editar'],color:'green'},
 'Estoquista':{desc:'Estoque e compras',perms:['Visualizar','Criar','Editar','Estoque'],color:'purple'}
};
const PERM_COLS=['Visualizar','Criar','Editar','Excluir','Exportar','Financeiro','Relatórios','Funcionários','Estoque'];
function vStaff(){
  const tab=state.staffTab||'equipe';
  const folha=sum(DB.funcionarios,f=>f.salario);
  return `${pageHead(`
    <button class="btn btn-ghost btn-sm" data-action="export">${ICONS.download} Exportar</button>
    <button class="btn btn-primary btn-sm" data-action="newstaff">${ICONS.plus} Novo funcionário</button>`)}
  <div class="grid g-4 mb-16">
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.staff}</div><div><b>${DB.funcionarios.length}</b><small>Colaboradores</small></div></div>
    <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.check}</div><div><b>${DB.funcionarios.filter(f=>f.status==='Ativo').length}</b><small>Ativos</small></div></div>
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.wallet}</div><div><b>${BRL(folha)}</b><small>Folha mensal</small></div></div>
    <div class="stat"><div class="si" style="background:var(--purple-soft);color:var(--purple)">${ICONS.shield}</div><div><b>${Object.keys(ROLE_PERMS).length}</b><small>Cargos / perfis</small></div></div>
  </div>
  <div class="tabs">${[['equipe','Equipe'],['permissoes','Cargos & Permissões']].map(([k,l])=>`<button class="tab ${tab===k?'on':''}" data-stftab="${k}">${l}</button>`).join('')}</div>
  ${tab==='equipe'?`<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Colaborador</th><th>Cargo</th><th>Contato</th><th>Admissão</th><th>Salário</th><th>Status</th><th></th></tr></thead><tbody>
    ${DB.funcionarios.map(f=>{const rp=ROLE_PERMS[f.cargo]||{color:'gray'};
      return `<tr><td><div class="cell-prod"><div class="avatar sm">${initials(f.nome)}</div><div><b>${esc(f.nome)}</b><br><small class="muted">${esc(f.cpf)}</small></div></div></td>
      <td><span class="badge b-${rp.color}">${esc(f.cargo)}</span></td><td class="small">${esc(f.tel)}<br><small class="muted">${esc(f.email)}</small></td>
      <td class="muted small">${fmtDate(f.adm)}</td><td><b class="num">${f.salario?BRL(f.salario):'—'}</b></td>
      <td><span class="badge ${f.status==='Ativo'?'b-green':f.status==='Férias'?'b-amber':'b-red'}"><span class="dot"></span>${f.status}</span></td>
      <td><div class="flex gap-8"><button class="icon-btn" style="width:30px;height:30px" data-editstaff="${f.id}">${ICONS.edit}</button><button class="icon-btn" style="width:30px;height:30px" data-permstaff="${f.id}" title="Permissões">${ICONS.shield}</button></div></td></tr>`}).join('')}
  </tbody></table></div></div>`
  :`<div class="card"><div class="card-head"><h3>${ICONS.shield} Matriz de permissões por cargo</h3><span class="muted small">Configurável pelo proprietário</span></div>
    <div class="tbl-wrap"><table class="matrix"><thead><tr><th>Cargo</th>${PERM_COLS.map(p=>`<th>${p}</th>`).join('')}</tr></thead><tbody>
      ${Object.entries(ROLE_PERMS).map(([c,v])=>`<tr><td><b>${c}</b><div class="hint">${v.desc}</div></td>${PERM_COLS.map(p=>`<td><input type="checkbox" class="pcheck" ${v.perms.includes(p)?'checked':''} data-perm="${c}|${p}"/></td>`).join('')}</tr>`).join('')}
    </tbody></table></div>
    <div class="card-body"><div class="flex gap-12 ai-c wrap"><span class="muted small">Alterações de permissão são aplicadas imediatamente no próximo login do colaborador.</span><button class="btn btn-primary btn-sm" data-action="saveperms">${ICONS.check} Salvar permissões</button></div></div></div>`}`;
}
function staffForm(id){
  const f=id?DB.funcionarios.find(x=>x.id===id):null;
  const o=openModal(`<div class="modal-head"><h3>${f?'Editar funcionário':'Novo funcionário'}</h3><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body"><div class="form-grid">
      <div class="field full"><label>Nome completo *</label><input class="input" id="stNome" value="${f?esc(f.nome):''}"/></div>
      <div class="field"><label>CPF</label><input class="input" id="stCpf" value="${f?esc(f.cpf):''}" placeholder="000.000.000-00"/></div>
      <div class="field"><label>Telefone</label><input class="input" id="stTel" value="${f?esc(f.tel):''}"/></div>
      <div class="field"><label>Cargo *</label><select class="input" id="stCargo">${Object.keys(ROLE_PERMS).map(c=>`<option ${f&&f.cargo===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label>Salário (R$)</label><input class="input" type="number" id="stSal" value="${f?f.salario:''}"/></div>
      <div class="field"><label>Data de admissão</label><input class="input" type="date" id="stAdm" value="${f?f.adm:todayISO()}"/></div>
      <div class="field"><label>E-mail de acesso</label><input class="input" id="stEmail" value="${f?esc(f.email):''}"/></div>
      <div class="field"><label>Status</label><select class="input" id="stStatus">${['Ativo','Férias','Inativo'].map(s=>`<option ${f&&f.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
    </div></div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-save>${ICONS.check} ${f?'Salvar':'Cadastrar'}</button></div>`);
  o.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  o.querySelector('[data-save]').onclick=()=>{
    const nome=$('#stNome').value.trim();if(!nome){toast('Informe o nome do colaborador.','error');return}
    const d={nome,cpf:$('#stCpf').value,tel:$('#stTel').value,cargo:$('#stCargo').value,salario:+$('#stSal').value||0,adm:$('#stAdm').value,email:$('#stEmail').value,status:$('#stStatus').value};
    if(f)Object.assign(f,d);else DB.funcionarios.push({id:uid('f'),...d,login:true});
    closeModal();toast('Funcionário '+(f?'atualizado':'cadastrado')+'.','success');render();
  };
}

/* ------------------------------ ANALYTICS ------------------------------ */
function vAnalytics(){
  const peak=[{d:'11h',v:420},{d:'12h',v:680},{d:'13h',v:520},{d:'18h',v:760},{d:'19h',v:1240},{d:'20h',v:1580},{d:'21h',v:1420},{d:'22h',v:980},{d:'23h',v:540}];
  const dias=DB.serie.semana;
  const piores=[...DB.produtos].map(p=>({...p,v:Math.round(p.preco*(4+(p.id.charCodeAt(2)%5)))})).sort((a,b)=>a.v-b.v).slice(0,5);
  return `${pageHead(`
    <div class="seg" data-seg="anPeriod"><button class="on">Últimos 30 dias</button><button data-val="trim">Trimestre</button><button data-val="ano">Ano</button></div>
    <button class="btn btn-ghost btn-sm" data-action="export">${ICONS.download} Exportar BI</button>`)}
  <div class="grid g-4 mb-16">
    <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.trendUp}</div><div><b>+14,2%</b><small>Crescimento de receita</small></div></div>
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.chart}</div><div><b>58,3%</b><small>Margem bruta</small></div></div>
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.knife}</div><div><b>34,8%</b><small>Food cost</small></div></div>
    <div class="stat"><div class="si" style="background:var(--purple-soft);color:var(--purple)">${ICONS.money}</div><div><b>${BRL(54780)}</b><small>Lucro estimado</small></div></div>
  </div>
  <div class="grid" style="grid-template-columns:1.6fr 1fr;margin-bottom:16px">
    <div class="card"><div class="card-head"><h3>${ICONS.chart} Evolução de faturamento e lucro</h3><span class="sub">Últimos 9 meses</span></div>
      <div class="card-body">${areaChart(DB.serie.ano,{h:250})}
        <div class="flex gap-16 mt-16 wrap" style="font-size:12px"><div><span class="muted">Receita YTD</span><b style="display:block;font-family:var(--font-display);font-size:17px">${BRL(sum(DB.serie.ano,d=>d.v))}</b></div><div><span class="muted">Ticket médio</span><b style="display:block;font-family:var(--font-display);font-size:17px">${BRL(68.40)}</b></div><div><span class="muted">Pedidos/mês</span><b style="display:block;font-family:var(--font-display);font-size:17px">${NUM(1842)}</b></div></div>
      </div></div>
    <div class="card"><div class="card-head"><h3>${ICONS.clock} Horários de pico</h3><span class="sub">Média diária</span></div><div class="card-body">${areaChart(peak,{color:'#a97bf0',h:250})}</div></div>
  </div>
  <div class="grid g-2 mb-16">
    <div class="card"><div class="card-head"><h3>${ICONS.flame} Dias de maior venda</h3></div><div class="card-body">${vBars(dias,{color:'#f7a633'})}</div></div>
    <div class="card"><div class="card-head"><h3>${ICONS.trendDown} Produtos com pior desempenho</h3></div><div class="card-body">${barRows(piores.map(p=>({n:p.emoji+' '+p.nome,v:p.v,lbl:Math.round(p.v/p.preco)+' un · '+BRL(p.v),c:'#e0574f',c2:'#ff8378'})))}</div></div>
  </div>
  <div class="grid g-4">
    <div class="stat"><div class="si" style="background:var(--green-soft);color:var(--green)">${ICONS.clients}</div><div><b>42,8%</b><small>Taxa de retenção</small></div></div>
    <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.clients}</div><div><b>1,8×</b><small>Frequência mensal</small></div></div>
    <div class="stat"><div class="si" style="background:var(--amber-soft);color:var(--amber)">${ICONS.chart}</div><div><b>34,8%</b><small>% de custo sobre receita</small></div></div>
    <div class="stat"><div class="si" style="background:var(--purple-soft);color:var(--purple)">${ICONS.star}</div><div><b>4,8 / 5</b><small>Satisfação dos clientes</small></div></div>
  </div>`;
}

/* ------------------------------ RELATÓRIOS ------------------------------ */
function vReports(){
  const groups=[
   ['Vendas',[['Vendas por dia','Faturamento diário consolidado por canal','chart'],['Vendas por mês','Comparativo mensal e tendência anual','chart'],['Vendas por funcionário','Ranking de desempenho da equipe','staff'],['Vendas por produto','Itens mais e menos vendidos','menu'],['Vendas por categoria','Distribuição de receita por categoria','tag'],['Vendas por pagamento','Detalhamento por forma de pagamento','wallet']]],
   ['Estoque',[['Estoque atual','Posição completa de estoque e valores','box'],['Estoque baixo','Itens abaixo do mínimo configurado','alert'],['Valor de estoque','Valorização de insumos e produtos','money'],['Movimentação de produtos','Entradas e saídas no período','refresh'],['Perdas e quebras','Registro de perdas operacionais','trendDown']]],
   ['Financeiro',[['Receitas','Entradas por período e categoria','trendUp'],['Despesas','Saídas e contas pagas','trendDown'],['Lucro e margem','Resultado e rentabilidade','money'],['Fluxo de caixa','Entradas × saídas por período','chart'],['Contas a pagar','Posição de obrigações','wallet'],['Contas a receber','Valores a receber','wallet']]],
   ['Clientes',[['Clientes mais frequentes','Ranking por número de pedidos','clients'],['Maiores clientes','Ranking por valor gasto','star'],['Ticket médio','Ticket médio por segmento','money'],['Retenção de clientes','Coortes e recompra','refresh']]],
   ['Funcionários',[['Vendas por funcionário','Performance individual','staff'],['Pedidos atendidos','Volume por colaborador','orders'],['Métricas de desempenho','Tempo médio e satisfação','chart']]]
  ];
  return `${pageHead(`
    <span class="badge b-green"><span class="dot"></span>Exportação PDF · Excel · CSV</span>
    <button class="btn btn-primary btn-sm" data-action="newreport">${ICONS.plus} Relatório personalizado</button>`)}
  ${groups.map(([g,items])=>`
    <h3 style="font-family:var(--font-display);font-size:15px;margin:22px 0 14px;display:flex;align-items:center;gap:9px">${g}<span class="muted small" style="font-family:var(--font);font-weight:400">${items.length} relatórios</span></h3>
    <div class="grid g-auto-lg">${items.map(it=>`<div class="card hover" style="cursor:pointer" data-report="${esc(it[0])}">
      <div class="card-body"><div class="flex ai-c gap-12 mb-12"><div class="avatar neutral" style="border-radius:12px">${ICONS[it[2]]}</div><div style="flex:1"><b style="font-family:var(--font-display);font-size:14px;display:block">${it[0]}</b><small class="muted">${it[1]}</small></div></div>
        <div class="flex gap-8 wrap"><span class="badge b-gray">${ICONS.download} PDF</span><span class="badge b-green">Excel</span><span class="badge b-blue">CSV</span></div></div></div>`).join('')}</div>`).join('')}`;
}

/* ------------------------------ CONFIGURAÇÕES ------------------------------ */
function vSettings(){
  const tab=state.settingsTab;
  const tabs=[['negocio','Negócio','suppliers'],['financeiro','Financeiro','money'],['pos','PDV','pos'],['mesas','Mesas','tables'],['usuarios','Usuários','staff'],['sistema','Sistema','settings']];
  const sec=()=>{
    if(tab==='negocio')return `<div class="form-grid">
      <div class="field full"><label>Nome do estabelecimento</label><input class="input" value="Calisto Gastrobar"/></div>
      <div class="field"><label>CNPJ</label><input class="input" value="12.345.678/0001-90"/></div>
      <div class="field"><label>Telefone</label><input class="input" value="(11) 3344-5566"/></div>
      <div class="field"><label>WhatsApp</label><input class="input" value="(11) 99812-4477"/></div>
      <div class="field"><label>E-mail</label><input class="input" value="contato@calistogastrobar.com.br"/></div>
      <div class="field full"><label>Endereço</label><input class="input" value="Rua Aurora Boreal, 458 — Vila Madalena, São Paulo/SP"/></div>
      <div class="field full"><label>Logo da marca</label><div class="flex ai-c gap-16"><div class="brand-mark" style="width:56px;height:56px;font-size:24px">C</div><button class="btn btn-ghost btn-sm">${ICONS.download} Alterar logo</button></div></div>
    </div>`;
    if(tab==='financeiro')return `<div class="form-grid">
      <div class="field"><label>Moeda</label><select class="input"><option>Real brasileiro (R$)</option><option>Dólar (US$)</option><option>Euro (€)</option></select></div>
      <div class="field"><label>Taxa de serviço (%)</label><input class="input" type="number" value="10"/></div>
      <div class="field"><label>Taxa de entrega padrão (R$)</label><input class="input" type="number" step="0.01" value="8.90"/></div>
      <div class="field"><label>Regime tributário</label><select class="input"><option>Simples Nacional</option><option>Lucro Presumido</option><option>MEI</option></select></div>
      <div class="field"><label>Alíquota de imposto (%)</label><input class="input" type="number" step="0.1" value="6.0"/></div>
      <div class="field"><label>Meta de faturamento mensal (R$)</label><input class="input" type="number" value="150000"/></div>
    </div>`;
    if(tab==='pos')return `<div class="form-grid">
      <div class="field"><label>Forma de pagamento padrão</label><select class="input"><option>PIX</option><option>Dinheiro</option><option>Débito</option><option>Crédito</option></select></div>
      <div class="field"><label>Impressora de cupom</label><select class="input"><option>Bematech MP-4200 TH</option><option>Epson TM-T20</option><option>Elgin i9</option></select></div>
      <div class="field"><label>Vias do comprovante</label><select class="input"><option>1 via</option><option>2 vias</option></select></div>
      <div class="field"><label>Arredondamento</label><select class="input"><option>Sem arredondamento</option><option>Arredondar para 0,05</option><option>Arredondar para 0,10</option></select></div>
      <div class="field full"><label class="check"><input type="checkbox" checked/> Imprimir comprovante automaticamente ao finalizar venda</label></div>
      <div class="field full"><label class="check"><input type="checkbox" checked/> Habilitar pagamento dividido</label></div>
    </div>`;
    if(tab==='mesas')return `<div class="form-grid">
      <div class="field"><label>Número total de mesas</label><input class="input" type="number" value="${DB.mesas.length}"/></div>
      <div class="field"><label>Capacidade padrão</label><input class="input" type="number" value="4"/></div>
      <div class="field"><label>Tempo de limpeza (min)</label><input class="input" type="number" value="5"/></div>
      <div class="field"><label>Modo de exibição padrão</label><select class="input"><option>Grade</option><option>Mapa do salão</option></select></div>
    </div>`;
    if(tab==='usuarios')return `<div class="form-grid">
      <div class="field full"><label>Usuários do sistema</label>
        <div class="card" style="background:var(--surface-2)"><div class="card-body" style="padding:8px">
        ${DB.funcionarios.map(f=>`<div class="flex ai-c gap-12" style="padding:9px 10px;border-radius:10px"><div class="avatar sm">${initials(f.nome)}</div><div style="flex:1"><b style="font-size:13px">${esc(f.nome)}</b><div class="muted small">${esc(f.email)}</div></div><span class="badge b-gray">${esc(f.cargo)}</span><span class="badge ${f.login?'b-green':'b-red'}">${f.login?'Ativo':'Suspenso'}</span></div>`).join('')}
        </div></div>
      </div>
    </div>`;
    return `<div class="form-grid">
      <div class="field"><label>Tema</label><select class="input"><option>Escuro premium (padrão)</option><option>Claro</option><option>Automático</option></select></div>
      <div class="field"><label>Idioma</label><select class="input"><option>Português (Brasil)</option><option>English (US)</option><option>Español</option></select></div>
      <div class="field full"><div class="divider"></div><b style="font-size:14px">Notificações</b></div>
      <div class="field full"><label class="check"><input type="checkbox" checked/> Alertas de estoque baixo</label></div>
      <div class="field full"><label class="check"><input type="checkbox" checked/> Contas a vencer</label></div>
      <div class="field full"><label class="check"><input type="checkbox" checked/> Novos pedidos no painel da cozinha</label></div>
      <div class="field full"><label class="check"><input type="checkbox"/> Resumo diário por e-mail</label></div>
      <div class="field full"><div class="divider"></div><b style="font-size:14px">Backup e segurança</b></div>
      <div class="field full"><div class="flex gap-12 wrap"><button class="btn btn-ghost btn-sm" data-action="backup">${ICONS.download} Gerar backup agora</button><button class="btn btn-ghost btn-sm" data-action="exportall">${ICONS.download} Exportar todos os dados</button></div><div class="hint mt-8">Último backup automático: hoje às 03:00</div></div>
    </div>`;
  };
  return `${pageHead('')}
  <div class="grid" style="grid-template-columns:240px 1fr;gap:24px">
    <div class="set-nav">${tabs.map(([k,l,ic])=>`<button class="${tab===k?'on':''}" data-settab="${k}">${ICONS[ic]} ${l}</button>`).join('')}</div>
    <div class="card"><div class="card-head"><h3>${tabs.find(t=>t[0]===tab)[1]}</h3></div><div class="card-body">${sec()}
      <div class="divider"></div><div class="flex justify-end gap-8"><button class="btn btn-ghost" data-action="reset">Descartar</button><button class="btn btn-primary" data-action="savesettings">${ICONS.check} Salvar configurações</button></div>
    </div></div>
  </div>`;
}

/* ------------------------------ NOTIFICAÇÕES ------------------------------ */
function vNotifications(){
  const list=DB.notifs;
  return `${pageHead(`<button class="btn btn-ghost btn-sm" data-action="markall">${ICONS.check} Marcar todas como lidas</button>`)}
  <div class="grid" style="grid-template-columns:2fr 1fr">
    <div class="card"><div class="card-head"><h3>${ICONS.bell} Central de notificações</h3><span class="badge b-amber">${list.filter(n=>n.unread).length} não lidas</span></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:11px">
        ${list.map(n=>`<div class="notif ${n.unread?'unread':''}"><div class="ni" style="background:var(--${n.color}-soft);color:var(--${n.color})">${ICONS[n.ico]}</div>
          <div style="flex:1"><b>${esc(n.titulo)}</b><p>${esc(n.msg)}</p><div class="hint mt-8">${timeAgo(n.hora)} atrás</div></div>
          <span class="badge b-${n.color}">${n.tipo}</span></div>`).join('')}
      </div></div>
    <div class="card"><div class="card-head"><h3>${ICONS.settings} Preferências</h3></div><div class="card-body">
      <div class="set-nav">${[['Estoque baixo',true],['Contas a vencer',true],['Pedidos na cozinha',true],['Fechamento de caixa',true],['Novas avaliações',false],['Resumo diário por e-mail',false]].map(([l,on])=>`<label class="check" style="padding:9px 0;display:flex"><input type="checkbox" ${on?'checked':''}/> ${l}</label>`).join('')}</div>
      <div class="divider"></div>
      <div class="stat"><div class="si" style="background:var(--blue-soft);color:var(--blue)">${ICONS.info}</div><div><b>${list.length}</b><small>Notificações nos últimos 7 dias</small></div></div>
    </div></div>
  </div>`;
}
