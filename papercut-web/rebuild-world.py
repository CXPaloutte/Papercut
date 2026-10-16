# -*- coding: utf-8 -*-
from pathlib import Path
import re
R=Path(__file__).resolve().parent
p=R/'dist/index.html';s=p.read_text(encoding='utf-8')
if 'world.css' in s:raise SystemExit('World already installed; edit index.html directly.')
(R/'qa-output/before-world.html').write_text(s,encoding='utf-8')
s=s.replace('living-paper.css','world.css').replace('living-paper.js','world.js')
s=s.replace('fish-leap-left.webp','fish-whole-left.webp').replace('fish-leap-right.webp','fish-whole-right.webp')
s=s.replace('x="185" y="365" width="560" height="680" transform="rotate(-10 465 705)"','x="225" y="330" width="455" height="600" transform="rotate(-5 450 630)"')
s=s.replace('x="865" y="425" width="540" height="655" transform="rotate(10 1135 750)"','x="920" y="380" width="425" height="565" transform="rotate(5 1130 660)"')
# Keep complete fish on top of foreground water, not hidden by it.
fish=re.findall(r' <g class="fish-placement[^\n]+',s)
for f in fish:s=s.replace(f+'\n','')
s=s.replace(' </svg></div>','\n'.join(fish)+'\n </svg></div>',1)
petal='''<path d="M0 0C-14-46-57-96 0-162C57-96 14-46 0 0Z M-4-29Q-22-76-4-118Q-9-72-4-29Z M8-32Q27-73 10-111Q18-68 8-32Z" fill-rule="evenodd"/>'''
lotus=''
for side in ['left','right']:
    petals=''.join('<g class="grown-petal" data-angle="%s" transform="rotate(%s)">%s</g>'%(a,a,petal) for a in [-66,-44,-22,0,22,44,66])
    lotus+=''' <g class="lotus-placement lotus-placement-%s"><g class="lotus-motion paper-interactive" role="button" tabindex="0" data-hero-play="lotus" aria-label="重播荷花从水中生长、花苞升起和逐瓣绽放"><path class="growing-stem" d="M0 0C45-84-20-161 0-235" fill="none" stroke="#a82f29" stroke-width="5"/><path d="M0-34Q-88-74-85-22Q-42 1 0-34Z M-10-32Q-52-49-69-29" fill="#ba493a" fill-rule="evenodd"/><g class="lotus-tip" transform="translate(0 -235)" fill="#b62d28">%s<path class="flower-cup" d="M-22-6Q0 16 22-6Q9 20 0 20Q-9 20-22-6Z"/></g></g></g>
'''%(side,petals)
start=s.index(' <g class="lotus-placement');end=s.index(' <g class="source-water-placement',start)
# The source-water blocks follow the original fish groups, now moved above.
s=s[:start]+lotus+s[end:]

cloud='''<svg class="world-clouds" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="currentColor"><path d="M-200 260C0 80 180 400 380 230S760 120 950 265S1350 420 1800 200M-200 285C0 105 180 425 380 255S760 145 950 290S1350 445 1800 225"/><path d="M-140 820C100 630 300 960 530 795S930 680 1130 820S1470 930 1800 760M-140 840C100 650 300 980 530 815S930 700 1130 840S1470 950 1800 780"/></g></svg>'''
dragon=(R/'dist/assets/scene/dragon-complete.svg').read_text(encoding='utf-8')
dragon=dragon.replace('<svg xmlns=', '<svg data-dragon-vector xmlns=',1)
dragon_story=s[s.index('<div class="dragon-story">'):s.index(' <div class="story-row">')]
# remove two trailing wrappers from the previous feature container
dragon_story=dragon_story.rsplit('</div>',2)[0]+'</div>'
dragon_story=dragon_story.replace('<h3>龙飞大有年</h3>','<h2 id="heritage-title">龙行纸上，<br>云起丰年。</h2>')
dragon_story=dragon_story.replace('龙身盘曲，谷穗丰盈。红、金、绿与紫在纸间交织，细密的刻纹让一幅丰年图景有了呼吸。','循一身月牙鳞纹，看一条长龙盘旋。龙首引路，身随云起，尾留余韵。')
dragon_world='''<section class="world-scene dragon-world" id="heritage" data-paper-scene="dragon" aria-labelledby="heritage-title">%s<span class="scene-number">第二幕 / 龙腾云海</span><div class="dragon-story-wrap">%s</div><button class="dragon-launch world-art" data-scene-play="dragon" aria-label="唤长龙腾飞">%s</button><div class="world-controls"><button data-scene-play="dragon" class="scene-play-button">唤龙腾飞 ↗</button><label for="dragon-height">云间高度 <input id="dragon-height" type="range" min="0" max="100" value="35"><output id="dragon-height-value">35%%</output></label><button class="text-link" data-open-work="dragon">细观《龙飞大有年》 ＋</button><small>参考原作色彩与细纹，完整龙形重新绘制</small></div><span class="world-poem" aria-hidden="true">身随云起　尾留余韵</span></section>'''%(cloud,dragon_story,dragon)

