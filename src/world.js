import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createWorld({ projects, onSelect, onFailure }) {
  const host = document.querySelector('#scene-canvas');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0a0b12');
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 70);
  const room = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture; scene.environmentIntensity = 1.1;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xd9e3ff, 0x12121c, 2));
  for (const [color, intensity, position] of [[0xecf0ff, 7, [-4,8,9]], [0x5e76ff,8,[8,3,4]], [0xb8c8ff,6,[1,-5,2]]]) {
    const light = new THREE.DirectionalLight(color, intensity); light.position.set(...position); scene.add(light);
  }
  const stage = new THREE.Group(); scene.add(stage);
  const chrome = new THREE.MeshPhysicalMaterial({ color:'#acb8d3', metalness:1, roughness:.22, clearcoat:1, side:THREE.DoubleSide });
  const cobalt = new THREE.MeshPhysicalMaterial({ color:'#3548e8', metalness:.82, roughness:.21, clearcoat:1, side:THREE.DoubleSide });
  const graphite = new THREE.MeshStandardMaterial({ color:'#101522', metalness:.8, roughness:.28 });
  const edge = new THREE.MeshBasicMaterial({ color:'#7c92ff', transparent:true, opacity:.65 });
  let visible=true, motion=true, dirty=true, current=projects[0], elapsed=0, category='all', animation, last=0;
  let video, videoTexture, playing=false, pointerDown, dragging=false;
  const aim=new THREE.Vector2(), rotation=new THREE.Vector2(), textures=new Map(), loader=new THREE.TextureLoader();
  projects.forEach(p=>{const t=loader.load(p.image,()=>{dirty=true;});t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.set(p.id,t);});
  function mesh(geometry,material,parent=stage){const m=new THREE.Mesh(geometry,material);parent.add(m);return m;}
  // Broad bent metal surfaces, lit like a sculpture in a photography studio.
  function ribbon(offset,material,scale){
    const positions=[],indices=[],count=180;
    for(let i=0;i<=count;i++){
      const t=i/count*Math.PI*1.86+offset;
      for(const side of [-1,1]){const width=side*(.28+.18*Math.sin(t*2));positions.push((3.65+width*Math.cos(t*1.4))*Math.cos(t),(2.8+width*Math.cos(t*1.4))*Math.sin(t),Math.sin(t*2)*.85+width*Math.sin(t*1.4));}
      if(i<count){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    const m=mesh(geometry,material);m.scale.setScalar(scale);m.position.z=-1.6;m.rotation.set(.12,-.22,-.28);return m;
  }
  const sculpture=ribbon(.25,chrome,1), accentRibbon=ribbon(2.8,cobalt,.86);
  accentRibbon.rotation.set(.25,.45,.38);accentRibbon.position.z=-2.1;
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;
  const context=glowCanvas.getContext('2d'), gradient=context.createRadialGradient(64,64,0,64,64,64);
  gradient.addColorStop(0,'#5760f966');gradient.addColorStop(.5,'#343dba18');gradient.addColorStop(1,'#20224a00');context.fillStyle=gradient;context.fillRect(0,0,128,128);
  const glowTexture=new THREE.CanvasTexture(glowCanvas);
  const glow=mesh(new THREE.PlaneGeometry(15,12),new THREE.MeshBasicMaterial({map:glowTexture,transparent:true,depthWrite:false}));glow.position.z=-3.8;
  function makeFrame(){
    const group=new THREE.Group();stage.add(group);
    const body=mesh(new RoundedBoxGeometry(1,1,.15,4,.055),graphite,group);
    const border=mesh(new RoundedBoxGeometry(1,1,.025,4,.02),chrome,group);border.position.z=.081;
    const pictureMaterial=new THREE.MeshBasicMaterial({toneMapped:false});
    const picture=mesh(new THREE.PlaneGeometry(1,1),pictureMaterial,group);picture.position.z=.099;
    const indicator=mesh(new THREE.PlaneGeometry(.2,.025),edge,group);indicator.position.z=.11;
    return {group,body,border,picture,indicator,pictureMaterial};
  }
  const hero=makeFrame(), previous=makeFrame(), next=makeFrame();
  function fillFrame(frame,p,maxWidth,maxHeight){
    const item=p.media.items[0],aspect=item.width/item.height,height=Math.min(maxHeight,maxWidth/aspect),width=height*aspect;
    frame.body.scale.set(width+.18,height+.18,1);frame.border.scale.set(width+.09,height+.09,1);frame.picture.scale.set(width,height,1);
    frame.pictureMaterial.map=textures.get(p.id);frame.pictureMaterial.needsUpdate=true;
    frame.indicator.position.set(width/2-.2,-height/2-.06,.11);frame.group.userData.projectId=p.id;
  }
  previous.group.position.set(-2.8,-.25,-2.7);previous.group.rotation.set(.04,.36,-.15);previous.group.scale.setScalar(.68);
  next.group.position.set(2.65,.65,-2.2);next.group.rotation.set(-.04,-.35,.14);next.group.scale.setScalar(.68);
  hero.group.rotation.set(-.04,-.16,.035);
  function stopVideo(){
    playing=false;if(video){video.pause();video.removeAttribute('src');video.load();video.remove();video=undefined;}videoTexture?.dispose();videoTexture=undefined;
    hero.pictureMaterial.map=textures.get(current.id);dirty=true;document.querySelector('#scene-interact').textContent='Смотреть видео ↗';
  }
  function focus(id){
    const p=projects.find(p=>p.id===id);if(!p)return;
    const oldIndex=projects.indexOf(current);stopVideo();current=p;
    const list=projects.filter(p=>category==='all'||p.category===category),index=list.findIndex(p=>p.id===id);
    fillFrame(hero,p,5.5,4.65);fillFrame(previous,list[(index-1+list.length)%list.length],3.8,4.7);fillFrame(next,list[(index+1)%list.length],3.8,4.7);
    previous.group.visible=next.group.visible=list.length>1;edge.color.set(p.accent);
    if(motion)animation={start:performance.now(),direction:projects.indexOf(p)>=oldIndex?1:-1};else hero.group.position.set(0,0,.65);
    host.dataset.project=id;dirty=true;
  }
  const raycaster=new THREE.Raycaster();
  function targetAt(event){
    const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
    const hit=raycaster.intersectObjects([hero.picture,previous.picture,next.picture],false).find(h=>h.object.parent.visible);return hit?.object.parent.userData.projectId;
  }
  host.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY};dragging=false;host.setPointerCapture(e.pointerId);});
  host.addEventListener('pointermove',e=>{
    if(pointerDown){const dx=e.clientX-pointerDown.x,dy=e.clientY-pointerDown.y;dragging||=Math.hypot(dx,dy)>7;rotation.set(THREE.MathUtils.clamp(dx*.003,-.5,.5),THREE.MathUtils.clamp(dy*.002,-.25,.25));dirty=true;}
    else{const r=host.getBoundingClientRect();aim.set((e.clientX/r.width-.5)*.14,(e.clientY/r.height-.5)*.09);host.style.cursor=targetAt(e)?'pointer':'grab';if(motion)dirty=true;}
  });
  host.addEventListener('pointerup',e=>{if(pointerDown&&!dragging){const id=targetAt(e);if(id)onSelect(id);}pointerDown=undefined;rotation.set(0,0);dirty=true;});
  host.addEventListener('pointercancel',()=>{pointerDown=undefined;rotation.set(0,0);dirty=true;});host.addEventListener('pointerleave',()=>aim.set(0,0));
  function resize(){
    const w=host.clientWidth,h=host.clientHeight,mobile=w<700;
    renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.75));renderer.setSize(w,h);camera.aspect=w/h;camera.position.set(0,0,mobile?18.4:14.8);
    if(mobile){stage.position.set(0,-1.7,0);stage.scale.setScalar(.72);camera.setViewOffset(w,h,0,h*.06,w,h);}
    else{stage.position.set(w/h<1.3?2.5:3.1,.25,0);stage.scale.setScalar(w<1100?.88:1);camera.clearViewOffset();}
    camera.updateProjectionMatrix();dirty=true;
  }
  new ResizeObserver(resize).observe(host);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();stopVideo();onFailure();});
  focus(current.id);resize();host.dataset.ready='true';
  function tick(now){
    requestAnimationFrame(tick);if(document.hidden||!visible)return;
    if(document.querySelector('dialog[open]')){if(video&&!video.paused)video.pause();return;}
    if(!motion&&!animation&&!pointerDown&&!playing&&!dirty)return;
    if(now-last<(innerWidth<700?32:20))return;elapsed+=Math.min((now-last)/1000,.05);last=now;
    if(motion){sculpture.rotation.z=-.28+Math.sin(elapsed*.12)*.08;accentRibbon.rotation.z=.38-Math.sin(elapsed*.12)*.12;hero.group.position.y=Math.sin(elapsed*.6)*.07;previous.group.position.y=-.25+Math.sin(elapsed*.5+1)*.09;next.group.position.y=.65+Math.sin(elapsed*.5+2)*.09;}
    hero.group.rotation.y=THREE.MathUtils.lerp(hero.group.rotation.y,-.16+rotation.x+(motion?aim.x:0),.12);hero.group.rotation.x=THREE.MathUtils.lerp(hero.group.rotation.x,-.04+rotation.y+(motion?aim.y:0),.12);
    if(animation){const t=Math.min((now-animation.start)/850,1),ease=1-Math.pow(1-t,3);hero.group.position.x=(1-ease)*animation.direction*1.4;hero.group.position.z=.65-(1-ease)*1.8;hero.group.rotation.z=.035+(1-ease)*animation.direction*.13;if(t===1)animation=undefined;}
    renderer.render(scene,camera);dirty=false;
  }
  requestAnimationFrame(tick);
  return {
    focus,overview(){category='all';focus(projects[0].id);},filter(value){category=value;focus(projects.find(p=>value==='all'||p.category===value).id);},
    async interact(id){
      if(playing){stopVideo();return 'Видео остановлено.';}if(current.id!==id)focus(id);
      const clip=current.media.items.find(i=>i.type==='video');if(!clip)return 'Для проекта нет видеозаписи.';
      video=document.createElement('video');video.src=clip.src;video.muted=true;video.playsInline=true;video.preload='metadata';video.hidden=true;video.dataset.sceneVideo='true';host.appendChild(video);
      const requestedVideo=video;
      try{await requestedVideo.play();if(video!==requestedVideo)return 'Видео остановлено.';videoTexture=new THREE.VideoTexture(video);videoTexture.colorSpace=THREE.SRGBColorSpace;hero.pictureMaterial.map=videoTexture;playing=true;dirty=true;document.querySelector('#scene-interact').textContent='Остановить видео Ⅱ';video.addEventListener('ended',stopVideo,{once:true});return 'На экране — запись работы проекта. Без звука.';}
      catch{stopVideo();return 'Видео можно открыть в подробностях проекта.';}
    },
    stopVideo,setVisible(value){visible=value;if(!value)stopVideo();dirty=true;},setMotion(value){motion=value;host.dataset.motion=String(value);if(!value)animation=undefined;dirty=true;},resize,
  };
}
