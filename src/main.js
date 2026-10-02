import '@fontsource-variable/manrope';
import '@fontsource/jetbrains-mono/400.css';
import './style.css';
import './polish.css';
import { projects } from './projects.js';

const github = 'https://github.com/DispenserBro/';
const grid = document.querySelector('#project-grid');
const dialog = document.querySelector('#project-dialog');
let dialogTrigger;
let dialogProject;

function visual(project, detail = false) {
  if (project.media) {
    const portrait = project.media.items[0].height > project.media.items[0].width;
    return `<div class="project-art capture-art ${portrait ? 'capture-portrait' : 'capture-landscape'}"><span class="visual-kicker">${project.kind}</span><img src="${project.image}" alt="${project.imageAlt}" loading="lazy" decoding="async" /><span class="capture-caption"><span>${project.stack[0]} / ${project.number}</span><strong>${project.title}</strong></span><span class="capture-badge">↗</span></div>`;
  }
  const smallLabel = `<span class="visual-kicker">${project.kind}</span>`;
  if (project.visual === 'jump') return `<div class="project-art jump-art">${smallLabel}<img src="${project.image}" alt="${project.imageAlt}" loading="lazy" /><div class="art-caption">DANRO<br /><strong>JUMP</strong></div><span class="art-note">ИГРОВОЙ ЭКРАН / UNITY</span></div>`;
  if (project.visual === 'danro') return `<div class="project-art danro-art">${smallLabel}<img src="${project.image}" alt="${project.imageAlt}" loading="lazy" /><div class="art-caption">DANRO<span>2D-ПЛАТФОРМЕР</span></div><span class="art-note">ГРАФИКА ПРОЕКТА</span></div>`;
  if (project.visual === 'wizard') return `<div class="project-art wizard-art">${smallLabel}<img class="wizard-background" src="./assets/wizard-scene.webp" alt="${project.imageAlt}" loading="lazy" /><div class="wizard-character"><img src="./assets/wizard.webp" alt="" loading="lazy" /></div><div class="art-caption">THE WIZARD’S<br /><strong>BASEMENT</strong></div><span class="art-note">ИГРОВЫЕ РЕСУРСЫ / GODOT</span></div>`;
  if (project.visual === 'exchanger') return `<div class="project-art system-art exchanger-art">${smallLabel}<div class="exchange-amount"><span>ОПЛАТА И ВЫДАЧА</span><strong>100<span>₽</span><i>⇄</i>10<span>жетонов</span></strong></div><div class="state-flow"><span>Ожидание</span><i></i><span>Оплата</span><i></i><span>Выдача</span></div><div class="art-foot"><span>НАЛИЧНЫЕ / КАРТА</span><span>FSM / SERIAL</span></div></div>`;
  if (project.visual === 'plate') return `<div class="project-art system-art plate-art">${smallLabel}<div class="terminal"><div class="terminal-header"><i></i><i></i><i></i><span>controller / serial</span></div><p><span class="terminal-muted">&gt; </span>AUTH <span class="terminal-accent">CHALLENGE</span></p><p><span class="terminal-muted">&lt; </span>READY!</p><p><span class="terminal-muted">&gt; </span>INPUT / OUTPUT / ADC</p><p class="terminal-accent"><span class="terminal-muted">&gt; </span>DIAGNOSTICS<span class="cursor">_</span></p></div><div class="art-foot"><span>ПРОТОКОЛ УСТРОЙСТВА</span><span>PYTHON / QT</span></div></div>`;
  if (project.visual === 'typing') return `<div class="project-art system-art typing-art">${smallLabel}<div class="type-demo"><span>ПЕЧАТЬ / RU + EN</span><p>Учусь <strong>печатать<span class="typing-caret"></span></strong></p><div class="keyboard" aria-hidden="true">${'QWERTYUIOPASDFGHJKL'.split('').map((key, index) => `<span class="${index === 7 || index === 12 ? 'lit' : ''}">${key}</span>`).join('')}</div></div><div class="art-foot"><span>УПРАЖНЕНИЯ / СТАТИСТИКА</span><span>ELECTRON</span></div></div>`;
  if (project.visual === 'led') return `<div class="project-art system-art led-art">${smallLabel}<div class="led-diagram" aria-label="Схема адресации светодиодных линий"><div class="led-matrix">${Array.from({ length: 48 }, (_, index) => `<i style="--delay:${index * 35}ms;--line:${index % 4}"></i>`).join('')}</div><div class="led-lines"><span>LINE_01</span><span>LINE_02</span><span>LINE_03</span><span>LINE_04</span></div></div><div class="art-foot"><span>СХЕМА → АДРЕСА СВЕТОДИОДОВ</span><span>JSON / C++</span></div></div>`;
  return `<div class="project-art system-art themes-art">${smallLabel}<div class="theme-diagram"><div class="theme-swatches"><span></span><span></span><span></span><span></span></div><p>ТЕМА<br /><strong>В ПАКЕТЕ.</strong></p><div class="theme-contract">theme.json <span>+</span> ресурсы</div></div><div class="art-foot"><span>ТЕМА EXCHANGER</span><span>GODOT / DLC</span></div></div>`;
}

