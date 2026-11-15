import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {withSite,launch} from './helpers.mjs';
await withSite(async base=>{
 const browser=await launch();await mkdir('test-results',{recursive:true});
 try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(base+'/?room=design#app');await page.waitForFunction(()=>window.__ALTWEB__?.getState()?.ready);
  const state=()=>page.evaluate(()=>window.__ALTWEB__.getState());
  assert.equal((await state()).npcCount,17);
  async function room(id){await page.locator('[data-action="workshops"]').click();await page.locator(`[data-zone="${id}"]`).click();await page.waitForTimeout(150);}
  async function interact(kind){const control=page.locator(mobile?'[data-action="interact-mobile"]':'[data-action="interact"]');await control.click();assert.equal(await page.locator('dialog[open]').count(),1);await page.locator(`dialog[open][data-panel="${kind}"]`).waitFor();}
  async function close(){await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);}
  await interact('design-station');
  await page.locator('[data-design-business]').selectOption('cafe');await page.locator('label').filter({has:page.locator('[data-design-style="modern"]')}).click();await page.locator('label').filter({has:page.locator('[data-design-palette="modern-ocean"]')}).click();
  assert.equal(await page.locator('[data-design-preview]').getAttribute('data-business'),'cafe');
  assert.equal(await page.locator('[data-design-preview]').getAttribute('data-palette'),'modern-ocean');
  await page.locator('[data-action="design-order"]').click();
  assert.equal(await page.locator('dialog[open]').count(),1);assert.ok((await page.locator('[data-order-design]').innerText()).includes('Морской'));
  await page.locator('select[name="siteType"]').selectOption('landing');await page.locator('input[name="businessName"]').fill('Проверка интерфейса');
  await page.evaluate(()=>{window.testEvents=[];document.addEventListener('altweb:engagement',e=>window.testEvents.push(e.detail));});
  await page.locator('[data-action="prepare-order"]').click();assert.ok((await page.locator('[data-order-message]').inputValue()).includes('Кафе'));
  assert.equal((await page.evaluate(()=>window.testEvents))[0].name,'brief_prepared');assert.equal(await page.locator('[data-action="open-instagram"]').getAttribute('href'),'https://www.instagram.com/altweb.design/');await close();
  await room('design');await interact('design-station');await page.locator('[data-task-action="repeat"]').click();
  await page.locator('[data-design-mode="puzzle"]').click();assert.equal(await page.locator('.design-game').count(),1);
  for(const id of ['header','hero','cta']){await page.locator(`[data-piece="${id}"]`).focus();await page.keyboard.press('Enter');await page.locator(`[data-slot="${id}"]`).focus();await page.keyboard.press('Enter');}
  assert.equal(await page.locator('.design-game__done').isEnabled(),true);await page.locator('.design-game__done').click();
  await room('backend');await interact('backend-station');assert.equal(await page.locator('.backend-game').count(),1);
  await page.locator('[data-node="frontend"]').click();await page.locator('[data-node="server"]').click();assert.ok((await page.locator('.backend-game__feedback').innerText()).includes('Попробуй'));
  await page.locator('[data-node="api"]').click();
  for(const [a,b] of [['api','server'],['server','response']]){await page.locator(`[data-node="${a}"]`).click();await page.locator(`[data-node="${b}"]`).click();}
  await page.locator('.backend-game__build').click();await page.locator('.backend-game__check').click();
  assert.equal(await page.locator('.backend-game__done').isEnabled(),true);await page.locator('.backend-game__done').click();
  await interact('backend-station');await page.locator('[data-task-action="result"]').click();assert.ok((await page.locator('.backend-game__build-state').innerText()).includes('успешно'));await close();
  await room('qa');await interact('qa-station');assert.equal(await page.locator('.qa-game').count(),1);
  for(const id of ['overflow','image','button'])await page.locator(`[data-error="${id}"]`).click();
  assert.equal(await page.locator('.qa-game__counter').innerText(),'Исправлено: 3 из 3');await page.locator('[data-error="button"]').click();assert.equal(await page.locator('.qa-game__sample-response').isVisible(),true);await page.locator('.qa-game__done').click();
  await interact('qa-station');await page.locator('[data-task-action="repeat"]').click();assert.equal(await page.locator('.qa-game__counter').innerText(),'Исправлено: 0 из 3');await close();
  for(const id of ['entry','design','backend','qa','library','dispatch']){
   await room(id);if(['design','backend','qa'].includes(id))assert.equal((await state()).stationId,id+'-station');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,id+' overflow');
   if(id==='library'){await interact('projects');assert.ok((await page.locator('dialog[open]').innerText()).includes('PITLANE Auto'));await close();}
   if(id==='dispatch'){await interact('contact');assert.equal(await page.locator('[data-order-form]').count(),1);await close();}
   await page.screenshot({path:`test-results/${mobile?'mobile':'desktop'}-${id}.png`});
  }
  await page.reload();await page.waitForFunction(()=>window.__ALTWEB__?.getState()?.ready);await room('backend');await interact('backend-station');assert.ok((await page.locator('dialog[open]').innerText()).includes('Задание уже выполнено'));await page.locator('[data-task-action="repeat"]').click();assert.equal(await page.locator('.backend-game__build').isDisabled(),true);await close();
  await room('entry');const x=(await state()).player.x;await page.locator('canvas').focus();await page.keyboard.down('d');await page.waitForTimeout(350);await page.keyboard.up('d');assert.ok((await state()).player.x>x+10,'Walking works');
  await page.locator('#site-content').scrollIntoViewIfNeeded();await page.waitForFunction(()=>window.__ALTWEB__.getState().paused);const time=(await state()).simTime;await page.waitForTimeout(150);assert.equal((await state()).simTime,time,'Simulation paused while reading');
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForFunction(()=>!window.__ALTWEB__.getState().paused);
  assert.equal(await page.locator('.portfolio-link').getAttribute('href'),'/portfolio');assert.equal(errors.length,0,errors.join('\n'));await context.close();console.log(`PASS factory ${mobile?'mobile':'desktop'}: six rooms, design configurator, all three games, keyboard puzzle, reset, persistence, order draft, movement, reading pause`);
 }
 }finally{await browser.close();}
});
