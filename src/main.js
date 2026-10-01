import '@fontsource-variable/manrope';
import '@fontsource/jetbrains-mono/400.css';
import './style.css';
import { projects } from './projects.js';

const github = 'https://github.com/DispenserBro/';
const grid = document.querySelector('#project-grid');
const dialog = document.querySelector('#project-dialog');
let dialogTrigger;

function visual(project, detail = false) {
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
  document.querySelector('#dialog-content').innerHTML = `<div class="dialog-art" style="--project-accent:${project.accent}">${visual(project, true)}</div><div class="dialog-copy"><p class="eyebrow">${project.kind} / ${project.number}</p><h2 id="dialog-title">${project.title}</h2><p class="dialog-overview">${project.overview}</p><h3>Что есть в проекте</h3><ul>${project.features.map((feature) => `<li>${feature}</li>`).join('')}</ul><div class="dialog-meta"><span class="mono">ПЛАТФОРМА</span><p>${project.platform}</p></div><div class="project-stack">${[...project.stack, ...project.tags].map((tag) => `<span>${tag}</span>`).join('')}</div><div class="dialog-links"><a class="button button-primary" href="${github}${project.source}" target="_blank" rel="noopener noreferrer">Исходники на GitHub</a>${(project.extras || []).map((item) => `<a class="text-link" href="${item.url}" target="_blank" rel="noopener noreferrer">${item.title}</a>`).join('')}</div></div>`;
  dialog.showModal();
  document.body.classList.add('dialog-active');
  history.replaceState(null, '', `#project-${id}`);
}
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
  document.body.classList.remove('dialog-active');
  history.replaceState(null, '', '#projects');
  dialogTrigger?.focus({ preventScroll: true });
});
document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
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

// Three.js loads separately so project content is available before WebGL initializes.
import('./world.js').then(({ createWorld }) => createWorld()).catch(() => {
  document.querySelector('#world-fallback').classList.add('visible');
  document.querySelector('#scene-status').textContent = 'Danro Jump';
  document.querySelector('#world-hint').textContent = 'Скриншот Danro Jump';
  document.querySelector('.world-bottom p').textContent = 'Игровой экран Danro Jump';
  document.querySelector('.scene-controls').hidden = true;
  document.querySelector('#scene-reset').hidden = true;
});
