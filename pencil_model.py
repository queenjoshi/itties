#!/usr/bin/env python3
"""Generate an editable, layered Itty pencil character GLB using only Python stdlib."""
import json, math, struct, os, sys
from pathlib import Path

THEME=(sys.argv[1].lower() if len(sys.argv)>1 else os.environ.get('ITTY_THEME','sky')).lower()
OUT=Path(__file__).with_name(f'itty-{THEME}.glb' if THEME in {'sky','bloom','noir'} else 'itty-sky.glb')
buf=bytearray(); views=[]; accessors=[]; meshes=[]; nodes=[]; materials=[]
def align(n=4):
    while len(buf)%n: buf.append(0)
def material(name,color,metal=0,rough=.4):
    materials.append({'name':name,'pbrMetallicRoughness':{'baseColorFactor':color,'metallicFactor':metal,'roughnessFactor':rough},'extensions':{'KHR_materials_specular':{'specularFactor':.42,'specularColorFactor':[1,1,1]}}}); return len(materials)-1
lacquer=material('Lacquer · midnight teal',[.07,.24,.22,1],.12,.25)
if THEME=='sky': materials[-1]['pbrMetallicRoughness']['baseColorFactor']=[.02,.55,.69,1]
elif THEME=='bloom': materials[-1]['pbrMetallicRoughness']['baseColorFactor']=[.82,.13,.16,1]
elif THEME=='noir': materials[-1]['pbrMetallicRoughness']['baseColorFactor']=[.78,.68,.51,1]
ivory=material('Enamel · warm ivory',[.93,.82,.57,1],.05,.32)
pink=material('Eraser · coral pink',[.91,.34,.39,1],0,.28)
gold=material('Ferrule · polished champagne',[.74,.61,.37,1],.82,.23)
cedar=material('Wood · sharpened cedar',[.79,.56,.29,1],0,.55)
graphite=material('Graphite · dark lead',[.045,.06,.07,1],.15,.33)
skin=material('Arms and hands · warm peach',[.88,.53,.30,1],0,.4)
white=material('Eyes · porcelain white',[.97,.93,.81,1],.02,.2)
iris=material('Eyes · hazel iris',[.28,.15,.08,1],.1,.2)
pupil=material('Eyes · pupil',[.012,.02,.023,1],.04,.16)
red=material('Mouth · glossy cherry',[.8,.025,.05,1],.08,.19)
dark=material('Mouth · inset',[.11,.008,.019,1],.04,.25)
shine=material('Catchlight',[1,.98,.9,1],.02,.12)
black=material('Sunglasses · glossy charcoal',[.025,.04,.045,1],.32,.16)
blue=material('Cyber parts · electric cyan',[.13,.74,.83,1],.32,.2)
fabric=material('Jacket · forest twill',[.16,.3,.22,1],.04,.6)
denim=material('Vest · indigo denim',[.22,.36,.47,1],.03,.62)
quilt=material('Puffer · slate blue',[.31,.43,.49,1],.04,.52)
grill=material('Grill · warm gold',[.92,.67,.2,1],.8,.19)
gum=material('Bubble gum · pink',[.96,.3,.52,1],.08,.18)
rose=material('Cheeks · soft rose',[.9,.28,.32,1],.02,.4)

