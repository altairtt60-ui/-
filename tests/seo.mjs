import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {withSite,launch} from './helpers.mjs';
const routes=['/','/services','/portfolio','/about','/contact','/faq'];
const origin='https://altweb-factory.vercel.app';
const config=JSON.parse(await readFile('vercel.json','utf8'));assert.equal(config.redirects[0].source,'/:path*');assert.equal(config.redirects[0].destination,origin+'/:path*');
await withSite(async base=>{
 const titles=new Set(),descriptions=new Set();
 const browser=await launch();const page=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
 try{
 for(const path of routes){
  const res=await fetch(base+path);assert.equal(res.status,200,path);const html=await res.text();
  const title=html.match(/<title>(.*?)<\/title>/s)?.[1],description=html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert.ok(title&&description,path+' metadata');assert.ok(!titles.has(title));titles.add(title);assert.ok(!descriptions.has(description));descriptions.add(description);
  assert.equal((html.match(/<h1\b/g)||[]).length,1,path+' H1');assert.ok(html.includes(`rel="canonical" href="${origin+path}"`));assert.ok(html.includes(`property="og:url" content="${origin+path}"`));
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(schema['@context'],'https://schema.org');
  const graph=schema['@graph'];for(const type of ['Organization','WebSite',...(path==='/'?[]:['BreadcrumbList'])])assert.ok(graph.some(n=>n['@type']===type),path+' '+type);
  assert.ok(!/aggregateRating|reviewCount|streetAddress/.test(JSON.stringify(graph)));
  if(path==='/services')assert.equal(graph.filter(n=>n['@type']==='Service').length,6);
  if(path==='/faq')assert.equal(graph.find(n=>n['@type']==='FAQPage').mainEntity.length,10);
  await page.goto(base+path);assert.ok(await page.locator('main').innerText());assert.ok(await page.locator('h1').isVisible());
  for(const width of [320,390,768,1920]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,path+' overflow '+width);}await page.setViewportSize({width:390,height:844});
  if(path==='/')assert.equal(await page.locator('#app').isVisible(),false,'No empty game viewport without JS');
  const hrefs=await page.locator('a[href^="/"]').evaluateAll(a=>a.map(e=>e.getAttribute('href')));
  for(const href of new Set(hrefs))assert.equal((await fetch(base+href)).status,200,path+' internal '+href);
 }
 const sitemap=await (await fetch(base+'/sitemap.xml')).text();assert.equal((sitemap.match(/<loc>/g)||[]).length,6);for(const p of routes)assert.ok(sitemap.includes(`<loc>${origin+p}</loc>`));
 const robots=await (await fetch(base+'/robots.txt')).text();assert.ok(robots.includes('User-agent: *\nAllow: /'));assert.ok(robots.includes('Sitemap: '+origin+'/sitemap.xml'));assert.ok(!/GPTBot|CCBot|Disallow: \/\s*$/m.test(robots),'Training policy unchanged');
 assert.equal((await fetch(base+'/missing-audit-page')).status,404);
 for(const p of ['/services/','/services.html']){const r=await fetch(base+p,{redirect:'manual'});assert.ok([307,308].includes(r.status),p);}
 for(const ua of ['Googlebot','Bingbot','OAI-SearchBot','PerplexityBot'])assert.equal((await fetch(base+'/',{headers:{'User-Agent':ua}})).status,200);
 assert.equal((await fetch(base+'/og-factory.jpg')).status,200);
 console.log('PASS SEO: six HTML pages without JS, unique metadata, JSON-LD, internal links, sitemap, robots, clean URLs and real 404');
 }finally{await browser.close();}
});
