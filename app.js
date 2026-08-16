const services=[
{id:'wa-id',name:'WhatsApp',icon:'WA',country:'ID',countryName:'Indonesia',flag:'🇮🇩',price:1350,stock:42},
{id:'tg-id',name:'Telegram',icon:'TG',country:'ID',countryName:'Indonesia',flag:'🇮🇩',price:950,stock:68},
{id:'gg-us',name:'Google',icon:'G',country:'US',countryName:'Amerika Serikat',flag:'🇺🇸',price:1600,stock:31},
{id:'dc-my',name:'Discord',icon:'DS',country:'MY',countryName:'Malaysia',flag:'🇲🇾',price:1200,stock:19},
{id:'ig-gb',name:'Instagram',icon:'IG',country:'GB',countryName:'Inggris',flag:'🇬🇧',price:2100,stock:12},
{id:'ms-us',name:'Microsoft',icon:'MS',country:'US',countryName:'Amerika Serikat',flag:'🇺🇸',price:1450,stock:25},
{id:'tg-my',name:'Telegram',icon:'TG',country:'MY',countryName:'Malaysia',flag:'🇲🇾',price:1100,stock:47},
{id:'wa-gb',name:'WhatsApp',icon:'WA',country:'GB',countryName:'Inggris',flag:'🇬🇧',price:2450,stock:15},
{id:'gg-id',name:'Google',icon:'G',country:'ID',countryName:'Indonesia',flag:'🇮🇩',price:1250,stock:53}
];

const state={balance:Number(localStorage.getItem('dlavie_balance')||0),history:JSON.parse(localStorage.getItem('dlavie_history')||'[]'),selected:null,authMode:'login'};
const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];

function persist(){localStorage.setItem('dlavie_balance',String(state.balance));localStorage.setItem('dlavie_history',JSON.stringify(state.history));}
function renderBalance(){['#balanceText','#balanceChip'].forEach(sel=>{const el=$(sel);if(el)el.textContent=rupiah(state.balance)});}
function serviceCard(s){return `<article class="service-card glass-card"><div class="service-top"><div class="service-title"><span class="service-icon">${s.icon}</span><div><h3>${s.name}</h3><p>${s.flag} ${s.countryName}</p></div></div><span class="stock">${s.stock} stok</span></div><div class="service-meta"><div><small>Mulai dari</small><strong>${rupiah(s.price)}</strong></div><button class="btn btn-primary" data-buy="${s.id}">Beli</button></div></article>`}
function renderServices(){const q=$('#serviceSearch').value.toLowerCase().trim();const country=$('#countryFilter').value;const list=services.filter(s=>(!q||`${s.name} ${s.countryName}`.toLowerCase().includes(q))&&(country==='all'||s.country===country));$('#serviceGrid').innerHTML=list.length?list.map(serviceCard).join(''):'<div class="history-empty">Layanan tidak ditemukan.</div>'}
function renderMini(q=''){const list=services.filter(s=>s.name.toLowerCase().includes(q.toLowerCase())).slice(0,4);$('#miniList').innerHTML=list.map(s=>`<div class="mini-item"><div class="mini-left"><span class="service-icon">${s.icon}</span><p>${s.name}<small>${s.flag} ${s.countryName}</small></p></div><span class="price">${rupiah(s.price)}</span></div>`).join('')}
function renderHistory(){const el=$('#historyList');if(!state.history.length){el.innerHTML='<div class="history-empty">Belum ada aktivitas demo.</div>';return}el.innerHTML=state.history.slice().reverse().map(x=>`<div class="history-item"><div><p>${x.title}</p><small>${x.time}</small></div><strong>${x.amount}</strong></div>`).join('')}
function addHistory(title,amount){state.history.push({title,amount,time:new Date().toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})});persist();renderHistory()}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove('show'),2300)}

const backdrop=$('#modalBackdrop');
function closeModal(){backdrop.hidden=true;$$('.modal').forEach(m=>m.hidden=true);document.body.style.overflow=''}
function openModal(type,tab){backdrop.hidden=false;document.body.style.overflow='hidden';$$('.modal').forEach(m=>m.hidden=true);const modal=$(`#${type}Modal`);if(modal)modal.hidden=false;if(type==='auth'&&tab)setAuthTab(tab)}
function setAuthTab(mode){state.authMode=mode;$$('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.authTab===mode));$('#authTitle').textContent=mode==='login'?'Selamat datang':'Buat akun demo'}

$$('[data-open]').forEach(btn=>btn.addEventListener('click',()=>openModal(btn.dataset.open,btn.dataset.tab)));
$$('[data-close]').forEach(btn=>btn.addEventListener('click',closeModal));
backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
$$('[data-auth-tab]').forEach(btn=>btn.addEventListener('click',()=>setAuthTab(btn.dataset.authTab)));

$('#serviceSearch').addEventListener('input',renderServices);$('#countryFilter').addEventListener('change',renderServices);$('#heroSearch').addEventListener('input',e=>renderMini(e.target.value));
$('#serviceGrid').addEventListener('click',e=>{const btn=e.target.closest('[data-buy]');if(!btn)return;state.selected=services.find(s=>s.id===btn.dataset.buy);const s=state.selected;$('#orderSummary').innerHTML=`<div class="order-box"><div class="order-line"><span>Layanan</span><strong>${s.name}</strong></div><div class="order-line"><span>Negara</span><strong>${s.flag} ${s.countryName}</strong></div><div class="order-line"><span>Harga demo</span><strong>${rupiah(s.price)}</strong></div></div>`;openModal('order')});

$$('[data-amount]').forEach(btn=>btn.addEventListener('click',()=>{$('#depositAmount').value=btn.dataset.amount}));
$('#depositForm').addEventListener('submit',e=>{e.preventDefault();const amount=Number(String($('#depositAmount').value).replace(/\D/g,''));if(!Number.isFinite(amount)||amount<1000){toast('Minimum deposit Rp1.000');return}state.balance+=amount;addHistory('Deposit demo',`+ ${rupiah(amount)}`);renderBalance();closeModal();toast('Deposit demo berhasil ditambahkan')});
$('#authForm').addEventListener('submit',e=>{e.preventDefault();const email=$('#authEmail').value.trim();localStorage.setItem('dlavie_demo_user',email);closeModal();toast(state.authMode==='register'?'Akun demo dibuat':'Berhasil masuk ke mode demo')});
$('#confirmOrder').addEventListener('click',()=>{const s=state.selected;if(!s)return;if(state.balance<s.price){closeModal();openModal('deposit');toast('Saldo demo belum cukup');return}state.balance-=s.price;addHistory(`Order demo • ${s.name} ${s.flag}`,`- ${rupiah(s.price)}`);renderBalance();closeModal();toast('Order demo dibuat — belum menghubungi supplier')});
$('#clearHistory').addEventListener('click',()=>{state.history=[];persist();renderHistory();toast('Riwayat demo dibersihkan')});

renderBalance();renderServices();renderMini();renderHistory();
