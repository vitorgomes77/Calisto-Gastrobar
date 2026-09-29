/* ==========================================================================
   CALISTO GASTROBAR — AÇÕES (PDV, pagamento dividido, eventos delegados)
   ========================================================================== */

/* ------------------------------ POS ACTIONS ------------------------------ */
function posAdd(pid){
  const p=DB.produtos.find(x=>x.id===pid);if(!p)return;
  const line=state.pos.cart.find(i=>i.pid===pid&&!i.mods.length&&!i.obs);
  if(line)line.qtd++;else state.pos.cart.push({pid,nome:p.nome,emoji:p.emoji,preco:p.preco,qtd:1,obs:'',mods:[]});
  toast('1× '+p.nome+' adicionado','info','Item na comanda');
  softRender();
}
function softRender(){const el=$('#cartItems');if(!el){render();return}
  // re-render entire PDV to keep totals in sync
  const c=$('#view');const sc=el.scrollTop;render();const nc=$('#cartItems');if(nc)nc.scrollTop=sc;
}
function modifierDialog(idx){
  const it=state.pos.cart[idx];if(!it)return;
  const o=openModal(`
    <div class="modal-head"><div><h3>Adicionais · ${esc(it.nome)}</h3><div class="muted small">${BRL(it.preco)} · personalize o item</div></div><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body">
      ${DB.mods.filter(m=>m.tipo!=='single'||m.id==='m3').map(g=>`<div class="mb-16"><b style="font-size:13.5px;display:block;margin-bottom:10px">${esc(g.nome)}</b>
        <div class="grid g-2" style="gap:8px">${g.opts.map(opt=>{const on=(it.mods||[]).some(x=>x.n===opt.n);
          return `<button class="chip ${on?'on':''}" style="justify-content:space-between;display:flex" data-modopt="${esc(g.id)}|${esc(opt.n)}|${opt.p}">${esc(opt.n)} <b style="color:${opt.p?'var(--amber-2)':'var(--muted)'}">${opt.p?'+ '+BRL(opt.p):''}</b></button>`}).join('')}</div></div>`).join('')}
      <div class="field"><label>Observação do item</label><input class="input" id="modObs" value="${esc(it.obs||'')}" placeholder="Ex: sem cebola, ponto da carne..."/></div>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-save>${ICONS.check} Aplicar · <span id="modTotal">${BRL(it.preco)}</span></button></div>`,`wide`);
  const recalc=()=>{const sum2=sum(it.mods||[],m=>m.p);const el=o.querySelector('#modTotal');if(el)el.textContent=BRL(it.preco+sum2)};
  o.querySelectorAll('[data-modopt]').forEach(b=>b.onclick=()=>{const [gid,n,p]=b.dataset.modopt.split('|');const pr=+p;
    it.mods=it.mods||[];const ex=it.mods.findIndex(x=>x.n===n);
    if(ex>=0)it.mods.splice(ex,1);else{if(gid==='m3'||gid==='m4')it.mods=it.mods.filter(x=>!DB.mods.find(m=>m.id===gid).opts.some(o2=>o2.n===x.n));it.mods.push({n,p:pr})}
    b.classList.toggle('on');recalc();});
  o.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  recalc();
  o.querySelector('[data-save]').onclick=()=>{it.obs=$('#modObs').value.trim();closeModal();toast('Item personalizado atualizado.','success');softRender()};
}
function splitPaymentDialog(){
  const t=posTotals();
  const o=openModal(`
    <div class="modal-head"><div><h3>Pagamento dividido</h3><div class="muted small">Total a pagar: <b style="color:var(--amber-2)">${BRL(t.total)}</b></div></div><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body">
      <div id="splitRows"></div>
      <div class="card" style="background:var(--surface-2);margin-top:14px"><div class="card-body" style="padding:14px">
        <div class="flex between small"><span class="muted">Distribuído</span><b id="spDist">R$ 0,00</b></div>
        <div class="flex between small" style="margin-top:6px"><span class="muted">Restante</span><b id="spRest" style="color:var(--amber-2)">${BRL(t.total)}</b></div>
        <div class="bar" style="margin-top:10px"><i id="spBar" style="width:0%"></i></div>
      </div></div>
      <button class="btn btn-ghost btn-sm full mt-16" data-addpay>${ICONS.plus} Adicionar forma de pagamento</button>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok disabled>${ICONS.check} Confirmar pagamento</button></div>`);
  const parts=[];const rows=o.querySelector('#splitRows');
  const draw=()=>{
    rows.innerHTML=parts.map((p,i)=>`<div class="flex ai-c gap-8" style="margin-bottom:8px"><select class="input" style="flex:1" data-pm="${i}">${['PIX','Crédito','Débito','Dinheiro'].map(m=>`<option ${p.m===m?'selected':''}>${m}</option>`).join('')}</select>
      <input class="input" style="width:130px" type="number" step="0.01" value="${p.v}" data-pv="${i}"/><button class="icon-btn" style="width:34px;height:34px" data-pd="${i}">${ICONS.trash}</button></div>`).join('');
    const dist=sum(parts,p=>+p.v||0);const rest=Math.max(0,t.total-dist);
    o.querySelector('#spDist').textContent=BRL(dist);o.querySelector('#spRest').textContent=BRL(rest);
    o.querySelector('#spBar').style.width=clamp(dist/t.total*100,0,100)+'%';
    o.querySelector('[data-ok]').disabled=dist<t.total-0.001;
    rows.querySelectorAll('[data-pm]').forEach(s=>s.onchange=()=>{parts[+s.dataset.pm].m=s.value});
    rows.querySelectorAll('[data-pv]').forEach(s=>s.oninput=()=>{parts[+s.dataset.pv].v=+s.value;draw()});
    rows.querySelectorAll('[data-pd]').forEach(b=>b.onclick=()=>{parts.splice(+b.dataset.pd,1);draw()});
  };
  parts.push({m:'PIX',v:+(t.total/2).toFixed(2)});parts.push({m:'Crédito',v:0});draw();
  o.querySelector('[data-addpay]').onclick=()=>{parts.push({m:'Dinheiro',v:0});draw()};
  o.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  o.querySelector('[data-ok]').onclick=()=>{closeModal();checkout(true)};
}
function checkout(skipDialog){
  const t=posTotals();const c=state.pos;
  if(!c.cart.length){toast('Adicione itens à comanda antes de finalizar.','error');return}
  const finish=(pay)=>{ 
    const num=100+DB.pedidos.length+1;
    const cliente=c.cliente?DB.clientes.find(x=>x.id===c.cliente)?.nome:'Cliente Balcão';
    const items=c.cart.map(i=>({pid:i.pid,nome:i.nome,qtd:i.qtd,preco:i.preco,emoji:i.emoji,obs:i.obs,mods:i.mods}));
    DB.pedidos.unshift({id:uid('ord'),num,tipo:c.tipo,status:'Finalizado',pm:pay,itens:items,subtotal:t.sub,desc:c.desc,servTipo:t.serv,entrega:t.entrega,total:t.total,
      cliente:tipoCliente(c,cliente),mesa:c.mesa||null,garcom:c.garcom,mins:0,entregador:c.tipo==='Delivery'?'Diego Ferreira':null,pago:true,criado:new Date(),
      endereco:c.tipo==='Delivery'?'Rua das Palmeiras, 120 — '+ (c.mesa||'Centro'):null,bairro:c.tipo==='Delivery'?'Vila Madalena':null,emoji:[...new Set(items.map(i=>i.emoji))].slice(0,3)});
    DB.caixa.movimentos.push({id:uid('cx'),tipo:'Venda',desc:'Venda '+c.tipo+' · '+items.length+' itens',valor:t.total,hora:new Date().toISOString(),resp:state.user?.nome||'Rafael Lima'});
    // inventory deduction
    items.forEach(it=>{const recipe=DB.receitas[it.pid];
      if(recipe)recipe.forEach(([iid,q])=>{const ing=DB.ingredientes.find(x=>x.id===iid);if(ing)ing.estoque=Math.max(0,ing.estoque-q*it.qtd)});
      const prod=DB.produtos.find(x=>x.id===it.pid);if(prod&&!recipe)prod.estoque=Math.max(0,prod.estoque-it.qtd);});
    if(c.mesa){const m=DB.mesas.find(x=>x.num===c.mesa);if(m){m.min=0;m.garcom=null;m.cliente=null;m.comanda=null;DB.comandas=DB.comandas.filter(x=>x.mesa!==c.mesa)}}
    state.pos={cat:'all',tipo:'Mesa',cart:[],cliente:'',mesa:'',garcom:'Juliana Alves',desc:0,obs:'',pay:'PIX',split:[]};
    toast('Venda de '+BRL(t.total)+' finalizada via '+pay+'. Estoque atualizado.','success','Venda concluída');
    render();
  };
  if(skipDialog){finish('Múltiplas formas');return}
  const o=openModal(`
    <div class="modal-head"><div><h3>Finalizar venda</h3><div class="muted small">${c.cart.length} produtos · Total <b style="color:var(--amber-2)">${BRL(t.total)}</b></div></div><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body">
      <div class="mb-16"><b style="font-size:13.5px;display:block;margin-bottom:10px">Forma de pagamento</b>
        <div class="chips" id="payChips">${['PIX','Crédito','Débito','Dinheiro'].map((p,i)=>`<button class="chip ${i===0?'on':''}" data-paym="${p}">${p}</button>`).join('')}</div></div>
      <div class="card" style="background:var(--surface-2)"><div class="card-body" style="padding:14px">
        <div class="flex between small"><span class="muted">Subtotal</span><b class="num">${BRL(t.sub)}</b></div>
        ${c.desc?`<div class="flex between small"><span class="muted">Desconto (${c.desc}%)</span><b class="num" style="color:#ff8378">− ${BRL(t.descAmt)}</b></div>`:''}
        ${t.serv?`<div class="flex between small"><span class="muted">Taxa de serviço (10%)</span><b class="num">${BRL(t.serv)}</b></div>`:''}
        ${t.entrega?`<div class="flex between small"><span class="muted">Taxa de entrega</span><b class="num">${BRL(t.entrega)}</b></div>`:''}
        <div class="flex between" style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--border-2);font-family:var(--font-display);font-size:20px;font-weight:700"><span>Total</span><span style="color:var(--amber-2)">${BRL(t.total)}</span></div>
      </div></div>
      <div class="grid g-2 mt-16" style="gap:10px"><button class="btn btn-ghost" data-action="splitpay">${ICONS.wallet} Dividir pagamento</button><label class="check" style="justify-content:center"><input type="checkbox" checked/> Imprimir comprovante</label></div>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary btn-lg" data-ok>${ICONS.check} Confirmar · ${BRL(t.total)}</button></div>`);
  let pay='PIX';
  o.querySelectorAll('[data-paym]').forEach(b=>b.onclick=()=>{o.querySelectorAll('[data-paym]').forEach(x=>x.classList.remove('on'));b.classList.add('on');pay=b.dataset.paym});
  o.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  o.querySelector('[data-action="splitpay"]').onclick=()=>{closeModal();splitPaymentDialog()};
  o.querySelector('[data-ok]').onclick=()=>{closeModal();finish(pay)};
}
function tipoCliente(c,nome){if(c.tipo==='Mesa')return nome==='Cliente Balcão'?('Mesa '+c.mesa):nome;return nome}
function obsDialog(idx){const it=state.pos.cart[idx];const v=prompt('Observação para '+it.nome+':',it.obs||'');if(v!==null){it.obs=v;toast('Observação salva.','success');softRender()}}