def addmesh(name,verts,faces,mat,smooth=True):
    # Give every editable mesh a dedicated material slot so the browser layer
    # outliner can reveal/hide that exact GLB layer without affecting siblings.
    source=materials[mat]; layer_mat=json.loads(json.dumps(source)); layer_mat['name']='Layer · '+name
    is_trait=not name.startswith(tuple(f'{i:02d} ' for i in range(1,11)))
    if THEME=='sky' and name.startswith('02 Pattern · flower'): is_trait=True
    if THEME=='noir' and name.startswith('11 Trait · designer shade'): is_trait=False
    if THEME=='bloom' and name.startswith('30 Trait · soft cap'): is_trait=False
    if THEME=='sky' and name.startswith('30 Trait · pinstripe'): is_trait=False
    if is_trait:
        layer_mat['alphaMode']='BLEND';layer_mat['pbrMetallicRoughness']['baseColorFactor'][3]=0
    mat=len(materials);materials.append(layer_mat)
    pos=[q for v in verts for q in v]; idx=[q for f in faces for q in f]
    align(); off=len(buf); buf.extend(struct.pack('<%sf'%len(pos),*pos)); vi=len(views); views.append({'buffer':0,'byteOffset':off,'byteLength':len(buf)-off,'target':34962})
    ai=len(accessors); accessors.append({'bufferView':vi,'componentType':5126,'count':len(verts),'type':'VEC3','min':[min(v[k] for v in verts) for k in range(3)],'max':[max(v[k] for v in verts) for k in range(3)]})
    align(2); off=len(buf); buf.extend(struct.pack('<%sH'%len(idx),*idx)); vi=len(views); views.append({'buffer':0,'byteOffset':off,'byteLength':len(buf)-off,'target':34963})
    ii=len(accessors); accessors.append({'bufferView':vi,'componentType':5123,'count':len(idx),'type':'SCALAR','min':[min(idx)],'max':[max(idx)]})
    # Smooth vertex normals are generated from the final triangle topology.
    norms=[[0.0,0.0,0.0] for _ in verts]
    for f in faces:
        a,b,c=[verts[k] for k in f];u=[b[i]-a[i] for i in range(3)];v=[c[i]-a[i] for i in range(3)]
        n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
        for k in f:
            for j in range(3):norms[k][j]+=n[j]
    norms=[[q/(math.sqrt(sum(z*z for z in n)) or 1) for q in n] for n in norms]
    align();off=len(buf);buf.extend(struct.pack('<%sf'%(3*len(norms)),*(q for n in norms for q in n)));ni=len(views);views.append({'buffer':0,'byteOffset':off,'byteLength':len(buf)-off,'target':34962})
    nai=len(accessors);accessors.append({'bufferView':ni,'componentType':5126,'count':len(norms),'type':'VEC3'})
    mi=len(meshes);meshes.append({'name':name,'primitives':[{'attributes':{'POSITION':ai,'NORMAL':nai},'indices':ii,'material':mat}]}); nodes.append({'name':name,'mesh':mi})
def lathe(name,profile,mat,segs=40):
    vs=[];fs=[]
    # Catmull-Rom sampling rounds transitions without changing the editable layer.
    prof=[]
    for k in range(len(profile)-1):
        p0=profile[max(0,k-1)];p1=profile[k];p2=profile[k+1];p3=profile[min(len(profile)-1,k+2)]
        for j in range(5):
            t=j/5
            prof.append(tuple(.5*((2*p1[d])+(-p0[d]+p2[d])*t+(2*p0[d]-5*p1[d]+4*p2[d]-p3[d])*t*t+(-p0[d]+3*p1[d]-3*p2[d]+p3[d])*t*t*t) for d in range(2)))
    prof.append(profile[-1])
    for y,r in prof:
        for i in range(segs):
            a=2*math.pi*i/segs;vs.append([r*math.cos(a),y,r*math.sin(a)])
    for j in range(len(prof)-1):
        for i in range(segs):
            a=j*segs+i;b=j*segs+(i+1)%segs;fs.extend([[a,b,b+segs],[a,b+segs,a+segs]])
    # close both ends with triangle fans for watertight rounded surfaces
    vs.extend([[0,prof[0][0],0],[0,prof[-1][0],0]])
    lo=len(vs)-2;hi=len(vs)-1
    for i in range(segs):fs.extend([[lo,(i+1)%segs,i],[hi,(len(prof)-1)*segs+i,(len(prof)-1)*segs+(i+1)%segs]])
    addmesh(name,vs,fs,mat)
