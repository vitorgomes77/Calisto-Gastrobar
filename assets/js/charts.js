/* ==========================================================================
   CALISTO GASTROBAR — GRÁFICOS (SVG puro, sem dependências externas)
   ========================================================================== */

/* ------------------------------ CHARTS ------------------------------ */
function sparkline(vals,color='#f7a633',w=100,h=30){
  const mn=Math.min(...vals),mx=Math.max(...vals)||1,rng=(mx-mn)||1;
  const pts=vals.map((v,i)=>[i/(vals.length-1)*w,h-3-((v-mn)/rng)*(h-8)]);
  const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const id='sg'+Math.random().toString(36).slice(2,7);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${d} L ${w} ${h} L 0 ${h} Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function areaChart(data,{color='#f7a633',h=230,hint=''}={}){
  const w=760,pad={l:52,r:14,t:16,b:30};
  const vals=data.map(d=>d.v),mx=Math.max(...vals)*1.15||1;
  const iw=w-pad.l-pad.r,ih=h-pad.t-pad.b;
  const X=i=>pad.l+(data.length<2?0:i/(data.length-1)*iw);
  const Y=v=>pad.t+ih-(v/mx)*ih;
  const line=data.map((d,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(d.v).toFixed(1)).join(' ');
  const area=line+` L ${X(data.length-1)} ${pad.t+ih} L ${pad.l} ${pad.t+ih} Z`;
  const ticks=5,grid=[];
  for(let i=0;i<=ticks;i++){const v=mx/ticks*i;grid.push(`<line x1="${pad.l}" y1="${Y(v)}" x2="${w-pad.r}" y2="${Y(v)}" stroke="rgba(255,255,255,.05)"/><text x="${pad.l-10}" y="${Y(v)+4}" fill="#63636e" font-size="10" text-anchor="end">${v>=1000?(v/1000).toFixed(0)+'k':v.toFixed(0)}</text>`)}
  const step=Math.ceil(data.length/12);
  const xl=data.map((d,i)=>i%step===0?`<text x="${X(i)}" y="${h-8}" fill="#63636e" font-size="10" text-anchor="middle">${d.d}</text>`:'').join('');
  const dots=data.map((d,i)=>`<circle class="cdot" cx="${X(i)}" cy="${Y(d.v)}" r="3.4" fill="${color}" opacity="0" data-x="${X(i)}" data-y="${Y(d.v)}" data-l="${d.d}" data-v="${BRL(d.v)}"/>`).join('');
  return `<div style="position:relative"><svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block"><defs><linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".3"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>${grid.join('')}<path d="${area}" fill="url(#ag1)"/><path d="${line}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>${dots}</svg><div class="chart-tip"></div>${hint}</div>`;
}
function donut(items,{size=180,thick=22,center=''}={}){
  const total=sum(items,i=>i.v)||1;let acc=0;
  const r=(size-thick)/2,c=2*Math.PI*r;
  const arcs=items.map(it=>{const f=it.v/total,seg=`<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${it.c}" stroke-width="${thick}" stroke-dasharray="${(f*c).toFixed(2)} ${c.toFixed(2)}" stroke-dashoffset="${(-acc*c).toFixed(2)}" transform="rotate(-90 ${size/2} ${size/2})" stroke-linecap="butt"/>`;acc+=f;return seg}).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${arcs}<circle cx="${size/2}" cy="${size/2}" r="${r-thick/2-4}" fill="none" stroke="rgba(255,255,255,.04)" stroke-width="1"/>${center}</svg>`;
}
function barRows(items,{color='#f7a633'}={}){
  const mx=Math.max(...items.map(i=>i.v))||1;
  return items.map((it,i)=>`
    <div style="margin-bottom:13px">
      <div class="flex between" style="font-size:12.5px;margin-bottom:6px"><span class="strong">${esc(it.n||it.d)}</span><span class="muted num">${it.lbl||BRL(it.v)}</span></div>
      <div class="bar"><i style="width:${(it.v/mx*100).toFixed(1)}%;background:linear-gradient(90deg,${it.c||color},${it.c2||(color==='#f7a633'?'#ffbe4d':'#63e2aa')})"></i></div>
    </div>`).join('');
}
function vBars(items,{h=200,color='#f7a633'}={}){
  const w=760,pad={l:44,r:14,t:14,b:28},mx=Math.max(...items.map(i=>i.v))*1.12||1;
  const iw=w-pad.l-pad.r,ih=h-pad.t-pad.b,bw=(iw/items.length)*0.58;
  const bars=items.map((it,i)=>{const bh=(it.v/mx)*ih;const x=pad.l+(i+0.5)*(iw/items.length)-bw/2;return `<rect x="${x}" y="${pad.t+ih-bh}" width="${bw}" height="${bh}" rx="6" fill="url(#bg1)"><title>${esc(it.d)}: ${BRL(it.v)}</title></rect><text x="${x+bw/2}" y="${h-8}" fill="#63636e" font-size="10" text-anchor="middle">${esc(it.d)}</text>`}).join('');
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto"><defs><linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity=".25"/></linearGradient></defs>${bars}</svg>`;
}
function hBars(items,{color='#f7a633'}={}){return barRows(items,{color});}
