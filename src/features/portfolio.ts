import './portfolio.css';
import { projects } from '../content/projects';
import { SHOWCASE_ORDER } from '../content/libraryLayout';
import type { PortfolioProject, ShowcaseStatus } from '../content/projectTypes';
import { assetUrl } from '../content/assetUrl';

export const projectStatusLabels: Record<ShowcaseStatus, string> = {
  studio: 'Проект студии',
  collection: 'Подборка демо',
  prototype: 'Прототип',
  demo: 'Демо-проект',
  concept: 'Концепт',
  owner_review_needed: 'Статус уточняется',
  education: 'Учебный проект',
};

const categoryLabels: Record<string, string> = {
  studio: 'Студия', experimental: 'Эксперименты', auto: 'Авто', beauty: 'Красота',
  food: 'Еда', service: 'Услуги', healthcare: 'Медицина', education: 'Образование',
};

export function categoryLabel(category: string): string {
  return categoryLabels[category] || 'Другое';
}

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

export function findProject(id: string): PortfolioProject | undefined {
  return projects.find(project => project.id === id);
}

// Captured media must come from our local project assets, never an arbitrary URL in metadata.
function localImage(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (window.__ALTWEB_OFFLINE_ASSETS__) {
    return value.startsWith('/projects/') ? window.__ALTWEB_OFFLINE_ASSETS__[value] : undefined;
  }
  try {
    const url = new URL(value, window.location.href);
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/projects/')) return undefined;
    return assetUrl(url.pathname);
  } catch { return undefined; }
}

export function confirmedWebsite(project: PortfolioProject): string | undefined {
  if (!project.verified || project.verification.state !== 'ok') return undefined;
  try {
    const url = new URL(project.verification.finalUrl || project.url);
    if (url.protocol !== 'https:' || url.username || url.password) return undefined;
    return url.href;
  } catch { return undefined; }
}

function imageFrame(project: PortfolioProject, detailed = false): HTMLElement {
  const frame = node('div', detailed ? 'project-preview' : 'project-thumbnail');
  const unavailable = node('div', 'project-image-unavailable', 'Превью недоступно');
  unavailable.setAttribute('role', 'img');
  unavailable.setAttribute('aria-label', `Превью сайта «${project.name}» недоступно`);
  const src = localImage(detailed ? project.previewImage : project.thumbnail);
  if (src) {
    const image = node('img');
    image.alt = `Главная страница сайта «${project.name}»`;
    image.loading = detailed ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.dataset.projectImage = project.id;
    image.dataset.imageKind = detailed ? 'preview' : 'thumbnail';
    if (!detailed) { image.width = 256; image.height = 160; }
    image.addEventListener('error', () => {
      image.remove();
      frame.classList.add('image-unavailable');
      frame.append(unavailable);
    }, { once: true });
    image.src = src;
    frame.append(image);
  } else {
    frame.classList.add('image-unavailable');
    frame.append(unavailable);
  }
  return frame;
}

export interface PortfolioOptions {
  onSelect(id: string): void;
  onLibrary?: () => void;
}
export interface PortfolioHandle {
  focusProject(id: string): void;
  destroy(): void;
}
let catalogueNumber = 0;

