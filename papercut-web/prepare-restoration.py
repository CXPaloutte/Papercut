# -*- coding: utf-8 -*-
"""Continuous fish remapping and a wholly redrawn, internally consistent dragon."""
from pathlib import Path
from PIL import Image
import math,json
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'dist/assets/scene'
meta=json.loads((OUT/'layers.json').read_text(encoding='utf-8'))
records=[]
for side,direction in [('left',-1),('right',1)]:
    record=next(x for x in meta['layers'] if x['file']=='fish-'+side+'.webp')
    im=Image.open(str(OUT/('fish-'+side+'.png'))).convert('RGBA')
    # A continuous inverse map bends the original intact selection. No cut,
    # detached tail, rotating joint, or white gap is introduced.
    x0,y0,x1,y1=record['sourceBounds']; scale=5653/1760
    margin=round(420*scale)
    canvas=Image.new('RGBA',(im.width+2*margin,im.height+24))
    canvas.paste(im,(margin,12))
    mesh=[]
    def displacement(y):
        source_y=(y-12+y0)/scale
        t=max(0,min(1,(source_y-720)/450))
        return direction*380*t*t*(3-2*t)*scale
    for yy in range(0,canvas.height,24):
        y2=min(yy+24,canvas.height);d1=displacement(yy);d2=displacement(y2)
        mesh.append(((0,yy,canvas.width,y2),(-d1,yy,-d2,y2,canvas.width-d2,y2,canvas.width-d1,yy)))
    fixed=canvas.transform(canvas.size,Image.MESH,mesh,Image.BICUBIC)
    fixed=fixed.crop(fixed.getbbox())
    fixed.save(str(OUT/('fish-whole-'+side+'.webp')),lossless=True,method=4)
    bg=Image.new('RGBA',fixed.size,'#f5f0e5');bg.alpha_composite(fixed);bg.thumbnail((650,850));bg.convert('RGB').save(str(ROOT/'qa-output'/('fish-restored-'+side+'.jpg')))
    records.append({'file':'fish-whole-'+side+'.webp','source':'fish-'+side+'.png','operation':'continuous smooth row remap; original connected selection never split','size':fixed.size})
(OUT/'restoration.json').write_text(json.dumps(records,indent=2),encoding='utf-8')

curves=[[(260,230),(420,110),(600,180),(570,360)],[(570,360),(550,510),(320,520),(365,710)],[(365,710),(420,930),(820,955),(980,770)],[(980,770),(1120,600),(900,490),(755,585)],[(755,585),(580,690),(660,835),(865,778)],[(865,778),(1045,720),(1090,540),(1135,460)]]
points=[]
for curve in curves:
    for k in range(36):
        t=k/36;u=1-t
        points.append([sum([u*u*u,3*u*u*t,3*u*t*t,t*t*t][j]*curve[j][axis] for j in range(4)) for axis in range(2)])
points.append(curves[-1][-1])
def shape(pts):
    edges=[[],[]]
    for i,(x,y) in enumerate(pts):
        a=pts[max(0,i-1)];b=pts[min(len(pts)-1,i+1)];dx=b[0]-a[0];dy=b[1]-a[1];l=math.hypot(dx,dy);nx=-dy/l;ny=dx/l
        t=min(1,i/32);half=44*t*t*(3-2*t)+9*i/(len(pts)-1)
        for n,sgn in enumerate([1,-1]):edges[n].append((x+sgn*nx*half,y+sgn*ny*half))
    return 'M'+'L'.join('%.2f %.2f'%p for p in edges[0]+list(reversed(edges[1])))+'Z'
scales=[]
for i in range(12,len(points)-3,2):
    x,y=points[i];dx=points[i+1][0]-points[i-1][0];dy=points[i+1][1]-points[i-1][1];angle=math.degrees(math.atan2(dy,dx))
    t=min(1,i/32);half=44*t*t*(3-2*t)+9*i/(len(points)-1)
    for offset in [-half*.79,-half*.53,-half*.265,0,half*.265,half*.53,half*.79]:
        scales.append('<g class="dragon-scale" data-index="%d" data-offset="%.3f" transform="translate(%.2f %.2f) rotate(%.2f)"><path d="M-4 %.2fQ5 %.2f-4 %.2f" fill="none" stroke="#f4e4bd" stroke-width="1.7" stroke-linecap="round"/></g>'%(i,offset,x,y,angle,offset-4.2,offset,offset+4.2))
fins=[]
for i in range(16,len(points)-8,5):
    x,y=points[i];a=points[i-1];b=points[i+1];angle=math.degrees(math.atan2(b[1]-a[1],b[0]-a[0]))
    fins.append('<g class="dragon-fin" data-index="%d" transform="translate(%.2f %.2f) rotate(%.2f)"><path d="M-13-39Q-20-60-8-74Q-5-53 7-51L12-39Z" fill="#315647"/><path d="M-6-44L-9-63" stroke="#f6e7c8" stroke-width="1.5"/></g>'%(i,x,y,angle))