def ball(name,c,r,mat,segs=32,rings=20):
    x,y,z=c;vs=[];fs=[]
    for j in range(rings+1):
        p=math.pi*j/rings
        for i in range(segs):
            a=2*math.pi*i/segs;vs.append([x+r[0]*math.sin(p)*math.cos(a),y+r[1]*math.cos(p),z+r[2]*math.sin(p)*math.sin(a)])
    for j in range(rings):
        for i in range(segs):
            a=j*segs+i;b=j*segs+(i+1)%segs;fs.extend([[a,a+segs,b],[b,a+segs,b+segs]])
    addmesh(name,vs,fs,mat)
def tube(name,pts,r,mat,sides=16):
    vs=[];fs=[]
    for j,p in enumerate(pts):
        a0=pts[max(j-1,0)];a1=pts[min(j+1,len(pts)-1)];dx=a1[0]-a0[0];dy=a1[1]-a0[1];d=math.hypot(dx,dy) or 1;nx=-dy/d;ny=dx/d
        for i in range(sides):
            a=2*math.pi*i/sides;vs.append([p[0]+r*nx*math.cos(a),p[1]+r*ny*math.cos(a),r*math.sin(a)])
    for j in range(len(pts)-1):
        for i in range(sides):
            a=j*sides+i;b=j*sides+(i+1)%sides;fs.extend([[a,b,b+sides],[a,b+sides,a+sides]])
    # Round tube ends for smooth finger and arm silhouettes.
    for end,reverse in [(0,True),(len(pts)-1,False)]:
        center=len(vs);vs.append([pts[end][0],pts[end][1],0])
        base=end*sides
        for i in range(sides):fs.append([center,base+(i+1)%sides,base+i] if reverse else [center,base+i,base+(i+1)%sides])
    addmesh(name,vs,fs,mat)

# Upright Y-axis pencil; separate named meshes remain individually selectable.
lathe('01 Body · lacquered barrel',[(.57,.43),(.61,.48),(.68,.49),(3.53,.49),(3.62,.45),(3.65,.4)],lacquer,48)
# Raised flower motifs form a light, editable decorative pattern layer.
for k,(x,y) in enumerate([(-.23,.93),(.18,1.19),(-.16,1.48),(.22,1.78),(-.22,2.08),(.2,2.38),(-.17,2.68),(.22,2.98),(-.21,3.26)]):
    ball(f'02 Pattern · flower {k+1} center',(x,y,.465),(.034,.034,.023),gold,10,6)
    for j in range(4):
        a=j*math.pi/2;ball(f'02 Pattern · flower {k+1} petal {j+1}',(x+.068*math.cos(a),y+.068*math.sin(a),.46),(.037,.05,.018),ivory,10,6)
lathe('03 Eraser · rounded coral cap',[(3.98,.4),(4.03,.43),(4.12,.43),(4.34,.41),(4.46,.35),(4.52,.23),(4.53,.02)],pink,40)
lathe('04 Ferrule · sleeve',[(3.54,.5),(3.58,.515),(3.96,.515),(4,.49)],gold,48)
for j in range(8): lathe(f'04 Ferrule · thread {j+1}',[(3.59+j*.045,.516),(3.605+j*.045,.541),(3.622+j*.045,.516)],gold,48)
# Seam and polished edge accents on ferrule.
lathe('04 Ferrule · lower lip',[(3.53,.51),(3.55,.53),(3.58,.51)],gold,48)
lathe('04 Ferrule · upper lip',[(3.95,.51),(3.97,.53),(4,.50)],gold,48)
lathe('05 Wood · sharpened cedar cone',[(.035,.012),(.56,.43),(.61,.43)],cedar,40)
lathe('06 Graphite · pointed lead',[(0,.006),(.13,.13),(.19,.18)],graphite,32)
# Layered expressive eyes, all as named meshes.
for side,x in [('L',-.19),('R',.19)]:
    ball(f'07 Face · {side} eye rim',(x,2.88,.455),(.202,.222,.075),gold)
    ball(f'07 Face · {side} sclera',(x,2.88,.51),(.168,.183,.07),white)
    ball(f'07 Face · {side} iris',(x,2.88,.57),(.086,.106,.042),iris)
    ball(f'07 Face · {side} pupil',(x,2.88,.604),(.047,.065,.025),pupil)
    ball(f'07 Face · {side} catchlight',(x-.028,2.93,.628),(.023,.03,.012),shine,12,8)
