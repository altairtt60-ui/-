import './qaGame.css';

type ErrorId='button'|'overflow'|'image';
const explanations:Readonly<Record<ErrorId,string>>={
  button:'У кнопки не было действия. Теперь она открывает список услуг в учебном макете.',
  overflow:'Блок был шире мобильного экрана и обрезался. Теперь его ширина подстраивается под экран.',
  image:'Изображение восстановлено. Пустой блок больше не мешает.',
};

/** Intentional errors are DOM illustrations, never failed image/network requests. */
export function mountQaGame(host:HTMLElement,onComplete:()=>void,onDone?:()=>void,initial:Record<string,unknown>={}):{destroy():void;reset():void;snapshot():Record<string,unknown>} {
  const abort=new AbortController(),{signal}=abort;
  const found=new Set<ErrorId>();
  let destroyed=false;
  const root=document.createElement('section');
  root.className='qa-game';
  root.setAttribute('aria-label','Мини-игра: найди три ошибки');
  root.innerHTML=`
    <div class="qa-game__intro"><h3>Найди 3 ошибки</h3><p>Проверь макет и исправь три ошибки.</p></div>
    <div class="qa-game__toolbar"><span>Учебный макет</span><span class="qa-game__counter" aria-live="polite">Исправлено: 0 из 3</span></div>
    <div class="qa-game__specimen" role="group" aria-label="Макет для проверки">
      <div class="qa-game__sample-head"><span class="qa-game__sample-brand">Тихий сад</span><span class="qa-game__sample-menu" aria-hidden="true"><i></i><i></i></span></div>
      <div class="qa-game__sample-content">
        <h4 class="qa-game__sample-title">Место, где<br>легко дышать</h4>
        <div class="qa-game__mobile-test" aria-label="Проверка мобильного экрана"><span class="qa-game__mobile-label">Мобильный экран</span><div class="qa-game__mobile-viewport"><button type="button" class="qa-game__error qa-game__error--overflow" data-error="overflow" aria-label="Проверить блок услуг в мобильном экране" aria-pressed="false"><strong>Уход за растениями</strong><span>Полив, пересадка и забота о вашем саде.</span><span class="qa-game__overflow-end" aria-hidden="true">Листаем дальше</span></button></div></div>
        <p class="qa-game__sample-copy">Озеленение пространства.<br>От первого эскиза до последнего листа.</p>
        <button type="button" class="qa-game__error qa-game__error--image" data-error="image" aria-label="Проверить изображение" aria-pressed="false"></button>
        <div class="qa-game__sample-action"><span>Расскажите о своём пространстве</span><button type="button" class="qa-game__error qa-game__error--button" data-error="button" aria-label="Проверить действие кнопки" aria-pressed="false" aria-expanded="false"></button><div class="qa-game__sample-response" hidden><strong>Виды работ</strong><span>Полив растений, пересадка и уход за садом.</span></div></div>
      </div>
      <span class="qa-game__scan" aria-hidden="true"></span>
    </div>
    <div class="qa-game__checklist" aria-label="Результаты проверки"><span data-check="overflow">Проверка 1</span><span data-check="image">Проверка 2</span><span data-check="button">Проверка 3</span></div>
    <div class="qa-game__footer"><p class="qa-game__feedback" role="status" aria-live="polite" aria-atomic="true">Найди на макете то, что мешает им пользоваться.</p><button class="qa-game__reset" type="button">Повторить задание</button><button class="qa-game__done" type="button" disabled>Готово</button></div>`;
  host.append(root);
  const counter=root.querySelector<HTMLElement>('.qa-game__counter')!;
  const feedback=root.querySelector<HTMLElement>('.qa-game__feedback')!;
  const done=root.querySelector<HTMLButtonElement>('.qa-game__done')!;
  const buttons=new Map<ErrorId,HTMLButtonElement>();
  function imageIllustration(fixed:boolean):string {
    return fixed?'<span class="qa-game__plant-art" aria-hidden="true"><i></i><i></i><i></i><i></i><b></b></span><span class="qa-game__image-note">Изображение на месте</span>':'<span class="qa-game__missing-image" aria-hidden="true"><svg viewBox="0 0 48 38"><rect x="3" y="3" width="42" height="32" rx="3"/><circle cx="15" cy="13" r="3"/><path d="m7 30 12-12 7 7 7-9 8 14M28 2l-7 12 9 7-6 16"/></svg></span><span class="qa-game__image-note">Изображение недоступно</span>';
  }
  function updateArt(id:ErrorId,fixed:boolean):void {
    const button=buttons.get(id)!;
    if(id==='image')button.innerHTML=imageIllustration(fixed);
    if(id==='overflow')root.querySelector('.qa-game__mobile-test')!.classList.toggle('is-fixed',fixed);
    if(id==='button')button.innerHTML=fixed?'<span>Посмотреть услуги</span><span class="qa-game__repair-mark" aria-hidden="true">✓</span>':'<span>Посмотреть услуги</span>';
  }
  for(const button of root.querySelectorAll<HTMLButtonElement>('[data-error]')){
    const id=button.dataset.error as ErrorId;buttons.set(id,button);
    button.addEventListener('click',()=>{
      if(destroyed)return;
      if(found.has(id)){
        if(id==='button'){const response=root.querySelector<HTMLElement>('.qa-game__sample-response')!;response.hidden=!response.hidden;button.setAttribute('aria-expanded',String(!response.hidden));feedback.textContent='Кнопка работает: открывает и закрывает список услуг в макете.';}
        else feedback.textContent='Этот участок уже проверен и исправлен.';
        return;
      }
      found.add(id);button.classList.add('is-fixed');button.setAttribute('aria-pressed','true');
      const titles={button:'Кнопка',overflow:'Мобильная ширина',image:'Изображение'};
      button.setAttribute('aria-label',id==='button'?'Посмотреть услуги: кнопка исправлена':`${titles[id]}: исправлено`);updateArt(id,true);
      const check=root.querySelector<HTMLElement>(`[data-check="${id}"]`)!;check.classList.add('is-fixed');check.textContent=`${titles[id]} — готово`;
      counter.textContent=`Исправлено: ${found.size} из 3`;
      feedback.textContent=explanations[id];
      if(found.size===3){root.classList.add('is-complete');feedback.textContent='Проверка завершена: 3/3 ошибки исправлены';done.disabled=false;onComplete();done.focus({preventScroll:true});}
    },{signal});
  }
  function reset():void {
    if(destroyed)return;
    found.clear();done.disabled=true;root.classList.remove('is-complete');
    counter.textContent='Исправлено: 0 из 3';root.querySelector<HTMLElement>('.qa-game__sample-response')!.hidden=true;buttons.get('button')!.setAttribute('aria-expanded','false');feedback.textContent='Найди на макете то, что мешает им пользоваться.';
    const labels={overflow:'Проверить блок услуг в мобильном экране',image:'Проверить изображение',button:'Проверить действие кнопки'};
    const titles={button:'Проверка 3',overflow:'Проверка 1',image:'Проверка 2'};
    for(const[id,button]of buttons){button.classList.remove('is-fixed');button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',labels[id]);updateArt(id,false);const check=root.querySelector<HTMLElement>(`[data-check="${id}"]`)!;check.classList.remove('is-fixed');check.textContent=titles[id];}
  }
  root.querySelector('.qa-game__reset')!.addEventListener('click',()=>{reset();buttons.get('overflow')!.focus({preventScroll:true});},{signal});
  done.addEventListener('click',()=>{if(found.size===3)onDone?.();},{signal});
  reset();
  if(Array.isArray(initial.found))for(const id of ['button','overflow','image'] as const)if(initial.found.includes(id))buttons.get(id)!.click();
  return{reset,snapshot:()=>({found:[...found]}),destroy(){if(destroyed)return;destroyed=true;abort.abort();root.remove();}};
}