/* ------------------------------ DELEGATED EVENTS ------------------------------ */
document.addEventListener('click',e=>{
  const t=e.target;
  const pcat=t.closest('[data-pcat]');if(pcat){state.pos.cat=pcat.dataset.pcat;render();return}
  const add=t.closest('[data-add]');if(add){posAdd(add.dataset.add);return}
  const qt=t.closest('[data-qty]');if(qt){const [i,d]=qt.dataset.qty.split('|').map(Number);const it=state.pos.cart[i];if(it){it.qtd+=d;if(it.qtd<=0)state.pos.cart.splice(i,1)}softRender();return}
  const dl=t.closest('[data-del]');if(dl){state.pos.cart.splice(+dl.dataset.del,1);toast('Item removido da comanda.','warn');softRender();return}
  const ob=t.closest('[data-obs]');if(ob){obsDialog(+ob.dataset.obs);return}
  const md=t.closest('[data-mods]');if(md){modifierDialog(+md.dataset.mods);return}
  const pt=t.closest('[data-ptipo]');if(pt){state.pos.tipo=pt.dataset.ptipo;if(pt.dataset.ptipo!=='Mesa'){state.pos.mesa='';state.pos.desc=pt.dataset.ptipo==='Mesa'?10:0}render();return}
  // segmented controls
  const segBtn=t.closest('[data-val]');if(segBtn&&segBtn.parentElement.dataset.seg){const key=segBtn.parentElement.dataset.seg;
    if(key==='chartPeriod')state.chartPeriod=segBtn.dataset.val;
    if(key==='mesaView')state.mesaView=segBtn.dataset.val;
    if(key==='ordersFilter')state.ordersFilter=segBtn.dataset.val;
    render();return}
  const mtab=t.closest('[data-mtab]');if(mtab){state.menuTab=mtab.dataset.mtab;render();return}
  const stab=t.closest('[data-stab]');if(stab){state.stockTab=stab.dataset.stab;render();return}
  const ftab=t.closest('[data-ftab]');if(ftab){state.financeTab=ftab.dataset.ftab;render();return}
  const stft=t.closest('[data-stftab]');if(stft){state.staffTab=stft.dataset.stftab;render();return}
  const sett=t.closest('[data-settab]');if(sett){state.settingsTab=sett.dataset.settab;render();return}
  const cseg=t.closest('[data-cseg]');if(cseg){state.clientFilter=cseg.dataset.cseg==='Todos'?null:cseg.dataset.cseg;render();return}
  const ord=t.closest('[data-order]');if(ord){orderDetail(ord.dataset.order);return}
  const adv=t.closest('[data-advance]');if(adv){const o=DB.pedidos.find(x=>x.id===adv.dataset.advance);if(o)advanceOrder(o);return}
  const tbl=t.closest('[data-table]');if(tbl){tableDetail(tbl.dataset.table);return}
  const com=t.closest('[data-com]');if(com){state.comandaSel=com.dataset.com;render();return}
  const ep=t.closest('[data-editprod]');if(ep){productForm(ep.dataset.editprod);return}
  const dp=t.closest('[data-dupprod]');if(dp){const p=DB.produtos.find(x=>x.id===dp.dataset.dupprod);DB.produtos.push({...p,id:uid('p'),nome:p.nome+' (cópia)',sku:p.sku+'-C'});toast('Produto duplicado.','success');render();return}
  const xp=t.closest('[data-delprod]');if(xp){const p=DB.produtos.find(x=>x.id===xp.dataset.delprod);confirmDialog('Excluir produto','O produto <b>'+esc(p.nome)+'</b> será removido permanentemente do cardápio.',()=>{DB.produtos=DB.produtos.filter(x=>x.id!==p.id);toast('Produto excluído.','warn');render()},{danger:true,label:'Excluir' });return}
  const mi=t.closest('[data-movitem]');if(mi){movementDialog(mi.dataset.movitem);return}
  const rc=t.closest('[data-recipe]');if(rc){recipeDialog(rc.dataset.recipe);return}
  const rv=t.closest('[data-receive]');if(rv){receivePurchase(rv.dataset.receive);return}
  const vp=t.closest('[data-vpurchase]');if(vp){vPurchaseDialog(DB.compras.find(x=>x.id===vp.dataset.vpurchase));return}
  const sup=t.closest('[data-supplier]');if(sup){supplierDetail(sup.dataset.supplier);return}
  const cli=t.closest('[data-client]');if(cli){clientProfile(cli.dataset.client);return}
  const rcv=t.closest('[data-rescheck]');if(rcv){const r=DB.reservas.find(x=>x.id===rcv.dataset.rescheck);r.status='Chegou';toast('Check-in de '+r.cliente+' registrado.','success');render();return}
  const rdl=t.closest('[data-resdel]');if(rdl){DB.reservas=DB.reservas.filter(x=>x.id!==rdl.dataset.resdel);toast('Reserva removida.','warn');render();return}
  const ptog=t.closest('[data-promotoggle]');if(ptog){const p=DB.promo.find(x=>x.id===ptog.dataset.promotoggle);p.ativo=!p.ativo;toast('Promoção '+p.nome+' '+(p.ativo?'ativada':'pausada')+'.','success');render();return}
  const ped=t.closest('[data-promoedit]');if(ped){toast('Editor de promoção (demo).','info');return}
  const pay=t.closest('[data-pay]');if(pay){const p=DB.payables.find(x=>x.id===pay.dataset.pay);confirmDialog('Confirmar pagamento','Pagar <b>'+esc(p.desc)+'</b> no valor de <b>'+BRL(p.valor)+'</b>?',()=>{p.status='Pago';p.pago=todayISO();DB.caixa.movimentos.push({id:uid('cx'),tipo:'Despesa',desc:p.desc,valor:-p.valor,hora:new Date().toISOString(),resp:state.user?.nome||'Mariana Souza'});toast('Pagamento registrado: '+BRL(p.valor),'success');render()},{label:'Pagar'});return}
  const rc2=t.closest('[data-receive2]');if(rc2){const r=DB.receivables.find(x=>x.id===rc2.dataset.receive2);r.status='Pago';r.pago=todayISO();toast('Recebimento de '+BRL(r.valor)+' confirmado.','success');render();return}
  const es=t.closest('[data-editstaff]');if(es){staffForm(es.dataset.editstaff);return}
  const ps=t.closest('[data-permstaff]');if(ps){const f=DB.funcionarios.find(x=>x.id===ps.dataset.permstaff);state.staffTab='permissoes';navigate('staff');toast('Permissões de '+f.nome+' ('+f.cargo+') em destaque.','info');return}
  const rep=t.closest('[data-report]');if(rep){reportDialog(rep.dataset.report);return}
  const act=t.closest('[data-action]');if(act){handleAction(act.dataset.action);return}
});
document.addEventListener('change',e=>{
  const s=e.target.closest('[data-psel]');if(s){const k=s.dataset.psel;state.pos[k]=k==='desc'?+s.value: s.value;render();return}
  const pm=e.target.closest('[data-perm]');if(pm){const [cargo,perm]=pm.dataset.perm.split('|');const rp=ROLE_PERMS[cargo];if(pm.checked){if(!rp.perms.includes(perm))rp.perms.push(perm)}else rp.perms=rp.perms.filter(x=>x!==perm);return}
});
function handleAction(a){
  switch(a){
    case 'neworder':case 'allorders':navigate('pos');break;
    case 'kds':navigate('kds');break;
    case 'clearcart':confirmDialog('Limpar comanda','Todos os itens da comanda atual serão removidos.',()=>{state.pos.cart=[];state.pos.desc=0;toast('Comanda esvaziada.','warn');render()},{danger:true,label:'Limpar'});break;
    case 'checkout':checkout(false);break;
    case 'splitpay':splitPaymentDialog();break;
    case 'newtable':toast('Configuração de nova mesa disponível em Configurações → Mesas.','info');break;
    case 'transfer':navigate('tables');toast('Selecione uma mesa ocupada e use Transferir.','info');break;
    case 'jointables':toast('Modo de junção de mesas ativado. Selecione duas mesas.','info');break;
    case 'split table':toast('Divisão de mesa: selecione a mesa e os itens.','info');break;
    case 'backcom':state.comandaSel=null;render();break;
    case 'additem':state.pos.cat='all';navigate('pos');break;
    case 'splitbill':toast('Divisão de conta aberta — escolha por pessoa ou por item.','info');break;
    case 'paycom':{const c=DB.comandas.find(x=>x.id===state.comandaSel);if(c){const m=DB.mesas.find(x=>x.num===c.mesa);if(m)closeTableDialog(m,c)}break}
    case 'newcmd':{const free=DB.mesas.find(m=>m.min===0);if(free)openTable(free);else toast('Não há mesas livres no momento.','warn');break}
    case 'export':toast('Relatório exportado com sucesso.','success','Exportação');break;
    case 'filter':toast('Filtros avançados abertos.','info');break;
    case 'refresh':render();toast('Painel atualizado.','success');break;
    case 'modifiers':state.menuTab='modificadores';render();break;
    case 'newmod':toast('Crie grupos de adicionais e vinculе-os aos produtos.','info');break;
    case 'newprod':productForm();break;
    case 'newing':ingredientForm();break;
    case 'movement':movementDialog();break;
    case 'newrecipe':recipeDialog(Object.keys(DB.receitas)[0]||DB.produtos[0].id);break;
    case 'newpurchase':newPurchaseDialog();break;
    case 'newsupplier':toast('Formulário de fornecedor (demo).','info');break;
    case 'newclient':toast('Formulário de cliente (demo).','info');break;
    case 'newres':toast('Nova reserva registrada — confira a agenda.','success');break;
    case 'newpromo':toast('Editor de promoção (demo).','info');break;
    case 'newpayable':toast('Nova conta a pagar (demo).','info');break;
    case 'newreceivable':toast('Nova conta a receber (demo).','info');break;
    case 'sangria':{const v=prompt('Valor da sangria (R$):','500');if(v){DB.caixa.movimentos.push({id:uid('cx'),tipo:'Sangria',desc:'Retirada de caixa',valor:-Math.abs(+v),hora:new Date().toISOString(),resp:state.user?.nome||'Mariana Souza'});toast('Sangria de '+BRL(Math.abs(+v))+' registrada.','warn');render()}break}
    case 'suprimento':{const v=prompt('Valor do suprimento (R$):','300');if(v){DB.caixa.movimentos.push({id:uid('cx'),tipo:'Suprimento',desc:'Reforço de troco',valor:Math.abs(+v),hora:new Date().toISOString(),resp:state.user?.nome||'Mariana Souza'});toast('Suprimento de '+BRL(Math.abs(+v))+' registrado.','success');render()}break}
    case 'closecash':closeCashDialog();break;
    case 'diffcalc':{const e=DB.caixa.saldoInicial+sum(DB.caixa.movimentos,m=>m.valor);const v=+($('#cashCount')?.value||0);const d=v-e;toast('Diferença apurada: '+(d>=0?'+':'-')+BRL(Math.abs(d)),d===0?'success':'warn','Conferência');break}
    case 'newstaff':staffForm();break;
    case 'saveperms':toast('Permissões dos cargos salvas com sucesso.','success');break;
    case 'savesettings':toast('Configurações salvas.','success');break;
    case 'reset':render();toast('Alterações descartadas.','info');break;
    case 'backup':toast('Backup gerado e armazenado com segurança.','success','Backup');break;
    case 'exportall':toast('Exportação completa iniciada. Você receberá um e-mail.','info');break;
    case 'newreport':toast('Construtor de relatórios personalizados (demo).','info');break;
    case 'markall':DB.notifs.forEach(n=>n.unread=false);toast('Todas as notificações foram marcadas como lidas.','success');render();break;
    default:toast('Ação executada.','info');break;
  }
}
function reportDialog(name){
  openModal(`
    <div class="modal-head"><div><h3>${esc(name)}</h3><div class="muted small">Selecione o período e o formato de exportação</div></div><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body"><div class="form-grid">
      <div class="field"><label>Data inicial</label><input class="input" type="date" value="${daysAgo(30)}"/></div>
      <div class="field"><label>Data final</label><input class="input" type="date" value="${todayISO()}"/></div>
      <div class="field"><label>Agrupar por</label><select class="input"><option>Dia</option><option>Semana</option><option>Mês</option></select></div>
      <div class="field"><label>Formato</label><select class="input"><option>PDF</option><option>Excel (.xlsx)</option><option>CSV</option></select></div>
    </div>
    <div class="card" style="background:var(--surface-2);margin-top:16px"><div class="card-body" style="padding:14px">
      <div class="flex between small"><span class="muted">Registros estimados</span><b>1.842</b></div>
      <div class="flex between small" style="margin-top:6px"><span class="muted">Valor total</span><b style="color:var(--amber-2)">${BRL(131480.55)}</b></div>
    </div></div></div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok>${ICONS.download} Gerar relatório</button></div>`);
  const o=$('#ovl');o.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  o.querySelector('[data-ok]').onclick=()=>{closeModal();toast('Relatório “'+name+'” gerado e baixado.','success','Exportação concluída')};
}
