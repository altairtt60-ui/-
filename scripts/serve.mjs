import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('dist');
const config=JSON.parse(await readFile('vercel.json','utf8'));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
const server=createServer(async(req,res)=>{
 for(const h of config.headers[0].headers)res.setHeader(h.key,h.value);
 try {
  const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);
  if(pathname!=='/'&&(pathname.endsWith('/')||pathname.endsWith('.html'))){res.writeHead(308,{Location:pathname.replace(/\.html$|\/$/,'')+url.search});return res.end();}
  let file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+'/'))throw Error('Outside output');
  if(!extname(file))file+='.html';
  if(!(await stat(file)).isFile())throw Error('Missing file');
  const b=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:b);
 } catch {res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(req.method==='HEAD'?undefined:await readFile(root+'/404.html'));}
});
server.listen(Number(process.env.PORT||4174),'0.0.0.0',()=>console.log('Static preview ready'));
