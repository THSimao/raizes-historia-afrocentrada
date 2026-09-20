// Verificação local opcional: NODE_PATH deve apontar para um Playwright instalado.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve(__dirname, '../.qa');
fs.mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const errors=[];const checks=[];
  const widths=[320,360,375,390,412,430,768,1024,1366,1920];
  for(const width of widths){
    const height=width===1366?768:width===1920?1080:width===768?1024:844;
    const context=await browser.newContext({viewport:{width,height},isMobile:width<600,hasTouch:width<600,deviceScaleFactor:1});
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push({width,error:e.message}));
    page.on('console',m=>{if(m.type()==='error')errors.push({width,console:m.text()});});
    const response=await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.querySelector('.loader').hidden);
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForTimeout(500);
    if([360,390,1366,1920].includes(width))await page.screenshot({path:path.join(out,`hero-${width}.png`)});
    const overflow=[];
    for(const id of ['origens','escravidao','resistencia','cultura','abolicao','legado','zumbi','palmares','consciencia','encerramento','fontes']){
      await page.locator('#'+id).evaluate(el=>el.scrollIntoView({behavior:'instant',block:'start'}));
      await page.waitForTimeout(150);
      const bad=await page.evaluate(()=>[...document.querySelectorAll('main h1,main h2,main h3,main p,main article,main figure,.site-footer')].filter(el=>{const r=el.getBoundingClientRect();return r.right>innerWidth+1||r.left< -1}).map(el=>({tag:el.tagName,text:el.textContent.trim().slice(0,60),left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right})));
      overflow.push(...bad);
      if([360,1366].includes(width)&&['origens','cultura','zumbi','consciencia'].includes(id)){
        await page.waitForTimeout(850);
        await page.screenshot({path:path.join(out,`${id}-${width}.png`)});
      }
    }
    const images=await page.evaluate(()=>[...document.images].filter(im=>!im.complete||!im.naturalWidth).map(im=>im.src));
    const titleFits=await page.locator('h1').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);return range.getBoundingClientRect().right<=innerWidth;});
    let menuPassed=true;
    if(width<1100){
      await page.locator('.menu-toggle').click();
      menuPassed=await page.locator('#mobile-menu').evaluate(el=>el.open);
      await page.locator('#mobile-menu a[href="#cultura"]').click();
      await page.waitForTimeout(700);
      menuPassed=menuPassed&&await page.evaluate(()=>!document.querySelector('#mobile-menu').open&&!document.body.classList.contains('menu-open')&&location.hash==='#cultura');
    }
    checks.push({width,height,status:response.status(),overflow:[...new Map(overflow.map(x=>[x.text,x])).values()],images,titleFits,menuPassed,loaderHidden:await page.locator('.loader').evaluate(el=>el.hidden)});
    await context.close();
  }
  const page=await browser.newPage({viewport:{width:1366,height:768}});
  await page.goto('http://127.0.0.1:4173');await page.waitForTimeout(2200);
  await page.keyboard.press('ArrowDown');await page.waitForTimeout(1000);
  const keyboardDown=await page.evaluate(()=>scrollY>200);
  await page.keyboard.press('End');await page.waitForFunction(()=>Math.abs(document.querySelector('#encerramento').getBoundingClientRect().top)<200);
  const keyboardEnd=await page.locator('#encerramento').evaluate(el=>Math.abs(el.getBoundingClientRect().top)<200);
  await page.keyboard.press('Home');await page.waitForFunction(()=>scrollY<10);
  const keyboardHome=await page.evaluate(()=>scrollY<10);
  await page.locator('.present-button').click();await page.waitForTimeout(300);
  const presentation=await page.locator('.presentation-controls').isVisible();
  await page.locator('.exit-presentation').click();
  const presentationExit=await page.locator('.presentation-controls').isHidden();
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
  const reduced=await page.evaluate(()=>document.querySelector('.loader').hidden&&!document.documentElement.classList.contains('js-motion'));
  await page.setViewportSize({width:844,height:390});await page.reload();await page.waitForTimeout(300);
  const landscape=await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth);
  const report={checks,errors,keyboardDown,keyboardEnd,keyboardHome,presentation,presentationExit,reduced,landscape};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
