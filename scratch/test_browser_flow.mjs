import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9444;
const TEMP_USER_DATA = path.join(os.tmpdir(), 'chrome_test_profile_' + Date.now());

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("Launching fresh isolated Chrome on port " + PORT + "...");
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
      } catch (err) {
        // Retry
      }
    }

    if (!target) {
      throw new Error("Failed to connect to isolated Chrome page target");
    }

    console.log("Connected to Chrome page:", target.url);
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

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCommand("Page.enable");
    await sendCommand("Runtime.enable");

    // Wait for Next.js to fully hydrate
    await sleep(3000);

    // Verify 4 roles presence
    const checkRoles = await sendCommand("Runtime.evaluate", {
      expression: `
        (() => {
          const bodyText = document.body.innerText;
          return {
            hasAdmin: bodyText.includes('Administrator') && bodyText.includes('System administration & warehouse control'),
            hasFaculty: bodyText.includes('Faculty') && bodyText.includes('Academic monitoring & student performance'),
            hasAnalytics: bodyText.includes('Analytics') && bodyText.includes('OLAP, data mining & institutional analytics'),
            hasStudent: bodyText.includes('Student') && bodyText.includes('Personal academic performance & insights'),
          };
        })()
      `,
      returnByValue: true,
    });
    console.log("4 Roles Presence Check:", checkRoles.result.value);

    // Click Student button
    console.log("Clicking Student role button...");
    const clickStudent = await sendCommand("Runtime.evaluate", {
      expression: `
        (() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const studentBtn = buttons.find(b => b.innerText.includes('Student') && b.innerText.includes('Personal academic performance'));
          if (studentBtn) {
            studentBtn.click();
            return true;
          }
          return false;
        })()
      `,
      returnByValue: true,
    });
    console.log("Student card clicked:", clickStudent.result.value);
    await sleep(1000);

    // Check credentials and active profile banner
    const stateAfterStudentClick = await sendCommand("Runtime.evaluate", {
      expression: `
        (() => {
          const emailInput = document.querySelector('input[type="email"]');
          const passInput = document.querySelector('input[type="password"]');
          const submitBtn = document.querySelector('button[type="submit"]');
          const bodyText = document.body.innerText;
          return {
            email: emailInput ? emailInput.value : null,
            pass: passInput ? passInput.value : null,
            submitBtnText: submitBtn ? submitBtn.innerText : null,
            showsDestinationStudent: bodyText.includes('/student'),
            showsRiyaPatil: bodyText.includes('Riya Patil')
          };
        })()
      `,
      returnByValue: true,
    });
    console.log("State after Student selection:", stateAfterStudentClick.result.value);

    // Capture screenshot of Student selected
    const screenshot1 = await sendCommand("Page.captureScreenshot");
    fs.writeFileSync(
      path.resolve("frontend/login_student_selected.png"),
      Buffer.from(screenshot1.data, 'base64')
    );
    console.log("Saved screenshot: frontend/login_student_selected.png");

    // Click submit button
    console.log("Submitting login form as Student...");
    await sendCommand("Runtime.evaluate", {
      expression: `
        (() => {
          const submitBtn = document.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.click();
        })()
      `,
    });

    // Listen to console messages
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        const text = data.params.args.map(a => a.value || a.description).join(' ');
        console.log(`[Browser Console ${data.params.type}]:`, text);
      }
      if (data.id && callbacks.has(data.id)) {
        const { resolve, reject } = callbacks.get(data.id);
        callbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    // Wait for redirect to /student and warehouse queries to complete
    await sleep(14000);

    const postLoginState = await sendCommand("Runtime.evaluate", {
      expression: `
        (() => {
          return {
            currentUrl: window.location.href,
            hasRiyaPatil: document.body.innerText.includes('Riya Patil'),
            hasSTU1178: document.body.innerText.includes('STU1178'),
            hasCGPA: document.body.innerText.includes('7.42'),
            hasSGPA: document.body.innerText.includes('5.60'),
            hasSubjects: document.body.innerText.includes('Computer Networks'),
            hasAtRiskBadge: document.body.innerText.includes('Academic Monitoring') || document.body.innerText.includes('At-Risk'),
            sidebarLinks: Array.from(document.querySelectorAll('aside a')).map(a => a.getAttribute('href'))
          };
        })()
      `,
      returnByValue: true,
    });
    console.log("Post-login state on /student:", postLoginState.result.value);

    // Capture screenshot of the loaded Student Dashboard
    const screenshot2 = await sendCommand("Page.captureScreenshot");
    fs.writeFileSync(
      path.resolve("frontend/student_dashboard_live.png"),
      Buffer.from(screenshot2.data, 'base64')
    );
    console.log("Saved screenshot: frontend/student_dashboard_live.png");

    ws.close();
  } finally {
    chromeProc.kill();
    try {
      fs.rmSync(TEMP_USER_DATA, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