head='''<g class="dragon-head-whole" transform="translate(1135 460) rotate(-22)">
<path d="M-67 61C-128 53-159 8-138-39C-169-28-180-50-172-73C-139-51-115-61-104-90C-121-113-122-145-95-160C-98-130-73-124-68-98C-39-105-11-91 0-74C41-86 89-65 101-43C140-48 170-31 171-8C161 9 137 14 116 9L173 37C185 54 167 79 145 77L91 67C61 95 20 104-15 83Z" fill="#b63128" stroke="#8e3026" stroke-width="2"/>
<path d="M-79-73C-126-115-163-92-192-124C-184-81-147-61-108-50C-155-62-181-25-206-37C-184-5-142 6-104-16C-141 11-140 43-174 49C-129 67-102 43-78 22C-100 66-75 85-109 107C-67 102-43 78-34 54Z" fill="#315647"/>
<g stroke="#f5e5c6" stroke-width="2" fill="none"><path d="M-85-61Q-127-91-173-107M-89-45Q-136-52-176-34M-85-23Q-132-10-151 29M-64 13Q-81 60-92 75"/></g>
<path d="M-43-71Q-70-118-57-149L-37-108-20-149-23-105-1-125-14-75" fill="#b63128"/><path d="M-46-82L-46-119M-36-96L-25-126" stroke="#f5e5c6" stroke-width="2"/>
<path d="M-13-44Q16-72 45-43Q22-20-13-44Z" fill="#f5e5c6"/><path d="M12-44Q22-60 29-42Q22-29 12-44Z" fill="#315647"/>
<path d="M-21-56Q14-85 49-52M49-28Q82-3 113-17M53 5Q71 30 109 27M12 24Q-2 50 20 60" fill="none" stroke="#f5e5c6" stroke-width="4" stroke-linecap="round"/>
<path d="M98 35Q133 33 161 49Q133 69 99 50L69 50" fill="#f5e5c6"/><path d="M105 36L110 47 118 37 124 50 132 40 139 52 147 45" stroke="#b63128" stroke-width="2" fill="none"/>
<path d="M136-8Q144-25 151-9Q145 0 136-8Z" fill="#f5e5c6"/>
<g class="dragon-whiskers" fill="none" stroke="#b63128" stroke-width="4" stroke-linecap="round"><path d="M145 1C202-30 204-101 260-102C277-102 277-83 264-80M131 61C202 110 244 94 256 49C261 24 278 35 272 51"/></g>
<g fill="none" stroke="#b68a45" stroke-width="2"><path d="M-45 60Q-18 48 2 73M-56 53Q-30 35-12 59"/></g></g>'''
# Fine carved mane lines echo the density of the source's green beard.
head=head.replace('<g fill="none" stroke="#b68a45"', ''.join('<path d="M-75 %.1fQ-125 %.1f-171 %.1f" fill="none" stroke="#f5e5c6" stroke-width="1.35"/>'%(y,y-8,y-25) for y in range(-46,25,6))+'<g fill="none" stroke="#b68a45"')
head=head.replace('<path d="M-13-44', '<g fill="none" stroke="#f5e5c6" stroke-width="1.7"><path d="M-52-19Q-40-35-24-22M-55-6Q-40-22-24-9M-49 8Q-34-8-18 5M-40 20Q-25 4-10 17M19-1Q26 7 34-1M26 11Q33 19 41 11"/></g><path d="M-13-44')
limbs=[]
for i,side in [(74,1),(100,-1),(172,-1),(201,1)]:
    x,y=points[i];a=points[i-1];b=points[i+1];angle=math.degrees(math.atan2(b[1]-a[1],b[0]-a[0]))
    limbs.append('<g class="dragon-limb" data-index="%d" transform="translate(%.2f %.2f) rotate(%.2f)"><g transform="scale(1 %d)"><path d="M-15 27C-35 74-13 108 39 111L85 124 59 102 99 91 57 91 81 65 41 88C11 91 5 70 13 42Z" fill="#b63128" stroke="#f5e5c6" stroke-width="2.5"/><path d="M-4 46Q-17 82 32 100" fill="none" stroke="#b68a45" stroke-width="2"/></g></g>'%(i,x,y,angle,side))
dragon='<svg xmlns="http://www.w3.org/2000/svg" class="restored-dragon" viewBox="0 0 1600 1100" role="img" aria-label="以龙飞大有年剪纸语言重新绘制的完整盘龙，红首红身，细密月牙鳞纹，绿鬃、四肢和长须连接自然"><g class="dragon-rig">'+''.join(fins)+'<path class="dragon-silhouette" d="'+shape(points)+'" fill="#b63128" stroke="#9d392b" stroke-width="1.5"/>'+''.join(scales)+''.join(limbs)+head+'</g></svg>'
(OUT/'dragon-complete.svg').write_text(dragon,encoding='utf-8')
(OUT/'dragon-rig.json').write_text(json.dumps({'points':points,'note':'Wholly redrawn vector dragon; no photographic head pasted onto a separate body.'}),encoding='utf-8')
print('Prepared 2 uncut fish and a complete 216-station vector dragon')
