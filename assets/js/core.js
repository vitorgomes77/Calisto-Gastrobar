/* ==========================================================================
   CALISTO GASTROBAR — NÚCLEO: helpers, formatação, toasts e modais
   ========================================================================== */

/* ------------------------------ HELPERS ------------------------------ */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const BRL=n=>(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const NUM=n=>(n||0).toLocaleString('pt-BR');
const PCT=n=>`${(n||0).toLocaleString('pt-BR',{maximumFractionDigits:1})}%`;
const uid=(p='id')=>p+'_'+Math.random().toString(36).slice(2,9);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials=n=>String(n||'').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
const todayISO=()=>new Date().toISOString().slice(0,10);
const fmtDate=d=>{ if(!d) return '—'; const x=new Date(d+(d.length===10?'T12:00:00':'')); return x.toLocaleDateString('pt-BR'); };
const fmtDateTime=d=>{ if(!d) return '—'; const x=new Date(d); return x.toLocaleDateString('pt-BR')+' '+x.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); };
const daysAgo=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)};
const timeAgo=mins=>mins<60?`${mins} min`:mins<1440?`${Math.floor(mins/60)}h ${mins%60}m`:`${Math.floor(mins/1440)}d`;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sum=(arr,f)=>arr.reduce((a,b)=>a+(f?f(b):b),0);

function toast(msg,type='success',title){
  const map={success:['t-green','check','Sucesso'],error:['t-red','alert','Erro'],warn:['t-amber','alert','Atenção'],info:['t-blue','info','Informação']};
  const [cls,ico,def]=map[type]||map.info;
  const el=document.createElement('div');
  el.className='toast '+cls;
  el.innerHTML=`<div class="ti">${ICONS[ico]}</div><div style="flex:1"><b>${esc(title||def)}</b><p>${esc(msg)}</p></div>`;
  $('#toasts').appendChild(el);
  setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),300)},3800);
}
function openModal(html,cls=''){
  closeModal();
  const o=document.createElement('div');
  o.className='overlay';o.id='ovl';
  o.innerHTML=`<div class="modal ${cls}">${html}</div>`;
  o.addEventListener('mousedown',e=>{if(e.target===o)closeModal()});
  $('#modalRoot').appendChild(o);
  const f=o.querySelector('input,select,textarea,button.btn-primary');
  return o;
}
function closeModal(){const o=$('#ovl');if(o)o.remove();}
function confirmDialog(title,msg,onYes,{danger=false,label='Confirmar'}={}){
  const o=openModal(`
    <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close>${ICONS.x}</button></div>
    <div class="modal-body"><p style="color:var(--text-2);line-height:1.6">${msg}</p></div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn ${danger?'btn-danger':'btn-primary'}" data-confirm>${esc(label)}</button></div>`,'sm');
  o.querySelector('[data-confirm]').onclick=()=>{closeModal();onYes()}; 
}
