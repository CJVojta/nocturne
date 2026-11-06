import {catalog, csvFor, horizontal, presets, sidereal} from './astro.js';
import {drawChart, drawHero} from './chart.js';

const byId = id => document.getElementById(id);
const storageKey='nocturne-field-log-v1';
const state={type:'All',selected:'M31',objects:[],date:null,hits:[],saved:readSaved()};
const types=['All','Galaxy','Nebula','Cluster','Star'];
const num=value=>`${value.toFixed(1)}°`;
const status=item=>item.alt>=0?'Above horizon':'Below horizon';

function readSaved() {
  try {
    const value=JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return new Set(Array.isArray(value)?value.filter(id=>catalog.some(item=>item.id===id)):[]);
  } catch { return new Set(); }
}

function node(tag, cls, text) {
  const result=document.createElement(tag);
  if(cls) result.className=cls;
  if(text!==undefined) result.textContent=text;
  return result;
}

function save(id, refocus) {
  if(state.saved.has(id)) state.saved.delete(id);
  else state.saved.add(id);
  try {localStorage.setItem(storageKey, JSON.stringify([...state.saved]));} catch {}
  renderFocus();
  renderCards();
  renderLog();
  if(refocus) document.querySelector(refocus)?.focus();
}

function choose(id, scroll=false, refocus=false) {
  state.selected=id;
  renderFocus();
  renderCards();
  draw();
  if(scroll){
    byId('focus').focus({preventScroll:true});
    byId('focus').scrollIntoView({block:'nearest'});
  } else if(refocus) document.querySelector(`[data-target="${id}"]`)?.focus();
}

function setNow() {
  byId('moment').value=new Date().toISOString().slice(0,16);
  byId('offset').value=0;
  recalculate();
}

function recalculate() {
  const latitude=byId('lat').valueAsNumber;
  const longitude=byId('lon').valueAsNumber;
  const moment=byId('moment').value;
  const offset=Number(byId('offset').value);
  const timestamp=Date.parse(moment+'Z');
  byId('offset-value').textContent=`${offset>0?'+':''}${offset} h`;
  if(!Number.isFinite(timestamp)||!(Math.abs(latitude)<=90)||!(Math.abs(longitude)<=180)){
    byId('instrument-error').textContent='Enter a valid UTC date, latitude (−90° to 90°), and longitude (−180° to 180°).';
    return;
  }
  byId('instrument-error').textContent='';
  state.date=new Date(timestamp+offset*3600000);
  const localSidereal=sidereal(state.date,longitude);
  state.objects=catalog.map(object=>({...object,...horizontal(object.ra,object.dec,latitude,localSidereal)}));
  const count=state.objects.filter(item=>item.alt>=0).length;
  byId('sky-count').textContent=`${count} of ${catalog.length} above horizon · ${state.date.toISOString().slice(0,16).replace('T',' ')} UTC`;
  renderFocus();
  renderCards();
  renderLog();
  draw();
}

function draw() {
  state.hits=drawChart(byId('sky'),state.objects,state.selected,byId('labels').checked);
}

function renderFocus() {
  const item=state.objects.find(object=>object.id===state.selected);
  if(!item) return;
  const statusText=node('p',`status ${item.alt<0?'below':''}`,status(item));
  const position=node('div','position');
  for(const [label,value] of [['Altitude',num(item.alt)],['Azimuth',num(item.az)],['RA',`${item.ra.toFixed(2)} h`],['Magnitude',item.mag.toFixed(2)]]){
    const cell=node('div');
    cell.append(node('small','',label),node('b','',value));
    position.append(cell);
  }
  const saved=state.saved.has(item.id);
  const button=node('button','button',saved?'− Remove from log':'+ Add to field log');
  button.id='focus-save';
  button.setAttribute('aria-pressed',String(saved));
  button.addEventListener('click',()=>save(item.id,'#focus-save'));
  byId('focus').tabIndex=-1;
  byId('focus').replaceChildren(node('p','tag',`${item.id} / ${item.type.toUpperCase()}`),node('h3','',item.name),
    node('p','muted',item.constellation),position,statusText,node('p','muted',item.description),button);
}

