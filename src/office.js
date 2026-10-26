import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const stage = document.querySelector('.office-stage');
const canvas = document.querySelector('#office-canvas');
const world = document.querySelector('.office-world');
const pan = document.querySelector('.office-pan');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
if (stage && canvas) init().catch(error => { console.warn('Office preview unavailable:', error.message); });

async function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  const mobileDevice=matchMedia('(pointer: coarse)').matches;
  const maxPixelRatio=mobileDevice?1:1.25;
  renderer.setPixelRatio(Math.min(devicePixelRatio,maxPixelRatio));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#302a24');
  scene.fog = new THREE.Fog('#302a24', 22, 48);
  const camera = new THREE.PerspectiveCamera(39, 1, .1, 70);
  const cameraBase = new THREE.Vector3(6.3, 7.2, 10.2);
  const target = new THREE.Vector3(0, 1.05, 0);
  camera.position.copy(cameraBase); camera.lookAt(target);
  scene.add(new THREE.HemisphereLight('#d9c2a4', '#292a30', .65));
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  scene.environment = pmrem.fromScene(environment,.06).texture;
  scene.environmentIntensity = .28;
  environment.dispose(); pmrem.dispose();
  const sun = new THREE.DirectionalLight('#ffbd78', 2.1);
  sun.position.set(-7, 5, 2); sun.castShadow = true;
  sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.5,far:28});
  sun.shadow.bias=-.0003; sun.shadow.normalBias=.025; sun.shadow.radius=4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#a7b8cf', .22);fill.position.set(5,4,-1);scene.add(fill);
  const sunset = new THREE.SpotLight('#ffab62', 95, 30, .62, .85, 2);
  sunset.position.set(-5,6,4);sunset.target.position.set(0,1,0);scene.add(sunset,sunset.target);
  const glow = new THREE.PointLight('#ffca89', 2.4, 7, 2);glow.position.set(-4.1,3.2,-1.8);scene.add(glow);
  const objects = new Map();
  const textureLoader = new THREE.TextureLoader();
  const textures = {};
  await Promise.all(['novalens-review','forma-dashboard','atlas-route','aloir-web','cv-page','walnut-albedo'].map(async name=>{
    const tx=await textureLoader.loadAsync(`/assets/${name}.webp`);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textures[name]=tx;
  }));
  function grain(repeatX=1,repeatY=1){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');const im=ctx.createImageData(256,256);let seed=763;for(let i=0;i<im.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const v=110+(seed%35);im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}ctx.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeatX,repeatY);return t;}
  const plasterGrain=grain(18,10),leatherGrain=grain(28,18),paperGrain=grain(3,4);
  const materialCache=new Map();
  function mat(color,roughness=.75,metalness=0){const key=[color,roughness,metalness].join(':');if(!materialCache.has(key))materialCache.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness}));return materialCache.get(key);}
  const paper=mat('#e4dbc7');paper.bumpMap=paperGrain;paper.bumpScale=.008;const aluminum=mat('#b9bec2',.28,.7);const graphite=mat('#202325',.34,.22);const ink=mat('#272827');
  const geometryCache=new Map();
  function box(parent,w,h,d,material,x=0,y=0,z=0){const key=[w,h,d].join(':');if(!geometryCache.has(key)){const thin=Math.min(w,h,d)<.025||Math.max(w,h,d)>15;geometryCache.set(key,thin?new THREE.BoxGeometry(w,h,d):new RoundedBoxGeometry(w,h,d,1,Math.min(.035,w*.08,h*.12,d*.08)));}const m=new THREE.Mesh(geometryCache.get(key),material);m.position.set(x,y,z);m.castShadow=Math.max(w,h,d)>.5;m.receiveShadow=true;parent.add(m);return m;}
  function plane(parent,w,h,material,x,y,z,rx=0){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);m.position.set(x,y,z);m.rotation.x=rx;m.receiveShadow=true;parent.add(m);return m;}
  function labelTexture(text,subtitle='',background='#f0ead9',color='#23364d'){
    const c=document.createElement('canvas');c.width=1024;c.height=640;const ctx=c.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,1024,640);
    ctx.fillStyle=color;ctx.font='bold 78px Arial';let yy=130;for(const line of text.split('\n')){ctx.fillText(line,78,yy);yy+=98;}
    ctx.font='24px monospace';ctx.fillText(subtitle,80,550);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
  }
  function surfaceMaterial(texture){return new THREE.MeshStandardMaterial({map:texture,roughness:.92,metalness:0,bumpMap:paperGrain,bumpScale:.004});}
  function sheet(parent,w,h,texture,x,y,z,rotation=0){const group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=rotation;parent.add(group);box(group,w,.014,h,paper,0,0,0);plane(group,w*.98,h*.98,surfaceMaterial(texture),0,.009,0,-Math.PI/2);return group;}
  function interactive(id,x,y,z){const group=new THREE.Group();group.position.set(x,y,z);scene.add(group);objects.set(id,{group,baseY:y,hover:0});return group;}
  // The room is constructed geometry; all product screens and the CV are genuine captures.
  const wall=new THREE.MeshLambertMaterial({color:'#5c5145'});const floor=new THREE.MeshLambertMaterial({color:'#49423a'});
  box(scene,32,.15,28,floor,0,-1.8,0);
  box(scene,32,13,.2,wall,0,4.6,-5.5);
  box(scene,.2,13,25,wall,-10,4.6,0);
  box(scene,32,.12,.15,mat('#39332d'),0,-1.6,-5.3);
  // Framed window and real cast shadows provide the room's depth cue.
  const windowGroup=new THREE.Group();windowGroup.position.set(-6.7,3.4,-5.32);scene.add(windowGroup);
  box(windowGroup,4.2,4.8,.09,mat('#3c352d'),0,0,0);
  plane(windowGroup,3.85,4.45,new THREE.MeshBasicMaterial({color:'#eeb57c'}),0,0,.06);
  box(windowGroup,.08,4.5,.1,mat('#b5a38c'),0,0,.12);box(windowGroup,3.9,.08,.1,mat('#b5a38c'),0,0,.12);
  for(let i=0;i<6;i++)box(windowGroup,4.05,.055,.18,mat('#8e7c65'),0,1.9-i*.65,.18);
  // Quiet architectural shelving, no invented personal trophies or possessions.
  box(scene,3.4,.09,.42,mat('#8c8271'),4.3,3.4,-5.18);
  const bookColors=['#36433e','#d0cbb9','#374b77','#b4ada0'];
  for(let i=0;i<5;i++)box(scene,.25,.8+(i%2)*.18,.29,mat(bookColors[i%4]),3.25+i*.32,3.85,-5.15);
  // Solid walnut slab and dark powder-coated frame.
  const walnut=textures['walnut-albedo'];walnut.wrapS=walnut.wrapT=THREE.RepeatWrapping;walnut.repeat.set(1.6,1);const wood=new THREE.MeshStandardMaterial({map:walnut,roughness:.42,metalness:0});
  const deskTop=box(scene,10,.25,5.2,wood,0,.8,0);
  const deskEdge=box(scene,9.9,.055,5.1,mat('#4b392b'),0,.65,0);
  const legs=[];for(const x of [-4.35,4.35])for(const z of [-1.95,1.95])legs.push(box(scene,.16,2.35,.16,graphite,x,-.55,z));
  const brace=box(scene,8.8,.12,.12,graphite,0,-.9,-1.95);
  const matDesk=mat('#272b27',.86);matDesk.bumpMap=leatherGrain;matDesk.bumpScale=.012;const deskMat=box(scene,6.3,.027,3.3,matDesk,.05,.943,-.55);
  // Monitor, metal stem and weighted base.
  const monitor=interactive('novalens',-.25,.965,-1.35);
  box(monitor,1.2,.065,.65,aluminum,0,.04,0);
  box(monitor,.16,.57,.12,aluminum,0,.34,-.05);
  box(monitor,3.15,1.88,.14,graphite,0,1.47,-.02);
  const screenTexture=textures['novalens-review'].clone();screenTexture.needsUpdate=true;screenTexture.repeat.set(1,.34);screenTexture.offset.set(0,.28);
  plane(monitor,2.99,1.67,new THREE.MeshBasicMaterial({map:screenTexture}),0,1.49,.059);
  const led=new THREE.Mesh(new THREE.SphereGeometry(.015,8,8),new THREE.MeshBasicMaterial({color:'#a9c5ff'}));led.position.set(1.37,.57,.057);monitor.add(led);
  // Laptop has a real hinged display, individually modelled keys and recessed trackpad.
  const laptop=interactive('forma',-2.55,.98,.25);laptop.rotation.y=.15;
  box(laptop,2.3,.09,1.62,aluminum,0,.03,.2);
  box(laptop,2.08,.015,.78,mat('#555a5d'),0,.083,-.06);
  const keys=new THREE.InstancedMesh(new THREE.BoxGeometry(.13,.014,.105),graphite,65);const keyMatrix=new THREE.Matrix4();let keyIndex=0;for(let row=0;row<5;row++)for(let col=0;col<13;col++){keyMatrix.makeTranslation(-.93+col*.155,.101,-.36+row*.14);keys.setMatrixAt(keyIndex++,keyMatrix);}keys.receiveShadow=true;laptop.add(keys);
  box(laptop,.76,.007,.36,mat('#a4aaac',.38,.6),0,.086,.71);
  const lid=new THREE.Group();lid.position.set(0,.08,-.61);lid.rotation.x=-.17;laptop.add(lid);
  box(lid,2.3,1.48,.075,graphite,0,.74,0);
  plane(lid,2.15,1.32,new THREE.MeshBasicMaterial({map:textures['forma-dashboard']}),0,.76,.041);
  // iPhone enclosure, glass screen, island and camera detail.
  const phone=interactive('atlas',2.15,.99,.15);phone.rotation.y=-.2;
  box(phone,.65,.055,1.33,mat('#202528',.22,.65));
  plane(phone,.603,1.268,new THREE.MeshBasicMaterial({map:textures['atlas-route']}),0,.031,0,-Math.PI/2);
  box(phone,.16,.006,.025,graphite,0,.035,-.57);
  // An open hardbound sketchbook: cover, page blocks, gutter, curled edge and elastic.
  const notebook=interactive('sketchbook',-.1,1.01,1.35);notebook.rotation.y=-.13;
  box(notebook,2.55,.065,1.63,mat('#314230'),0,-.015,0);
  box(notebook,1.21,.07,1.54,paper,-.63,.05,0);box(notebook,1.21,.075,1.54,paper,.63,.05,0);
  const notes=labelTexture('What if…?','LAAS / OBSERVE → REVIEW','#f4f0e2','#304a78');
  const nc=document.createElement('canvas');nc.width=700;nc.height=900;const nctx=nc.getContext('2d');nctx.fillStyle='#f2eedf';nctx.fillRect(0,0,700,900);nctx.strokeStyle='#aebbd0';for(let y=70;y<900;y+=50){nctx.beginPath();nctx.moveTo(45,y);nctx.lineTo(655,y);nctx.stroke();}nctx.fillStyle='#324b7b';nctx.font='italic 52px Georgia';nctx.fillText('What can we see?',58,145);nctx.font='27px Arial';nctx.fillText('detection ≠ understanding',58,220);nctx.strokeStyle='#4c6691';nctx.lineWidth=4;nctx.strokeRect(90,325,490,315);nctx.beginPath();nctx.arc(335,485,83,0,Math.PI*2);nctx.moveTo(335,325);nctx.lineTo(335,640);nctx.stroke();nctx.font='25px Arial';nctx.fillText('Keep the unknowns visible.',58,760);const nt=new THREE.CanvasTexture(nc);nt.colorSpace=THREE.SRGBColorSpace;
  plane(notebook,1.17,1.49,surfaceMaterial(notes),-.63,.089,0,-Math.PI/2);plane(notebook,1.17,1.49,surfaceMaterial(nt),.63,.092,0,-Math.PI/2);
  box(notebook,.035,.079,1.5,mat('#b3ab97'),0,.059,0);
  for(let i=0;i<5;i++){box(notebook,1.19,.003,1.52,mat('#d9d1bf'),-.63,.015+i*.009,0);box(notebook,1.19,.003,1.52,mat('#d9d1bf'),.63,.015+i*.009,0);}
  // Actual PDF page, not a decorative CV label.
  const cv=interactive('cv',3.35,.98,1.35);cv.rotation.y=.17;
  sheet(cv,1.35,1.75,textures['cv-page'],0,.012,0);
  sheet(cv,1.35,1.75,textures['cv-page'],.026,-.005,.025,-.025);
  // Physical manila file with stacked project pages, cut tab and a slightly opened cover.
  const folder=interactive('index',-3.53,.98,1.65);folder.rotation.y=.19;
  const manila=mat('#bca879');box(folder,1.85,.035,1.35,manila);
  box(folder,.65,.035,.2,manila,-.48,0,-.73);
  const dossier=labelTexture('PROJECT\nFILES','ANOTIDA DZINOTYIWEI','#eeeada','#24344c');
  for(let i=0;i<4;i++)sheet(folder,1.65,1.18,dossier,(i-2)*.025,.027+i*.008,0,.015*i);
  const cover=new THREE.Group();cover.position.set(0,.1,.58);cover.rotation.x=.12;folder.add(cover);box(cover,1.85,.025,1.16,manila,0,0,-.58);
  plane(cover,1.3,.65,surfaceMaterial(labelTexture('SELECTED\nWORK','OPEN THE FILES','#bca879','#33413f')),0,.016,-.58,-Math.PI/2);
  // Small personal note and a broad systems note.
  const about=interactive('about',3.5,.98,-1.25);about.rotation.y=-.12;sheet(about,1.3,.92,labelTexture('Hello,\nI’m Anotida.','A NOTE FROM ME','#e8e4d2'),0,.015,0);
  const twin=interactive('digital-twin',-4.2,.98,-.2);twin.rotation.y=.12;sheet(twin,1.05,.95,labelTexture('Systems\nthinking','DIGITAL TWIN','#d6d9ac'),0,.01,0);
  const website=interactive('collection',1.55,.98,1.65);website.rotation.y=-.13;sheet(website,1.25,.87,textures['aloir-web'],0,.01,0);
  // A brass desk light gives the office a recognisable vertical silhouette.
  const lamp=new THREE.Group();lamp.position.set(-4.25,.98,-1.9);scene.add(lamp);
  const brass=mat('#8d8b7a',.36,.65);const cylinder=(r1,r2,h,material,x,y,z)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,32),material);m.position.set(x,y,z);m.castShadow=true;lamp.add(m);return m;};
  cylinder(.36,.4,.065,graphite,0,.025,0);cylinder(.035,.035,2.5,brass,0,1.25,0);const shade=cylinder(.18,.48,.38,mat('#303831'),.1,2.5,0);shade.rotation.z=-.15;
  // Pen: restrained object detail grounded in the blue annotation colour.
  const pen=new THREE.Mesh(new THREE.CylinderGeometry(.023,.023,1.17,14),mat('#2b4ff3',.3,.25));pen.rotation.z=Math.PI/2;pen.rotation.y=.5;pen.position.set(.4,1.01,2.4);pen.castShadow=true;scene.add(pen);

  const cableCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.25,.98,-1.45),new THREE.Vector3(-.6,.98,-2.2),new THREE.Vector3(-2.0,.98,-2.25),new THREE.Vector3(-2.8,.98,-.45)]);
  const cable=new THREE.Mesh(new THREE.TubeGeometry(cableCurve,40,.017,8,false),mat('#161914',.7));cable.castShadow=true;scene.add(cable);
  for(const x of [-.98,.98])for(let j=0;j<9;j++)box(laptop,.014,.002,.03,mat('#757b7b'),x,.097,-.3+j*.075);
  for(const x of [-1.03,1.03])for(const z of[-.47,.84]){const screw=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.003,12),mat('#555c60',.3,.7));screw.position.set(x,.089,z);laptop.add(screw);}
  const screenGlow=new THREE.PointLight('#c2ccdf',.9,2.5,2);screenGlow.position.set(0,1.4,.2);monitor.add(screenGlow);
  // Collapse repeated static meshes to one draw per material, preserving each pickable group.
  scene.updateMatrixWorld(true);
  const interactiveGroups=new Set([...objects.values()].map(o=>o.group));
  function batchMeshes(root,skipInteractive=false){const batches=new Map(),remove=[];root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert();function collect(node){if(skipInteractive&&interactiveGroups.has(node))return;if(node.isMesh&&!node.isInstancedMesh&&!Array.isArray(node.material)){let g=node.geometry.clone();if(g.index)g=g.toNonIndexed();g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,node.matrixWorld));const key=node.material.uuid+':'+node.castShadow+':'+node.receiveShadow;if(!batches.has(key))batches.set(key,{material:node.material,cast:node.castShadow,receive:node.receiveShadow,geometries:[]});batches.get(key).geometries.push(g);remove.push(node);}else if(!node.isInstancedMesh)for(const child of node.children)collect(child);}for(const child of root.children)collect(child);for(const node of remove)node.removeFromParent();for(const b of batches.values()){const geometry=mergeGeometries(b.geometries,false);b.geometries.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,b.material);mesh.castShadow=b.cast;mesh.receiveShadow=b.receive;root.add(mesh);}}
  for(const o of objects.values())batchMeshes(o.group);
  batchMeshes(scene,true);
  // The office is static at rest. Only pointer/focus transitions schedule frames.
  const anchors=[...stage.querySelectorAll('[data-office-object]')];
  const entries=[...objects.entries()];
  const pointer={x:0,y:0};let active=null,frame=0,visible=true,intersecting=true,modalOpen=false,picked=null;
  const cameraGoal=cameraBase.clone(),lookGoal=target.clone();let zoomGoal=1.12;
  let renderWidth=1,renderHeight=1,pendingPointer=null,renderCount=0,shadowCount=0;
  const profile=new URLSearchParams(location.search).has('profile');
  if(profile)Object.defineProperty(window,'officePerformance',{configurable:true,get:()=>({frames:renderCount,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,pixelRatio:renderer.getPixelRatio(),pixels:canvas.width*canvas.height,shadowUpdates:shadowCount,picked,scheduled:!!frame,visible,intersecting,modalOpen})});
  const hotspotOffsets={novalens:new THREE.Vector3(0,.68,.12),forma:new THREE.Vector3(0,.1,.98),atlas:new THREE.Vector3(0,.1,.9),sketchbook:new THREE.Vector3(0,.1,1.02),cv:new THREE.Vector3(0,.1,1.06),index:new THREE.Vector3(0,.1,.9),about:new THREE.Vector3(0,.1,.65),'digital-twin':new THREE.Vector3(0,.1,.32),collection:new THREE.Vector3(0,.1,.62)};
  const labelState=new Map(anchors.map(a=>[a,{half:60,x:NaN,y:NaN,hover:false}]));
  function invalidate(){if(!frame&&visible&&intersecting&&!modalOpen)frame=requestAnimationFrame(render);}
  function setActive(id){if(active!==id){active=id;invalidate();}}
  anchors.forEach(a=>{const id=a.dataset.officeObject;if(!objects.has(id))return;a.hidden=false;a.addEventListener('pointerenter',()=>setActive(id));a.addEventListener('pointerleave',()=>setActive(null));a.addEventListener('focus',()=>{setActive(id);a.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});});a.addEventListener('blur',()=>setActive(null));});
  const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2(),hitPoint=new THREE.Vector3();
  scene.updateMatrixWorld(true);
  const hitBounds=entries.map(([id,o])=>({id,bounds:new THREE.Box3().setFromObject(o.group).expandByScalar(.025)}));
  // Nine precomputed bounds replace raycasting every triangle on every pointer event.
  function hit(event){const r=canvas.getBoundingClientRect();mouse.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);let result=null,distance=Infinity;for(const item of hitBounds){if(raycaster.ray.intersectBox(item.bounds,hitPoint)){const d=raycaster.ray.origin.distanceToSquared(hitPoint);if(d<distance){distance=d;result=item.id;}}}return result;}
  // Shared-element previews use the actual projected object bounds, measured only on activation.
  stage.addEventListener('office:measure-object',event=>{
    const object=objects.get(event.detail?.id);if(!object)return;
    object.group.updateWorldMatrix(true,true);camera.updateMatrixWorld();
    const bounds=new THREE.Box3().setFromObject(object.group),point=new THREE.Vector3();
    const canvasRect=canvas.getBoundingClientRect();let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
    for(const x of[bounds.min.x,bounds.max.x])for(const y of[bounds.min.y,bounds.max.y])for(const z of[bounds.min.z,bounds.max.z]){
      point.set(x,y,z).project(camera);const px=canvasRect.left+(point.x*.5+.5)*canvasRect.width,py=canvasRect.top+(-point.y*.5+.5)*canvasRect.height;
      left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);
    }
    const viewport=pan.getBoundingClientRect();left=Math.max(left,viewport.left,0);right=Math.min(right,viewport.right,innerWidth);top=Math.max(top,viewport.top,0);bottom=Math.min(bottom,viewport.bottom,innerHeight);
    if(right>left&&bottom>top)event.detail.rect={left,top,width:right-left,height:bottom-top};
  });
  stage.addEventListener('office:pickup',event=>{
    if(picked)objects.get(picked).group.visible=true;
    const object=objects.get(event.detail?.id);picked=object?event.detail.id:null;
    if(object)object.group.visible=false;
    // One cached scene frame hands the object to its compositor-animated preview.
    // The modal then pauses WebGL until the object is returned.
    renderer.render(scene,camera);renderCount++;
  });
  let pointerStart=null,moved=false;
  canvas.style.touchAction='pan-x pan-y';
  canvas.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};moved=false;});
  canvas.addEventListener('pointermove',e=>{if(pointerStart&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>8)moved=true;if(e.pointerType==='touch'||reduced.matches)return;pendingPointer={clientX:e.clientX,clientY:e.clientY};invalidate();},{passive:true});
  canvas.addEventListener('pointerup',()=>pointerStart=null);
  canvas.addEventListener('pointercancel',()=>{pointerStart=null;moved=true;});
  canvas.addEventListener('pointerleave',()=>{pendingPointer=null;setActive(null);});
  canvas.addEventListener('click',e=>{if(moved){moved=false;return;}const id=hit(e);anchors.find(a=>a.dataset.officeObject===id)?.click();});
  let worldRect=world.getBoundingClientRect();
  pan?.addEventListener('scroll',()=>{worldRect=world.getBoundingClientRect();},{passive:true});
  stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reduced.matches)return;beginMotion();pointer.x=(e.clientX-worldRect.left)/renderWidth-.5;pointer.y=(e.clientY-worldRect.top)/renderHeight-.5;invalidate();},{passive:true});
  stage.addEventListener('pointerleave',()=>{pointer.x=pointer.y=0;invalidate();});
  function measureLabels(){for(const a of anchors)labelState.get(a).half=a.offsetWidth/2+12;invalidate();}
  const labelObserver=new ResizeObserver(measureLabels);anchors.forEach(a=>labelObserver.observe(a));
  function resize(){renderWidth=world.clientWidth;renderHeight=world.clientHeight;renderer.setSize(renderWidth,renderHeight,false);camera.aspect=renderWidth/renderHeight;camera.fov=39;cameraGoal.copy(cameraBase);lookGoal.set(0,stage.clientWidth<=1100?1.65:1.05,0);camera.position.copy(cameraGoal);camera.lookAt(lookGoal);camera.zoom=1;camera.updateProjectionMatrix();camera.updateMatrixWorld();const bounds=new THREE.Box3(new THREE.Vector3(-5,.7,-2.65),new THREE.Vector3(5,3.0,2.65));let min=1,max=-1;for(const x of[bounds.min.x,bounds.max.x])for(const y of[bounds.min.y,bounds.max.y])for(const z of[bounds.min.z,bounds.max.z]){const v=new THREE.Vector3(x,y,z).project(camera);min=Math.min(min,v.x);max=Math.max(max,v.x);}zoomGoal=Math.min(1.85/(max-min),1.12);camera.zoom=zoomGoal;target.copy(lookGoal);camera.updateProjectionMatrix();worldRect=world.getBoundingClientRect();measureLabels();invalidate();}
  new ResizeObserver(resize).observe(world);resize();stage.dataset.officeReady='true';
  if(stage.clientWidth<=1100&&pan){pan.scrollLeft=(world.clientWidth-pan.clientWidth)*.49;worldRect=world.getBoundingClientRect();}
  const tmp=new THREE.Vector3(),lightGoal=new THREE.Vector3();
  let lastRenderTime=0,slowFrames=0,qualityScale=1,interactionScale=1,restoreTimer=0;
  function applyResolution(scale){qualityScale=scale;renderer.setPixelRatio(Math.min(devicePixelRatio,maxPixelRatio)*scale);renderer.setSize(renderWidth,renderHeight,false);}
  function beginMotion(){clearTimeout(restoreTimer);restoreTimer=0;if(qualityScale!==interactionScale)applyResolution(interactionScale);}
  function render(time){frame=0;if(!visible||!intersecting||modalOpen)return;
    const gap=time-lastRenderTime;const noMotion=reduced.matches,dt=Math.min(50,gap||16.7);lastRenderTime=time;if(pendingPointer&&gap>18&&gap<150){slowFrames++;if(slowFrames>=12&&qualityScale>.7){interactionScale=Math.max(.7,qualityScale-.15);applyResolution(interactionScale);slowFrames=0;}}else slowFrames=Math.max(0,slowFrames-1);
    const ease=noMotion?1:1-Math.exp(-dt/110);let moving=false;
    if(pendingPointer){const id=hit(pendingPointer);pendingPointer=null;active=id;canvas.style.cursor=id?'pointer':'default';}
    const mobile=stage.clientWidth<=700;
    const xx=cameraGoal.x+(noMotion||mobile?0:pointer.x*.22),yy=cameraGoal.y+(noMotion||mobile?0:-pointer.y*.1);
    const dx=xx-camera.position.x,dy=yy-camera.position.y;
    if(Math.abs(dx)+Math.abs(dy)>.0005){camera.position.x+=dx*ease;camera.position.y+=dy*ease;moving=true;}else{camera.position.x=xx;camera.position.y=yy;}
    camera.lookAt(target);camera.updateMatrixWorld();
    lightGoal.set(noMotion?0:pointer.x*8,1,noMotion?0:pointer.y*5);
    if(sunset.target.position.distanceToSquared(lightGoal)>.00001){sunset.target.position.lerp(lightGoal,ease);moving=true;}else sunset.target.position.copy(lightGoal);
    const lightX=-5+(noMotion?0:pointer.x*2),dl=lightX-sunset.position.x;
    if(Math.abs(dl)>.001){sunset.position.x+=dl*ease;moving=true;}else sunset.position.x=lightX;
    for(const[id,o]of entries){const desired=noMotion?0:Number(active===id);const dh=desired-o.hover;if(Math.abs(dh)>.001){o.hover+=dh*ease;moving=true;}else o.hover=desired;o.group.position.y=o.baseY+o.hover*.065;}
    // Batch projection and transform writes; no per-frame DOM measurements/layout.
    for(const a of anchors){const id=a.dataset.officeObject,o=objects.get(id),label=labelState.get(a);tmp.copy(hotspotOffsets[id]);o.group.updateWorldMatrix(true,false);o.group.localToWorld(tmp);tmp.project(camera);const x=Math.max(label.half,Math.min(renderWidth-label.half,(tmp.x*.5+.5)*renderWidth)),y=Math.max(130,Math.min(renderHeight-95,(-tmp.y*.5+.5)*renderHeight));if(!Number.isFinite(label.x)||Math.abs(x-label.x)+Math.abs(y-label.y)>.25){a.style.left='0';a.style.top='0';a.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-50%)`;label.x=x;label.y=y;}const hovered=active===id;if(label.hover!==hovered){a.classList.toggle('is-hovered',hovered);label.hover=hovered;}}
    if(renderer.shadowMap.needsUpdate)shadowCount++;
    renderer.render(scene,camera);renderCount++;
    if(moving)invalidate();else if(qualityScale<1&&!restoreTimer){restoreTimer=setTimeout(()=>{restoreTimer=0;if(frame||modalOpen||!visible||!intersecting)return;applyResolution(1);invalidate();},300);}
  }
  invalidate();
  document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(!visible){cancelAnimationFrame(frame);frame=0;}else invalidate();});
  new IntersectionObserver(([entry])=>{intersecting=entry.isIntersecting;if(!intersecting){cancelAnimationFrame(frame);frame=0;}else invalidate();},{threshold:0}).observe(stage);
  const dialog=document.querySelector('#object-dialog');
  if(dialog?.open){modalOpen=true;cancelAnimationFrame(frame);frame=0;}
  if(dialog)new MutationObserver(()=>{modalOpen=dialog.open;if(modalOpen){cancelAnimationFrame(frame);frame=0;}else{if(picked){objects.get(picked).group.visible=true;picked=null;}invalidate();}}).observe(dialog,{attributes:true,attributeFilter:['open']});
  reduced.addEventListener('change',invalidate);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();visible=false;cancelAnimationFrame(frame);frame=0;delete stage.dataset.officeReady;});
}
