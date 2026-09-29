/* ==========================================================================
   CALISTO GASTROBAR — DADOS DE DEMONSTRAÇÃO
   Categorias, produtos, insumos, fichas técnicas, mesas, pedidos, clientes,
   fornecedores, financeiro, reservas, promoções e movimentações.
   ========================================================================== */

/* ------------------------------ DATABASE ------------------------------ */
const CATS=[
 {id:'hamb',nome:'Hambúrgueres',ico:'🍔'},{id:'porc',nome:'Porções',ico:'🍟'},
 {id:'lanch',nome:'Lanches',ico:'🥪'},{id:'beb',nome:'Bebidas',ico:'🥤'},
 {id:'drink',nome:'Drinks',ico:'🍸'},{id:'cerve',nome:'Cervejas',ico:'🍺'},
 {id:'sobre',nome:'Sobremesas',ico:'🍮'},{id:'combo',nome:'Combos',ico:'🎁'},{id:'outro',nome:'Outros',ico:'🧂'}
];
const P=(id,nome,cat,preco,custo,estoque,min,emoji,obs='')=>({id,nome,categoria:cat,preco,custo,estoque,min,emoji,obs,ativo:true,sku:'CG-'+id.toUpperCase(),tempo:12,margem:0});
const DB={
 produtos:[
  P('p01','X-Burger','hamb',28.90,11.40,42,10,'🍔'),
  P('p02','X-Salada','hamb',31.90,12.80,38,10,'🥬'),
  P('p03','Bacon Burger','hamb',36.90,15.20,26,8,'🥓'),
  P('p04','Smash Burger','hamb',29.90,12.10,34,10,'🍔'),
  P('p05','Cheddar Duplo','hamb',39.90,17.50,18,8,'🧀'),
  P('p06','Batata Frita','porc',22.90,7.20,55,12,'🍟'),
  P('p07','Onion Rings','porc',26.90,9.10,31,10,'🧅'),
  P('p08','Coxinha (6un)','porc',29.90,11.00,22,8,'🍗'),
  P('p09','Calabresa Acebolada','porc',34.90,14.30,17,6,'🌭'),
  P('p10','Frango a Passarinho','porc',38.90,16.80,12,6,'🍗'),
  P('p11','Sanduíche de Frango','lanch',26.90,10.20,24,8,'🥪'),
  P('p12','Misto Quente','lanch',18.90,6.40,30,8,'🥪'),
  P('p13','Coca-Cola 350ml','beb',8.00,3.10,64,24,'🥤'),
  P('p14','Guaraná 350ml','beb',7.00,2.80,58,24,'🥤'),
  P('p15','Água Mineral 500ml','beb',5.00,1.60,80,20,'💧'),
  P('p16','Suco de Laranja','beb',12.90,4.20,26,10,'🍊'),
  P('p17','Caipirinha','drink',24.90,8.90,40,12,'🍋'),
  P('p18','Caipiroska','drink',26.90,9.60,36,12,'🍸'),
  P('p19','Gin Tônica','drink',32.90,13.40,22,8,'🍸'),
  P('p20','Aperol Spritz','drink',34.90,15.10,15,6,'🥂'),
  P('p21','Heineken 600ml','cerve',18.90,9.20,48,18,'🍺'),
  P('p22','Original 600ml','cerve',14.90,6.80,52,18,'🍺'),
  P('p23','Brahma Duplo Malte 600ml','cerve',12.90,5.60,60,18,'🍺'),
  P('p24','Corona 355ml','cerve',16.90,8.10,7,12,'🍺'),
  P('p25','Brownie com Sorvete','sobre',24.90,8.30,14,6,'🍫'),
  P('p26','Pudim de Leite','sobre',14.90,4.70,9,6,'🍮'),
  P('p27','Petit Gâteau','sobre',26.90,9.80,11,5,'🍰'),
  P('p28','Combo X-Burger','combo',44.90,18.60,20,6,'🎁'),
  P('p29','Combo Casal','combo',89.90,38.40,10,4,'🎁'),
  P('p30','Molho Extra','outro',3.00,0.90,90,20,'🧂'),
  P('p31','Cebola Caramelizada','outro',5.00,1.70,40,12,'🧅')
 ],
 mods:[
  {id:'m1',nome:'Adicionais Hambúrguer',tipo:'add',min:0,max:4,opts:[{n:'Bacon',p:5.00},{n:'Cheddar extra',p:4.00},{n:'Ovo',p:3.00},{n:'Molho especial',p:2.00},{n:'Cebola caramelizada',p:5.00}]},
  {id:'m2',nome:'Remover Ingredientes',tipo:'remove',min:0,max:5,opts:[{n:'Sem cebola',p:0},{n:'Sem tomate',p:0},{n:'Sem alface',p:0},{n:'Sem molho',p:0},{n:'Sem pepino',p:0}]},
  {id:'m3',nome:'Ponto da Carne',tipo:'single',min:1,max:1,opts:[{n:'Ao ponto',p:0},{n:'Bem passada',p:0},{n:'Mal passada',p:0}]},
  {id:'m4',nome:'Bebida',tipo:'single',min:0,max:1,opts:[{n:'Lata',p:0},{n:'600ml',p:6.00},{n:'Garrafa',p:12.00}]}
 ],
 ingredientes:[
  {id:'i01',nome:'Pão Brioche',un:'un',custo:1.80,estoque:120,min:40,max:400,forn:'Padaria Premium'},
  {id:'i02',nome:'Carne Bovina 160g',un:'g',custo:0.029,estoque:6800,min:3000,max:20000,forn:'Atacadão Carnes'},
  {id:'i03',nome:'Queijo Cheddar',un:'g',custo:0.042,estoque:2400,min:1500,max:9000,forn:'Distribuidora Laticínios'},
  {id:'i04',nome:'Bacon',un:'g',custo:0.048,estoque:1350,min:1200,max:6000,forn:'Atacadão Carnes'},
  {id:'i05',nome:'Alface',un:'g',custo:0.012,estoque:1800,min:1000,max:5000,forn:'Hortifruti Central'},
  {id:'i06',nome:'Tomate',un:'g',custo:0.011,estoque:2200,min:1000,max:6000,forn:'Hortifruti Central'},
  {id:'i07',nome:'Molho Especial',un:'g',custo:0.019,estoque:3100,min:1500,max:8000,forn:'Distribuidora Bebidas SP'},
  {id:'i08',nome:'Batata Pré-frita',un:'g',custo:0.014,estoque:9200,min:5000,max:25000,forn:'Atacadão Carnes'},
  {id:'i09',nome:'Cebola',un:'g',custo:0.008,estoque:2600,min:1200,max:7000,forn:'Hortifruti Central'},
  {id:'i10',nome:'Óleo de Fritura',un:'ml',custo:0.009,estoque:14000,min:6000,max:30000,forn:'Distribuidora Bebidas SP'},
  {id:'i11',nome:'Refrigerante Lata',un:'un',custo:3.10,estoque:64,min:24,max:200,forn:'Distribuidora Bebidas SP'},
  {id:'i12',nome:'Cachaça',un:'ml',custo:0.031,estoque:4200,min:2000,max:10000,forn:'Distribuidora Bebidas SP'}
 ],
 receitas:{
  p01:[['i01',1],['i02',1],['i03',40],['i05',20],['i06',30],['i07',20]],
  p02:[['i01',1],['i02',1],['i03',30],['i05',25],['i06',35],['i07',20]],
  p03:[['i01',1],['i02',1],['i03',35],['i04',40],['i05',15],['i06',20],['i07',20]],
  p04:[['i01',1],['i02',1],['i03',45],['i09',15],['i07',15]],
  p05:[['i01',1],['i02',2],['i03',80],['i04',20],['i07',20]],
  p06:[['i08',180],['i10',60],['i09',10]]
 },
 mesas:[],
 funcionarios:[
  {id:'f01',nome:'Carlos Oliveira',cpf:'123.456.789-00',tel:'(11) 99812-4477',cargo:'Proprietário',salario:0,adm:'2021-03-01',status:'Ativo',email:'admin@calisto.com.br',login:true},
  {id:'f02',nome:'Mariana Souza',cpf:'234.567.890-11',tel:'(11) 99745-2210',cargo:'Gerente',salario:4800,adm:'2021-06-15',status:'Ativo',email:'mariana@calisto.com.br',login:true},
  {id:'f03',nome:'Rafael Lima',cpf:'345.678.901-22',tel:'(11) 99633-8890',cargo:'Caixa',salario:2200,adm:'2022-01-10',status:'Ativo',email:'rafael@calisto.com.br',login:true},
  {id:'f04',nome:'Juliana Alves',cpf:'456.789.012-33',tel:'(11) 99521-7743',cargo:'Garçom',salario:2100,adm:'2022-04-03',status:'Ativo',email:'juliana@calisto.com.br',login:true},
  {id:'f05',nome:'Pedro Santos',cpf:'567.890.123-44',tel:'(11) 99410-6621',cargo:'Churrasqueiro',salario:2600,adm:'2022-02-18',status:'Ativo',email:'pedro@calisto.com.br',login:true},
  {id:'f06',nome:'Ana Clara Dias',cpf:'678.901.234-55',tel:'(11) 99388-5540',cargo:'Cozinha',salario:1900,adm:'2023-03-12',status:'Ativo',email:'ana@calisto.com.br',login:true},
  {id:'f07',nome:'Diego Ferreira',cpf:'789.012.345-66',tel:'(11) 99277-4432',cargo:'Entregador',salario:1800,adm:'2023-08-20',status:'Ativo',email:'diego@calisto.com.br',login:true},
  {id:'f08',nome:'Lucas Martins',cpf:'890.123.456-77',tel:'(11) 99166-3321',cargo:'Estoquista',salario:2000,adm:'2023-11-05',status:'Férias',email:'lucas@calisto.com.br',login:true}
 ],
 clientes:
  [['Camila Rodrigues','111.222.333-44','(11) 98812-4344','1990-04-12','Vila Mariana','São Paulo'],
   ['Bruno Carvalho','222.333.444-55','(11) 98745-2210','1985-09-23','Pinheiros','São Paulo'],
   ['Fernanda Lima','333.444.555-66','(11) 98633-8890','1993-01-30','Moema','São Paulo'],
   ['Rodrigo Alves','444.555.666-77','(11) 98521-7743','1979-07-08','Ipiranga','São Paulo'],
   ['Patrícia Gomes','555.666.777-88','(11) 98410-6621','1996-11-16','Tatuapé','São Paulo'],
   ['Thiago Barbosa','666.777.888-99','(11) 98388-5540','1988-02-27','Saúde','São Paulo'],
   ['Larissa Nunes','777.888.999-00','(11) 98277-4432','1999-06-04','Butantã','São Paulo'],
   ['Marcelo Pires','888.999.000-11','(11) 98166-3321','1974-12-19','Santana','São Paulo'],
   ['Aline Costa','999.000.111-22','(11) 98055-2210','1991-08-25','Perdizes','São Paulo'],
   ['Gustavo Rocha','100.200.300-40','(11) 97944-1109','1982-05-14','Lapa','São Paulo']
  ].map((c,i)=>({id:'c'+String(i+1).padStart(2,'0'),nome:c[0],cpf:c[1],tel:c[2],nasc:c[3],bairro:c[4],cidade:c[5],email:c[0].toLowerCase().split(' ')[0]+'@email.com',endereco:'Rua das Palmeiras, '+(100+i*37),obs:'',criado:daysAgo(300-i*22)})),
 fornecedores:[
  {id:'s01',razao:'Distribuidora Bebidas SP LTDA',fantasia:'Bebidas SP',cnpj:'12.345.678/0001-90',contato:'Sérgio Menezes',tel:'(11) 3344-5566',wa:'(11) 98877-1122',email:'vendas@bebidassp.com.br',end:'Av. Industrial, 1200 - São Paulo',pag:'28 dias',obs:'Entrega às terças e sextas'},
  {id:'s02',razao:'Atacadão Carnes Premium LTDA',fantasia:'Carnes Premium',cnpj:'23.456.789/0001-01',contato:'Rita Campos',tel:'(11) 3355-6677',wa:'(11) 98766-2233',email:'comercial@carnespremium.com.br',end:'Rua do Frigorífico, 455 - Osasco',pag:'15 dias',obs:'Carne bovina e suína'},
  {id:'s03',razao:'Hortifruti Central LTDA',fantasia:'Hortifruti Central',cnpj:'34.567.890/0001-12',contato:'João Peixoto',tel:'(11) 3366-7788',wa:'(11) 98655-3344',email:'pedidos@horticentral.com.br',end:'Ceagesp - Box 42 - São Paulo',pag:'À vista',obs:'Produtos frescos diários'},
  {id:'s04',razao:'Padaria Premium Pães LTDA',fantasia:'Padaria Premium',cnpj:'45.678.901/0001-23',contato:'Cláudia Reis',tel:'(11) 3377-8899',wa:'(11) 98544-4455',email:'contato@padariapremium.com.br',end:'Rua do Pão, 78 - São Paulo',pag:'21 dias',obs:'Pão brioche artesanal'},
  {id:'s05',razao:'Embalagens Brasil LTDA',fantasia:'Embalagens Brasil',cnpj:'56.789.012/0001-34',contato:'Fábio Nunes',tel:'(11) 3388-9900',wa:'(11) 98433-5566',email:'vendas@embbrasil.com.br',end:'Av. das Indústrias, 2200 - Guarulhos',pag:'30 dias',obs:'Sacolas, caixas e descartáveis'}
 ],
 movimentos:[
  {id:'mov1',data:daysAgo(0),prod:'Coca-Cola 350ml',tipo:'Venda',qtd:-12,resp:'Sistema',obs:'Vendas do dia'},
  {id:'mov2',data:daysAgo(0),prod:'Carne Bovina 160g',tipo:'Venda',qtd:-4800,resp:'Sistema',obs:'Produção de hambúrgueres'},
  {id:'mov3',data:daysAgo(0),prod:'Corona 355ml',tipo:'Perda',qtd:-3,resp:'Pedro Santos',obs:'Garrafa quebrada'},
  {id:'mov4',data:daysAgo(1),prod:'Batata Pré-frita',tipo:'Compra',qtd:15000,resp:'Lucas Martins',obs:'NF 44821 - Carnes Premium'},
  {id:'mov5',data:daysAgo(1),prod:'Pão Brioche',tipo:'Compra',qtd:200,resp:'Lucas Martins',obs:'Padaria Premium'},
  {id:'mov6',data:daysAgo(2),prod:'Alface',tipo:'Perda',qtd:-400,resp:'Ana Clara Dias',obs:'Folhas murchas'},
  {id:'mov7',data:daysAgo(2),prod:'Heineken 600ml',tipo:'Ajuste',qtd:-2,resp:'Mariana Souza',obs:'Inventário cíclico'},
  {id:'mov8',data:daysAgo(3),prod:'Queijo Cheddar',tipo:'Consumo Interno',qtd:-180,resp:'Ana Clara Dias',obs:'Refeição da equipe'}
 ],
 compras:[
  {id:'cp01',num:'OC-2026-0142',forn:'s02',data:daysAgo(1),previsao:daysAgo(-2),itens:[{n:'Carne Bovina 160g',qtd:15000,custo:0.028},{n:'Bacon',qtd:3000,custo:0.047}],pag:'PIX',venc:daysAgo(-13),status:'Recebido'},
  {id:'cp02',num:'OC-2026-0143',forn:'s04',data:daysAgo(1),previsao:daysAgo(-1),itens:[{n:'Pão Brioche',qtd:200,custo:1.75}],pag:'Boleto',venc:daysAgo(-20),status:'Recebido'},
  {id:'cp03',num:'OC-2026-0144',forn:'s01',data:daysAgo(0),previsao:daysAgo(-3),itens:[{n:'Heineken 600ml',qtd:96,custo:9.10},{n:'Corona 355ml',qtd:72,custo:8.00},{n:'Coca-Cola 350ml',qtd:120,custo:3.05}],pag:'PIX',venc:daysAgo(-27),status:'Pendente'},
  {id:'cp04',num:'OC-2026-0145',forn:'s03',data:daysAgo(0),previsao:daysAgo(-1),itens:[{n:'Tomate',qtd:5000,custo:0.010},{n:'Alface',qtd:6000,custo:0.011},{n:'Cebola',qtd:4000,custo:0.007}],pag:'À vista',venc:daysAgo(0),status:'Parcial'},
  {id:'cp05',num:'OC-2026-0146',forn:'s05',data:daysAgo(-1),previsao:daysAgo(-6),itens:[{n:'Sacolas Kraft G',qtd:1000,custo:0.35},{n:'Caixas delivery',qtd:500,custo:0.90}],pag:'Boleto',venc:daysAgo(-29),status:'Pendente'}
 ],
 promo:[],
 reservas:[],
 pedidos:[],
 comandas:[],
 payables:[],
 receivables:[],
 caixa:{aberto:true,saldoInicial:800,abertoEm:new Date().toISOString(),movimentos:[]},
 notifs:[]
};
/* mesas */
const mesa=[[1,4,0],[2,4,330],[3,2,520],[4,6,910],[5,4,0],[6,2,0],[7,8,1450],[8,4,260],[9,6,0],[10,2,180],[11,4,0],[12,6,640],[13,8,0],[14,4,0],[15,2,0],[16,4,780]];
DB.mesas=mesa.map((m,i)=>({id:'mesa'+String(m[0]).padStart(2,'0'),num:String(m[0]).padStart(2,'0'),lugares:m[1],min:m[2],garcom:m[2]?(i%2?'Juliana Alves':'Rafael Lima'):null,cliente:m[2]?(DB.clientes[i%10].nome):null,comanda:m[2]?('CMD-'+(3200+i)):null,x:60+(i%5)*180,y:50+Math.floor(i/5)*150}));
DB.produtos.forEach(p=>p.margem=((p.preco-p.custo)/p.preco)*100);

