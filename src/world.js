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
  const windowPositions=new Map(),pressedKeys=new Map(),keyMeshes=new Map();
  const powerControl=document.querySelector('#scene-power'),controlStatus=document.querySelector('#scene-control-status');
  let powered=true,gesture;
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
  const monitorLed=box(.25,.025,.012,lightMaterial,0,-1.38,.245);
  const wallpaper=canvasTexture(1600,900,(ctx,w,h)=>{
    const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#142751');g.addColorStop(.52,'#10223f');g.addColorStop(1,'#07101f');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    for(let i=0;i<4;i++){ctx.lineWidth=105-i*15;ctx.strokeStyle=['#5563a42a','#697acd24','#7a91dc1c','#96b5fc15'][i];ctx.beginPath();ctx.ellipse(1200,400,500+i*35,230+i*22,-.4,0,Math.PI*2);ctx.stroke();}
    ctx.font='20px monospace';ctx.fillStyle='#8fadd4';ctx.fillText('DANIL YAROSH / WORKSPACE',42,49);ctx.textAlign='right';ctx.fillText('08 PROJECTS',w-42,49);
  });
  box(8.1,4.56,.012,new THREE.MeshBasicMaterial({color:'#020408'}),0,1.12,.228);
  const desktop=plane(8.1,4.56,wallpaper,0,1.12,.246);
  const taskbar=new THREE.Group();taskbar.position.set(0,-.91,.3);pc.add(taskbar);
  box(8.1,.34,.02,new THREE.MeshBasicMaterial({color:'#101a2c'}),0,0,0,taskbar);
  projects.forEach((p,i)=>{
    const icon=canvasTexture(100,100,(ctx,w,h)=>{ctx.fillStyle=p.accent;ctx.beginPath();ctx.roundRect(12,12,76,76,19);ctx.fill();ctx.fillStyle='#172238';ctx.font='bold 35px sans-serif';ctx.textAlign='center';ctx.fillText(p.number,50,63);});
    const m=plane(.22,.22,icon,-1.7+i*.48,0,.02,taskbar);m.userData.projectId=p.id;clickable.push(m);
  });
  const tower=new THREE.Group();tower.position.set(5.32,-.17,-.22);pc.add(tower);
  box(1.75,3.65,2.35,black,0,0,0,tower,.11);
  box(1.54,3.42,.045,new THREE.MeshPhysicalMaterial({color:'#243047',metalness:.72,roughness:.22}),0,0,1.19,tower);
  const fans=[],fanLights=[];
  for(let i=0;i<3;i++){
    const torus=new THREE.Mesh(new THREE.TorusGeometry(.43,.028,8,48),new THREE.MeshBasicMaterial({color:i===1?'#84cdd5':'#8095ff'}));torus.position.set(0,.85-i*.9,1.23);tower.add(torus);
    fanLights.push({material:torus.material,color:torus.material.color.clone()});
    const fan=new THREE.Group();fan.position.copy(torus.position);tower.add(fan);
    for(let j=0;j<5;j++){const blade=box(.095,.28,.01,metal,0,.19,0,fan,.03);const pivot=new THREE.Group();fan.add(pivot);pivot.rotation.z=j*Math.PI*2/5;pivot.add(blade);}
    fans.push(fan);
  }
  const powerTexture=canvasTexture(128,128,ctx=>{ctx.strokeStyle='#c8d6ff';ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();ctx.arc(64,67,36,-Math.PI*.34,Math.PI*1.34);ctx.stroke();ctx.beginPath();ctx.moveTo(64,18);ctx.lineTo(64,60);ctx.stroke();});
  box(.43,.43,.025,metal,.5,1.43,1.235,tower,.14);
  const powerButton=plane(.35,.35,powerTexture,.5,1.43,1.26,tower);powerButton.userData.kind='power';clickable.push(powerButton);
  powerButton.material.transparent=true;powerButton.material.alphaTest=.1;
  const keyboard=new THREE.Group();keyboard.position.set(-.35,-1.94,2.08);keyboard.rotation.y=-.06;pc.add(keyboard);
  box(4.4,.16,1.36,black,0,0,0,keyboard,.09);
  const keyGeometry=new RoundedBoxGeometry(.235,.095,.23,2,.025);
  const rows=[['Esc','1','2','3','4','5','6','7','8','9','0','-','=','⌫'],['Tab','Q','W','E','R','T','Y','U','I','O','P','[',']','\\'],['Caps','A','S','D','F','G','H','J','K','L',';','\u0027','Enter','↑'],['Shift','Z','X','C','V','B','N','M',',','.','/','←','↓','→']];
  function registerKey(key,label){
    key.userData.kind='key';key.userData.label=label;clickable.push(key);keyMeshes.set(label,key);
    const texture=canvasTexture(96,96,ctx=>{ctx.fillStyle='#d5def3';ctx.font=(label.length>2?'22':'42')+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,48,48);});
    const glyph=plane(.18,.17,texture,0,.052,0,key);glyph.rotation.x=-Math.PI/2;
    glyph.material.transparent=true;glyph.material.alphaTest=.1;
  }
  for(let row=0;row<4;row++)for(let col=0;col<14;col++){const key=new THREE.Mesh(keyGeometry,keyMaterial.clone());key.position.set(-1.86+col*.285,.12,-.45+row*.285);keyboard.add(key);registerKey(key,rows[row][col]);}
  const space=box(1.45,.09,.22,keyMaterial.clone(),-.15,.12,.58,keyboard,.025);registerKey(space,'Space');
  const keyboardLight=box(4.1,.018,.018,new THREE.MeshBasicMaterial({color:'#6d82c5'}),0,.03,.69,keyboard);
  const mouse=new THREE.Group();mouse.position.set(3,-1.82,2.1);mouse.rotation.y=-.16;pc.add(mouse);
  const mouseBody=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),black);mouseBody.scale.set(.35,.19,.55);mouse.add(mouseBody);box(.045,.035,.14,keyMaterial,0,.19,-.12,mouse,.012);
  // Three overlapping application windows stay within the physical display.
  function appWindow(){
    const group=new THREE.Group();pc.add(group);
    const backdrop=box(1,1,.013,new THREE.MeshBasicMaterial({color:'#080e1c'}),0,0,0,group,.012);
    const border=box(1,1,.018,new THREE.MeshBasicMaterial({color:'#425271'}),0,0,-.01,group,.013);
    const image=plane(1,1,null,0,-.08,.018,group),bar=plane(1,.2,null,0,0,.023,group);
    const handle=plane(1,.34,null,0,0,.026,group);handle.material.transparent=true;handle.material.opacity=0;handle.material.depthWrite=false;
    const frame={group,backdrop,border,image,bar,handle};
    for(const target of [bar,handle]){target.userData.kind='titlebar';target.userData.frame=frame;}
    clickable.push(image,bar,handle,backdrop);return frame;
  }
  const active=appWindow(),previous=appWindow(),next=appWindow();
  function fillWindow(frame,p,w,h){
    const aspect=p.media.items[0].width/p.media.items[0].height;
    if(aspect<1)w=(h-.25)*aspect+.15;
    frame.width=w;frame.height=h;
    frame.group.userData.projectId=p.id;for(const child of frame.group.children)child.userData.projectId=p.id;
    frame.backdrop.scale.set(w,h,1);frame.border.scale.set(w+.035,h+.035,1);
    const ih=Math.min(h-.25,(w-.12)/aspect),iw=ih*aspect;
    frame.image.scale.set(iw,ih,1);frame.image.material.map=textures.get(p.id);frame.image.material.needsUpdate=true;
    frame.bar.scale.x=w;frame.bar.position.y=h/2-.1;frame.bar.material.map=titleFor(p,w);frame.bar.material.needsUpdate=true;
    frame.handle.scale.x=w;frame.handle.position.y=frame.bar.position.y;
    const position=windowPositions.get(p.id)||frame.home;if(position){frame.group.position.x=position.x;frame.group.position.y=position.y;}
    constrainWindow(frame);
  }
  active.group.position.set(.28,1.07,.36);previous.group.position.set(-1.3,1.67,.275);next.group.position.set(1.18,.55,.295);
  for(const frame of [active,previous,next])frame.home=new THREE.Vector2(frame.group.position.x,frame.group.position.y);
  function constrainWindow(frame){frame.group.position.x=THREE.MathUtils.clamp(frame.group.position.x,-4.01+frame.width/2,4.01-frame.width/2);frame.group.position.y=THREE.MathUtils.clamp(frame.group.position.y,-.71+frame.height/2,3.36-frame.height/2);}
  function setPower(value){
    powered=value;if(!value){stopVideo();releaseKey();gesture=undefined;pointerDown=undefined;}
    desktop.visible=taskbar.visible=active.group.visible=powered;
    const count=projects.filter(p=>category==='all'||p.category===category).length;
    previous.group.visible=next.group.visible=powered&&count>1;
    monitorLed.visible=keyboardLight.visible=powered;
    fanLights.forEach(light=>light.material.color.copy(powered?light.color:new THREE.Color('#202a3e')));
    powerButton.material.color.set(powered?'#ffffff':'#59667d');
    powerControl.setAttribute('aria-pressed',String(powered));powerControl.setAttribute('aria-label',powered?'Выключить ПК в 3D-сцене':'Включить ПК в 3D-сцене');powerControl.textContent=powered?'⏻ ПК включён':'⏻ Включить ПК';
    document.querySelector('#scene-interact').disabled=!powered;
    controlStatus.textContent=powered?'ПК включён':'ПК выключен — нажми ⏻ на корпусе';host.dataset.power=powered?'on':'off';dirty=true;
  }
  powerControl.addEventListener('click',()=>setPower(!powered));
  function pressKey(key){key.position.y=.075;key.material.color.set('#8bafff');pressedKeys.set(key,performance.now()+180);controlStatus.textContent='Нажата клавиша '+key.userData.label;host.dataset.lastKey=key.userData.label;dirty=true;}
  function releaseKey(){for(const key of pressedKeys.keys()){key.position.y=.12;key.material.color.copy(keyMaterial.color);}pressedKeys.clear();dirty=true;}
  function stopVideo(){
    playing=false;if(video){video.pause();video.removeAttribute('src');video.load();video.remove();video=undefined;}videoTexture?.dispose();videoTexture=undefined;
    active.image.material.map=textures.get(current.id);dirty=true;document.querySelector('#scene-interact').textContent='▶ Смотреть запись';
  }
  function focus(id){
    const p=projects.find(p=>p.id===id);if(!p)return;stopVideo();current=p;
    const list=projects.filter(p=>category==='all'||p.category===category),index=list.findIndex(p=>p.id===id);
    fillWindow(active,p,5.9,3.49);fillWindow(previous,list[(index-1+list.length)%list.length],4.85,2.86);fillWindow(next,list[(index+1)%list.length],4.8,2.7);
    active.group.visible=powered;previous.group.visible=next.group.visible=powered&&list.length>1;
    if(motion)animation={start:performance.now()};else active.group.scale.setScalar(1);
    host.dataset.project=id;dirty=true;
  }
  const raycaster=new THREE.Raycaster();
  function setRay(e){const r=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);}
  function isVisible(object){for(let node=object;node;node=node.parent)if(!node.visible)return false;return true;}
  function targetAt(e){setRay(e);return raycaster.intersectObjects(clickable,false).find(hit=>isVisible(hit.object)&&(powered||['power','key'].includes(hit.object.userData.kind)))?.object;}
  function screenPoint(e,z){setRay(e);pc.updateMatrixWorld(true);const localRay=raycaster.ray.clone().applyMatrix4(pc.matrixWorld.clone().invert());return localRay.intersectPlane(new THREE.Plane(new THREE.Vector3(0,0,1),-z),new THREE.Vector3());}
  host.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    pointerDown={x:e.clientX,y:e.clientY};dragging=false;host.setPointerCapture(e.pointerId);
    const hit=targetAt(e);
    if(hit?.userData.kind==='titlebar'){
      let frame=hit.userData.frame;
      if(hit.userData.projectId!==current.id){windowPositions.set(hit.userData.projectId,new THREE.Vector2(frame.group.position.x,frame.group.position.y));onSelect(hit.userData.projectId);frame=active;}
      animation=undefined;frame.group.scale.setScalar(1);
      const point=screenPoint(e,frame.group.position.z);
      if(point)gesture={type:'window',frame,offset:point.sub(frame.group.position)};
      host.style.cursor='grabbing';
    }else if(hit?.userData.kind==='key'){gesture={type:'key',key:hit};pressKey(hit);}
    else if(hit?.userData.kind==='power')gesture={type:'power'};
    else gesture={type:'scene',hit};
  });
  host.addEventListener('pointermove',e=>{
    if(pointerDown){
      const dx=e.clientX-pointerDown.x,dy=e.clientY-pointerDown.y;dragging||=Math.hypot(dx,dy)>7;
      if(gesture?.type==='window'){
        const point=screenPoint(e,gesture.frame.group.position.z);
        if(point){gesture.frame.group.position.x=point.x-gesture.offset.x;gesture.frame.group.position.y=point.y-gesture.offset.y;constrainWindow(gesture.frame);windowPositions.set(current.id,new THREE.Vector2(gesture.frame.group.position.x,gesture.frame.group.position.y));host.dataset.windowPosition=gesture.frame.group.position.x.toFixed(3)+','+gesture.frame.group.position.y.toFixed(3);}
      }else if(gesture?.type==='scene')tilt.set(THREE.MathUtils.clamp(dx*.0015,-.28,.28),THREE.MathUtils.clamp(dy*.001,-.12,.12));
      dirty=true;
    }else{
      const r=host.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5);
      const hit=targetAt(e);host.style.cursor=hit?.userData.kind==='titlebar'?'grab':hit?'pointer':'grab';if(motion)dirty=true;
    }
  });
  host.addEventListener('pointerup',e=>{
    if(pointerDown&&!dragging){if(gesture?.type==='power')setPower(!powered);else if(gesture?.type==='scene'&&gesture.hit?.userData.projectId)onSelect(gesture.hit.userData.projectId);}
    if(gesture?.type==='key')pressedKeys.set(gesture.key,performance.now()+80);
    gesture=undefined;pointerDown=undefined;tilt.set(0,0);dirty=true;
  });
  host.addEventListener('pointercancel',()=>{gesture=undefined;pointerDown=undefined;tilt.set(0,0);releaseKey();dirty=true;});
  function cancelInput(){gesture=undefined;pointerDown=undefined;tilt.set(0,0);releaseKey();}
  window.addEventListener('blur',cancelInput);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelInput();stopVideo();}});
  document.addEventListener('keydown',e=>{if(!visible||document.querySelector('dialog[open]')||e.target.closest('button,a,input,textarea,select')||e.ctrlKey||e.metaKey||e.altKey)return;const name=({Escape:'Esc',Backspace:'⌫',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',' ':'Space',CapsLock:'Caps'})[e.key]||e.key.toUpperCase();const key=keyMeshes.get(name)||keyMeshes.get(e.key);if(key)pressKey(key);});
  function resize(){
    const w=host.clientWidth,h=host.clientHeight,mobile=innerWidth<700;
    renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.75));renderer.setSize(w,h);camera.aspect=w/h;
    camera.position.set(0,mobile?3.5:3.2,mobile?18.8:17.4);camera.lookAt(0,.2,0);camera.updateProjectionMatrix();
    pc.position.set(mobile?-1.2:innerWidth<900?1.65:innerWidth<1100?2.05:1.75,mobile?.05:0,0);pc.scale.setScalar(mobile?1.08:innerWidth<900?.48:innerWidth<1100?.72:1);
    pc.rotation.y=-.1;dirty=true;
  }
  new ResizeObserver(resize).observe(host);renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();stopVideo();onFailure();});
  focus(current.id);resize();setPower(true);host.dataset.ready='true';
  function tick(now){
    requestAnimationFrame(tick);if(document.hidden||!visible)return;
    if(document.querySelector('dialog[open]')){if(video)stopVideo();return;}
    if(!motion&&!dirty&&!playing&&!animation&&!pointerDown&&!pressedKeys.size)return;if(now-last<(innerWidth<700?32:20))return;
    elapsed+=Math.min((now-last)/1000,.05);last=now;
    if(gesture?.type!=='window'){pc.rotation.y=THREE.MathUtils.lerp(pc.rotation.y,-.1+tilt.x+(motion?pointer.x*.035:0),.15);pc.rotation.x=THREE.MathUtils.lerp(pc.rotation.x,tilt.y,.15);}
    if(motion&&powered)fans.forEach((fan,i)=>{fan.rotation.z=elapsed*(1.2+i*.2);});
    for(const [key,until] of pressedKeys){if(now>=until&&!(gesture?.type==='key'&&gesture.key===key)){key.position.y=.12;key.material.color.copy(keyMaterial.color);pressedKeys.delete(key);}}
    if(animation){const t=Math.min((now-animation.start)/500,1);active.group.scale.setScalar(.965+.035*(1-Math.pow(1-t,3)));if(t===1)animation=undefined;}
    renderer.render(scene,camera);dirty=false;
  }
  requestAnimationFrame(tick);
  return {
    focus,overview(){category='all';focus(projects[0].id);tilt.set(0,0);pointer.set(0,0);dirty=true;},filter(value){category=value;focus(projects.find(p=>value==='all'||p.category===value).id);},
    async interact(id){
      if(!powered)return 'Сначала включи ПК кнопкой ⏻ на корпусе.';
      if(playing){stopVideo();return 'Запись остановлена.';}if(current.id!==id)focus(id);
      const clip=current.media.items.find(i=>i.type==='video');if(!clip)return 'Для проекта нет записи.';
      video=document.createElement('video');video.src=clip.src;video.muted=true;video.playsInline=true;video.preload='metadata';video.hidden=true;video.dataset.sceneVideo='true';host.appendChild(video);const requested=video;
      try{await requested.play();if(video!==requested)return 'Запись остановлена.';videoTexture=new THREE.VideoTexture(video);videoTexture.colorSpace=THREE.SRGBColorSpace;active.image.material.map=videoTexture;playing=true;dirty=true;document.querySelector('#scene-interact').textContent='Ⅱ Остановить запись';video.addEventListener('ended',stopVideo,{once:true});return 'Запись работы проекта · без звука';}catch{if(video===requested)stopVideo();return 'Запись можно открыть в подробностях проекта.';}
    },
    stopVideo,setVisible(value){visible=value;if(!value){stopVideo();cancelInput();}dirty=true;},setMotion(value){motion=value;host.dataset.motion=String(value);if(!value){animation=undefined;active.group.scale.setScalar(1);}dirty=true;},resize,
  };
}
