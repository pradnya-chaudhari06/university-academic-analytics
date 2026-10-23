import { spawn } from 'child_process';

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--remote-debugging-port=9455',
  '--headless=new',
  '--disable-gpu',
  'http://localhost:3000/login',
]);

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  await sleep(2000);
  try {
    const res = await fetch('http://127.0.0.1:9455/json');
    const json = await res.json();
    const target = json.find(t => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    const send = (method, params = {}) => new Promise((resolve) => {
      const curId = id++;
      const handler = (evt) => {
        const d = JSON.parse(evt.data);
        if (d.id === curId) {
          ws.removeEventListener('message', handler);
          resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('Clicking faculty role...');
    await send('Runtime.evaluate', { expression: 'document.querySelector("#role-btn-faculty").click()' });
    await sleep(500);

    console.log('Submitting login...');
    await send('Runtime.evaluate', { expression: 'document.querySelector("button[type=submit]").click()' });
    await sleep(4000);

    const loc = await send('Runtime.evaluate', { expression: 'window.location.href' });
    console.log('Location after login:', loc.result ? loc.result.value : 'unknown');

    // Wait 5 more seconds for dashboard fetch
    await sleep(5000);
    const body = await send('Runtime.evaluate', { expression: 'document.body ? document.body.innerText : "empty"' });
    console.log('Body Text length:', body.result ? body.result.value.length : 0);
    console.log('Body Text preview:\n', body.result ? body.result.value.substring(0, 1000) : '');

    // Check if there are console errors or network errors
    const errors = await send('Runtime.evaluate', { expression: 'window.__lastErrors || []' });
    console.log('Errors:', errors);

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chromeProc.kill();
  }
}

main();