/* promos */
DB.promo=[
 {id:'pr01',nome:'Happy Hour Chopp & Cia',tipo:'percent',valor:20,ini:daysAgo(20),fim:daysAgo(-40),min:0,ativo:true,desc:'20% OFF em drinks e cervejas de seg. a qui, 18h–20h',prod:'Drinks & Cervejas',usos:342},
 {id:'pr02',nome:'Terça do Burger',tipo:'percent',valor:15,ini:daysAgo(30),fim:daysAgo(-60),min:40,ativo:true,desc:'15% OFF em todos os hambúrgueres acima de R$40',prod:'Hambúrgueres',usos:189},
 {id:'pr03',nome:'Combo Família',tipo:'combo',valor:0,ini:daysAgo(10),fim:daysAgo(-80),min:0,ativo:true,desc:'2 Combos X-Burger + 1 Batata Grande por R$89,90',prod:'Combos',usos:57},
 {id:'pr04',nome:'Leve 2 Pague 1 - Corona',tipo:'bxgy',valor:0,ini:daysAgo(5),fim:daysAgo(-25),min:0,ativo:true,desc:'Na compra de 2 Coronas, a 2ª sai grátis',prod:'Corona 355ml',usos:88},
 {id:'pr05',nome:'Cupom BEMVINDO10',tipo:'coupon',valor:10,ini:daysAgo(60),fim:daysAgo(-120),min:30,ativo:false,desc:'10% OFF na primeira compra (código BEMVINDO10)',prod:'Todas as categorias',usos:410}
];
/* reservas */
const resNomes=DB.clientes.map(c=>c.nome);
DB.reservas=[
 {id:'r01',cliente:'Camila Rodrigues',tel:'(11) 98812-4344',data:daysAgo(0),hora:'20:00',pessoas:4,mesa:'05',status:'Confirmada',obs:'Aniversário — levar sobremesa com vela'},
 {id:'r02',cliente:'Bruno Carvalho',tel:'(11) 98745-2210',data:daysAgo(0),hora:'21:30',pessoas:2,mesa:'09',status:'Aguardando',obs:''},
 {id:'r03',cliente:'Fernanda Lima',tel:'(11) 98633-8890',data:daysAgo(-1),hora:'19:30',pessoas:6,mesa:'13',status:'Confirmada',obs:'Mesa perto da janela'},
 {id:'r04',cliente:'Rodrigo Alves',tel:'(11) 98521-7743',data:daysAgo(-1),hora:'20:30',pessoas:5,mesa:'12',status:'Confirmada',obs:'Alergia a frutos do mar'},
 {id:'r05',cliente:'Patrícia Gomes',tel:'(11) 98410-6621',data:daysAgo(-2),hora:'21:00',pessoas:2,mesa:'03',status:'Chegou',obs:''},
 {id:'r06',cliente:'Thiago Barbosa',tel:'(11) 98388-5540',data:daysAgo(-3),hora:'20:00',pessoas:8,mesa:'07',status:'Concluída',obs:'Evento corporativo'}
].map(r=>({...r,mesa:r.mesa||'—'}));

