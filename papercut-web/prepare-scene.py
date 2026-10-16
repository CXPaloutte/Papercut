"""Extract original ink at native resolution; never modify resource originals.

Masks are in a 1760 x 1403 inspection coordinate system. They follow visible
fish / flower boundaries. At shared paper bridges the selection stops at the
fish contour. Internal flower-shaped apertures remain faithful to the source.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import json

ROOT = Path(__file__).resolve().parent
source = ROOT.parent / 'resource' / '鱼.jpg'
out = ROOT / 'dist' / 'assets' / 'scene'
out.mkdir(parents=True, exist_ok=True)
im = Image.open(str(source)).convert('RGB')
w, h = im.size
rgb = np.asarray(im).astype(np.float32)
# Red/white unmatting keeps antialiased holes without white fringes.
chroma = (rgb[:,:,0] - np.minimum(rgb[:,:,1],rgb[:,:,2])) / 245.0
alpha = np.clip((chroma-.045)/.35,0,1)
ink = np.zeros((h,w,4),dtype=np.uint8)
# Keep small variations in the photographed red paper, tuned to cinnabar.
tone = np.clip(rgb[:,:,0]/245,.78,1)
ink[:,:,0] = 185*tone
ink[:,:,1] = 37*tone
ink[:,:,2] = 35*tone
ink[:,:,3] = (alpha*255).astype(np.uint8)

left = [(620,325),(652,334),(675,356),(687,382),(699,403),(686,421),
 (704,441),(695,460),(678,473),(679,517),(668,553),(651,581),(643,609),
 (682,620),(729,630),(769,650),(755,677),(741,702),(713,719),(676,725),
 (642,754),(622,782),(635,803),(683,811),(736,835),(783,877),(808,925),
 (824,970),(839,1015),(850,1053),(855,1095),(866,1139),(856,1167),
 (836,1137),(820,1092),(799,1051),(779,1034),(748,1039),(708,1030),
 (663,1010),(627,991),(602,978),(573,951),(549,926),(526,902),
 (487,901),(451,897),(418,895),(385,879),(359,865),(345,837),(340,801),
 (335,756),(329,731),(310,715),(285,719),(295,696),(293,674),(270,664),
 (246,664),(216,659),(242,633),(273,612),(307,589),(337,578),(348,546),
 (362,508),(385,464),(416,423),(454,388),(502,359),(551,338),(590,328)]
right = [(1136,336),(1177,340),(1218,354),(1257,379),(1292,411),
 (1323,447),(1348,488),(1374,543),(1390,578),(1425,600),(1463,625),
 (1485,649),(1507,681),(1476,670),(1458,671),(1441,687),(1440,707),
 (1458,736),(1426,727),(1409,744),(1400,782),(1393,821),(1380,855),
 (1358,879),(1327,894),(1290,901),(1254,908),(1212,912),(1174,927),
 (1138,958),(1094,985),(1050,1003),(1015,1017),(980,1023),
 (947,1018),(925,1034),(914,1063),(904,1102),(890,1138),(875,1155),
 (873,1118),(881,1079),(893,1046),(906,1008),(921,969),(943,925),
 (967,886),(995,851),(1030,828),(1071,812),(1118,805),(1137,783),
 (1108,757),(1073,733),(1034,730),(1000,712),(972,684),(950,658),
 (979,640),(1014,632),(1055,619),(1084,605),(1088,584),(1075,558),
 (1066,526),(1064,489),(1055,468),(1042,455),(1054,433),
 (1049,416),(1068,403),(1066,386),(1081,374),(1090,353),(1114,340)]
flower = [(750,151),(801,139),(837,146),(868,155),(908,150),(953,159),
 (983,181),(998,218),(1020,239),(1000,274),(975,295),(937,300),
 (932,316),(979,331),(1012,367),(1028,404),(1033,437),(1049,471),
 (1041,519),(1023,556),(1000,584),(977,608),(946,622),(912,637),
 (868,648),(827,636),(790,617),(753,591),(727,563),(704,523),
 (699,479),(705,437),(718,399),(740,359),(773,334),(808,320),
 (808,298),(778,285),(755,267),(738,239),(738,198)]
floral_left = [(206,442),(246,422),(278,369),(312,374),(339,330),
 (332,270),(359,231),(402,214),(451,199),(485,211),(505,251),
 (522,273),(559,271),(586,303),(579,327),(541,343),(503,357),
 (458,384),(418,417),(387,453),(366,493),(346,543),(332,570),
 (309,577),(303,552),(275,555),(239,542),(218,516),(208,478)]

def extract(name, polygon):
    mask = Image.new('L',(w,h))
    ImageDraw.Draw(mask).polygon([(int(x*w/1760),int(y*h/1403)) for x,y in polygon],fill=255)
    rgba = ink.copy()
    rgba[:,:,3] = np.minimum(rgba[:,:,3], np.asarray(mask))
    result=Image.fromarray(rgba,'RGBA')
    box = result.getbbox()
    result=result.crop(box)
    result.save(str(out/(name+'.png')),optimize=True)
    result.save(str(out/(name+'.webp')),lossless=True,method=6)
    return {'file': name+'.webp', 'width':result.width, 'height':result.height,
            'sourceBounds':box, 'selection':polygon}

layers=[extract('fish-left',left),extract('fish-right',right),
        extract('flower',flower),extract('floral-left',floral_left),
        extract('floral-right',[(1760-x,y+15) for x,y in floral_left])]

def leap_pose(name, polygon, pivot, angle, mirrored=False):
    selection=Image.new('L',(w,h))
    ImageDraw.Draw(selection).polygon([(int(x*w/1760),int(y*h/1403)) for x,y in polygon],fill=255)
    rgba=ink.copy();rgba[:,:,3]=np.minimum(rgba[:,:,3],np.asarray(selection))
    tail_mask=Image.new('L',(w,h))
    boundary=[(400,930),(720,745),(980,1000),(920,1370),(400,1370)]
    if mirrored: boundary=[(1760-x,y+10) for x,y in boundary]
    ImageDraw.Draw(tail_mask).polygon([(int(x*w/1760),int(y*h/1403)) for x,y in boundary],fill=255)
    ta=np.asarray(tail_mask)
    tail=rgba.copy();tail[:,:,3]=np.minimum(rgba[:,:,3],ta)
    body=rgba.copy();body[:,:,3]=np.minimum(rgba[:,:,3],255-ta)
    tail_im=Image.fromarray(tail,'RGBA').rotate(angle,Image.BICUBIC,
        center=(pivot[0]*w/1760,pivot[1]*h/1403))
    tail_im.alpha_composite(Image.fromarray(body,'RGBA'))
    tail_im=tail_im.crop(tail_im.getbbox())
    tail_im.save(str(out/(name+'.webp')),lossless=True,method=4)
    bg=Image.new('RGBA',tail_im.size,'#f6f0e4');bg.alpha_composite(tail_im)
    bg.thumbnail((650,850));bg.convert('RGB').save(str(ROOT/'qa-output'/(name+'.jpg')))
    return {'file':name+'.webp','width':tail_im.width,'height':tail_im.height,
            'tailPivot':pivot,'tailRotation':angle,'note':'Original tail repositioned at shared floral bridge. Body and tail retain photographed apertures; no generated details.'}

layers += [leap_pose('fish-leap-left',left,(535,855),-110),
           leap_pose('fish-leap-right',right,(1225,865),110,True)]
(out/'layers.json').write_text(json.dumps({'source':'../works/fish.jpg','sourceSize':[w,h],
    'treatment':'Native-resolution chroma unmatting and hand-traced selection; cinnabar color grading. No generated fish details.','layers':layers},ensure_ascii=False,indent=2),encoding='utf-8')
# Small originals for the editorial sections; full files remain separate.
for source_name, target, size in [('龙飞大有年.webp','dragon-preview.webp',(780,1040)),
                                  ('穆桂英.png','mu-preview.webp',(660,550)),
                                  ('中华盛世.jpg','scroll-preview.webp',(600,1216))]:
    thumb=Image.open(str(ROOT.parent/'resource'/source_name)).convert('RGB')
    thumb.thumbnail(size,Image.LANCZOS)
    thumb.save(str(out/target),'WEBP',quality=90)
print(json.dumps(layers,ensure_ascii=True)[:500])
