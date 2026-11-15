import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {existsSync} from 'node:fs';
import {chromium} from '@playwright/test';
export async function withSite(run){
 const remote=process.env.BASE_URL;
 const server=remote?null:spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4174'},stdio:['ignore','pipe','inherit']});
 try {
  if(server)await Promise.race([once(server.stdout,'data'),once(server,'exit').then(([code])=>{throw Error('Server exited '+code);})]);
  await run(remote||'http://127.0.0.1:4174');
 }finally{server?.kill();if(server)await once(server,'exit').catch(()=>{});}
}
export function launch(){return chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox','--disable-dev-shm-usage']});}
