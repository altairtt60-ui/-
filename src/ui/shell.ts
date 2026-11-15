import type { GameState, InputAction, UIHandle, UIHandlers } from '../contracts';
import { brand } from '../content/brand';
import { assetUrl } from '../content/assetUrl';
import { zones } from '../content/world';
import type { ZoneId, TaskKind } from '../content/world';

const soundIcon = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path class="sound-waves" d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path class="sound-slash" d="m15 9 6 6m0-6-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;

export function mountUI(root: HTMLElement, handlers: UIHandlers): UIHandle {
  root.classList.add('factory-ui');
  root.innerHTML = `
    <header class="factory-header">
      <div class="brand-lockup" aria-label="Altweb Factory, студия веб-дизайна">
        <span class="brand-word">ALTWEB<span>Factory</span></span>
        <span class="brand-description">Здесь собирают сайты</span>
      </div>
      <nav class="factory-nav" aria-label="Основная навигация">
        <button class="nav-button workshops-button" data-action="workshops" aria-expanded="false" aria-controls="workshop-map">Цеха</button>
        <a class="nav-button" href="/portfolio" data-panel="projects">Проекты</a>
        <a class="nav-button" href="/services" data-panel="services">Услуги</a>
        <a class="nav-button contact-button" href="/contact" data-panel="contact" aria-label="Заказать сайт"><span class="order-label-full">Заказать сайт</span><span class="order-label-short" aria-hidden="true">Заказать</span></a>
        <button class="sound-button" data-action="sound" aria-label="Включить звук" aria-pressed="false" title="Включить звук">${soundIcon}</button>
      </nav>
    </header>
    <section class="workshop-map" id="workshop-map" aria-labelledby="workshop-map-title" hidden>
      <div class="workshop-map-heading"><h2 id="workshop-map-title">Маршрут по фабрике</h2><button class="map-close" type="button" aria-label="Закрыть маршрут">×</button></div>
      <p class="workshop-map-note">Можно пройти всё пешком или выбрать цех.</p>
      <div class="workshop-map-route">${zones.map(zone => `<button type="button" class="workshop-stop" data-zone="${zone.id}"><span>${zone.name}</span><small>${zone.id === 'design' ? 'Собрать интерфейс' : zone.id === 'backend' ? 'Подключить сервер' : zone.id === 'qa' ? 'Найти три ошибки' : zone.id === 'library' ? 'Открыть работы' : zone.id === 'dispatch' ? 'Обсудить сайт' : 'Начало прогулки'}</small></button>`).join('')}</div>
      <div class="workshop-tasks" aria-label="Необязательные задания">
        <p>Три коротких задания — по желанию</p>
        <ul><li data-task="design">Интерфейс <span>не пройдено</span></li><li data-task="backend">Сервер <span>не пройдено</span></li><li data-task="qa">Проверка <span>не пройдено</span></li></ul>
      </div>
    </section>
    <div class="walk-note" aria-hidden="true"><span class="walk-note-line"></span>Вперёд — в дизайн-ателье</div>
    <button class="station-prompt" data-action="interact" hidden><kbd>E</kbd><span>Посмотреть макет</span></button>
    <div class="touch-controls" aria-label="Управление роботом">
      <div class="touch-direction">
        <button class="touch-button" data-input="left" aria-label="Влево"><span aria-hidden="true">‹</span></button>
        <button class="touch-button" data-input="right" aria-label="Вправо"><span aria-hidden="true">›</span></button>
      </div>
      <div class="touch-actions">
        <button class="touch-button touch-interact" data-action="interact-mobile" aria-label="Взаимодействовать" disabled><span aria-hidden="true">E</span></button>
        <button class="touch-button touch-jump" data-input="jump" aria-label="Прыжок"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </div>
    </div>
    <footer class="factory-footer">
      <div class="location-console">
        <svg class="location-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 18s6-6.2 6-10A6 6 0 0 0 4 8c0 3.8 6 10 6 10Z" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/></svg>
        <span class="location-name">Входной цех</span>
        <button class="restart-button" data-action="restart" aria-label="Вернуться к началу" title="Вернуться к началу"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 10a7 7 0 1 1 .5 6M5 4v6h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </div>
      <p class="keyboard-guide"><span><kbd>A</kbd><kbd>D</kbd> идти</span><span><kbd>Space</kbd> прыгать</span><span><kbd>E</kbd> заглянуть</span><span><a href="#site-content">О студии и услугах</a></span></p>
      <a class="portfolio-link" href="/portfolio">Обычное портфолио<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M3 7h14M7 7v10" stroke="currentColor" stroke-width="1.4"/></svg></a>
    </footer>`;

  if (brand.markUrl) {
    try {
      const markUrl = new URL(brand.markUrl, window.location.href);
      if (markUrl.origin === window.location.origin && /^\/(assets|brand)\//.test(markUrl.pathname)) {
        const wordmark = root.querySelector<HTMLElement>('.brand-word')!;
        const signature = document.createElement('span');
        signature.className = 'brand-signature';
        const mark = document.createElement('img');
        mark.className = 'brand-mark';
        mark.alt = '';
        mark.width = 44;
        mark.height = 44;
        mark.addEventListener('error', () => mark.remove(), { once: true });
        mark.src = assetUrl(markUrl.pathname);
        wordmark.replaceWith(signature);
        signature.append(mark, wordmark);
      }
    } catch { /* Preserve the text signature when the original logo file is absent. */ }
  }

  const location = root.querySelector<HTMLElement>('.location-name')!;
  const stationPrompt = root.querySelector<HTMLButtonElement>('[data-action="interact"]')!;
  const mobileInteract = root.querySelector<HTMLButtonElement>('[data-action="interact-mobile"]')!;
  const interactionText = stationPrompt.querySelector<HTMLElement>('span')!;
  const soundButton = root.querySelector<HTMLButtonElement>('[data-action="sound"]')!;
  const walkNote = root.querySelector<HTMLElement>('.walk-note')!;
  const mapButton = root.querySelector<HTMLButtonElement>('[data-action="workshops"]')!;
  const workshopMap = root.querySelector<HTMLElement>('.workshop-map')!;
  let mapOpen = false;

  function closeMap(restoreFocus = false) {
    mapOpen = false;
    workshopMap.hidden = true;
    mapButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus) mapButton.focus({ preventScroll: true });
  }
  mapButton.addEventListener('click', () => {
    if (mapOpen) { closeMap(); return; }
    releaseAll();
    mapOpen = true;
    workshopMap.hidden = false;
    mapButton.setAttribute('aria-expanded', 'true');
    workshopMap.querySelector<HTMLButtonElement>('[aria-current="location"]')?.focus({ preventScroll: true });
  });
  workshopMap.querySelector('.map-close')!.addEventListener('click', () => closeMap(true));
  workshopMap.querySelectorAll<HTMLButtonElement>('[data-zone]').forEach(button => {
    button.addEventListener('click', () => {
      closeMap();
      handlers.goToZone(button.dataset.zone as ZoneId);
    });
  });
  document.addEventListener('pointerdown', event => {
    if (mapOpen && event.target instanceof Node && !workshopMap.contains(event.target) && !mapButton.contains(event.target)) closeMap();
  });
  document.addEventListener('keydown', event => {
    if (mapOpen && event.key === 'Escape') { event.preventDefault(); closeMap(true); }
  });

  root.querySelectorAll<HTMLAnchorElement>('[data-panel]').forEach(button => {
    button.addEventListener('click', event => {
      if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
      event.preventDefault();
      closeMap();
      handlers.navigate(button.dataset.panel as 'projects' | 'services' | 'contact' | 'portfolio');
    });
  });
  soundButton.addEventListener('click', () => setSound(handlers.sound()));
  root.querySelector('[data-action="restart"]')!.addEventListener('click', () => handlers.restart());
  stationPrompt.addEventListener('click', () => handlers.interact());
  mobileInteract.addEventListener('click', () => handlers.interact());

  const held = new Map<number, InputAction>();
  const releaseAll = () => {
    for (const action of held.values()) handlers.input(action, false);
    held.clear();
    root.querySelectorAll('.is-held').forEach(button => button.classList.remove('is-held'));
  };
  root.querySelectorAll<HTMLButtonElement>('[data-input]').forEach(button => {
    const action = button.dataset.input as InputAction;
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      if (button.disabled) return;
      held.set(event.pointerId, action);
      button.setPointerCapture(event.pointerId);
      button.classList.add('is-held');
      handlers.input(action, true);
    });
    const release = (event: PointerEvent) => {
      if (!held.has(event.pointerId)) return;
      held.delete(event.pointerId);
      button.classList.remove('is-held');
      if (![...held.values()].includes(action)) handlers.input(action, false);
    };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    // Native buttons remain useful to keyboard and assistive-technology users.
    button.addEventListener('keydown', event => {
      if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
        event.preventDefault();
        handlers.input(action, true);
      }
    });
    button.addEventListener('keyup', event => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        handlers.input(action, false);
      }
    });
    button.addEventListener('blur', () => handlers.input(action, false));
  });
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });

  function setSound(on: boolean) {
    soundButton.setAttribute('aria-pressed', String(on));
    soundButton.setAttribute('aria-label', on ? 'Выключить звук' : 'Включить звук');
    soundButton.title = on ? 'Выключить звук' : 'Включить звук';
    soundButton.classList.toggle('sound-on', on);
  }

  return {
    setSound,
    setStatus(state: GameState) {
      location.textContent = state.zone || (state.player.x > 1050 ? 'Дизайн-ателье' : 'Входной цех');
      stationPrompt.hidden = !state.canInteract || state.paused;
      mobileInteract.disabled = !state.canInteract || state.paused;
      const actionLabel = state.interactionLabel || 'Взаимодействовать';
      interactionText.textContent = actionLabel;
      mobileInteract.setAttribute('aria-label', actionLabel);
      mobileInteract.title = state.canInteract ? actionLabel : 'Подойдите к рабочему месту или проекту';
      root.classList.toggle('world-paused', state.paused);
      const currentZone = zones.find(zone => state.player.x >= zone.start && state.player.x < zone.end);
      workshopMap.querySelectorAll<HTMLButtonElement>('[data-zone]').forEach(button => {
        if (button.dataset.zone === currentZone?.id) button.setAttribute('aria-current', 'location');
        else button.removeAttribute('aria-current');
      });
      workshopMap.querySelectorAll<HTMLElement>('[data-task]').forEach(task => {
        const complete = (state.completedTasks ?? []).includes(task.dataset.task as TaskKind);
        task.classList.toggle('task-complete', complete);
        task.querySelector('span')!.textContent = complete ? 'готово' : 'не пройдено';
      });
      walkNote.hidden = state.player.x > 1000;
      if (state.paused) { releaseAll(); closeMap(); }
    },
  };
}
