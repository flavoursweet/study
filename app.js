'use strict';
// Candidate roster: verify World availability and popularity before replacing prototype labels.
const SPIRITS=[{id:'huohua',name:'火花',type:'火系候选',rarity:'R',symbol:'♨',tint:'#884b39'},{id:'shuilanlan',name:'水蓝蓝',type:'水系候选',rarity:'R',symbol:'◈',tint:'#2a6f98'},{id:'miaomiao',name:'喵喵',type:'草系候选',rarity:'SR',symbol:'❧',tint:'#3d7960'},{id:'dimo',name:'迪莫',type:'光系候选',rarity:'SSR',symbol:'✦',tint:'#8d7441'}];
const KEY='xingji.v1'; const $=s=>document.querySelector(s); const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const nextDate=s=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+1);return dateKey(d)};
const weekOf=s=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()-(d.getDay()+6)%7);return dateKey(d)};
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&dateKey(new Date(s+'T12:00:00'))===s;
const fresh=()=>({version:1,id:crypto.randomUUID(),tasks:[],goals:[],reviews:{},claims:{},summaries:{}});
function validSummaries(s){return s===undefined||(s&&typeof s==='object'&&!Array.isArray(s)&&Object.values(s).every(r=>r&&typeof r.win==='string'&&typeof r.next==='string'&&typeof r.label==='string'&&typeof r.saved==='string'&&!isNaN(Date.parse(r.saved))))}
function validState(s){return s&&validSummaries(s.summaries)&&s.version===1&&typeof s.id==='string'&&Array.isArray(s.tasks)&&Array.isArray(s.goals)&&s.reviews&&typeof s.reviews==='object'&&!Array.isArray(s.reviews)&&s.claims&&typeof s.claims==='object'&&!Array.isArray(s.claims)&&s.tasks.length<=10000&&s.goals.length<=2000&&s.tasks.every(t=>t&&typeof t.id==='string'&&typeof t.title==='string'&&typeof t.proof==='string'&&typeof t.done==='boolean'&&validDate(t.date))&&s.goals.every(g=>g&&typeof g.id==='string'&&typeof g.title==='string'&&validDate(g.week))&&Object.entries(s.claims).every(([d,v])=>validDate(d)&&(v==='star'||SPIRITS.some(c=>c.id===v)))&&Object.entries(s.reviews).every(([d,r])=>validDate(d)&&r&&typeof r.win==='string'&&typeof r.next==='string');}
// Keep personal records from older backups; discard retired social fields.
const personalState=s=>({version:1,id:s.id,tasks:s.tasks,goals:s.goals,reviews:s.reviews,claims:s.claims,summaries:s.summaries||{}});
let state=fresh(),storageBroken=false;
try{const raw=localStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);if(!validState(parsed))throw Error();state=personalState(parsed);}}catch{storageBroken=true;}
let selected=dateKey();$('#day').value=selected;
function toast(message){$('#toast').textContent=message;$('#toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').style.display='none',4000)}
function commit(next){if(storageBroken){toast('本地数据读取失败，已停止写入以保护原数据。请先备份或恢复有效备份。');return false}try{localStorage.setItem(KEY,JSON.stringify(next));state=next;return true}catch{toast('保存失败，浏览器存储可能已满；本次修改未保存。');return false}}
function update(fn){const next=structuredClone(state);fn(next);if(commit(next)){render();return true}return false}
const dayTasks=()=>state.tasks.filter(t=>t.date===selected);
function card(c,owned){return `<article class="spirit ${owned?'':'locked'}" style="--tint:${c.tint}"><div class="rarity"><span>${c.rarity} · 暂定</span><span>${owned?'✧ 已收藏':'◇ 未解锁'}</span></div><div class="symbol" aria-hidden="true">${c.symbol}</div><h3>${c.name}</h3><small>${c.type} / 原创符号占位</small><p>${owned?'已加入收藏':'完成当天计划，按顺序解锁。'}</p></article>`}
function render(){
 const tasks=dayTasks(),done=tasks.filter(t=>t.done).length,claimed=!!state.claims[selected],owned=new Set(Object.values(state.claims).filter(x=>x!=='star'));
 $('#stats').innerHTML=`<div><strong>${Object.keys(state.claims).length}</strong><span>达成天数</span></div><div><strong>${owned.size}</strong><span>精灵收藏</span></div><div><strong>${state.tasks.filter(t=>t.done).length}</strong><span>完成行动</span></div>`;
 $('#date-label').textContent=selected===dateKey()?'TODAY / 今天的行动':selected+' / 当日计划';
 $('#progress-text').textContent=tasks.length?`${done} / ${tasks.length} 个重点任务已完成`:'尚未添加任务';$('#progress-note').textContent=claimed?'今日奖励已领取，成果已锁定。':selected!==dateKey()?'可规划或补记；奖励仅在任务当天领取。':'完成今天的全部重点任务，解锁一次收藏。';
 $('#progress').max=tasks.length||1;$('#progress').value=done;$('#claim').disabled=claimed||selected!==dateKey()||!tasks.length||done!==tasks.length;$('#claim').textContent=claimed?'✓ 今日奖励已收藏':owned.size===SPIRITS.length?'领取今日成长星 ✦':'领取今日精灵卡 ✦';
 $('#tasks').innerHTML=tasks.length?tasks.map(t=>`<article class="task ${t.done?'done':''}"><input type="checkbox" aria-label="完成：${escape(t.title)}" data-check="${escape(t.id)}" ${t.done?'checked':''} ${claimed?'disabled':''}><div class="content"><h3>${escape(t.title)}</h3><p>完成标准：${escape(t.proof)}</p>${t.goal?`<p>↳ ${escape(state.goals.find(g=>g.id===t.goal)?.title||'周目标')}</p>`:''}</div><button class="quiet delete" data-delete="${escape(t.id)}" aria-label="删除：${escape(t.title)}" ${claimed?'disabled':''}>×</button></article>`).join(''):'<div class="empty">暂无任务</div>';
 const target=nextDate(selected),planned=state.tasks.filter(t=>t.date===target).length,locked=!!state.claims[target];
 $('#task-date').value=target;$('#task-form button[type=submit]').disabled=locked||planned>=3;
 $('#task-limit').textContent=locked?'该日期已领奖，任务不可修改。':`${target} 已安排 ${planned} / 3 个任务。`;
 renderResults();
 $('#cards').innerHTML=SPIRITS.map(c=>card(c,owned.has(c.id))).join('');$('#owned-count').textContent=`${owned.size} / ${SPIRITS.length}`;
}
function loadReview(){const r=state.reviews[selected];$('#review-win').value=r?.win||'';$('#review-next').value=r?.next||'';$('#review-status').textContent=r?'已保存当日复盘':'';}
function changeDay(day){selected=day;$('#day').value=day;render();loadReview();}
function tab(id){if(id==='plan')renderResults();document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!==id);document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===id);b.setAttribute('aria-current',b.dataset.tab===id?'page':'false')});}
$('#day').addEventListener('change',e=>{if(validDate(e.target.value))changeDay(e.target.value)});
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
$('#task-form').onsubmit=e=>{e.preventDefault();const target=nextDate(selected);if(state.claims[target]||state.tasks.filter(t=>t.date===target).length>=3)return;const title=$('#task-title').value.trim(),proof=$('#task-proof').value.trim();if(!title||!proof)return toast('请填写具体任务和完成标准。');if(update(s=>s.tasks.push({id:crypto.randomUUID(),date:target,title,proof,done:false}))){$('#task-title').value='';$('#task-proof').value='';toast(`已保存到 ${target}。`)}};
$('#tasks').onchange=e=>{const id=e.target.dataset.check;if(!id)return;const task=state.tasks.find(t=>t.id===id);if(!task||state.claims[task.date])return;update(s=>{s.tasks.find(t=>t.id===id).done=e.target.checked});render()};
$('#tasks').onclick=e=>{const id=e.target.closest('[data-delete]')?.dataset.delete;if(!id||state.claims[selected])return;if(confirm('删除这个任务？'))update(s=>s.tasks=s.tasks.filter(t=>t.id!==id))};
$('#claim').onclick=()=>{if(selected!==dateKey()||state.claims[selected]||!dayTasks().length||dayTasks().some(t=>!t.done))return;const owned=Object.values(state.claims),next=SPIRITS.find(c=>!owned.includes(c.id));if(update(s=>s.claims[selected]=next?.id||'star')){$('#reward-card').innerHTML=next?card(next,true):'<div class="symbol">✦</div><h3>成长星 +1</h3>';$('#reward').showModal()}};
$('#reward').querySelectorAll('.close').forEach(b=>b.onclick=()=>$('#reward').close());
$('#review-form').onsubmit=e=>{e.preventDefault();if(update(s=>s.reviews[selected]={win:$('#review-win').value.trim(),next:$('#review-next').value.trim()})){$('#review-status').textContent='已保存当日复盘';toast('复盘已保存。')}};
function download(data,name){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type:'application/json'}));a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('#export').onclick=()=>{try{download(storageBroken?(localStorage.getItem(KEY)||'{}'):state,`星迹备份-${dateKey()}.json`)}catch{toast('无法读取本地存储。')}};
async function readFile(input){const f=input.files[0];if(!f)return null;if(f.size>2e6)throw Error('文件过大');return JSON.parse(await f.text())}
$('#restore').onchange=async e=>{try{const s=await readFile(e.target);if(!s)return;if(!validState(s))throw Error();if(confirm('将用备份替换当前全部计划、收藏与复盘，确定恢复？')){const wasBroken=storageBroken;storageBroken=false;if(commit(personalState(s))){render();loadReview();toast('备份已恢复。')}else storageBroken=wasBroken}}catch{toast('备份格式不正确，原数据未改变。')}finally{e.target.value=''}};
let resultLimit=20;
function resultPeriod(){const end=dateKey(),range=$('#result-range').value;const d=new Date(end+'T12:00:00');d.setDate(d.getDate()-(Number(range)||1)+1);return {start:range==='all'?'0000-01-01':dateKey(d),end}}
function renderResults(){
 const {start,end}=resultPeriod(),inRange=date=>date>=start&&date<=end;
 const tasksByDate=new Map();for(const task of state.tasks){if(!inRange(task.date))continue;if(!tasksByDate.has(task.date))tasksByDate.set(task.date,[]);tasksByDate.get(task.date).push(task)}
 const reviewDates=Object.entries(state.reviews).filter(([date,r])=>inRange(date)&&(r.win.trim()||r.next.trim())).map(([date])=>date);
 const query=$('#result-search').value.trim().toLowerCase();
 const entries=[...new Set([...tasksByDate.keys(),...reviewDates])].sort().reverse().map(date=>({date,tasks:tasksByDate.get(date)||[],review:state.reviews[date]})).filter(e=>[e.date,...e.tasks.flatMap(t=>[t.title,t.proof]),e.review?.win||'',e.review?.next||''].join(' ').toLowerCase().includes(query));
 $('#result-count').textContent=`${entries.length} 天记录`;
 $('#result-timeline').innerHTML=entries.slice(0,resultLimit).map(e=>`<article class="result-entry"><div class="section-title"><h3>${e.date}</h3><span class="pill">${e.tasks.filter(t=>t.done).length} / ${e.tasks.length} 项已完成</span></div><div class="history-columns"><section><h4>学习规划</h4>${e.tasks.length?`<ul class="history-plans">${e.tasks.map(t=>`<li class="result-task"><span class="task-state ${t.done?'complete':''}">${t.done?'已完成':'未完成'}</span><strong>${escape(t.title)}</strong><p>完成标准：${escape(t.proof)}</p></li>`).join('')}</ul>`:'<p class="history-empty">当日没有规划记录。</p>'}</section><section><h4>复盘总结</h4>${e.review&&(e.review.win.trim()||e.review.next.trim())?`${e.review.win.trim()?`<div class="review-excerpt"><small>完成了什么</small><p>${escape(e.review.win)}</p></div>`:''}${e.review.next.trim()?`<div class="review-excerpt"><small>问题与调整</small><p>${escape(e.review.next)}</p></div>`:''}`:'<p class="history-empty">尚未填写复盘。</p>'}</section></div><button type="button" class="quiet" data-open-day="${e.date}">查看当日 / 补充复盘 →</button></article>`).join('')||`<div class="empty">${query?'没有匹配的规划或复盘。':'暂无历史规划和复盘记录。'}</div>`;
 $('#result-more').hidden=entries.length<=resultLimit;
 $('#old-goals').hidden=!state.goals.length;$('#old-goal-list').innerHTML=state.goals.slice().sort((a,b)=>b.week.localeCompare(a.week)).map(g=>`<p><small>${g.week} 当周</small><br>${escape(g.title)}</p>`).join('');
 const summaries=Object.values(state.summaries).sort((a,b)=>b.saved.localeCompare(a.saved));$('#saved-summaries').hidden=!summaries.length;$('#summary-history').innerHTML=summaries.map(r=>`<article class="summary-saved"><strong>${escape(r.label)}</strong><small>保存于 ${escape(new Date(r.saved).toLocaleString())}</small><p>${escape(r.win)}</p><p>${escape(r.next)}</p></article>`).join('');
}
$('#result-range').onchange=()=>{resultLimit=20;renderResults()};
$('#result-search').oninput=()=>{resultLimit=20;renderResults()};
$('#result-more').onclick=()=>{resultLimit+=20;renderResults()};
$('#result-timeline').onclick=e=>{const day=e.target.closest('[data-open-day]')?.dataset.openDay;if(day){changeDay(day);tab('today');window.scrollTo({top:0,behavior:'smooth'})}};

render();loadReview();if(storageBroken)toast('已有数据无法读取，请备份原数据后恢复有效备份；当前不会覆盖原数据。');
// Refresh calendar-sensitive reward eligibility after returning from background.
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
