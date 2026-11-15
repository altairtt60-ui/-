import './designGame.css';

type PieceId = 'header' | 'hero' | 'cta';
interface Piece { id: PieceId; name: string; hint: string; }
const pieces: readonly Piece[] = [
  { id: 'header', name: 'Шапка', hint: 'Название и навигация' },
  { id: 'hero', name: 'Главный блок', hint: 'Первое впечатление' },
  { id: 'cta', name: 'Кнопка действия', hint: 'Понятный следующий шаг' },
];

/** A small, optional activity. The caller owns the modal, focus return and world pause. */
export function mountDesignGame(host: HTMLElement, onComplete: () => void, onDone?: () => void, initial:unknown=[]): { destroy(): void; reset(): void; snapshot():string[] } {
  const abort = new AbortController();
  const { signal } = abort;
  const placed = new Set<PieceId>();
  let selected: PieceId | null = null;
  let destroyed = false;
  let pointer: { id: number; piece: PieceId; x: number; y: number; dragging: boolean } | null = null;
  let ghost: HTMLElement | null = null;
  let suppressClick = false;
  const root = document.createElement('section');
  root.className = 'design-game';
  root.setAttribute('aria-label', 'Мини-игра: собери удачный макет');
  root.innerHTML = `
    <div class="design-game__intro">
      <h3>Собери удачный макет</h3>
      <p>Выбери деталь, затем её место в телефоне. Можно перетаскивать.</p>
    </div>
    <div class="design-game__bench">
      <div class="design-game__tray" role="group" aria-label="Детали макета">
        <p class="design-game__tray-label">Детали на столе</p>
        <div class="design-game__pieces"></div>
      </div>
      <div class="design-game__drawing">
        <div class="design-game__ruler" aria-hidden="true"></div>
        <div class="design-game__device">
          <span class="design-game__speaker" aria-hidden="true"></span>
          <div class="design-game__screen" role="group" aria-label="Места для деталей макета"></div>
          <span class="design-game__device-dot" aria-hidden="true"></span>
        </div>
        <p class="design-game__drawing-note">От идеи к понятному сайту</p>
      </div>
    </div>
    <div class="design-game__footer">
      <p class="design-game__feedback" role="status" aria-live="polite" aria-atomic="true">Начни с любой детали.</p>
      <div class="design-game__progress" role="img" aria-label="Собрано деталей: 0 из 3"><i></i><i></i><i></i></div>
      <button class="design-game__reset" type="button">Повторить задание</button>
      <button class="design-game__done" type="button" disabled>Готово</button>
    </div>`;
  host.append(root);
  const pieceArea = root.querySelector<HTMLElement>('.design-game__pieces')!;
  const screen = root.querySelector<HTMLElement>('.design-game__screen')!;
  const feedback = root.querySelector<HTMLElement>('.design-game__feedback')!;
  const progress = root.querySelector<HTMLElement>('.design-game__progress')!;
  const done = root.querySelector<HTMLButtonElement>('.design-game__done')!;
  done.addEventListener('click', () => { if (placed.size === pieces.length) onDone?.(); }, { signal });
  const sourceButtons = new Map<PieceId, HTMLButtonElement>();
  const slotButtons = new Map<PieceId, HTMLButtonElement>();

  function illustration(id: PieceId): HTMLElement {
    const art = document.createElement('span');
    art.className = `design-game__art design-game__art--${id}`;
    art.setAttribute('aria-hidden', 'true');
    if (id === 'header') art.innerHTML = '<b></b><span></span><span></span><span></span>';
    if (id === 'hero') art.innerHTML = '<span class="design-game__sun"></span><span class="design-game__hill"></span><span class="design-game__hill design-game__hill--far"></span><b></b>';
    if (id === 'cta') art.innerHTML = '<span>Обсудить идею</span><b></b>';
    return art;
  }

  for (const piece of pieces) {
    const source = document.createElement('button');
    source.type = 'button';
    source.className = `design-game__piece design-game__piece--${piece.id}`;
    source.dataset.piece = piece.id;
    source.setAttribute('aria-pressed', 'false');
    source.setAttribute('aria-label', `Выбрать деталь: ${piece.name}`);
    source.append(illustration(piece.id));
    const label = document.createElement('span');
    label.className = 'design-game__piece-label';
    label.textContent = piece.name;
    source.append(label);
    pieceArea.append(source);
    sourceButtons.set(piece.id, source);

    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = `design-game__slot design-game__slot--${piece.id}`;
    slot.dataset.slot = piece.id;
    slot.setAttribute('aria-label', `Место для детали: ${piece.name}`);
    const slotName = document.createElement('span');
    slotName.className = 'design-game__slot-name';
    slotName.textContent = piece.name;
    const slotHint = document.createElement('span');
    slotHint.className = 'design-game__slot-hint';
    slotHint.textContent = piece.hint;
    slot.append(slotName, slotHint);
    screen.append(slot);
    slotButtons.set(piece.id, slot);

    source.addEventListener('click', () => {
      if (suppressClick) { suppressClick = false; return; }
      choose(piece.id);
    }, { signal });
    source.addEventListener('pointerdown', (event: PointerEvent) => {
      if (event.button !== 0 || placed.has(piece.id)) return;
      pointer = { id: event.pointerId, piece: piece.id, x: event.clientX, y: event.clientY, dragging: false };
      // Capture keeps touch dragging alive when the finger leaves the source.
      source.setPointerCapture(event.pointerId);
    }, { signal });
    slot.addEventListener('click', () => {
      if (!selected) {
        feedback.textContent = placed.has(piece.id) ? 'Эта деталь уже на месте.' : `Сначала выбери деталь «${piece.name}» на столе.`;
        return;
      }
      place(selected, piece.id, true);
    }, { signal });
  }

  function choose(id: PieceId): void {
    if (destroyed || placed.has(id)) return;
    selected = id;
    for (const [pieceId, source] of sourceButtons) {
      source.setAttribute('aria-pressed', String(pieceId === id));
    }
    for (const [slotId, slot] of slotButtons) slot.classList.toggle('is-target', slotId === id && !placed.has(slotId));
    feedback.textContent = `Теперь выбери место «${pieces.find(piece => piece.id === id)!.name}» в телефоне.`;
  }

  function place(id: PieceId, slotId: PieceId, moveFocus: boolean): void {
    if (destroyed || placed.has(id)) return;
    if (id !== slotId) {
      feedback.textContent = `Почти! Для этой детали подсвечено другое место.`;
      return;
    }
    placed.add(id);
    selected = null;
    const slot = slotButtons.get(id)!;
    slot.replaceChildren(illustration(id));
    slot.classList.add('is-placed');
    slot.setAttribute('aria-label', `${pieces.find(piece => piece.id === id)!.name}: на месте`);
    const source = sourceButtons.get(id)!;
    source.classList.add('is-placed');
    source.setAttribute('aria-pressed', 'false');
    source.setAttribute('aria-disabled', 'true');
    source.setAttribute('aria-label', `${pieces.find(piece => piece.id === id)!.name}: уже установлена`);
    for (const button of sourceButtons.values()) button.setAttribute('aria-pressed', 'false');
    for (const button of slotButtons.values()) button.classList.remove('is-target');
    [...progress.children].forEach((lamp, index) => lamp.classList.toggle('is-lit', index < placed.size));
    progress.setAttribute('aria-label', `Собрано деталей: ${placed.size} из 3`);
    if (placed.size === pieces.length) {
      root.classList.add('is-complete');
      feedback.textContent = 'Вот теперь понятно, куда нажать! Макет готов и для большого экрана.';
      done.disabled = false;
      done.setAttribute('aria-label', 'Готово: завершить задание и вернуться на фабрику');
      onComplete();
      if (moveFocus) done.focus({ preventScroll: true });
    } else {
      feedback.textContent = 'На месте. Добавь следующую деталь.';
      if (moveFocus) sourceButtons.get(pieces.find(piece => !placed.has(piece.id))!.id)!.focus({ preventScroll: true });
    }
  }

  function clearDrag(): void {
    pointer = null;
    ghost?.remove();
    ghost = null;
    root.classList.remove('is-dragging');
    for (const slot of slotButtons.values()) slot.classList.remove('is-hovered');
  }

  document.addEventListener('pointermove', (event: PointerEvent) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (!pointer.dragging && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 7) {
      pointer.dragging = true;
      choose(pointer.piece);
      ghost = sourceButtons.get(pointer.piece)!.cloneNode(true) as HTMLElement;
      ghost.classList.add('design-game__ghost');
      ghost.removeAttribute('aria-pressed');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.tabIndex = -1;
      root.append(ghost);
      root.classList.add('is-dragging');
    }
    if (!pointer.dragging || !ghost) return;
    event.preventDefault();
    ghost.style.left = `${event.clientX}px`;
    ghost.style.top = `${event.clientY}px`;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-slot]');
    for (const slot of slotButtons.values()) slot.classList.toggle('is-hovered', slot === target);
  }, { signal, passive: false });

  document.addEventListener('pointerup', (event: PointerEvent) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (pointer.dragging) {
      suppressClick = true;
      window.setTimeout(() => { suppressClick = false; }, 0);
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-slot]');
      if (target && root.contains(target)) place(pointer.piece, target.dataset.slot as PieceId, false);
      else feedback.textContent = 'Можно просто выбрать деталь, затем нажать на её место.';
    }
    clearDrag();
  }, { signal });
  document.addEventListener('pointercancel', clearDrag, { signal });

  function reset(): void {
    if (destroyed) return;
    clearDrag();
    placed.clear();
    selected = null;
    suppressClick = false;
    root.classList.remove('is-complete');
    done.disabled = true;
    done.setAttribute('aria-label', 'Готово: сначала собери три детали');
    shufflePieces();
    feedback.textContent = 'Начни с любой детали.';
    progress.setAttribute('aria-label', 'Собрано деталей: 0 из 3');
    for (const lamp of progress.children) lamp.classList.remove('is-lit');
    for (const piece of pieces) {
      const source = sourceButtons.get(piece.id)!;
      source.classList.remove('is-placed');
      source.removeAttribute('aria-disabled');
      source.setAttribute('aria-pressed', 'false');
      source.setAttribute('aria-label', `Выбрать деталь: ${piece.name}`);
      const slot = slotButtons.get(piece.id)!;
      slot.classList.remove('is-placed', 'is-target', 'is-hovered');
      slot.setAttribute('aria-label', `Место для детали: ${piece.name}`);
      const name = document.createElement('span');
      name.className = 'design-game__slot-name';
      name.textContent = piece.name;
      const hint = document.createElement('span');
      hint.className = 'design-game__slot-hint';
      hint.textContent = piece.hint;
      slot.replaceChildren(name, hint);
    }
  }
  function shufflePieces(): void {
    const order = [...pieces];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    // Start with an unsorted tray even when the shuffle draws the original order.
    if (order.every((piece, index) => piece.id === pieces[index]!.id)) order.push(order.shift()!);
    order.forEach((piece, index) => {
      const button = sourceButtons.get(piece.id)!;
      button.style.setProperty('--piece-tilt', `${[-2.4, 1.8, -1.2][index]}deg`);
      button.style.setProperty('--piece-offset', `${[3, -3, 1][index]}px`);
      pieceArea.append(button);
    });
  }
  shufflePieces();
  root.querySelector<HTMLButtonElement>('.design-game__reset')!.addEventListener('click', () => {
    reset();
    pieceArea.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  }, { signal });

  if(Array.isArray(initial))for(const piece of pieces)if(initial.includes(piece.id))place(piece.id,piece.id,false);
  return {
    reset,
    snapshot:()=>[...placed],
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      abort.abort();
      clearDrag();
      root.remove();
    },
  };
}
