'use strict';
function drawPaperSpirit(ctx, p) {
  const s = p.size, phase = p.flapPhase;
  ctx.beginPath();
  if (p.kind === 'swallow') {
    ctx.rotate(-.35 + Math.sin(phase * .3) * .12);
    const lift = .7 + .25 * Math.sin(phase);
    ctx.moveTo(0, -s * .5);ctx.quadraticCurveTo(-s * .25, -s * lift, -s * 1.4, -s * lift);
    ctx.quadraticCurveTo(-s, s * .1, -s * .15, s * .2);ctx.lineTo(-s * .45, s);
    ctx.lineTo(0, s * .55);ctx.lineTo(s * .45, s);ctx.lineTo(s * .15, s * .2);
    ctx.quadraticCurveTo(s, s * .1, s * 1.4, -s * lift);ctx.quadraticCurveTo(s * .25, -s * lift, 0, -s * .5);ctx.fill();
  } else if (p.kind === 'butterfly') {
    ctx.scale(.45 + .55 * Math.abs(Math.cos(phase)), 1);
    ctx.moveTo(0,0);ctx.bezierCurveTo(-s*1.8,-s*1.4,-s*1.4,s*.8,0,s*.2);
    ctx.bezierCurveTo(s*1.4,s*.8,s*1.8,-s*1.4,0,0);
    ctx.moveTo(-s*.55,-s*.3);ctx.ellipse(-s*.55,-s*.3,s*.17,s*.27,0,0,Math.PI*2);
    ctx.moveTo(s*.55,-s*.3);ctx.ellipse(s*.55,-s*.3,s*.17,s*.27,0,0,Math.PI*2);ctx.fill('evenodd');
  } else if (p.kind === 'koi') {
    ctx.rotate(Math.sin(phase)*.2);ctx.ellipse(0,0,s,s*.43,0,0,Math.PI*2);
    ctx.moveTo(s*.7,0);ctx.quadraticCurveTo(s*1.3,-s*.2,s*1.5,-s*.65);ctx.lineTo(s*1.25,0);ctx.lineTo(s*1.5,s*.65);ctx.quadraticCurveTo(s*1.3,s*.2,s*.7,0);
    ctx.moveTo(-s*.5,-s*.12);ctx.arc(-s*.5,-s*.12,s*.1,0,Math.PI*2);ctx.fill('evenodd');
  } else if (p.kind === 'snowflake') {
    ctx.rotate(phase*.08);
    for(let n=0;n<6;n++){ctx.rotate(Math.PI/3);ctx.moveTo(0,-s*.18);ctx.quadraticCurveTo(-s*.36,-s*.65,0,-s);ctx.quadraticCurveTo(s*.36,-s*.65,0,-s*.18);}
    ctx.fill();
  } else if (p.kind === 'cloud') {
    ctx.scale(1.3,.75);ctx.moveTo(-s,0);ctx.bezierCurveTo(-s*1.4,-s*.7,-s*.3,-s*.9,-s*.25,-s*.4);
    ctx.bezierCurveTo(0,-s*1.4,s*1.1,-s*.8,s*.7,-s*.2);ctx.bezierCurveTo(s*1.5,-s*.4,s*1.5,s*.7,s*.7,s*.5);
    ctx.lineTo(-s,s*.5);ctx.quadraticCurveTo(-s*1.4,s*.35,-s,0);ctx.fill();
  } else if(p.kind === 'lantern') {
    ctx.rotate(Math.sin(phase*.2)*.16);ctx.ellipse(0,0,s*.65,s*.8,0,0,Math.PI*2);ctx.fill();
    ctx.fillRect(-s*.4,-s,s*.8,s*.17);ctx.fillRect(-s*.35,s*.83,s*.7,s*.15);
    ctx.strokeStyle=p.color;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(0,-s*1.4);ctx.moveTo(0,s);ctx.lineTo(0,s*1.5);ctx.stroke();
  } else if(p.kind === 'ginkgo') {
    ctx.scale(.55+.45*Math.abs(Math.cos(phase*.4)),1);ctx.moveTo(0,s*.7);ctx.lineTo(-s,-s*.3);
    ctx.quadraticCurveTo(-s*.6,-s*1.2,0,-s*.7);ctx.quadraticCurveTo(s*.6,-s*1.2,s,-s*.3);ctx.closePath();ctx.fill();
    ctx.strokeStyle=p.color;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,s*.5);ctx.lineTo(s*.2,s*1.2);ctx.stroke();
  } else {
    ctx.globalAlpha *= .4 + .6 * Math.pow(Math.sin(phase*.3),2);
    ctx.moveTo(0,-s*.55);ctx.lineTo(s*.25,0);ctx.lineTo(0,s*.55);ctx.lineTo(-s*.25,0);ctx.closePath();ctx.fill();
  }
}
