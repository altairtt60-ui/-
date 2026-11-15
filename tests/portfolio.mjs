import assert from 'node:assert/strict';
import {withSite,launch} from './helpers.mjs';
await withSite(async base=>{
 const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});await page.goto(base+'/portfolio');
 assert.equal(await page.locator('.site-projects article').count(),16);
 for(const image of await page.locator('.site-projects img').all()){
  await image.scrollIntoViewIfNeeded();await image.evaluate(img=>img.decode());
  const d=await image.evaluate(img=>({w:img.naturalWidth,h:img.naturalHeight,dw:Number(img.getAttribute('width')),dh:Number(img.getAttribute('height'))}));assert.equal(d.w,d.dw);assert.equal(d.h,d.dh);
 }
 assert.equal(await page.locator('.site-projects a').count(),14);
 assert.equal(await page.locator('#dans-le-garage a').getAttribute('href'),'https://dans-le-garage-club.vercel.app/');
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'test-results/portfolio-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/portfolio-mobile.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.goto(base+'/#order');await page.locator('dialog[open][data-panel="contact"]').waitFor();assert.equal(await page.locator('dialog[open]').count(),1);
 console.log('PASS portfolio: 16 honest statuses, 16 previews with verified width and height, 14 available destination links, correct concept URL, mobile layout and direct order link');
 }finally{await browser.close();}
});