function card(project) {
  return `<article class="project-card reveal" style="--project-accent:${project.accent}" data-category="${project.category}">${visual(project)}<div class="project-card-body"><div class="project-title-row"><h3>${project.title}</h3><span class="project-number">/${project.number}</span></div><p>${project.description}</p><div class="project-stack">${project.stack.map((item) => `<span>${item}</span>`).join('')}</div><div class="project-card-actions"><button class="project-open" data-project="${project.id}">О проекте<span class="plus-icon" aria-hidden="true">+</span></button><a href="${github}${project.source}" target="_blank" rel="noopener noreferrer" aria-label="Исходный код ${project.title} на GitHub"><span class="github-icon" aria-hidden="true"></span>Исходники</a></div></div></article>`;
}
grid.innerHTML = projects.map(card).join('');
document.querySelector('#project-count').textContent = 'Показаны все 8 проектов';
document.querySelector('#year').textContent = new Date().getFullYear();

function openProject(id, trigger) {
  const project = projects.find((item) => item.id === id);
  if (!project) return;
  dialogTrigger = trigger;
  dialogProject = project;
  document.querySelector('#dialog-content').innerHTML = `<div class="dialog-art" style="--project-accent:${project.accent}">${visual(project, true)}</div><div class="dialog-copy"><p class="eyebrow">${project.kind} / ${project.number}</p><h2 id="dialog-title">${project.title}</h2><p class="dialog-overview">${project.overview}</p><h3>Что есть в проекте</h3><ul>${project.features.map((feature) => `<li>${feature}</li>`).join('')}</ul><div class="dialog-meta"><span class="mono">ПЛАТФОРМА</span><p>${project.platform}</p></div><div class="project-stack">${[...project.stack, ...project.tags].map((tag) => `<span>${tag}</span>`).join('')}</div><div class="dialog-links"><a class="button button-primary" href="${github}${project.source}" target="_blank" rel="noopener noreferrer">Исходники на GitHub</a>${(project.extras || []).map((item) => `<a class="text-link" href="${item.url}" target="_blank" rel="noopener noreferrer">${item.title}</a>`).join('')}</div></div>`;
  const art = document.querySelector('#dialog-content .dialog-art');
  art.innerHTML = `<div class="media-stage" aria-live="polite"></div><div class="media-toolbar"><span class="mono">ВНУТРИ ПРОЕКТА</span><span id="media-caption"></span></div><div class="media-thumbs" role="group" aria-label="Скриншоты и видео">${project.media.items.map((item, index) => `<button class="media-button" data-media-index="${index}" aria-pressed="${index===0}" aria-label="${item.label}${item.type==='video'?', видео':''}">${item.type==='video'?'<span class="media-play">▶</span><span>Видео</span>':`<img src="${item.src}" alt="" loading="lazy" />`}</button>`).join('')}</div><p class="media-note">${project.media.note} Видео без звука.</p>`;
  selectMedia(0);
  dialog.showModal();
  document.body.classList.add('dialog-active');
  history.replaceState(null, '', `#project-${id}`);
}
function selectMedia(index) {
  const item = dialogProject?.media.items[index];
  if (!item) return;
  dialog.querySelectorAll('video').forEach(video => video.pause());
  dialog.querySelector('.media-stage').innerHTML = item.type === 'video'
    ? `<video controls playsinline preload="metadata" poster="${dialogProject.image}" src="${item.src}" aria-label="${item.label}"></video>`
    : `<img src="${item.src}" alt="${item.label}" decoding="async" />`;
  dialog.querySelector('#media-caption').textContent = `${item.label}${item.type==='video'?` · ${Math.round(item.duration)} сек.`:''}`;
  dialog.querySelectorAll('[data-media-index]').forEach(button => button.setAttribute('aria-pressed',String(Number(button.dataset.mediaIndex)===index)));
}
dialog.addEventListener('click', event => {
  const button = event.target.closest('[data-media-index]');
  if (button) selectMedia(Number(button.dataset.mediaIndex));
});
dialog.addEventListener('keydown', event => {
  if (!event.target.closest('.media-thumbs') || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  const buttons = [...dialog.querySelectorAll('[data-media-index]')];
  const index = buttons.indexOf(event.target.closest('button'));
  const next = (index + (event.key==='ArrowRight'?1:-1) + buttons.length) % buttons.length;
  buttons[next].focus(); selectMedia(next);
});
function closeProject() {
  dialog.close();
}
grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-project]');
  if (button) openProject(button.dataset.project, button);
});
dialog.querySelector('.dialog-close').addEventListener('click', closeProject);
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeProject();
  }
});
dialog.addEventListener('close', () => {
  dialog.querySelectorAll('video').forEach(video => { video.pause(); video.removeAttribute('src'); video.load(); });
  document.body.classList.remove('dialog-active');
  history.replaceState(null, '', '#projects');
  dialogTrigger?.focus({ preventScroll: true });
});
document.querySelectorAll('.project-filters [data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.project-filters [data-filter]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    const category = button.dataset.filter;
    let count = 0;
    document.querySelectorAll('.project-card').forEach((item) => {
      item.hidden = category !== 'all' && item.dataset.category !== category;
      if (!item.hidden) { count++; item.classList.add('visible'); }
    });
    document.querySelector('#project-count').textContent = `Показано проектов: ${count}`;
  });
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach((item) => {
  if (reducedMotion.matches) item.classList.add('visible');
  else observer.observe(item);
});