# Retain source-selected portrait and original eye layers; they stay stable.
portrait=s[s.index(' <g class="mu-portrait"'):s.index('\n <path d="M200 1060')]
flags=''
for index,(x,y,sign,outer) in enumerate([(650,1000,-1,True),(780,1000,1,True),(680,980,-1,False),(750,980,1,False)]):
    angle=sign*(26 if outer else 10)
    flags+='''<g class="flag-anchor" transform="translate(%s %s)"><g class="command-flag" data-sign="%s" data-outer="%s" data-order="%s" transform="rotate(%s)"><path class="flag-pole" d="M0 0L0-690" fill="none" stroke="#9e322c" stroke-width="5"/><g transform="scale(%s 1)" fill="#b9352e"><path class="flag-cloth" d="M0-680Q145-656 280-565Q164-469 0-382Z"/><path class="flag-border" d="M12-659Q144-635 250-565Q142-485 12-402Z" fill="none" stroke="#f4e4c9" stroke-width="4"/><g class="flag-pattern"><path d="M60-558C7-627 115-644 110-581C162-630 188-525 126-533C176-482 67-459 74-521C20-471 4-574 60-558Z" fill="none" stroke="#f4e4c9" stroke-width="3"/><circle cx="92" cy="-550" r="12" fill="#f4e4c9"/></g><path class="flag-tail" d="M253-573Q286-557 304-582M248-554Q280-535 297-557" fill="none" stroke="#b9352e" stroke-width="4"/></g></g></g>'''%(x,y,sign,str(outer).lower(),index,angle,sign)
mu_world='''<section class="world-scene mu-world" id="mu-scene" data-paper-scene="mu" aria-labelledby="mu-title">%s<span class="scene-number">第三幕 / 纸上点将</span><div class="world-copy"><p class="eyebrow">人物故事 · 以线写神</p><h2 id="mu-title">一剪英姿，<br>满纸风骨。</h2><p>冠饰繁，眉眼静。<br>四面靠旗系于背后，<br>起落有度，衬一身英武。</p><button data-open-work="mu" class="text-link">走近纸上穆桂英 ↗</button><small>人物取自项目参考截图；靠旗按戏曲结构补绘。<br>原图、标识及字幕保留于原作查看。</small></div><button class="mu-launch world-art" data-scene-play="mu" aria-label="点将，让背后靠旗错落抬升"><svg viewBox="0 0 1400 1200" role="img" aria-label="穆桂英人物稳定居中，四面三角靠旗从背后腰位固定，旗面随自由边缘轻动"><g class="mu-flags">%s<path d="M646 996Q715 1020 785 996" fill="none" stroke="#992e28" stroke-width="9"/></g>%s</svg></button><div class="world-controls"><button data-scene-play="mu" class="scene-play-button">点将 · 起靠旗 ↗</button><button id="mu-blink" class="text-link">眨一下眼</button><label for="flag-height">起旗分寸 <input id="flag-height" type="range" min="0" max="100" value="70"><output id="flag-height-value">70%%</output></label><small>背靠系旗 · 杆定、面动、尾随</small></div><span class="world-poem" aria-hidden="true">旗随势起　面容自若</span></section>'''%(cloud,flags,portrait)
start=s.index('<section class="heritage ');end=s.index('<section class="patterns"',start)
s=s[:start]+dragon_world+mu_world+'\n'+s[end:]
start=s.index('<section class="long-scroll ');end=s.index('<section class="create-section"',start)
scroll='''<section class="world-scene scroll-world long-scroll" id="scroll-scene" aria-labelledby="scroll-title">%s<span class="scene-number">第四幕 / 长卷铺展</span><div class="world-copy scroll-intro"><p class="eyebrow">纸上长卷 / 中华盛世</p><h2 id="scroll-title">把万象，<br>收入一纸。</h2><p>从飞鸟到盘龙，从花卉到楼阁。<br>随滚动徐徐展开，<br>一纸之间，阅尽山河。</p><button class="text-link" data-open-work="flourishing">展开完整原作 ↗</button><small>题名据画面 · 作者、地域待核</small></div><div class="scroll-landscape" aria-hidden="true"><span>山河</span></div><button class="scroll-art world-art" data-open-work="flourishing" aria-label="查看中华盛世完整原作"><img src="assets/scene/flourishing-cut.webp" width="790" height="1600" alt="中华盛世完整纵向剪纸，盘龙、飞鸟、花卉与楼阁" loading="lazy"></button><div class="world-controls scroll-controller"><button class="text-link" id="scroll-replay">徐徐展卷 ↧</button><label for="scroll-unroll">展卷 <input id="scroll-unroll" type="range" min="15" max="100" value="100"><output id="scroll-unroll-value">100%%</output></label></div><span class="world-poem" aria-hidden="true">方寸有天地　纸间见山河</span></section>'''%cloud
s=s[:start]+scroll+s[end:]
s=s.replace('<nav aria-label="主导航">','<nav aria-label="主导航">',1)
s=s.replace('<p id="paper-interaction-status"','<nav class="scene-index" aria-label="纸境章节"><a href="#home" aria-label="第一幕双鱼跃水">一</a><a href="#heritage" aria-label="第二幕长龙盘旋">二</a><a href="#mu-scene" aria-label="第三幕穆桂英点将">三</a><a href="#scroll-scene" aria-label="第四幕长卷铺展">四</a></nav><p id="paper-interaction-status"')
p.write_text(s,encoding='utf-8')
# Transparent artwork keeps the original long-scroll ratio without a UI mat.
import numpy as np
from PIL import Image
im=Image.open(str(R.parent/'resource/中华盛世.jpg')).convert('RGB');a=np.array(im).astype(np.float32)
alpha=np.clip((a[:,:,0]-np.minimum(a[:,:,1],a[:,:,2])-28)/85,0,1)
rgba=np.zeros((im.height,im.width,4),dtype=np.uint8);rgba[:,:,:3]=[170,44,37];rgba[:,:,3]=(alpha*255).astype(np.uint8)
Image.fromarray(rgba,'RGBA').save(str(R/'dist/assets/scene/flourishing-cut.webp'),lossless=True,method=4)
print('Rebuilt three full-viewport scenes; retained original viewer and workshop links')
