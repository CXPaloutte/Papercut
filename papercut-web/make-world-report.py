"""Assemble browser screenshots into review sheets; no artwork is modified."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

OUT=Path(__file__).resolve().parent/'qa-output/world-audit'
FONT='C:/Windows/Fonts/msyh.ttc'
PAPER='#f5f0e5'
RED='#a7332c'
names=[('fish','一 · 双鱼跃水'),('dragon','二 · 长龙盘旋'),('mu','三 · 穆桂英点将'),('scroll','四 · 长卷铺展')]

def label(canvas,text,xy,size=25,color=RED):
    ImageDraw.Draw(canvas).text(xy,text,font=ImageFont.truetype(FONT,size),fill=color)

def fit(canvas,file,box,crop=None,align_top=False):
    im=Image.open(OUT/file).convert('RGB')
    if crop:im=im.crop(crop)
    im=ImageOps.contain(im,(box[2]-box[0],box[3]-box[1]),Image.Resampling.LANCZOS)
    canvas.paste(im,(box[0]+(box[2]-box[0]-im.width)//2,box[1]+(0 if align_top else (box[3]-box[1]-im.height)//2)))

desktop=Image.new('RGB',(2100,1650),PAPER)
label(desktop,'剪映古今 · 四幕纸景 / 桌面', (35,22),32)
for i,(name,title) in enumerate(names):
    x=30+(i%2)*1040;y=87+(i//2)*775
    label(desktop,title,(x+5,y),25)
    fit(desktop,'desktop-'+name+'-complete.png',(x,y+42,x+1020,y+750))
desktop.save(OUT/'desktop-scenes.jpg',quality=94)

mobile=Image.new('RGB',(1700,1390),PAPER)
label(mobile,'剪映古今 · 竖向构图 / 手机', (28,20),30)
for i,(name,title) in enumerate(names):
    x=25+i*420
    label(mobile,title,(x,83),22)
    fit(mobile,'mobile-'+name+'-complete.png',(x,126,x+390,1375),align_top=True)
mobile.save(OUT/'mobile-scenes.jpg',quality=95)

phases=Image.new('RGB',(1860,2070),PAPER)
label(phases,'动作分阶段检查 · 开始 / 中途 / 完成', (30,20),30)
rows=[
    ('鱼跃 · 完整尾部、弧线抬升与回落','fish',[('start','起势'),('middle','跃起'),('end','缓冲完成')],None),
    ('荷花 · 花茎、花苞、开瓣、盛开','lotus',[('start','水面起生'),('middle','花苞升至茎顶'),('opening','花瓣沿根部展开'),('end','盛开')],(0,545,315,970)),
    ('盘龙 · 龙头先行、连续曲线向尾部传递','dragon',[('start','起势'),('middle','身体跟随'),('end','尾部收势')],(490,180,1395,850)),
    ('靠旗 · 腰位固定、错时抬升、停顿回落','flags',[('start','启动'),('middle','错时抬升'),('end','停顿后微落')],(550,200,1390,875))
]
for row,(title,kind,frames,crop) in enumerate(rows):
    y=85+row*490
    label(phases,title,(30,y),23)
    w=1800//len(frames)
    for i,(phase,caption) in enumerate(frames):
        x=30+i*w
        label(phases,caption,(x+10,y+42),19,'#725640')
        fit(phases,'desktop-'+kind+'-'+phase+'.png',(x+5,y+74,x+w-10,y+475),crop)
phases.save(OUT/'motion-phases.jpg',quality=96)
print('Created desktop-scenes.jpg, mobile-scenes.jpg, motion-phases.jpg')