/* order builder helpers */
const orderProducts=[['p01',2],['p13',2],['p06',1]];
function mkItems(list){return list.map(([pid,q],i)=>{const p=DB.produtos.find(x=>x.id===pid);return{pid,nome:p.nome,qtd:q,preco:p.preco,emoji:p.emoji,obs:'',mods:[]}})}
const payMet=['PIX','Crédito','Débito','Dinheiro'];
function mkOrder(i,{tipo,status,pm,totalHint,cliente,mesa,itens,mins,entregador}){
 const its=itens||mkItems(orderProducts);
 const sub=sum(its,x=>x.preco*x.qtd);
 return {id:'ord'+String(100+i),num:100+i,tipo,status,pm,itens:its,subtotal:sub,desc:0,servTipo:tipo==='Mesa'?10:0,entrega:tipo==='Delivery'?8.90:0,
  total:+(sub+sub*0.10*(tipo==='Mesa'?1:0)+(tipo==='Delivery'?8.90:0)-0).toFixed(2),
  cliente:cliente||'Cliente Balcão',mesa:mesa||null,garcom:garcomFor(i),mins,entregador:entregador||null,pago:['Finalizado','Entregue'].includes(status),
  criado:new Date(Date.now()-mins*60000),endereco:tipo==='Delivery'?DB.clientes[i%10].endereco+', '+(10+i):null,bairro:tipo==='Delivery'?DB.clientes[i%10].bairro:null}
}
function garcomFor(i){return ['Juliana Alves','Rafael Lima','Mariana Souza'][i%3]}
DB.pedidos=[
 mkOrder(4,{tipo:'Mesa',status:'Em preparo',pm:null,mesa:'01',cliente:'Mesa 01',mins:14,itens:mkItems([['p01',2],['p06',1],['p13',3]])}),
 mkOrder(7,{tipo:'Delivery',status:'Novo',pm:'PIX',mins:4,itens:mkItems([['p03',1],['p07',1],['p21',2]])}),
 mkOrder(8,{tipo:'Balcão',status:'Pronto',pm:'Dinheiro',mins:22,itens:mkItems([['p04',1],['p14',1]])}),
 mkOrder(9,{tipo:'Delivery',status:'Saiu para entrega',pm:'Crédito',mins:31,itens:mkItems([['p05',2],['p27',2],['p20',2]])}),
 mkOrder(10,{tipo:'Mesa',status:'Em preparo',pm:null,mesa:'12',cliente:'Mesa 12',mins:18,itens:mkItems([['p28',3],['p21',4],['p25',2]])}),
 mkOrder(11,{tipo:'Balcão',status:'Finalizado',pm:'PIX',mins:52,itens:mkItems([['p01',1],['p13',1]])}),
 mkOrder(12,{tipo:'Mesa',status:'Entregue',pm:'Crédito',mesa:'04',cliente:'Marcelo Pires',mins:68,itens:mkItems([['p02',2],['p09',1],['p22',4]])}),
 mkOrder(13,{tipo:'Delivery',status:'Finalizado',pm:'Débito',mins:96,itens:mkItems([['p11',2],['p06',2],['p14',2]])}),
 mkOrder(14,{tipo:'Mesa',status:'Cancelado',pm:null,mesa:'10',cliente:'Aline Costa',mins:120,itens:mkItems([['p10',1],['p18',1]])}),
 mkOrder(15,{tipo:'Balcão',status:'Finalizado',pm:'Dinheiro',mins:142,itens:mkItems([['p12',2],['p15',2]])}),
];
DB.pedidos.forEach((o,i)=>{o.emoji=[...new Set(o.itens.map(x=>x.emoji))].slice(0,3)});
/* comandas from occupied tables + extras */
let cmdN=3200;
DB.comandas=DB.mesas.filter(m=>m.min>0).map((m,i)=>({
 id:m.comanda,mesa:m.num,cliente:m.cliente,garcom:m.garcom,aberta:new Date(Date.now()-m.min*60000),
 itens:mkItems(i%2?[['p01',2],['p06',1],['p13',2]]:[['p03',1],['p07',1],['p21',3]]),
 status:(i<2?'Em andamento':i<4?'Aguardando pagamento':'Aberta'),desc:i===1?10:0,pgto:i<4?null:null
}));
DB.comandas.push({id:'CMD-3210',mesa:'—',cliente:'Rodrigo Alves',garcom:'Juliana Alves',aberta:new Date(Date.now()-95*60000),itens:mkItems([['p05',3],['p26',3],['p19',3]]),status:'Aberta',desc:0,pgto:null});
DB.comandas.push({id:'CMD-3211',mesa:'—',cliente:'Fernanda Lima',garcom:'Mariana Souza',aberta:new Date(Date.now()-40*60000),itens:mkItems([['p28',2],['p21',2]]),status:'Aguardando pagamento',desc:5,pgto:null});

