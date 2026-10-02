import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function createWorld({ projects, onSelect, onFailure }) {
  const host = document.querySelector('#scene-canvas');
  const shell = document.querySelector('#portfolio-scene');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.2 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#070914');
  scene.fog = new THREE.FogExp2('#070914', 0.03);
  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 120);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls,{enableDamping:true,dampingFactor:.075,enablePan:false,minDistance:5,maxDistance:50,minPolarAngle:Math.PI*.18,maxPolarAngle:Math.PI*.47,rotateSpeed:.6,zoomSpeed:.7});
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, .04);
  scene.environment = env.texture;
  scene.environmentIntensity = .55;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0x9badff, 0x080817, 1.9));
  const key = new THREE.DirectionalLight(0xcbd3ff, 4.4); key.position.set(3,12,8); scene.add(key);
  const fill = new THREE.DirectionalLight(0x727bff,3); fill.position.set(-12,5,-8); scene.add(fill);
  const metal = new THREE.MeshStandardMaterial({color:'#293245',metalness:.7,roughness:.27});
  const dark = new THREE.MeshStandardMaterial({color:'#080b1c',metalness:.45,roughness:.42});
  const silver = new THREE.MeshStandardMaterial({color:'#95adb8',metalness:.95,roughness:.3});
  const gold = new THREE.MeshStandardMaterial({color:'#ebc967',metalness:.75,roughness:.25});
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshStandardMaterial({color:'#040611',metalness:.08,roughness:.9}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.11;scene.add(floor);
  const grid = new THREE.GridHelper(40,20,0x444b7a,0x23283f);
  grid.position.y=-.1;grid.material.transparent=true;grid.material.opacity=.24;scene.add(grid);
  let composer;
  if (innerWidth >= 700) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene,camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(1,1),.42,.55,1.05));
    composer.addPass(new OutputPass());
  }
  const exhibits=[],clickable=[],textures=[];
  const loader=new THREE.TextureLoader();
  const modelTextures={};
  for(const [name,url] of Object.entries({jump:'./assets/danro-jump.webp',danro:'./assets/danro.webp',wizard:'./assets/wizard-scene.webp',character:'./assets/wizard.png'})){
    const t=loader.load(url,()=>{needsRender=true;});t.colorSpace=THREE.SRGBColorSpace;
    if(name==='character'){
      // Preserve the original pixel grid at every camera distance.
      t.magFilter=THREE.NearestFilter;
      t.minFilter=THREE.NearestFilter;
      t.generateMipmaps=false;
    }
    textures.push(t);modelTextures[name]=t;
  }
  const projectTextures = {};
  projects.forEach(project => {
    const texture=loader.load(project.image,()=>{needsRender=true;}); texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
    textures.push(texture); projectTextures[project.id]=texture;
  });
  const auraCanvas=document.createElement('canvas');auraCanvas.width=128;auraCanvas.height=128;
  const auraContext=auraCanvas.getContext('2d');
  const auraGradient=auraContext.createRadialGradient(64,64,18,64,64,64);
  auraGradient.addColorStop(0,'#ffffff88');auraGradient.addColorStop(.5,'#ffffff50');auraGradient.addColorStop(1,'#ffffff00');
  auraContext.fillStyle=auraGradient;auraContext.fillRect(0,0,128,128);
  const auraTexture=new THREE.CanvasTexture(auraCanvas);textures.push(auraTexture);
  function box(parent,w,h,d,material,x=0,y=0,z=0,radius=.045){
    const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(radius,w/3,h/3,d/3)),material);
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  function cylinder(parent,r,h,material,x,y,z){
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),material);
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  function ring(parent,r,material,y=0){
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(r,.016,6,80),material);
    mesh.rotation.x=-Math.PI/2;mesh.position.y=y;parent.add(mesh);return mesh;
  }
  function screen(parent,w,h,x,y,z,texture){
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  function canvasTexture(title,lines,accent){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=512;
    const c=canvas.getContext('2d');
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
    function draw(newLines=lines,newAccent=accent){
      c.fillStyle='#081722';c.fillRect(0,0,768,512);
      c.strokeStyle=newAccent;c.lineWidth=3;c.strokeRect(22,22,724,468);
      c.fillStyle=newAccent;c.font='bold 32px monospace';c.fillText(title,48,85,660);
      c.fillStyle='#d1e6ec';c.font='27px monospace';
      newLines.forEach((line,i)=>c.fillText(line,48,160+i*55,665));
      c.fillStyle=newAccent;c.fillRect(48,447,60,7);c.fillStyle='#264450';c.fillRect(121,447,590,7);texture.needsUpdate=true;
    }
    draw();return {texture,draw};
  }
  function addArcade(e,texture,title){
    const g=e.model;
    box(g,1.65,2.85,1.1,metal,0,1.6);box(g,1.78,.46,1.2,dark,0,2.95,.08);
    box(g,1.38,1.53,.12,silver,0,2.05,.6);box(g,1.28,1.43,.14,dark,0,2.05,.66);
    const portrait=title==='DANRO JUMP';
    screen(g,portrait ? 1.31*698/1241 : 1.16,portrait ? 1.31 : 1.16*810/1440,0,2.06,.741,texture);
    const marquee=document.createElement('canvas');marquee.width=768;marquee.height=180;
    const ink=marquee.getContext('2d');ink.fillStyle='#081722';ink.fillRect(0,0,768,180);
    ink.textAlign='center';ink.fillStyle=e.project.accent;ink.font='bold 74px monospace';ink.fillText(title,384,91,710);
    ink.fillStyle='#91b6bf';ink.font='23px monospace';ink.fillText('UNITY / C#',384,143);
    const labelTexture=new THREE.CanvasTexture(marquee);labelTexture.colorSpace=THREE.SRGBColorSpace;textures.push(labelTexture);
    screen(g,1.4,.29,0,2.98,.69,labelTexture);
    const deck=box(g,1.86,.19,.72,metal,0,.99,.76);deck.rotation.x=-.14;
    box(g,1.35,.65,.08,dark,0,.53,.61);box(g,.42,.12,.08,silver,.2,.62,.68);box(g,.28,.03,.04,dark,.2,.65,.73);
    for(const x of [-.73,.73])box(g,.025,2.56,.025,e.glow,x,1.66,.57,.01);
    cylinder(g,.16,.05,silver,-.42,1.13,.87);cylinder(g,.03,.25,silver,-.42,1.28,.87);
    const ball=new THREE.Mesh(new THREE.SphereGeometry(.095,18,12),e.glow);ball.position.set(-.42,1.45,.87);g.add(ball);
    for(let i=0;i<3;i++)cylinder(g,.08,.06,e.glow,.05+i*.23,1.14,.86);
    e.activate=()=>{e.active=!e.active;e.glow.emissiveIntensity=e.active?3:.45;return e.active?'Подсветка включена. Можно рассмотреть автомат со всех сторон.':'Подсветка приглушена.';};
  }
  function addKiosk(e){
    const g=e.model;
    box(g,1.75,2.7,1.2,metal,0,1.55);box(g,1.55,2.45,.32,dark,0,1.96,.55);
    screen(g,1.2,2.13,0,1.96,.719,projectTextures[e.project.id]);
    box(g,.65,.1,.16,silver,.34,.63,.65);box(g,.35,.22,.05,e.glow,-.43,.63,.64);box(g,1.1,.18,.45,dark,0,.37,.79);
    for(const x of [-.7,.7])box(g,.025,1.8,.025,e.glow,x,1.35,.62,.01);
    const coins=[];
    for(let i=0;i<10;i++){const c=cylinder(g,.1,.025,gold,(i%5)*.13-.26,.83+Math.floor(i/5)*.045,.9);c.visible=false;coins.push(c);}
    e.activate=()=>{e.effectTime=0;coins.forEach(c=>{c.visible=true;c.position.y=.82});return 'Модель выдала 10 жетонов. Это иллюстрация, без подключения к оборудованию.';};
    e.animate=(time,dt)=>{e.effectTime+=dt;if(e.effectTime<1.3)coins.forEach((c,i)=>{c.position.y=.8+Math.max(0,1-e.effectTime+i*.035)*1.2;c.rotation.z=time*(1+i*.1)});};
  }
  function addComputer(e,isTyping){
    const g=e.model;
    box(g,2.8,.14,1.7,metal,0,.88);
    for(const x of [-1.15,1.15])box(g,.1,.8,.1,silver,x,.43,.4);
    box(g,1.98,1.32,.16,dark,0,1.78,-.38);
    const panel=canvasTexture(isTyping?'TYPING TRAINER':'PLATE CONFIG',isTyping?['Учусь печатать','СКОРОСТЬ / ТОЧНОСТЬ','RU / EN']:['CONTROLLER / COM','ОЖИДАНИЕ УСТРОЙСТВА','INPUT / OUTPUT / ADC'],e.project.accent);
    const display=screen(g,1.8,1.14,0,1.78,-.29,projectTextures[e.project.id]);box(g,.12,.42,.13,silver,0,1.04,-.42);box(g,.65,.05,.45,dark,0,.97,-.4);
    box(g,1.48,.09,.48,dark,-.2,1.01,.43);
    const keys=[];
    for(let r=0;r<3;r++)for(let i=0;i<12;i++)keys.push(box(g,.095,.025,.105,(i+r)%7===0?e.glow:silver,i*.115-.86,1.07,.3+r*.13,.007));
    box(g,.2,.07,.3,dark,.97,1.02,.44);
    if(!isTyping){
      box(g,.68,.08,.46,new THREE.MeshStandardMaterial({color:'#216459',roughness:.6}),.93,1.03,-.24);
      for(let i=0;i<4;i++)box(g,.055,.025,.055,e.glow,.7+i*.13,1.1,-.23,.005);
    }
    e.activate=()=>{e.effectTime=0;e.active=true;display.material.map=panel.texture;panel.draw(isTyping?['Печатаю без спешки.','ТЕКСТ НАБРАН','ПРОДОЛЖИТЬ ТРЕНИРОВКУ']:['CONTROLLER / COM','СОЕДИНЕНИЕ УСТАНОВЛЕНО','INPUT / OUTPUT / ADC']);e.glow.emissiveIntensity=2;return isTyping?'На рабочей станции появился текст, клавиши подсвечены.':'Плата подключена в модели. Индикаторы показывают связь.';};
    e.animate=(time,dt)=>{e.effectTime+=dt;if(e.active&&isTyping)keys.forEach((k,i)=>{k.position.y=1.07-(Math.sin(time*9-i*.7)>.94?.025:0)});};
  }
  function addWizard(e){
    const g=e.model;box(g,2.6,.22,2.1,dark,0,.24);screen(g,2.5,1.6,0,1.45,-.8,projectTextures[e.project.id]);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:modelTextures.character,transparent:true,alphaTest:.5,depthWrite:false,toneMapped:false}));sprite.position.set(0,.94,.2);sprite.scale.set(1.42,1.42,1);g.add(sprite);
    for(const x of [-1.12,1.12])box(g,.15,1.1,.15,metal,x,.83,-.7);
    const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.17,1),e.glow);orb.position.set(.78,1.62,.1);g.add(orb);
    const spell=ring(g,1.05,e.glow,.58);spell.visible=false;
    e.activate=()=>{e.effectTime=0;e.active=true;spell.visible=true;return 'Чародей применил заклинание. Вокруг него появился магический круг.';};
    e.animate=(time,dt)=>{orb.position.y=1.6+Math.sin(time*1.8)*.12;orb.rotation.y=time;if(e.active){e.effectTime+=dt;spell.scale.setScalar(1+Math.sin(time*3)*.14);spell.rotation.z=time*.4;sprite.position.y=.94+Math.sin(time*2)*.07}};
  }
  function addLed(e){
    const g=e.model;box(g,2.5,1.8,.23,dark,0,1.65);
    for(const x of [-.9,.9]){box(g,.08,.55,.08,silver,x,.51);box(g,.4,.08,.6,metal,x,.23)}
    const leds=new THREE.InstancedMesh(new THREE.SphereGeometry(.048,10,8),new THREE.MeshBasicMaterial({color:'#ffffff'}),96);
    const dummy=new THREE.Object3D();
    for(let i=0;i<96;i++){dummy.position.set((i%12)*.19-1.045,Math.floor(i/12)*.19+.98,.145);dummy.updateMatrix();leds.setMatrixAt(i,dummy.matrix);leds.setColorAt(i,new THREE.Color('#315d5e'));}
    g.add(leds);const palette=['#68ebcc','#89a3ff','#ed9e75','#dba4f7'];
    function light(time){for(let i=0;i<96;i++){const c=new THREE.Color(palette[Math.floor(i/24)]);c.multiplyScalar(e.active?.4+(Math.sin(time*3-i*.12)+1)*.6:.13);leds.setColorAt(i,c)}leds.instanceColor.needsUpdate=true;}
    e.activate=()=>{e.active=!e.active;light(0);return e.active?'LED-панель включена. Цвета показывают четыре линии подключения.':'LED-панель выключена.';};
    e.animate=light;
  }
  function addThemes(e){
    const g=e.model;box(g,2.3,.2,1.4,metal,0,.25);
    const panes=[],palette=['#c998ec','#728cf7','#e791b0','#d5b972'];
    for(let i=0;i<4;i++){
      const mat=new THREE.MeshStandardMaterial({color:palette[i],metalness:.35,roughness:.23,emissive:palette[i],emissiveIntensity:.12});
      const p=box(g,.75,1.08,.15,mat,(i%2)*.85-.42,Math.floor(i/2)*1.15+1,-.05+(i%2)*.24);p.rotation.y=-.2+(i%2)*.4;panes.push(p);
      const image=e.project.media.items.filter(item=>item.type==='image')[i];
      const texture=loader.load(image.src,()=>{needsRender=true;});texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
      screen(p,.61,.99,0,0,.081,texture);
    }
    let turn=0;
    e.activate=()=>{turn++;panes.forEach((p,i)=>{p.material.color.set(palette[(i+turn)%4]);p.material.emissive.copy(p.material.color)});return 'Палитра изменена. Ещё одно нажатие переключит цвета темы.';};
    e.animate=time=>panes.forEach((p,i)=>p.position.z=-.05+(i%2)*.24+Math.sin(time+i)*.08);
  }
  projects.forEach(project=>{
    const root=new THREE.Group();root.userData.projectId=project.id;scene.add(root);
    const model=new THREE.Group();model.position.y=.19;root.add(model);
    const glow=new THREE.MeshStandardMaterial({color:project.accent,emissive:project.accent,emissiveIntensity:1.5,roughness:.3});
    const base=cylinder(root,1.83,.2,dark,0,.05,0);
    const haloMaterial=new THREE.MeshBasicMaterial({color:new THREE.Color(project.accent).multiplyScalar(2.5),transparent:true,opacity:.75,toneMapped:false});
    const halo=ring(root,1.87,haloMaterial,.18);
    const e={root,model,project,glow,halo,haloMaterial,base,active:false,effectTime:10,label:document.querySelector('#scene-labels [data-scene-project="'+project.id+'"]')};
    const aura=new THREE.Mesh(new THREE.PlaneGeometry(6.8,6.8),new THREE.MeshBasicMaterial({map:auraTexture,color:project.accent,transparent:true,opacity:.2,depthWrite:false}));
    aura.rotation.x=-Math.PI/2;aura.position.y=-.07;root.add(aura);
    const lamp=new THREE.PointLight(project.accent,3,4,2);lamp.position.set(0,1.6,1.8);root.add(lamp);
    if(project.visual==='jump'||project.visual==='danro')addArcade(e,projectTextures[project.id],project.visual==='jump'?'DANRO JUMP':'DANRO');
    else if(project.visual==='exchanger')addKiosk(e);
    else if(project.visual==='plate'||project.visual==='typing')addComputer(e,project.visual==='typing');
    else if(project.visual==='wizard')addWizard(e);
    else if(project.visual==='led')addLed(e);
    else addThemes(e);
    root.traverse(o=>{if(o.isMesh||o.isSprite)clickable.push(o)});exhibits.push(e);
  });
  const railMaterial=new THREE.MeshBasicMaterial({color:'#62a79e',transparent:true,opacity:.35});
  for(const z of [-9,-.5,8])box(scene,29,.015,.02,railMaterial,0,-.06,z,.005);
  for(const x of [-12,12])box(scene,.02,.015,24,railMaterial,x,-.06,-.5,.005);
  const orbit=new THREE.Mesh(new THREE.TorusGeometry(18,.025,8,160),new THREE.MeshBasicMaterial({color:0x6868c6,transparent:true,opacity:.28}));
  orbit.rotation.x=Math.PI/2;orbit.position.y=.02;scene.add(orbit);
  const particleGeometry=new THREE.BufferGeometry(),positions=new Float32Array(240*3);
  for(let i=0;i<240;i++){positions[i*3]=Math.sin(i*2.4)*24;positions[i*3+1]=.8+(i%17)*.7;positions[i*3+2]=Math.cos(i*2.4)*24-2}
  particleGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const particles=new THREE.Points(particleGeometry,new THREE.PointsMaterial({color:'#77b4ca',size:.035,transparent:true,opacity:.45}));scene.add(particles);
  let visible=true,motion=!reduce.matches,selected=null,tween=null,lastTime=performance.now(),animationFrame,needsRender=true;
  let mobile=innerWidth<700;
  function layout(){
    mobile=host.clientWidth<700;
    exhibits.forEach((e,i)=>e.root.position.set(mobile?(i%2)*4.5-2.25:(i%4)*4.7-7.05,0,mobile?4-Math.floor(i/2)*5:3-Math.floor(i/4)*6));
  }
  function overviewPose(){return mobile?{position:new THREE.Vector3(9,24,28),target:new THREE.Vector3(0,.6,-3)}:{position:new THREE.Vector3(10,10,21),target:new THREE.Vector3(0,.7,-.5)}}
  function moveTo(position,target){
    if(reduce.matches){camera.position.copy(position);controls.target.copy(target);controls.update();tween=null;return}
    tween={from:camera.position.clone(),targetFrom:controls.target.clone(),to:position,targetTo:target,start:performance.now(),duration:950};
  }
  function overview(){selected=null;const pose=overviewPose();moveTo(pose.position,pose.target);host.dataset.focus='overview';}
  function focus(id){
    const e=exhibits.find(x=>x.project.id===id);if(!e)return;
    selected=id;const target=e.root.position.clone().add(new THREE.Vector3(0,1.6,0));
    moveTo(target.clone().add(mobile?new THREE.Vector3(4.2,3.7,8.8):new THREE.Vector3(4.7,3.6,7.7)),target);
    host.dataset.focus=id;
  }
  function filter(next){exhibits.forEach(e=>{e.root.visible=next==='all'||e.project.category===next});host.dataset.filter=next;needsRender=true;}
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function hit(event){
    const r=renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(clickable.filter(o=>{let parent=o;while(parent){if(!parent.visible)return false;parent=parent.parent}return true}),false);
    if(!hits.length)return null;
    let object=hits[0].object;while(object&&!object.userData.projectId)object=object.parent;return object?.userData.projectId;
  }
  let pointerStart=null,hover=null,lastHover=0;
  renderer.domElement.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY,time:performance.now()};tween=null});
  renderer.domElement.addEventListener('pointerup',e=>{
    if(pointerStart&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)<7&&performance.now()-pointerStart.time<600){const id=hit(e);if(id)onSelect(id);}
    pointerStart=null;
  });
  renderer.domElement.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch'||performance.now()-lastHover<50)return;
    lastHover=performance.now();const nextHover=hit(e);if(hover!==nextHover)needsRender=true;hover=nextHover;renderer.domElement.style.cursor=hover?'pointer':'grab';
  });
  renderer.domElement.addEventListener('pointerleave',()=>{hover=null;pointerStart=null;needsRender=true});
  controls.addEventListener('start',()=>{tween=null});
  controls.addEventListener('change',()=>{needsRender=true});
  const projection=new THREE.Vector3();
  function labels(){
    const w=host.clientWidth,h=host.clientHeight;
    for(const e of exhibits){
      projection.copy(e.root.position).add(new THREE.Vector3(0,3.95,0)).project(camera);
      const x=(projection.x*.5+.5)*w,y=(-projection.y*.5+.5)*h;
      e.label.hidden=!e.root.visible||!!selected||projection.z>1||x<40||x>w-40||y<95||y>h-240;
      e.label.style.transform='translate('+x+'px,'+y+'px) translate(-50%,-100%)';
    }
  }
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    needsRender=true;
    const wasMobile=mobile;layout();renderer.setSize(w,h,false);composer?.setSize(w,h);camera.aspect=w/h;
    scene.fog.density=mobile?.016:.03;
    renderer.toneMappingExposure=mobile?1.3:1.1;
    camera.setViewOffset(w,h,mobile?0:-w*.125,mobile?(selected?h*.12:-h*.045):0,w,h);camera.updateProjectionMatrix();
    if(wasMobile!==mobile){if(selected)focus(selected);else overview()}labels();
  }
  const observer=new ResizeObserver(resize);observer.observe(host);
  layout();const initial=overviewPose();camera.position.copy(initial.position);controls.target.copy(initial.target);controls.update();resize();
  document.querySelector('#scene-load-status').textContent='Выставка готова / 08 проектов';
  host.dataset.ready='true';host.dataset.focus='overview';host.dataset.filter='all';
  function frame(now){
    animationFrame=requestAnimationFrame(frame);
    if(!visible||document.hidden||document.querySelector('dialog[open]')){lastTime=now;return}
    if (now-lastTime < (mobile ? 30 : 14)) return;
    const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;
    const moving=!!tween;
    if(tween){const t=Math.min((now-tween.start)/tween.duration,1),ease=t*t*(3-2*t);camera.position.lerpVectors(tween.from,tween.to,ease);controls.target.lerpVectors(tween.targetFrom,tween.targetTo,ease);if(t===1)tween=null;}
    const controlsChanged=controls.update();
    if(!motion&&!moving&&!controlsChanged&&!needsRender)return;
    for(const e of exhibits){
      e.haloMaterial.opacity=(e.project.id===selected||e.project.id===hover) ? .95 : .55;
      e.halo.scale.setScalar(e.project.id===selected?1.04:1);
      if(motion)e.animate?.(now/1000,dt);
    }
    if(motion)particles.rotation.y=now*.000006;
    labels();if(composer&&!mobile)composer.render();else renderer.render(scene,camera);needsRender=false;
  }
  animationFrame=requestAnimationFrame(frame);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(animationFrame);onFailure()});
  function dispose(){
    cancelAnimationFrame(animationFrame);observer.disconnect();controls.dispose();
    const materials=new Set(),geometries=new Set();
    scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m))});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());composer?.passes.forEach(pass=>pass.dispose?.());composer?.dispose();env.dispose();renderer.dispose();
  }
  window.addEventListener('pagehide',e=>{if(!e.persisted)dispose()});
  return {
    focus(id){focus(id);resize()},overview(){overview();resize()},filter,
    interact(id){const e=exhibits.find(x=>x.project.id===id);if(!e)return '';const result=e.activate();shell.dataset.effect=id;needsRender=true;return result},
    setVisible(value){visible=value;needsRender=true},setMotion(value){motion=value;host.dataset.motion=String(value);needsRender=true},resize,
  };
}