# Eyewear variants are separate editable meshes, organized into removable groups.
for side,x in [('L',-.19),('R',.19)]:
    ball(f'11 Trait · designer shade {side}',(x,2.88,.62),(.175,.122,.048),black)
    ball(f'12 Trait · visor lens {side}',(x,2.88,.624),(.17,.115,.052),blue)
    ball(f'13 Trait · wild eye accent {side}',(x,2.88,.638),(.207,.235,.016),rose)
ball('08 Face · mouth dark inset',(0,2.22,.47),(.245,.13,.055),dark)
ball('08 Face · glossy red lip',(0,2.23,.52),(.195,.086,.05),red)
ball('08 Face · mouth glint',(-.06,2.28,.56),(.05,.017,.01),shine,12,8)
# Additional mouth styles; separately named objects make expression layers swappable.
ball('14 Trait · grin lower lip',(0,2.20,.56),(.205,.07,.045),red)
ball('15 Trait · bubble gum',(0,2.23,.61),(.15,.14,.09),gum)
ball('16 Trait · gold grill',(0,2.22,.615),(.185,.065,.04),grill)
ball('17 Trait · snarl tooth L',(-.075,2.27,.645),(.04,.025,.018),white,12,8)
ball('17 Trait · snarl tooth C',(0,2.27,.645),(.04,.025,.018),white,12,8)
ball('17 Trait · snarl tooth R',(.075,2.27,.645),(.04,.025,.018),white,12,8)
# Accessory wardrobe layers: jacket panels, seams, buttons, medallion and chain.
for name,mat,y0,y1 in [('18 Trait · puffer jacket',quilt,1.72,2.53),('19 Trait · bomber jacket',fabric,1.72,2.53),('20 Trait · denim vest',denim,1.72,2.53)]:
    lathe(name,[(y0,.51),(y0+.08,.55),(y1-.08,.55),(y1,.5)],mat,48)
for j,y in enumerate([1.88,2.08,2.28]):
    tube(f'18 Trait · puffer quilt seam {j+1}',[(-.5,y,.22),(-.3,y-.03,.46),(0,y-.04,.54),(.3,y-.03,.46),(.5,y,.22)],.012,shine,8)
for j,y in enumerate([1.85,2.1,2.35]):ball(f'19 Trait · bomber snap {j+1}',(0,y,.55),(.025,.025,.018),grill,12,8)
for x in [-.34,.34]:tube(f'20 Trait · denim seam {x:+.2f}',[(x,1.77,.37),(x*.75,2.1,.5),(x,2.49,.37)],.012,shine,8)
ball('21 Trait · gold medallion',(0,1.62,.62),(.17,.19,.065),grill)
ball('21 Trait · medallion inset',(0,1.62,.68),(.11,.12,.02),ivory)
for j in range(13):
    a=math.pi+j*math.pi/12;ball(f'22 Trait · dollar chain link {j+1}',(.48*math.cos(a),2.1+.34*math.sin(a),.39),(.036,.045,.025),gold,12,8)
# Body color swatches as separately removable surface inlays for finish variants.
for j,(name,col) in enumerate([('Classic red',red),('Pink',pink),('Sky blue',blue),('Matte charcoal',black),('Neon lime',material('Finish · acid lime',[.72,.87,.13,1],.03,.3)),('Floral ivory',ivory)]):
    ball(f'23 Trait · body finish sample {name}',(0,2.02,.484),(.31,.73,.014),col,24,12)
# Face and body markings; these are optional expression/effect overlays.
for side,x in [('L',-.19),('R',.19)]:
    ball(f'24 Trait · cheek blush {side}',(x*1.62,2.55,.495),(.075,.038,.012),rose,18,10)
    tube(f'25 Trait · brow {side}',[(x-.13,3.12,.49),(x,3.16,.51),(x+.13,3.12,.49)],.025,black,12)