export function mountPortfolio(host: HTMLElement, options: PortfolioOptions): PortfolioHandle {
  const abort = new AbortController();
  const {signal}=abort;
  const catalogue = node('div', 'portfolio-catalogue');
  catalogue.dataset.portfolioCatalogue = '';
  const intro = node('div', 'catalogue-intro');
  intro.append(node('p', '', 'Сайты, концепты и демонстрации. У каждой работы — свой статус.'));
  if (options.onLibrary) {
    const shortcut = node('button', 'console-button library-shortcut', 'Перейти к полкам');
    shortcut.type = 'button';
    shortcut.dataset.action = 'go-library';
    shortcut.addEventListener('click', options.onLibrary);
    intro.append(shortcut);
  }
  catalogue.append(intro);
  const categories=node('div','catalogue-categories');
  categories.setAttribute('role','group');categories.setAttribute('aria-label','Тематика проектов');
  let category='';
  for(const [value,label] of [['','Все'],['auto','Авто'],['beauty','Красота'],['food','Еда'],['service','Услуги'],['other','Другие']]){
    const button=node('button','catalogue-category',label);button.type='button';button.dataset.projectCategory=value;button.setAttribute('aria-pressed',String(value===''));
    button.addEventListener('click',()=>{category=value;categories.querySelectorAll('button').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));filter();},{signal});categories.append(button);
  }
  catalogue.append(categories);
  const filters = node('div', 'catalogue-filters');
  const searchLabel = node('label', 'catalogue-search');
  const id = ++catalogueNumber;
  searchLabel.htmlFor = `project-search-${id}`;
  searchLabel.append(node('span', '', 'Найти работу'));
  const search = node('input');
  search.type = 'search';
  search.id = `project-search-${id}`;
  search.placeholder = 'Название или тематика';
  search.autocomplete = 'off';
  search.dataset.projectSearch = '';
  searchLabel.append(search);
  const statusLabel = node('label', 'catalogue-status-filter');
  statusLabel.htmlFor = `project-status-${id}`;
  statusLabel.append(node('span', '', 'Статус'));
  const status = node('select');
  status.id = `project-status-${id}`;
  status.dataset.projectFilter = 'status';
  const allStatuses = node('option', '', 'Все статусы');
  allStatuses.value = '';
  status.append(allStatuses);
  const available = new Set(projects.map(project => project.status));
  for (const [value, label] of Object.entries(projectStatusLabels)) {
    if (!available.has(value as ShowcaseStatus)) continue;
    const option = node('option', '', label);
    option.value = value;
    status.append(option);
  }
  statusLabel.append(status);
  filters.append(searchLabel, statusLabel);
  const count = node('p', 'catalogue-count');
  count.setAttribute('role', 'status');
  count.setAttribute('aria-live', 'polite');
  count.dataset.projectCount = '';
  const grid = node('div', 'project-grid');
  const noResults = node('p', 'catalogue-no-results', 'Таких работ пока нет. Попробуйте другое название или статус.');
  noResults.hidden = true;
  catalogue.append(filters, count, grid, noResults);
  host.append(catalogue);

  const ordered = [...projects].sort((a, b) => {
    const ai = SHOWCASE_ORDER.indexOf(a.id), bi = SHOWCASE_ORDER.indexOf(b.id);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
  });
  const buttons = new Map<string, HTMLButtonElement>();
  const cards = new Map<string,HTMLElement>();
  for (const project of ordered) {
    const tile=node('article','project-tile');
    const card = node('button', 'project-card');
    card.type = 'button';
    card.dataset.projectId = project.id;
    card.dataset.projectStatus = project.status;
    card.setAttribute('aria-label', `Подробнее: ${project.name}. ${projectStatusLabels[project.status]}`);
    const info = node('span', 'project-card-info');
    const name = node('strong', 'project-card-title', project.name);
    const statusBadge = node('span', `project-status status-${project.status}`, projectStatusLabels[project.status]);
    statusBadge.dataset.statusLabel = '';
    info.append(name, node('span', 'project-category', categoryLabel(project.category)), statusBadge);
    info.append(node('span','project-more','Подробнее'));
    card.append(imageFrame(project), info);
    card.addEventListener('click', () => options.onSelect(project.id),{signal});
    tile.append(card,node('p','project-card-summary',project.summary));
    const website=confirmedWebsite(project);
    if(website){const link=node('a','project-card-website','Посмотреть сайт');link.href=website;link.target='_blank';link.rel='noopener noreferrer';link.dataset.projectExternal=project.id;tile.append(link);}
    else tile.append(node('p','project-card-unavailable',project.verification.state==='restricted'?'Просмотр сайта ограничен':'Сайт пока недоступен'));
    grid.append(tile);cards.set(project.id,tile);
    buttons.set(project.id, card);
  }
  function filter() {
    const query = search.value.trim().toLocaleLowerCase('ru');
    let visible = 0;
    for (const project of ordered) {
      const categoryMatch=!category||(category==='other'?!['auto','beauty','food','service'].includes(project.category):project.category===category);
      const matches = categoryMatch && (!status.value || project.status === status.value) &&
        (!query || `${project.name} ${categoryLabel(project.category)} ${project.summary}`.toLocaleLowerCase('ru').includes(query));
      cards.get(project.id)!.hidden = !matches;
      if (matches) visible++;
    }
    count.textContent = visible === projects.length ? `Всего работ: ${projects.length}` : `Показано ${visible} из ${projects.length}`;
    noResults.hidden = visible > 0;
  }
  search.addEventListener('input', filter,{signal});
  status.addEventListener('change', filter,{signal});
  filter();
  return {
    focusProject(projectId) { buttons.get(projectId)?.focus({ preventScroll: true }); },
    destroy() { abort.abort();catalogue.remove(); },
  };
}

export function mountProjectDetail(host: HTMLElement, project: PortfolioProject, onBack: () => void): void {
  const article = node('article', 'project-detail');
  article.dataset.projectDetail = project.id;
  const back = node('button', 'project-back', 'Ко всем работам');
  back.type = 'button';
  back.dataset.action = 'catalogue-back';
  back.addEventListener('click', onBack);
  article.append(back);
  const badges = node('div', 'project-detail-badges');
  const status = node('span', `project-status status-${project.status}`, projectStatusLabels[project.status]);
  status.dataset.statusLabel = '';
  badges.append(status, node('span', 'project-category', categoryLabel(project.category)));
  article.append(badges, imageFrame(project, true), node('p', 'project-summary', project.summary));
  if (project.status === 'owner_review_needed') {
    article.append(node('p', 'project-editorial-note', 'Статус работы и состав выполненных задач уточняются. Не обозначаем её как подтверждённый клиентский кейс.'));
  }
  const website = confirmedWebsite(project);
  if (website) {
    const link = node('a', 'project-website-link', 'Посмотреть сайт');
    link.href = website;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.dataset.projectExternal = project.id;
    article.append(link, node('p', 'project-link-note', 'Откроется в новой вкладке.'));
    if (project.id === 'altweb-atelier' && new URL(website).pathname.startsWith('/bakery')) {
      article.append(node('p', 'project-link-note', 'Проверенный адрес сейчас открывает демо кондитерской внутри подборки.'));
    } else if (project.id === 'dans-le-garage' && website !== project.url) {
      article.append(node('p', 'project-link-note', 'Основной адрес не открылся. Показываем проверенную альтернативную версию сайта.'));
    } else if (website !== project.url) {
      article.append(node('p', 'project-link-note', 'Ссылка ведёт на проверенный адрес страницы.'));
    }
  } else {
    const message = project.verification.state === 'restricted'
      ? 'Страница ограничивает просмотр. Доступность ссылки пока не подтверждена.'
      : 'Во время проверки сайт был недоступен. Ссылку пока не показываем.';
    const unavailable = node('p', 'project-unavailable-note', message);
    unavailable.dataset.projectUnavailable = '';
    article.append(unavailable);
  }
  host.append(article);
}
