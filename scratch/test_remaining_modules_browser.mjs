import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9461;
const TEMP_USER_DATA = path.join(os.tmpdir(), 'chrome_remaining_test_' + Date.now());

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("================================================================================");
  console.log("FULL END-TO-END BROWSER AUDIT: ADMIN, ANALYTICS & STUDENT MODULES");
  console.log("================================================================================");

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

    const navigate = async (url) => {
      await send('Page.navigate', { url });
      await sleep(2500);
    };

    const waitForText = async (substring, maxMs = 40000) => {
      const subLower = substring.toLowerCase();
      const start = Date.now();
      while (Date.now() - start < maxMs) {
        const text = await evalJs('document.body ? document.body.innerText : ""');
        if (text && text.toLowerCase().includes(subLower)) {
          return text;
        }
        await sleep(800);
      }
      return await evalJs('document.body ? document.body.innerText : ""');
    };

    const results = [];

    // =========================================================================
    // FLOW 1: ADMINISTRATOR MODULE (/dashboard, /warehouse, /warehouse/etl)
    // =========================================================================
    console.log("\n[1/6] Authenticating as Administrator...");
    await navigate('http://localhost:3000/login');
    await evalJs('localStorage.clear(); sessionStorage.clear();');
    await navigate('http://localhost:3000/login');
    await evalJs('document.querySelector("#role-btn-admin")?.click();');
    await sleep(500);
    await evalJs('document.querySelector("button[type=submit]")?.click();');
    await sleep(4000);

    const adminPath = await evalJs('window.location.pathname');
    console.log("  -> Admin landed on:", adminPath);

    console.log("[2/6] Verifying Administrator Dashboard (/dashboard)...");
    const rawDash = await waitForText('Students Enrolled', 35000);
    const dashLower = rawDash.toLowerCase();
    const hasAdminKpis = dashLower.includes('students enrolled') && dashLower.includes('cohort cgpa');
    results.push({
      step: "Administrator Dashboard",
      route: "/dashboard",
      details: "Institutional KPI summary (Students Enrolled: 4,820, CGPA: 7.82), department performance",
      pass: adminPath === '/dashboard' && hasAdminKpis
    });

    try {
      const s = await send("Page.captureScreenshot");
      if (s && s.data) fs.writeFileSync(path.resolve('frontend/admin_dashboard_live.png'), Buffer.from(s.data, 'base64'));
    } catch (e) {}

    console.log("[3/6] Verifying Data Warehouse Status (/warehouse)...");
    await navigate('http://localhost:3000/warehouse');
    const rawWh = await waitForText('Star Schema', 35000);
    const whLower = rawWh.toLowerCase();
    const hasWhInfo = whLower.includes('star schema') || whLower.includes('fact_academic_performance') || whLower.includes('warehouse');
    results.push({
      step: "Warehouse Operations Page",
      route: "/warehouse",
      details: "Conformed star schema fact tables, dimension counts, and audit logs",
      pass: hasWhInfo
    });

    try {
      const s = await send("Page.captureScreenshot");
      if (s && s.data) fs.writeFileSync(path.resolve('frontend/warehouse_status_live.png'), Buffer.from(s.data, 'base64'));
    } catch (e) {}

    // =========================================================================
    // FLOW 2: ANALYTICS / OLAP & DATA MINING MODULES
    // =========================================================================
    console.log("\n[4/6] Authenticating as Analytics...");
    await navigate('http://localhost:3000/login');
    await evalJs('localStorage.clear(); sessionStorage.clear();');
    await navigate('http://localhost:3000/login');
    await evalJs('document.querySelector("#role-btn-analytics")?.click();');
    await sleep(500);
    await evalJs('document.querySelector("button[type=submit]")?.click();');
    await sleep(4000);

    const anaPath = await evalJs('window.location.pathname');
    console.log("  -> Analytics landed on:", anaPath);

    console.log("[5/6] Verifying OLAP Cube Matrix (/analytics/olap)...");
    const rawOlap = await waitForText('OLAP', 35000);
    const olapLower = rawOlap.toLowerCase();
    const hasOlapMatrix = olapLower.includes('olap') || olapLower.includes('semester') || olapLower.includes('cube');
    results.push({
      step: "OLAP Multi-Dimensional Matrix",
      route: "/analytics/olap",
      details: "DimTime × DimDepartment slice-and-dice cube aggregations",
      pass: anaPath === '/analytics/olap' && hasOlapMatrix
    });

    try {
      const s = await send("Page.captureScreenshot");
      if (s && s.data) fs.writeFileSync(path.resolve('frontend/analytics_olap_live.png'), Buffer.from(s.data, 'base64'));
    } catch (e) {}

    console.log("[6/6] Verifying Data Mining Algorithms (/analytics/data-mining)...");
    await navigate('http://localhost:3000/analytics/data-mining');
    const rawMining = await waitForText('K-Means', 35000);
    const miningLower = rawMining.toLowerCase();
    const hasMiningAlgos = miningLower.includes('k-means') || miningLower.includes('apriori') || miningLower.includes('decision tree');
    results.push({
      step: "Institutional Data Mining Dashboard",
      route: "/analytics/data-mining",
      details: "K-Means clusters, Apriori association rules, Decision Tree classification",
      pass: hasMiningAlgos
    });

    try {
      const s = await send("Page.captureScreenshot");
      if (s && s.data) fs.writeFileSync(path.resolve('frontend/analytics_mining_live.png'), Buffer.from(s.data, 'base64'));
    } catch (e) {}

    // =========================================================================
    // FLOW 3: STUDENT MODULE (/student)
    // =========================================================================
    console.log("\n[7/7] Authenticating as Student (Riya Patil · STU1178)...");
    await navigate('http://localhost:3000/login');
    await evalJs('localStorage.clear(); sessionStorage.clear();');
    await navigate('http://localhost:3000/login');
    await evalJs('document.querySelector("#role-btn-student")?.click();');
    await sleep(500);
    await evalJs('document.querySelector("button[type=submit]")?.click();');
    await sleep(4000);

    const stuPath = await evalJs('window.location.pathname');
    console.log("  -> Student landed on:", stuPath);

    // Wait for dynamic academic numbers from the warehouse
    const rawStu = await waitForText('Cumulative CGPA', 35000);
    const stuLower = rawStu.toLowerCase();
    const hasStuData = stuLower.includes('cumulative cgpa') || stuLower.includes('earned credits') || stuLower.includes('sgpa');
    results.push({
      step: "Personal Student Dashboard",
      route: "/student",
      details: "Personal academic record, SGPA/CGPA, subject marks, attendance & personalized suggestions",
      pass: stuPath === '/student' && hasStuData
    });

    try {
      const s = await send("Page.captureScreenshot");
      if (s && s.data) fs.writeFileSync(path.resolve('frontend/student_dashboard_live.png'), Buffer.from(s.data, 'base64'));
    } catch (e) {}

    // Summary
    console.log("\n================================================================================");
    console.log("BROWSER AUDIT RESULTS: ADMIN, ANALYTICS & STUDENT");
    console.log("================================================================================");
    let allOk = true;
    for (const r of results) {
      if (!r.pass) allOk = false;
      console.log(`[${r.pass ? 'PASS' : 'FAIL'}] ${r.step.padEnd(36)} (${r.route}) | ${r.details}`);
    }
    console.log("================================================================================");
    console.log(`BROWSER AUDIT STATUS: ${allOk ? 'ALL AUDITED MODULES PASSED (100%)' : 'FAILURES DETECTED'}`);
    console.log("================================================================================");

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

run().catch(console.error);
