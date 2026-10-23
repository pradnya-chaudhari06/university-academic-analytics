import { spawn } from 'child_process';

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--remote-debugging-port=9456',
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
    const res = await fetch('http://127.0.0.1:9456/json');
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

    const evalJs = async (expr) => {
      const r = await send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true,
      });
      return r && r.result ? r.result.value : null;
    };

    console.log('Selecting Faculty...');
    await evalJs('document.querySelector("#role-btn-faculty").click()');
    await sleep(500);

    console.log('Clicking Submit...');
    await evalJs('document.querySelector("button[type=submit]").click()');
    console.log('Login clicked. Polling for dashboard content...');

    const start = Date.now();
    let found = false;
    while (Date.now() - start < 30000) {
      const text = await evalJs('document.body ? document.body.innerText : ""');
      if (text && text.includes('Faculty Academic Analytics')) {
        console.log(`[SUCCESS] Found "Faculty Academic Analytics" after ${Date.now() - start}ms!`);
        console.log('Full Text on Page:\n----------------------------------------\n', text, '\n----------------------------------------');
        found = true;
        break;
      }
      await sleep(1000);
    }

    if (!found) {
      console.log('Timeout waiting for Total Students.');
      const text = await evalJs('document.body ? document.body.innerText : ""');
      console.log('Text preview:', text ? text.substring(0, 500) : 'none');
    }

    ws.close();
  } catch (e) {
    console.error('Error:', e);
  } finally {
    chromeProc.kill();
  }
}

main();
