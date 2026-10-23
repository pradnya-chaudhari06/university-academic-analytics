import { spawn } from 'child_process';

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--remote-debugging-port=9459',
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
    const res = await fetch('http://127.0.0.1:9459/json');
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
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      return r && r.result ? r.result.value : null;
    };

    // Login as faculty
    await evalJs('document.querySelector("#role-btn-faculty").click()');
    await sleep(500);
    await evalJs('document.querySelector("button[type=submit]").click()');
    await sleep(10000);

    // 1. Dashboard checks
    const dText = await evalJs('document.body.innerText');
    console.log('--- DASHBOARD ---');
    console.log('has Faculty Academic Analytics:', dText.includes('Faculty Academic Analytics'));
    console.log('has Class Average:', dText.includes('Class Average'));
    console.log('has Pass Percentage:', dText.includes('Pass Percentage'));
    console.log('has Class Performance Trend:', dText.includes('Class Performance Trend'));
    console.log('has Grade Distribution:', dText.includes('Grade Distribution'));
    console.log('has Course Performance:', dText.includes('Course Performance'));
    console.log('has At-Risk Students:', dText.includes('At-Risk Students'));

    // 2. Attendance checks
    await send('Page.navigate', { url: 'http://localhost:3000/faculty/attendance' });
    await sleep(10000);
    const aText = await evalJs('document.body.innerText');
    console.log('--- ATTENDANCE ---');
    console.log('has Cohort Average Attendance:', aText.includes('Cohort Average Attendance'));
    console.log('has Statutory Limit:', aText.includes('Statutory Limit'));
    console.log('has Attendance Tiers vs. Mean Academic Performance:', aText.includes('Attendance Tiers vs. Mean Academic Performance'));
    console.log('has Scatter Sample:', aText.includes('Scatter Sample'));
    console.log('has Pearson Correlation:', aText.includes('Pearson Correlation'));
    console.log('has Deficit Attendance:', aText.includes('Deficit Attendance'));
    console.log('has Regularization:', aText.includes('Regularization'));

    // 3. Student profile checks
    await send('Page.navigate', { url: 'http://localhost:3000/faculty/student/STU1178' });
    await sleep(10000);
    const sText = await evalJs('document.body.innerText');
    console.log('--- STUDENT PROFILE ---');
    console.log('has Riya Patil:', sText.includes('Riya Patil'));
    console.log('has STU1178:', sText.includes('STU1178'));
    console.log('has Cumulative GPA:', sText.includes('Cumulative GPA'));
    console.log('has GPA:', sText.includes('GPA'));
    console.log('has Course Evaluations:', sText.includes('Course Evaluations'));
    console.log('has Subjects:', sText.includes('Subjects'));
    console.log('has Course Breakdown:', sText.includes('Course Breakdown'));
    console.log('has Faculty Academic Action:', sText.includes('Faculty Academic Action'));
    console.log('has Intervention:', sText.includes('Intervention'));

    ws.close();
  } catch (e) {
    console.error('Error:', e);
  } finally {
    chromeProc.kill();
  }
}

main();
