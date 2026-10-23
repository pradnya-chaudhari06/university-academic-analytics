import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9555;
const TEMP_USER_DATA = path.join(os.tmpdir(), 'chrome_test_profile_' + Date.now());

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_USER_DATA}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,1024',
    'http://localhost:3000/login',
  ]);

  try {
    let target = null;
    for (let i = 0; i < 25; i++) {
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

    await new Promise((resolve) => ws.onopen = resolve);
    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCommand("Page.enable");
    await sendCommand("Runtime.enable");
    await sleep(2500);

    // Click Student
    await sendCommand("Runtime.evaluate", {
      expression: `
        (() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const studentBtn = buttons.find(b => b.innerText.includes('Student') && b.innerText.includes('Personal academic performance'));
          if (studentBtn) studentBtn.click();
        })()
      `
    });
    await sleep(500);

    // Submit
    await sendCommand("Runtime.evaluate", {
      expression: `document.querySelector('button[type="submit"]').click()`
    });

    // Wait 5s for page to fetch data
    await sleep(5000);

    // Check fetch directly from browser context
    const checkApi = await sendCommand("Runtime.evaluate", {
      expression: `
        (async () => {
          try {
            const session = localStorage.getItem('uni_academic_auth_session');
            const res = await fetch('http://127.0.0.1:8000/api/student/me/dashboard', {
              headers: {
                'X-User-Role': 'Student',
                'X-Student-Id': 'STU1178'
              }
            });
            const data = await res.json();
            return {
              session: JSON.parse(session),
              apiStatus: res.status,
              hasCgpa: data?.kpis?.cgpa,
              studentName: data?.profile?.studentName,
              bodyHtmlSnippet: document.body.innerHTML.substring(0, 500)
            };
          } catch(e) {
            return { error: e.toString() };
          }
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log("Browser Context API & Session Check:", JSON.stringify(checkApi.result.value, null, 2));

    const checkDom = await sendCommand("Runtime.evaluate", {
      expression: `
        (() => {
          const body = document.body.innerText;
          return {
            hasCgpaText: body.includes('7.42'),
            hasSgpaText: body.includes('5.60'),
            hasNetWorkText: body.includes('Computer Networks'),
            fullTextLength: body.length
          };
        })()
      `,
      returnByValue: true
    });
    console.log("DOM text check:", checkDom.result.value);

    // Save screenshot
    const screenshot = await sendCommand("Page.captureScreenshot");
    fs.writeFileSync(
      path.resolve("frontend/student_dashboard_live.png"),
      Buffer.from(screenshot.data, 'base64')
    );
    console.log("Screenshot saved.");

    ws.close();
  } finally {
    chromeProc.kill();
    try { fs.rmSync(TEMP_USER_DATA, { recursive: true, force: true }); } catch {}
  }
}

run().catch(console.error);