for j in range(8):
    a=j*math.pi/4;ball(f'26 Trait · particle sparkle {j+1}',(1.22*math.cos(a),2.2+1.15*math.sin(a),.12),(.035,.035,.035),shine,12,8)
# Motion variants are represented as selectable effect geometry in GLB.
for j in range(3):
    lathe(f'27 Trait · neon halo ring {j+1}',[(2.8+j*.12,.77+j*.08),(2.82+j*.12,.79+j*.08),(2.85+j*.12,.77+j*.08)],blue,48)
# Small decorative marks on the pencil body as a separate surface layer family.
for j,(x,y) in enumerate([(-.25,1.02),(.25,1.28),(-.25,1.55),(.25,1.82),(-.25,2.09),(.25,2.36),(-.25,2.63),(.25,2.9)]):
    ball(f'28 Trait · floral dot {j+1}',(x,y,.49),(.035,.035,.018),ivory,12,8)
    ball(f'29 Trait · polka dot {j+1}',(x,y,.493),(.03,.03,.018),shine,12,8)
# Add distinct geometry to the themed variants while keeping each piece editable.
if THEME=='sky':
    for k,x in enumerate([-.36,-.24,-.12,0,.12,.24,.36]):
        z=math.sqrt(max(.01,.49*.49-x*x))+.008
        tube(f'30 Trait · pinstripe {k+1}',[(x,.72,z),(x,1.4,z),(x,2.15,z),(x,2.9,z),(x,3.48,z)],.014,ivory,8)
elif THEME=='bloom':
    lathe('30 Trait · soft cap',[(4.32,.44),(4.40,.51),(4.56,.50),(4.72,.43),(4.83,.27),(4.86,.03)],red,40)
    ball('30 Trait · cap brim',(0,4.42,.31),(.48,.075,.26),red,32,16)
# Arms down the sides, ending in visible sculpted palms, fingers and thumbs.
for side,s in [('L',-1),('R',1)]:
    tube(f'09 Arms · {side} upper',[(s*.40,2.57),(s*.62,2.44),(s*.77,2.18),(s*.84,1.83)],.095,skin,14)
    tube(f'09 Arms · {side} forearm',[(s*.84,1.83),(s*.92,1.55),(s*.98,1.34)],.082,skin,14)
    ball(f'10 Hand · {side} palm',(s*1.0,1.24,0),(.18,.19,.145),skin)
    for j,L in enumerate([.17,.23,.22,.17]):
        x=s*(.90+j*.066);tube(f'10 Hand · {side} finger {j+1}',[(x,1.20,.015),(x+s*.012,1.20-L*.55,.025),(x+s*.018,1.20-L,.02)],.038,skin,10)
    tube(f'10 Hand · {side} thumb',[(s*.91,1.3,.06),(s*.82,1.22,.07),(s*.82,1.12,.06)],.05,skin,12)
    for j in range(3): tube(f'10 Hand · {side} knuckle crease {j+1}',[(s*(.92+j*.054),1.12,.145),(s*(.92+j*.054),1.17,.147)],.009,gold,6)

gltf={'asset':{'version':'2.0','generator':'Itties Layered Pencil Builder'},'extensionsUsed':['KHR_materials_specular'],'scene':0,'scenes':[{'name':'Itty · Layered Pencil Character','nodes':list(range(len(nodes)))}],'nodes':nodes,'meshes':meshes,'materials':materials,'accessors':accessors,'bufferViews':views,'buffers':[{'byteLength':0}]}
align();gltf['buffers'][0]['byteLength']=len(buf);js=json.dumps(gltf,separators=(',',':')).encode();js+=b' '*((-len(js))%4);align();total=12+8+len(js)+8+len(buf)
with OUT.open('wb') as f:
    f.write(struct.pack('<III',0x46546c67,2,total));f.write(struct.pack('<II',len(js),0x4e4f534a));f.write(js);f.write(struct.pack('<II',len(buf),0x004e4942));f.write(buf)
print(f'{OUT.name}: {OUT.stat().st_size:,} bytes; {len(nodes)} separately named mesh layers')