function bookmark(item, where) {
  const saved=state.saved.has(item.id);
  const button=node('button','bookmark',saved?'✓':'+');
  button.id=`${where}-${item.id}`;
  button.setAttribute('aria-label',`${saved?'Remove':'Save'} ${item.name} ${saved?'from':'to'} field log`);
  button.setAttribute('aria-pressed',String(saved));
  button.addEventListener('click',()=>save(item.id,where==='log'?'#shortlist':`#${button.id}`));
  return button;
}

function renderCards() {
  const search=byId('search').value.trim().toLowerCase();
  const above=byId('above').checked;
  const objects=state.objects.filter(item=>(state.type==='All'||item.type===state.type)&&
    (!above||item.alt>=0)&&`${item.name} ${item.id} ${item.constellation}`.toLowerCase().includes(search));
  byId('results').textContent=`${objects.length} matching objects`;
  byId('cards').replaceChildren(...objects.map(item=>{
    const card=node('article',`card ${item.id===state.selected?'selected':''}`);
    const head=node('div','card-head');
    const label=node('span','tag',item.type);
    label.prepend(node('i',`dot ${item.type.toLowerCase()}`));
    head.append(node('span','id',item.id),label);
    const title=node('h3');
    const button=node('button','',item.name);
    button.dataset.target=item.id;
    button.addEventListener('click',()=>choose(item.id,true));
    title.append(button);
    const bottom=node('div','card-bottom');
    bottom.append(node('span',`status ${item.alt<0?'below':''}`,`${num(item.alt)} · ${status(item)}`),bookmark(item,'card'));
    card.append(head,title,node('p','muted',item.constellation),bottom);
    return card;
  }));
  if(!objects.length) byId('cards').append(node('p','muted','No objects match these filters.'));
}

function renderLog() {
  const items=state.objects.filter(item=>state.saved.has(item.id));
  byId('nav-count').textContent=items.length;
  byId('export').disabled=!items.length;
  const list=node('ul');
  for(const item of items){
    const row=node('li');
    const details=node('div');
    details.append(node('strong','',item.name),node('p','muted',`${item.id} · altitude ${num(item.alt)} · azimuth ${num(item.az)}`));
    row.append(details,bookmark(item,'log'));
    list.append(row);
  }
  byId('shortlist').tabIndex=-1;
  byId('shortlist').replaceChildren(items.length?list:node('p','muted','Your field log is empty. Save objects from the catalogue or the focus panel.'));
}

for(const type of types){
  const button=node('button','filter',type==='All'?'All objects':type);
  button.setAttribute('aria-pressed',String(type===state.type));
  button.addEventListener('click',()=>{
    state.type=type;
    for(const filter of byId('filters').children) filter.setAttribute('aria-pressed',String(filter===button));
    renderCards();
  });
  byId('filters').append(button);
}
byId('place').addEventListener('change',event=>{
  const coordinates=presets[event.target.value];
  if(coordinates) [byId('lat').value,byId('lon').value]=coordinates;
  else byId('lat').focus();
  recalculate();
});
for(const id of ['lat','lon']) byId(id).addEventListener('input',()=>{
  byId('place').value='custom';
  recalculate();
});
for(const id of ['moment','offset']) byId(id).addEventListener('input',recalculate);
byId('reset-offset').addEventListener('click',()=>{byId('offset').value=0;recalculate();});
byId('now').addEventListener('click',setNow);
byId('labels').addEventListener('change',draw);
byId('search').addEventListener('input',renderCards);
byId('above').addEventListener('change',renderCards);
byId('sky').addEventListener('click',event=>{
  const {left,top}=event.currentTarget.getBoundingClientRect();
  const points=state.hits.map(point=>({...point,distance:Math.hypot(point.x-(event.clientX-left),point.y-(event.clientY-top))}));
  const match=points.sort((a,b)=>a.distance-b.distance)[0];
  if(match?.distance<=16) choose(match.id);
});
byId('export').addEventListener('click',()=>{
  const items=state.objects.filter(item=>state.saved.has(item.id));
  if(!items.length||!state.date) return;
  const url=URL.createObjectURL(new Blob([csvFor(items,state.date)],{type:'text/csv;charset=utf-8'}));
  const link=node('a');
  link.href=url;
  link.download='nocturne-field-log.csv';
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
const resize=new ResizeObserver(entries=>{
  for(const entry of entries){
    if(entry.target.id==='hero-stars') drawHero(entry.target);
    else draw();
  }
});
resize.observe(byId('hero-stars'));
resize.observe(byId('sky'));
setNow();
