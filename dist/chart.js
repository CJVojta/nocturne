import {chartPoint} from './astro.js';

const colours = {Star:'#f4e8ff', Nebula:'#ff9bc6', Galaxy:'#bda5ff', Cluster:'#8fe5d6'};
const tau = Math.PI * 2;

function canvasContext(canvas) {
  const {width, height} = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  return {ctx, width, height};
}

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function drawHero(canvas) {
  const {ctx,width:w,height:h} = canvasContext(canvas);
  if (!w || !h) return;
  const rng = random(3917);
  const cx = w * (w < 620 ? .77 : .72);
  const cy = h * .49;
  const radius = Math.min(w*.47, h*.78);
  const field = ctx.createRadialGradient(cx,cy,0,cx,cy,radius*1.35);
  field.addColorStop(0,'#332754');
  field.addColorStop(.37,'#17172f');
  field.addColorStop(1,'#080b15');
  ctx.fillStyle = field;
  ctx.fillRect(0,0,w,h);
  for (let i=0;i<560;i++) {
    const x=rng()*w, y=rng()*h, bright=rng();
    ctx.fillStyle = `rgba(219,221,255,${.12+bright**3*.7})`;
    ctx.beginPath();
    ctx.arc(x,y,.22+bright**4*1.15,0,tau);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(-.53);
  ctx.scale(1,.48);
  ctx.globalCompositeOperation='screen';
  const glow=ctx.createRadialGradient(0,0,0,0,0,radius*.7);
  glow.addColorStop(0,'#fff4cf');
  glow.addColorStop(.08,'#f2c6a3bb');
  glow.addColorStop(.25,'#b08afb61');
  glow.addColorStop(.63,'#6657bd29');
  glow.addColorStop(1,'#37256700');
  ctx.fillStyle=glow;
  ctx.fillRect(-radius,-radius,radius*2,radius*2);
  for(let i=0;i<9500;i++){
    const r=rng()**.74;
    const arm=(i%3)*tau/3;
    const angle=arm+r*6.9+(rng()-.5)*(.35+r*.93);
    const spread=(rng()-.5)*radius*.13;
    const x=Math.cos(angle)*r*radius+spread;
    const y=Math.sin(angle)*r*radius+spread;
    const alpha=(1-r)*(.06+rng()*.29);
    ctx.fillStyle = i%7===0 ? `rgba(245,165,163,${alpha})` : `rgba(167,154,255,${alpha})`;
    const size=.45+rng()*2.4;
    ctx.fillRect(x,y,size,size);
  }
  ctx.restore();
  ctx.strokeStyle='#b4a4ee37';
  ctx.lineWidth=.8;
  for(const factor of [.66,.9,1.07]){
    ctx.beginPath();
    ctx.arc(cx,cy,radius*factor,0,tau);
    ctx.stroke();
  }
  ctx.setLineDash([2,8]);
  ctx.beginPath();
  ctx.moveTo(cx-radius*1.17,cy);ctx.lineTo(cx+radius*1.17,cy);
  ctx.moveTo(cx,cy-radius*1.17);ctx.lineTo(cx,cy+radius*1.17);ctx.stroke();
  ctx.setLineDash([]);
  for(let i=0;i<36;i++){
    const angle=i*tau/36;
    const r=radius*1.07;
    const length=i%3===0?9:4;
    ctx.beginPath();
    ctx.moveTo(cx+r*Math.sin(angle),cy+r*Math.cos(angle));
    ctx.lineTo(cx+(r-length)*Math.sin(angle),cy+(r-length)*Math.cos(angle));
    ctx.stroke();
  }
}

export function drawChart(canvas, objects, selected, labels) {
  const {ctx,width:w,height:h} = canvasContext(canvas);
  const cx=w/2, cy=h/2, radius=Math.max(0,Math.min(w,h)/2-28);
  if(!radius) return [];
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.font='11px monospace';
  ctx.lineWidth=1;
  ctx.strokeStyle='#343b59';
  for (const altitude of [0,30,60]) {
    const r=radius*(90-altitude)/90;
    ctx.beginPath();ctx.arc(cx,cy,r,0,tau);ctx.stroke();
    if (altitude) {
      ctx.fillStyle='#8c96b3';
      ctx.fillText(`${altitude}°`,cx+17,cy-r);
    }
  }
  for(const [name,az] of [['N',0],['E',90],['S',180],['W',270]]){
    const point=chartPoint(-8,az,cx,cy,radius);
    const end=chartPoint(0,az,cx,cy,radius);
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(end.x,end.y);ctx.stroke();
    ctx.fillStyle='#c4b6ff';ctx.fillText(name,point.x,point.y);
  }
  const hits=[];
  for(const object of objects.filter(item=>item.alt>=0)){
    const point=chartPoint(object.alt,object.az,cx,cy,radius);
    hits.push({...point,id:object.id});
    const colour=colours[object.type];
    ctx.fillStyle=colour;
    ctx.beginPath();ctx.arc(point.x,point.y,object.type==='Star'?2.7:3.7,0,tau);ctx.fill();
    if(object.id===selected){
      ctx.strokeStyle=colour;
      ctx.beginPath();ctx.arc(point.x,point.y,9,0,tau);ctx.stroke();
      ctx.strokeStyle='#343b59';
    }
    if(labels||object.id===selected){
      ctx.font='10px monospace';
      ctx.textAlign=point.x>cx?'right':'left';
      ctx.fillText(object.type==='Star'?object.name:object.id,point.x+(point.x>cx?-9:9),point.y-8);
    }
  }
  return hits;
}
