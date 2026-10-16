"""Source-derived animation pieces. Originals remain independent and untouched."""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import json

ROOT=Path(__file__).resolve().parent
OUT=ROOT/'dist/assets/scene'
records=[]

def polygon_mask(size,points,reference):
    mask=Image.new('L',size)
    ImageDraw.Draw(mask).polygon([(round(x*size[0]/reference[0]),round(y*size[1]/reference[1])) for x,y in points],fill=255)
    return np.array(mask)

def red_ink(name,threshold=12):
    im=Image.open(str(ROOT.parent/'resource'/name)).convert('RGB')
    a=np.array(im).astype(np.float32)
    alpha=np.clip((a[:,:,0]-np.minimum(a[:,:,1],a[:,:,2])-threshold)/82,0,1)
    tone=np.clip(a[:,:,0]/240,.82,1)
    out=np.zeros((im.height,im.width,4),dtype=np.uint8)
    for i,c in enumerate([184,37,35]):out[:,:,i]=(c*tone).astype(np.uint8)
    out[:,:,3]=(alpha*255).astype(np.uint8)
    return im,out

def save_piece(name,rgba,source,points=None,reference=None,crop=True):
    im=Image.fromarray(rgba,'RGBA');box=im.getbbox()
    if crop:im=im.crop(box)
    im.save(str(OUT/(name+'.webp')),lossless=True,method=4)
    records.append({'file':name+'.webp','source':source,'dimensions':im.size,'sourceBounds':box,'selection':points,'reference':reference})
    bg=Image.new('RGBA',im.size,'#f5f0e5');bg.alpha_composite(im);bg.thumbnail((700,900))
    bg.convert('RGB').save(str(ROOT/'qa-output'/(name+'-review.jpg')))

fish,ink=red_ink('鱼.jpg')
lotus=[(328,276),(340,252),(362,230),(401,209),(433,212),(472,199),(488,224),(492,246),(508,280),(508,315),(489,351),(461,376),(418,397),(372,392),(346,371),(348,345),(338,318)]
water=[(195,863),(215,818),(239,819),(254,833),(271,838),(283,822),(310,822),(334,837),(341,865),(323,900),(309,922),(327,944),(355,963),(382,959),(412,968),(445,978),(483,1004),(509,1033),(548,1045),(583,1037),(617,1044),(644,1069),(664,1095),(691,1103),(726,1113),(744,1139),(723,1160),(687,1158),(647,1154),(608,1151),(575,1124),(558,1112),(519,1115),(471,1100),(429,1088),(398,1072),(365,1071),(340,1087),(303,1091),(279,1066),(272,1039),(285,1011),(265,980),(246,963),(229,945),(205,925),(199,898)]
for name,poly in [('lotus-left',lotus),('lotus-right',[(1760-x,y+26) for x,y in lotus]),('source-wave-left',water),('source-wave-right',[(1760-x,y+15) for x,y in water])]:
    a=ink.copy();a[:,:,3]=np.minimum(a[:,:,3],polygon_mask(fish.size,poly,(1760,1403)))
    save_piece(name,a,'鱼.jpg',poly,(1760,1403))

dragon=Image.open(str(ROOT.parent/'resource/龙飞大有年.webp')).convert('RGB')
rgb=np.array(dragon).astype(np.float32)
rgba=np.zeros((dragon.height,dragon.width,4),dtype=np.uint8)
rgba[:,:,:3]=rgb.astype(np.uint8)
rgba[:,:,3]=(np.clip((255-np.min(rgb,axis=2)-18)/95,0,1)*255).astype(np.uint8)
body=[(400,180),(400,242),(375,277),(354,321),(345,365),(370,394),(401,390),(417,352),(430,310),(468,286),(500,285),(535,299),(563,329),(572,362),(593,391),(613,430),(596,471),(617,518),(641,553),(674,582),(704,569),(704,519),(740,498),(766,528),(768,579),(751,623),(718,652),(669,667),(613,669),(577,666),(573,696),(611,727),(640,754),(628,775),(643,799),(656,800),(677,789),(682,825),(671,852),(662,877),(651,907),(618,935),(568,945),(525,930),(488,915),(461,906),(420,917),(372,906),(327,883),(291,873),(259,847),(242,813),(222,782),(207,746),(185,708),(170,669),(166,628),(177,586),(193,551),(226,524),(265,503),(296,484),(321,466),(319,449),(289,430),(271,413),(271,373),(278,333),(298,298),(321,274),(349,250),(375,209)]
grapes=[(405,451),(472,452),(540,477),(588,504),(619,544),(603,578),(580,608),(552,615),(525,598),(490,564),(441,555),(407,530),(380,496)]
mask=polygon_mask(dragon.size,body,(900,1200))
mask=np.minimum(mask,255-polygon_mask(dragon.size,grapes,(900,1200)))
rgba[:,:,3]=np.minimum(rgba[:,:,3],mask)
head=[(292,712),(335,716),(373,737),(420,736),(461,723),(506,734),(548,747),(576,779),(609,796),(646,797),(675,784),(688,821),(677,853),(669,884),(647,913),(614,935),(568,946),(521,928),(484,916),(448,902),(409,917),(367,900),(329,875),(314,845),(296,813)]
hm=polygon_mask(dragon.size,head,(900,1200))
head_rgba=rgba.copy();head_rgba[:,:,3]=np.minimum(rgba[:,:,3],hm)
body_rgba=rgba.copy();body_rgba[:,:,3]=np.minimum(rgba[:,:,3],255-hm)
save_piece('dragon-flight-body',body_rgba,'龙飞大有年.webp',body,(900,1200),False)
save_piece('dragon-flight-head',head_rgba,'龙飞大有年.webp',head,(900,1200),False)

mu,red=red_ink('穆桂英.png',55)
figure=[(40,0),(856,0),(861,285),(811,374),(810,600),(850,890),(37,890),(80,600),(80,374),(34,282)]
red[:,:,3]=np.minimum(red[:,:,3],polygon_mask(mu.size,figure,mu.size))
eyes=[[(343,423),(368,431),(390,445),(410,467),(420,484),(395,478),(373,466),(351,450)],[(554,423),(527,431),(506,445),(487,467),(476,484),(501,478),(525,466),(548,450)]]
for i,poly in enumerate(eyes):
    mask=polygon_mask(mu.size,poly,mu.size)
    eye=red.copy();eye[:,:,3]=np.minimum(red[:,:,3],mask)
    save_piece('mu-eye-'+str(i+1),eye,'穆桂英.png',poly,mu.size,False)
    red[:,:,3]=np.minimum(red[:,:,3],255-mask)
save_piece('mu-character',red,'穆桂英.png',figure,mu.size,False)
(OUT/'animation-layers.json').write_text(json.dumps({'layers':records,'notes':[
    'Fish water curls and lotus are sampled from the original photographed red paper.',
    'Dragon pieces retain source occlusion; the stationary full original remains a backdrop and is separately viewable.',
    'Mu character and eyes are source selections. Four theatrical command flags are newly drawn SVG additions, not attributed to the original artwork.'
]},ensure_ascii=False,indent=2),encoding='utf-8')
print('Prepared',len(records),'source-derived animation pieces')