const initialId = location.hash.replace('#project-', '');
if (location.hash.startsWith('#project-')) openProject(initialId, null);

// The 3D exhibition and the accessible document share the same project data.
let exhibition;
let sceneMode = true;
let selectedId;
let sceneCategory = 'all';
const sceneShell = document.querySelector('#portfolio-scene');
const viewToggle = document.querySelector('#view-toggle');
const infoDialog = document.querySelector('#info-dialog');
const effectButtons = {
  'danro-jump': 'Включить подсветку', danro: 'Включить подсветку',
  exchanger: 'Выдать жетоны', wizard: 'Применить заклинание',
  plate: 'Подключить плату', typing: 'Набрать текст',
  led: 'Зажечь панель', themes: 'Сменить тему',
};
function setView(useScene) {
  sceneMode = useScene;
  sceneShell.hidden = !useScene;
  document.body.classList.toggle('scene-mode', useScene);
  document.querySelector('main').inert = useScene;
  document.querySelector('footer').inert = useScene;
  viewToggle.textContent = useScene ? 'Список проектов' : '3D-выставка';
  viewToggle.setAttribute('aria-pressed', String(!useScene));
  exhibition?.setVisible(useScene);
  if (useScene) exhibition?.resize();
}
setView(true);
function selectSceneProject(id) {
  const p = projects.find(item => item.id === id);
  if (!p) return;
  if (sceneCategory !== 'all' && p.category !== sceneCategory) {
    sceneCategory = 'all';
    document.querySelectorAll('[data-scene-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sceneFilter === 'all')));
    document.querySelectorAll('#scene-dock [data-scene-project]').forEach(b => { b.hidden = false; });
    exhibition?.filter('all');
  }
  selectedId = id;
  document.querySelector('#scene-intro').hidden = true;
  document.querySelector('#scene-project').hidden = false;
  document.querySelector('#scene-project-kind').textContent = p.kind + ' / ' + p.number;
  document.querySelector('#scene-project-title').textContent = p.title;
  document.querySelector('#scene-project-preview').innerHTML = `<img src="${p.image}" alt="${p.imageAlt}" /><span>Скриншоты и видео <i aria-hidden="true">↗</i></span>`;
  document.querySelector('#scene-project-preview').style.setProperty('--project-accent',p.accent);
  document.querySelector('#scene-project-description').textContent = p.description;
  document.querySelector('#scene-project-stack').innerHTML = p.stack.map(t => '<span>'+t+'</span>').join('');
  document.querySelector('#scene-project-source').href = github + p.source;
  document.querySelector('#scene-interact').textContent = effectButtons[id];
  document.querySelector('#scene-effect-status').textContent = 'Это интерактивная иллюстрация проекта.';
  document.querySelectorAll('[data-scene-project]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sceneProject === id)));
  sceneShell.dataset.selected = id;
  delete sceneShell.dataset.effect;
  exhibition?.focus(id);
  document.querySelector('#scene-project').scrollTop = 0;
  document.querySelector('#scene-dock [data-scene-project="'+id+'"]').scrollIntoView({ block:'nearest', inline:'nearest', behavior:reducedMotion.matches?'instant':'smooth' });
}
function overview() {
  selectedId = null;
  document.querySelector('#scene-intro').hidden = false;
  document.querySelector('#scene-project').hidden = true;
  document.querySelectorAll('[data-scene-project]').forEach(b => b.setAttribute('aria-pressed', 'false'));
  delete sceneShell.dataset.selected;
  delete sceneShell.dataset.effect;
  exhibition?.overview();
}
document.querySelector('#scene-dock').innerHTML = projects.map(p => '<button data-scene-project="'+p.id+'" data-category="'+p.category+'" aria-pressed="false" style="--project-accent:'+p.accent+'"><img src="'+p.image+'" alt="" decoding="async"/><span class="dock-copy"><span>'+p.number+' / '+p.stack[0]+'</span><strong>'+p.title+'</strong></span></button>').join('');
document.querySelector('#scene-labels').innerHTML = projects.map(p => '<button class="scene-label" data-scene-project="'+p.id+'" aria-pressed="false" style="--project-accent:'+p.accent+'"><span>'+p.number+' / '+p.stack[0]+'</span><strong>'+p.title+'</strong><i aria-hidden="true">↗</i></button>').join('');
sceneShell.addEventListener('click', e => {
  const b = e.target.closest('[data-scene-project]');
  if (b) selectSceneProject(b.dataset.sceneProject);
});
document.querySelector('#scene-project-details').addEventListener('click', e => openProject(selectedId, e.currentTarget));
document.querySelector('#scene-project-preview').addEventListener('click', e => openProject(selectedId, e.currentTarget));
document.querySelector('#scene-interact').addEventListener('click', () => {
  if (selectedId && exhibition) document.querySelector('#scene-effect-status').textContent = exhibition.interact(selectedId);
});
document.querySelector('#scene-back').addEventListener('click', overview);
document.querySelector('#scene-overview').addEventListener('click', overview);
document.querySelector('#scene-explore').addEventListener('click', () => selectSceneProject('danro-jump'));
document.querySelectorAll('[data-scene-filter]').forEach(b => b.addEventListener('click', () => {
  sceneCategory = b.dataset.sceneFilter;
  document.querySelectorAll('[data-scene-filter]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  document.querySelectorAll('#scene-dock [data-scene-project]').forEach(x => { x.hidden = sceneCategory !== 'all' && x.dataset.category !== sceneCategory; });
  overview();
  exhibition?.filter(sceneCategory);
}));
viewToggle.addEventListener('click', () => { setView(!sceneMode); if (!sceneMode) document.querySelector('#projects').scrollIntoView(); });
document.querySelector('[data-enter-scene]').addEventListener('click', () => setView(true));
document.querySelector('.brand').addEventListener('click', e => { if (sceneMode) { e.preventDefault(); overview(); } });
document.querySelectorAll('.header nav a').forEach(a => a.addEventListener('click', e => {
  if (!sceneMode) return;
  e.preventDefault();
  if (a.hash === '#projects') { overview(); return; }
  const fragment = document.querySelector(a.hash).cloneNode(true);
  fragment.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
  fragment.removeAttribute('id');
  fragment.classList.remove('section-width');
  document.querySelector('#info-content').replaceChildren(fragment);
  infoDialog.setAttribute('aria-label', sourceLabel(a.hash));
  infoDialog.showModal();
  infoDialog.dataset.trigger = a.hash;
}));
function sourceLabel(hash) { return hash === '#about' ? 'Обо мне — Данил Ярош' : 'Как я работаю'; }
document.querySelector('.skip-link').addEventListener('click', e => {
  if (sceneMode) { e.preventDefault(); document.querySelector('#scene-dock button:not([hidden])')?.focus(); }
});
infoDialog.querySelector('.dialog-close').addEventListener('click', () => infoDialog.close());
infoDialog.addEventListener('close', () => document.querySelector('.header nav a[href="'+infoDialog.dataset.trigger+'"]')?.focus());
infoDialog.addEventListener('click', e => { if (e.target === infoDialog) { const r=infoDialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)infoDialog.close(); } });
document.addEventListener('keydown', e => {
  if (!sceneMode || dialog.open || infoDialog.open || ['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
  if (e.key === 'Escape') { overview(); return; }
  if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !e.target.closest('.scene-category-bar')) {
    e.preventDefault();
    const visible = projects.filter(p => sceneCategory === 'all' || p.category === sceneCategory);
    const i = visible.findIndex(p => p.id === selectedId);
    selectSceneProject(visible[(i + (e.key === 'ArrowRight' ? 1 : -1) + visible.length) % visible.length].id);
  }
});
const motionButton = document.querySelector('#scene-motion');
motionButton.setAttribute('aria-pressed', String(!reducedMotion.matches));
motionButton.textContent = reducedMotion.matches ? 'Движение: выкл.' : 'Движение: вкл.';
motionButton.addEventListener('click', () => {
  const on = motionButton.getAttribute('aria-pressed') !== 'true';
  motionButton.setAttribute('aria-pressed', String(on));
  motionButton.textContent = on ? 'Движение: вкл.' : 'Движение: выкл.';
  exhibition?.setMotion(on);
});
function fallback() {
  setView(false);
  document.querySelector('#scene-failure').hidden = false;
  viewToggle.disabled = true;
  viewToggle.textContent = '3D недоступно';
  document.querySelector('[data-enter-scene]').hidden = true;
}
import('./world.js').then(({ createWorld }) => {
  exhibition = createWorld({ projects, onSelect: selectSceneProject, onFailure: fallback });
  exhibition.setVisible(sceneMode);
  exhibition.setMotion(motionButton.getAttribute('aria-pressed') === 'true');
  if(selectedId) exhibition.focus(selectedId);
}).catch(fallback);
