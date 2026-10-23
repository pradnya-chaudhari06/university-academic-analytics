import { spawn } from 'child_process';
import os from 'os';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9460;
const TEMP_USER_DATA = path.join(os.tmpdir(), 'chrome_roles_test_' + Date.now());

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("================================================================================");
  console.log("ALL 4 ROLES LOGIN & ROUTING VERIFICATION SUITE");
  console.log("================================================================================");

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_USER_DATA}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:3000/login',
  ]);

  try {
    let target = null;
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json`);
        const json = await res.json();
        const pageTarget = json.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
        if (pageTarget) {
          target = pageTarget;
          break;
        }
      } catch (err) {}
    }

    if (!target) throw new Error("Failed to connect to isolated Chrome page target");

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let msgId = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && callbacks.has(data.id)) {
        const { resolve, reject } = callbacks.get(data.id);
        callbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
    });

    const send = (method, params = {}) => {
      const id = msgId++;
      return new Promise((resolve, reject) => {
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await send('Page.enable');
    await send('Runtime.enable');

    const evalJs = async (expr) => {
      const res = await send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true,
      });
      return res && res.result ? res.result.value : null;
    };

    const rolesToTest = [
      { role: 'Administrator', btnId: '#role-btn-admin', expectedRoute: '/dashboard' },
      { role: 'Faculty', btnId: '#role-btn-faculty', expectedRoute: '/faculty' },
      { role: 'Analytics', btnId: '#role-btn-analytics', expectedRoute: '/analytics/olap' },
      { role: 'Student', btnId: '#role-btn-student', expectedRoute: '/student' },
    ];

    const results = [];

    for (const item of rolesToTest) {
      console.log(`Testing Role: ${item.role}...`);
      await send('Page.navigate', { url: 'http://localhost:3000/login' });
      await sleep(2000);

      // Clear existing session
      await evalJs('localStorage.clear(); sessionStorage.clear();');
      await send('Page.navigate', { url: 'http://localhost:3000/login' });
      await sleep(2000);

      // Click role button
      await evalJs(`document.querySelector("${item.btnId}")?.click();`);
      await sleep(500);

      // Submit
      await evalJs('document.querySelector("button[type=submit]")?.click();');
      await sleep(4000);

      const currentPath = await evalJs('window.location.pathname');
      const pass = currentPath === item.expectedRoute;
      results.push({
        role: item.role,
        expected: item.expectedRoute,
        actual: currentPath,
        pass,
      });
      console.log(`  -> Actual Landing: ${currentPath} | Expected: ${item.expectedRoute} | Result: ${pass ? 'PASS' : 'FAIL'}`);
    }

    console.log("\n================================================================================");
    console.log("ROLES LANDING VERIFICATION SUMMARY");
    console.log("================================================================================");
    let allOk = true;
    for (const r of results) {
      if (!r.pass) allOk = false;
      console.log(`[${r.pass ? 'PASS' : 'FAIL'}] Role ${r.role.padEnd(14)} -> ${r.actual} (expected ${r.expected})`);
    }
    console.log("================================================================================");
    console.log(`OVERALL ROLES STATUS: ${allOk ? 'ALL 4 ROLES ROUTED CORRECTLY (100%)' : 'SOME ROLES MISROUTED'}`);
    console.log("================================================================================");

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

run().catch(console.error);
