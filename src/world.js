import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createWorld({ projects, onSelect, onFailure }) {
  const host=document.querySelector('#scene-canvas');
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#0a0c13');
  const camera=new THREE.PerspectiveCamera(38,1,.1,80);
  const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(room,.04);
  scene.environment=env.texture;scene.environmentIntensity=.9;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xd7e2ff,0x101018,2));
  for(const [color,intensity,pos] of [[0xf3f4ff,5,[-5,8,9]],[0x667cff,6,[8,4,3]],[0x76c1ff,3,[-2,1,-5]]]){const l=new THREE.DirectionalLight(color,intensity);l.position.set(...pos);scene.add(l);}
  const pc=new THREE.Group();scene.add(pc);
  const metal=new THREE.MeshStandardMaterial({color:'#333a49',metalness:.85,roughness:.3});
  const black=new THREE.MeshStandardMaterial({color:'#111520',metalness:.5,roughness:.32});
  const keyMaterial=new THREE.MeshStandardMaterial({color:'#4b5262',metalness:.3,roughness:.44});
  const lightMaterial=new THREE.MeshBasicMaterial({color:'#91a5ff'});
  const clickable=[],textures=new Map(),titles=new Map(),loader=new THREE.TextureLoader();
  let dirty=true,motion=true,visible=true,current=projects[0],category='all',animation,last=0,elapsed=0;
  let video,videoTexture,playing=false,pointerDown,dragging=false;
  const pointer=new THREE.Vector2(),tilt=new THREE.Vector2();
  function box(w,h,d,material,x=0,y=0,z=0,parent=pc,r=.05){const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/3,h/3,d/3)),material);m.position.set(x,y,z);parent.add(m);return m;}
  function plane(w,h,texture,x,y,z,parent=pc){const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);m.position.set(x,y,z);parent.add(m);return m;}
  function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
  projects.forEach(p=>{
    const t=loader.load(p.image,()=>{dirty=true;});t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.set(p.id,t);
  });
  function titleFor(p,width){
    const key=p.id+'-'+width.toFixed(2);if(titles.has(key))return titles.get(key);
    const texture=canvasTexture(Math.round(width*330),66,(ctx,w,h)=>{ctx.fillStyle='#20283c';ctx.fillRect(0,0,w,h);ctx.fillStyle=p.accent;ctx.beginPath();ctx.roundRect(21,20,26,26,7);ctx.fill();ctx.font='500 26px sans-serif';ctx.fillStyle='#e3e8fa';ctx.fillText(p.title,65,42);ctx.font='19px monospace';ctx.textAlign='right';ctx.fillStyle='#8c9bb9';ctx.fillText(p.stack.slice(0,2).join(' / '),w-24,42);});
    titles.set(key,texture);return texture;
  }
  // A real desk silhouette: monitor, articulated stand, tower, keyboard and mouse.
  box(13.7,.22,5.2,new THREE.MeshStandardMaterial({color:'#080c15',metalness:.15,roughness:.7}),.5,-2.1,1);
  box(8.6,5.12,.34,black,0,1.08,0);
  box(8.42,4.91,.07,metal,0,1.12,.19);
  box(.35,1.25,.38,metal,0,-1.96,-.22);
  box(2.1,.12,1.36,metal,0,-1.92,.03);
  box(.25,.025,.012,lightMaterial,0,-1.38,.245);
  const wallpaper=canvasTexture(1600,900,(ctx,w,h)=>{
    const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#142751');g.addColorStop(.52,'#10223f');g.addColorStop(1,'#07101f');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    for(let i=0;i<4;i++){ctx.lineWidth=105-i*15;ctx.strokeStyle=['#5563a42a','#697acd24','#7a91dc1c','#96b5fc15'][i];ctx.beginPath();ctx.ellipse(1200,400,500+i*35,230+i*22,-.4,0,Math.PI*2);ctx.stroke();}
    ctx.font='20px monospace';ctx.fillStyle='#8fadd4';ctx.fillText('DANIL YAROSH / WORKSPACE',42,49);ctx.textAlign='right';ctx.fillText('08 PROJECTS',w-42,49);
  });
  plane(8.1,4.56,wallpaper,0,1.12,.236);
  const taskbar=new THREE.Group();taskbar.position.set(0,-.91,.3);pc.add(taskbar);
  box(8.1,.34,.02,new THREE.MeshBasicMaterial({color:'#101a2c'}),0,0,0,taskbar);
  projects.forEach((p,i)=>{
    const icon=canvasTexture(100,100,(ctx,w,h)=>{ctx.fillStyle=p.accent;ctx.beginPath();ctx.roundRect(12,12,76,76,19);ctx.fill();ctx.fillStyle='#172238';ctx.font='bold 35px sans-serif';ctx.textAlign='center';ctx.fillText(p.number,50,63);});
    const m=plane(.22,.22,icon,-1.7+i*.48,0,.02,taskbar);m.userData.projectId=p.id;clickable.push(m);
  });
  const tower=new THREE.Group();tower.position.set(5.32,-.17,-.22);pc.add(tower);
  box(1.75,3.65,2.35,black,0,0,0,tower,.11);
  box(1.54,3.42,.045,new THREE.MeshPhysicalMaterial({color:'#243047',metalness:.72,roughness:.22}),0,0,1.19,tower);
  const fans=[];
  for(let i=0;i<3;i++){
    const torus=new THREE.Mesh(new THREE.TorusGeometry(.43,.028,8,48),new THREE.MeshBasicMaterial({color:i===1?'#84cdd5':'#8095ff'}));torus.position.set(0,.85-i*.9,1.23);tower.add(torus);
    const fan=new THREE.Group();fan.position.copy(torus.position);tower.add(fan);
    for(let j=0;j<5;j++){const blade=box(.095,.28,.01,metal,0,.19,0,fan,.03);const pivot=new THREE.Group();fan.add(pivot);pivot.rotation.z=j*Math.PI*2/5;pivot.add(blade);}
    fans.push(fan);
  }
  box(.13,.03,.012,lightMaterial,.52,1.45,1.23,tower);
  const keyboard=new THREE.Group();keyboard.position.set(-.35,-1.94,2.08);keyboard.rotation.y=-.06;pc.add(keyboard);
  box(4.4,.16,1.36,black,0,0,0,keyboard,.09);
  const keyGeometry=new RoundedBoxGeometry(.235,.095,.23,2,.025);
  for(let row=0;row<4;row++)for(let col=0;col<14;col++){const key=new THREE.Mesh(keyGeometry,keyMaterial);key.position.set(-1.86+col*.285,.12,-.45+row*.285);keyboard.add(key);}
  box(1.45,.09,.22,keyMaterial,-.15,.12,.58,keyboard,.025);
  box(4.1,.018,.018,new THREE.MeshBasicMaterial({color:'#6d82c5'}),0,.03,.69,keyboard);
  const mouse=new THREE.Group();mouse.position.set(3,-1.82,2.1);mouse.rotation.y=-.16;pc.add(mouse);
  const mouseBody=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),black);mouseBody.scale.set(.35,.19,.55);mouse.add(mouseBody);box(.045,.035,.14,keyMaterial,0,.19,-.12,mouse,.012);
  // Three overlapping application windows stay within the physical display.
  function appWindow(){
    const group=new THREE.Group();pc.add(group);
    const backdrop=box(1,1,.013,new THREE.MeshBasicMaterial({color:'#080e1c'}),0,0,0,group,.012);
    const border=box(1,1,.018,new THREE.MeshBasicMaterial({color:'#425271'}),0,0,-.01,group,.013);
    const image=plane(1,1,null,0,-.08,.018,group),bar=plane(1,.2,null,0,0,.023,group);
    clickable.push(image,bar,backdrop);return {group,backdrop,border,image,bar};
  }
  const active=appWindow(),previous=appWindow(),next=appWindow();
  function fillWindow(frame,p,w,h){
    const aspect=p.media.items[0].width/p.media.items[0].height;
    if(aspect<1)w=(h-.25)*aspect+.15;
    frame.group.userData.projectId=p.id;for(const child of frame.group.children)child.userData.projectId=p.id;
    frame.backdrop.scale.set(w,h,1);frame.border.scale.set(w+.035,h+.035,1);
    const ih=Math.min(h-.25,(w-.12)/aspect),iw=ih*aspect;
    frame.image.scale.set(iw,ih,1);frame.image.material.map=textures.get(p.id);frame.image.material.needsUpdate=true;
    frame.bar.scale.x=w;frame.bar.position.y=h/2-.1;frame.bar.material.map=titleFor(p,w);frame.bar.material.needsUpdate=true;
  }
  active.group.position.set(.28,1.07,.36);previous.group.position.set(-1.3,1.67,.275);next.group.position.set(1.18,.55,.295);
  function stopVideo(){
    playing=false;if(video){video.pause();video.removeAttribute('src');video.load();video.remove();video=undefined;}videoTexture?.dispose();videoTexture=undefined;
    active.image.material.map=textures.get(current.id);dirty=true;document.querySelector('#scene-interact').textContent='▶ Смотреть запись';
  }
  function focus(id){
    const p=projects.find(p=>p.id===id);if(!p)return;stopVideo();current=p;
    const list=projects.filter(p=>category==='all'||p.category===category),index=list.findIndex(p=>p.id===id);
    fillWindow(active,p,5.9,3.49);fillWindow(previous,list[(index-1+list.length)%list.length],4.85,2.86);fillWindow(next,list[(index+1)%list.length],4.8,2.7);
    previous.group.visible=next.group.visible=list.length>1;
    if(motion)animation={start:performance.now()};else active.group.scale.setScalar(1);
    host.dataset.project=id;dirty=true;
  }
  const raycaster=new THREE.Raycaster();
  function targetAt(e){const r=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);return raycaster.intersectObjects(clickable,false).find(hit=>hit.object.parent.visible)?.object.userData.projectId;}
  host.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY};dragging=false;host.setPointerCapture(e.pointerId);});
  host.addEventListener('pointermove',e=>{if(pointerDown){const dx=e.clientX-pointerDown.x,dy=e.clientY-pointerDown.y;dragging||=Math.hypot(dx,dy)>7;tilt.set(THREE.MathUtils.clamp(dx*.0015,-.28,.28),THREE.MathUtils.clamp(dy*.001,-.12,.12));dirty=true;}else{const r=host.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5);host.style.cursor=targetAt(e)?'pointer':'grab';if(motion)dirty=true;}});
  host.addEventListener('pointerup',e=>{if(pointerDown&&!dragging){const id=targetAt(e);if(id)onSelect(id);}pointerDown=undefined;tilt.set(0,0);dirty=true;});host.addEventListener('pointercancel',()=>{pointerDown=undefined;tilt.set(0,0);dirty=true;});
  function resize(){
    const w=host.clientWidth,h=host.clientHeight,mobile=innerWidth<700;
    renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.75));renderer.setSize(w,h);camera.aspect=w/h;
    camera.position.set(0,mobile?3.5:3.2,mobile?18.8:17.4);camera.lookAt(0,.2,0);camera.updateProjectionMatrix();
    pc.position.set(mobile?-1.2:innerWidth<900?1.65:innerWidth<1100?2.05:1.75,mobile?.05:0,0);pc.scale.setScalar(mobile?1.08:innerWidth<900?.48:innerWidth<1100?.72:1);
    pc.rotation.y=-.1;dirty=true;
  }
  new ResizeObserver(resize).observe(host);renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();stopVideo();onFailure();});
  focus(current.id);resize();host.dataset.ready='true';
  function tick(now){
    requestAnimationFrame(tick);if(document.hidden||!visible)return;
    if(document.querySelector('dialog[open]')){if(video)stopVideo();return;}
    if(!motion&&!dirty&&!playing&&!animation&&!pointerDown)return;if(now-last<(innerWidth<700?32:20))return;
    elapsed+=Math.min((now-last)/1000,.05);last=now;
    pc.rotation.y=THREE.MathUtils.lerp(pc.rotation.y,-.1+tilt.x+(motion?pointer.x*.035:0),.15);pc.rotation.x=THREE.MathUtils.lerp(pc.rotation.x,tilt.y,.15);
    if(motion)fans.forEach((fan,i)=>{fan.rotation.z=elapsed*(1.2+i*.2);});
    if(animation){const t=Math.min((now-animation.start)/500,1);active.group.scale.setScalar(.965+.035*(1-Math.pow(1-t,3)));if(t===1)animation=undefined;}
    renderer.render(scene,camera);dirty=false;
  }
  requestAnimationFrame(tick);
  return {
    focus,overview(){category='all';focus(projects[0].id);tilt.set(0,0);pointer.set(0,0);dirty=true;},filter(value){category=value;focus(projects.find(p=>value==='all'||p.category===value).id);},
    async interact(id){
      if(playing){stopVideo();return 'Запись остановлена.';}if(current.id!==id)focus(id);
      const clip=current.media.items.find(i=>i.type==='video');if(!clip)return 'Для проекта нет записи.';
      video=document.createElement('video');video.src=clip.src;video.muted=true;video.playsInline=true;video.preload='metadata';video.hidden=true;video.dataset.sceneVideo='true';host.appendChild(video);const requested=video;
      try{await requested.play();if(video!==requested)return 'Запись остановлена.';videoTexture=new THREE.VideoTexture(video);videoTexture.colorSpace=THREE.SRGBColorSpace;active.image.material.map=videoTexture;playing=true;dirty=true;document.querySelector('#scene-interact').textContent='Ⅱ Остановить запись';video.addEventListener('ended',stopVideo,{once:true});return 'Запись работы проекта · без звука';}catch{if(video===requested)stopVideo();return 'Запись можно открыть в подробностях проекта.';}
    },
    stopVideo,setVisible(value){visible=value;if(!value)stopVideo();dirty=true;},setMotion(value){motion=value;host.dataset.motion=String(value);if(!value)animation=undefined;dirty=true;},resize,
  };
}
