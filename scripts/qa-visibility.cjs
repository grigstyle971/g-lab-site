const {chromium}=require('../tempg-lab-recorder/node_modules/playwright-core');
const assert=require('assert');
const base=process.env.COURSE_QA_URL||'http://localhost:3010';
async function readable(p,selector){await p.waitForFunction(selector=>{let el=document.querySelector(selector);if(!el)return false;while(el){const s=getComputedStyle(el);if(Number(s.opacity)<.99||s.visibility==='hidden'||s.display==='none')return false;el=el.parentElement;}return true;},selector);}
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
for(const width of [1440,390])for(const locale of ['', '/ru']){
 const p=await b.newPage({viewport:{width,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+locale+'/#contact',{waitUntil:'networkidle'});await readable(p,'#contact a');
 await p.goto(base+locale+'/',{waitUntil:'networkidle'});await p.locator('a[href="#contact"]').first().click();await readable(p,'#contact a');
 await p.evaluate(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'instant'}));
 for(const selector of ['.intro','.services .section-top','#contact a'])await readable(p,selector);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Home overflow');
 if(locale)assert.match(await p.locator('#learn h2').innerText(),/Создам сайт\s+для вашего бизнеса/);
 await p.locator('#contact').screenshot({path:`recordings/qa/contact-${width}${locale?'-ru':'-en'}.png`});
 await p.goto(base+locale+'/learn/welcome',{waitUntil:'networkidle'});
 assert.equal(await p.locator('.screen-active-region').count(),0);
 const prompt=p.locator('[data-screen-id="codex-prompt"]');await prompt.scrollIntoViewIfNeeded();await prompt.locator('img').first().evaluate(i=>i.decode());
 await prompt.locator('.screen-choice').last().click();assert.equal(await prompt.locator('.screen-choice').last().getAttribute('aria-pressed'),'true');assert.equal(await prompt.locator('.screen-marker').count(),0);
 await prompt.screenshot({path:`recordings/qa/lesson-screen-${width}${locale?'-ru':'-en'}.png`});
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Lesson overflow');assert.deepEqual(errors,[]);await p.close();
}
for(const options of [{javaScriptEnabled:false},{reducedMotion:'reduce'}]){const p=await b.newPage(options);await p.goto(base+'/ru#contact',{waitUntil:'networkidle'});await readable(p,'#contact a');await readable(p,'.intro');await p.close();}
console.log('PASS: EN/RU desktop/mobile contact anchors, ancestor visibility, no-JS, reduced motion, translated heading and lesson markers.');
}finally{await b.close();}})();
