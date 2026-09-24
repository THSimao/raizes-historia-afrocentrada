// Execute com NODE_PATH apontando para um Playwright instalado.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4173/';
const out = path.resolve(__dirname, '../.qa');
fs.mkdirSync(out, {recursive:true});
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const errors = [], results = [];
  try {
    for (const width of [320,360,375,390,412,430,768,1024,1366,1920]) {
      const context = await browser.newContext({viewport:{width,height:width>1100?900:844}, isMobile:width<600, hasTouch:width<600});
      const page = await context.newPage();
      page.on('pageerror', e=>errors.push({width,error:e.message}));
      page.on('console', m=>{if(m.type()==='error')errors.push({width,error:m.text()});});
      page.on('response', r=>{if(r.status()>=400)errors.push({width,status:r.status(),url:r.url()});});
      assert.equal((await page.goto(base+'querino.html')).status(),200);
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForTimeout(1000);
      if ([390,1366].includes(width)) await page.screenshot({path:path.join(out,'querino-hero-'+width+'.png')});
      for (const selector of ['#olhar','.q-history-line','.q-breves','.q-manuel','#episodios','#continuar']) {
        await page.locator(selector).evaluate(el=>el.scrollIntoView({behavior:'instant'}));
        await page.waitForTimeout(180);
      }
      const overflow = await page.evaluate(()=>[...document.querySelectorAll('main h1, main h2, main h3, main p, .q-header, .q-book, .q-history-line')].filter(el=>!el.closest('.q-track')&&!el.classList.contains('q-visually-hidden')).filter(el=>{
        const r=el.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1||el.scrollWidth>el.clientWidth+2;
      }).map(el=>({text:el.textContent.trim().slice(0,50),width:el.clientWidth,scroll:el.scrollWidth})));
      assert.deepEqual(overflow,[], 'overflow '+width+': '+JSON.stringify(overflow));
      assert.equal(await page.locator('.q-context').evaluate(el=>el.classList.contains('is-present')), true);
      assert.equal(await page.locator('.q-portrait img').evaluate(el=>el.complete&&el.naturalWidth>0), true);
      await page.locator('#episodios').evaluate(el=>el.scrollIntoView({behavior:'instant'}));
      await page.waitForTimeout(800);
      if ([390,1366].includes(width)) await page.screenshot({path:path.join(out,'querino-episodes-'+width+'.png')});
      await page.locator('.q-next').click();
      await page.waitForFunction(()=>document.querySelector('.q-count strong').textContent==='02');
      await page.waitForTimeout(600);
      await page.locator('#q-track').focus();
      await page.keyboard.press('End');
      await page.waitForFunction(()=>document.querySelector('.q-count strong').textContent==='08');
      await page.waitForTimeout(650);
      assert.equal(await page.locator('.q-next').isDisabled(), true);
      assert.equal(await page.locator('.q-carousel-progress span').evaluate(el=>el.style.transform),'scaleX(1)');
      await page.keyboard.press('Home');
      await page.waitForFunction(()=>document.querySelector('.q-count strong').textContent==='01');
      await page.waitForTimeout(650);
      assert.equal(await page.locator('.q-prev').isDisabled(), true);
      // Tab alcança e centraliza cada link, sem retirar cartões da árvore acessível.
      await page.locator('#episodio-4 a').focus();
      await page.waitForFunction(()=>document.querySelector('.q-count strong').textContent==='04');
      await page.waitForTimeout(600);
      const centered = await page.locator('#episodio-4').evaluate(el=>Math.abs(el.getBoundingClientRect().left+el.getBoundingClientRect().width/2-innerWidth/2)<3);
      if (!centered) console.log(await page.locator('#episodio-4').evaluate(el=>({left:el.getBoundingClientRect().left,width:el.getBoundingClientRect().width,inner:innerWidth,scroll:document.querySelector('#q-track').scrollLeft})));
      assert.equal(centered,true,'center '+width);
      const localLinks = await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].every(a=>document.getElementById(a.hash.slice(1))));
      assert.equal(localLinks,true);
      const cardFit = await page.evaluate(()=>[...document.querySelectorAll('.q-episode-copy')].every(el=>el.scrollWidth<=el.clientWidth+1&&el.scrollHeight<=el.clientHeight+1));
      assert.equal(cardFit,true, 'card text '+width);
      results.push({width,overflow:0,carousel:true,keyboard:true,links:true});
      await context.close();
    }
    const mobile = await browser.newContext({viewport:{width:390,height:844}, isMobile:true,hasTouch:true});
    const page = await mobile.newPage();
    await page.goto(base+'querino.html');
    await page.locator('#q-track').evaluate(el=>el.scrollIntoView({behavior:'instant',block:'start'}));
    await page.waitForTimeout(700);
    const cdp = await mobile.newCDPSession(page);
    async function swipe(x,y,dx,dy) {
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      for(let i=1;i<=12;i++){
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/12,y:y+dy*i/12}]});
        await page.waitForTimeout(20);
      }
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await page.waitForTimeout(850);
    }
    await swipe(320,270,-260,0);
    assert.notEqual(await page.locator('.q-count strong').textContent(),'01','native touch swipe');
    const beforeY=await page.evaluate(()=>scrollY);
    await swipe(195,550,0,-260);
    assert.ok(await page.evaluate(()=>scrollY)>beforeY+100,'vertical touch remains native');
    await page.goto(base+'index.html#projeto-querino');
    await page.locator('.querino-callout .q-link').click();
    await page.waitForURL('**/querino.html');
    await page.locator('.q-back').click();
    await page.waitForURL('**/index.html#projeto-querino');
    assert.equal(await page.locator('.loader').evaluate(el=>el.hidden),true);
    await page.waitForFunction(()=>Math.abs(document.querySelector('#projeto-querino').getBoundingClientRect().top)<200);
    await page.locator('.menu-toggle').click();
    await page.locator('#mobile-menu a[data-page-transition]').click();
    await page.waitForURL('**/querino.html');
    await page.goBack();
    await page.waitForTimeout(400);
    assert.equal(await page.locator('.page-curtain').count(),0);
    await mobile.close();
    const reduced = await browser.newContext({viewport:{width:360,height:800},reducedMotion:'reduce'});
    const rp = await reduced.newPage();
    await rp.goto(base+'querino.html');
    assert.equal(await rp.locator('html').evaluate(el=>el.classList.contains('q-enhanced')),false);
    await rp.locator('.q-back').click();
    await rp.waitForURL('**/index.html#projeto-querino');
    await reduced.close();
    const noJS = await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:800}});
    const np = await noJS.newPage();
    await np.goto(base+'querino.html');
    assert.equal(await np.locator('.q-episode a').count(),8);
    assert.equal(await np.locator('.q-carousel-controls').isVisible(),false);
    await np.locator('.q-back').click();
    await np.waitForURL('**/index.html#projeto-querino');
    await noJS.close();
    assert.deepEqual(errors,[]);
    const report={results,errors,touch:true,verticalScroll:true,returnTransition:true,mobileMenu:true,browserBack:true,reducedMotion:true,noJavaScript:true};
    fs.writeFileSync(path.join(out,'querino-report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