/* financial */
DB.payables=[
 {id:'ap01',desc:'Aluguel do imóvel - Outubro',cat:'Aluguel',valor:6800,venc:daysAgo(-3),status:'Pendente',forn:'Imobiliária Central',pago:null,obs:'Vencimento dia 10 com multa após'},
 {id:'ap02',desc:'Energia elétrica - Setembro',cat:'Energia',valor:2340.55,venc:daysAgo(-1),status:'Pendente',forn:'Enel SP',pago:null,obs:''},
 {id:'ap03',desc:'Internet e telefonia',cat:'Internet',valor:389.90,venc:daysAgo(0),status:'Pendente',forn:'Vivo Empresas',pago:null,obs:'Fibra 500MB'},
 {id:'ap04',desc:'Água e esgoto',cat:'Água',valor:612.30,venc:daysAgo(-6),status:'Pendente',forn:'Sabesp',pago:null,obs:''},
 {id:'ap05',desc:'NF 44821 - Carnes Premium',cat:'Fornecedores',valor:5420.00,venc:daysAgo(-13),status:'Pendente',forn:'Atacadão Carnes Premium',pago:null,obs:'Carne e bacon'},
 {id:'ap06',desc:'Folha de pagamento - Outubro',cat:'Salários',valor:15400.00,venc:daysAgo(-5),status:'Pendente',forn:'—',pago:null,obs:'8 colaboradores'},
 {id:'ap07',desc:'DAS Simples Nacional - 09/2026',cat:'Impostos',valor:3120.40,venc:daysAgo(0),status:'Pendente',forn:'Receita Federal',pago:null,obs:'DAS do mês'},
 {id:'ap08',desc:'Impulsionamento Instagram',cat:'Marketing',valor:450.00,venc:daysAgo(8),status:'Pago',forn:'Meta Platforms',pago:daysAgo(9),obs:'Campanha do combo'},
 {id:'ap09',desc:'Manutenção da câmara fria',cat:'Manutenção',valor:980.00,venc:daysAgo(12),status:'Pago',forn:'Refrigeração Silva',pago:daysAgo(11),obs:''},
 {id:'ap10',desc:'NF 44902 - Embalagens Brasil',cat:'Fornecedores',valor:745.00,venc:daysAgo(-25),status:'Pendente',forn:'Embalagens Brasil',pago:null,obs:''}
];
DB.receivables=[
 {id:'ar01',desc:'Almoço corporativo - Empresa Nexus',cliente:'Thiago Barbosa',valor:1240.00,venc:daysAgo(-4),status:'Pendente',pago:null},
 {id:'ar02',desc:'Evento aniversário - salão reservado',cliente:'Marcelo Pires',valor:2800.00,venc:daysAgo(-9),status:'Pendente',pago:null},
 {id:'ar03',desc:'Fatura mensal - Delivery próprio',cliente:'Aline Costa',valor:389.90,venc:daysAgo(2),status:'Pago',pago:daysAgo(2)},
 {id:'ar04',desc:'Reembolso iFood - repasse',cliente:'iFood',valor:3870.20,venc:daysAgo(-2),status:'Pendente',pago:null}
];
/* caixa movements */
DB.caixa.movimentos=[
 {id:'cx1',tipo:'Venda',desc:'Recebimento de pedidos',valor:1240.50,hora:new Date(Date.now()-3600000*6).toISOString(),resp:'Rafael Lima'},
 {id:'cx2',tipo:'Sangria',desc:'Retirada para depósito bancário',valor:-500,hora:new Date(Date.now()-3600000*4).toISOString(),resp:'Mariana Souza'},
 {id:'cx3',tipo:'Venda',desc:'Recebimento de pedidos',valor:890.00,hora:new Date(Date.now()-3600000*2).toISOString(),resp:'Rafael Lima'},
 {id:'cx4',tipo:'Suprimento',desc:'Troco adicional',valor:300,hora:new Date(Date.now()-3600000).toISOString(),resp:'Mariana Souza'}
];
/* notifications */
DB.notifs=[
 {id:'n1',tipo:'estoque',titulo:'Estoque baixo',msg:'Corona 355ml está com apenas 7 unidades (mín. 12).',hora:8,unread:true,ico:'alert',color:'amber'},
 {id:'n2',tipo:'financeiro',titulo:'Contas vencendo hoje',msg:'3 contas vencem hoje: DAS, Internet e Energia.',hora:34,unread:true,ico:'wallet',color:'red'},
 {id:'n3',tipo:'pedido',titulo:'Pedido aguardando preparo',msg:'Pedido #107 está aguardando início de preparo há 4 min.',hora:4,unread:true,ico:'kitchen',color:'blue'},
 {id:'n4',tipo:'estoque',titulo:'Produto esgotado',msg:'Cebola caramelizada zerou no estoque de insumos.',hora:120,unread:true,ico:'box',color:'red'},
 {id:'n5',tipo:'caixa',titulo:'Caixa aberto',msg:'O caixa permanece aberto desde as 11:00.',hora:420,unread:false,ico:'pos',color:'amber'},
 {id:'n6',tipo:'geral',titulo:'Meta do dia',msg:'Faltam R$ 812,00 para atingir a meta de faturamento.',hora:60,unread:false,ico:'trendUp',color:'green'}
];
/* analytics series */
DB.serie={hoje:[...Array(12)].map((_,i)=>({h:(11+i)+'h',v:Math.round(180+Math.sin(i/2)*140+Math.random()*220)})),
 semana:[{d:'Seg',v:4820},{d:'Ter',v:3960},{d:'Qua',v:5210},{d:'Qui',v:6480},{d:'Sex',v:9840},{d:'Sáb',v:12480},{d:'Dom',v:8930}],
 mes:[...Array(30)].map((_,i)=>({d:String(i+1),v:Math.round(4200+Math.sin(i/3)*1400+ (i%7===5||i%7===6?3200:0) + Math.random()*900)})),
 ano:[{d:'Jan',v:96000},{d:'Fev',v:88000},{d:'Mar',v:104000},{d:'Abr',v:112000},{d:'Mai',v:121000},{d:'Jun',v:138000},{d:'Jul',v:152000},{d:'Ago',v:143000},{d:'Set',v:131000}]
};
