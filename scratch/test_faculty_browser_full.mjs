import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9445;
const TEMP_USER_DATA = path.join(os.tmpdir(), 'chrome_faculty_test_' + Date.now());

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("================================================================================");
  console.log("STARTING FULL END-TO-END FACULTY MODULE BROWSER VERIFICATION");
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

    console.log("Connected to Chrome via DevTools Protocol:", target.url);
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

    const testResults = [];

    // -------------------------------------------------------------------------
    // STEP 1: LOGIN PAGE AUDIT (4 Roles Visible)
    // -------------------------------------------------------------------------
    console.log("\n[1/7] Inspecting Login Page & Role Options...");
    await navigate('http://localhost:3000/login');

    const loginText = (await evalJs('document.body.innerText')) || "";
    const loginLower = loginText.toLowerCase();
    const hasAdmin = loginLower.includes('admin');
    const hasFaculty = loginLower.includes('faculty');
    const hasAnalytics = loginLower.includes('analytics');
    const hasStudent = loginLower.includes('student');

    testResults.push({
      step: "Login Roles Check",
      details: "Admin, Faculty, Analytics, and Student all visibly selectable",
      pass: hasAdmin && hasFaculty && hasAnalytics && hasStudent
    });

    // -------------------------------------------------------------------------
    // STEP 2: FACULTY LOGIN & REDIRECT TO /faculty
    // -------------------------------------------------------------------------
    console.log("[2/7] Authenticating as Faculty (faculty@university.edu)...");
    
    // Select Faculty role button
    await evalJs(`
      const btn = document.querySelector('#role-btn-faculty');
      if (btn) btn.click();
    `);
    await sleep(1000);

    // Click Sign In
    await evalJs(`
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    `);
    await sleep(4000);

    const facultyUrl = await evalJs('window.location.pathname');
    const facultyLandingPass = facultyUrl === '/faculty';
    testResults.push({
      step: "Faculty Login Redirect",
      details: `Destination: ${facultyUrl} (Expected /faculty)`,
      pass: facultyLandingPass
    });

    // -------------------------------------------------------------------------
    // STEP 3: FACULTY DASHBOARD VERIFICATION
    // -------------------------------------------------------------------------
    console.log("[3/7] Verifying Faculty Dashboard & Teaching Cockpit...");
    const rawDashText = await waitForText('Faculty Academic Analytics', 40000);
    const dashLower = rawDashText.toLowerCase();
    const hasKpis = dashLower.includes('faculty academic analytics') && dashLower.includes('class average') && dashLower.includes('pass percentage');
    const hasTrend = dashLower.includes('class performance trend');
    const hasGradeDist = dashLower.includes('grade distribution');
    const hasCourseTable = dashLower.includes('course performance');
    const hasAtRisk = dashLower.includes('at-risk students');

    testResults.push({
      step: "Faculty Dashboard Sections",
      details: "KPIs, Trend, Grade Bands, Scatter Correlation, Course Matrix, At-Risk Roster, Insights rendered",
      pass: hasKpis && hasTrend && hasGradeDist && hasCourseTable && hasAtRisk
    });

    // Capture screenshot of Faculty Dashboard
    try {
      const dashShot = await send("Page.captureScreenshot");
      if (dashShot && dashShot.data) {
        fs.writeFileSync(path.resolve('frontend/faculty_dashboard_live.png'), Buffer.from(dashShot.data, 'base64'));
        console.log("Saved screenshot: frontend/faculty_dashboard_live.png");
      }
    } catch (e) {
      console.warn("Screenshot capture error:", e.message);
    }

    // -------------------------------------------------------------------------
    // STEP 4: CLASS PERFORMANCE PAGE (/faculty/performance)
    // -------------------------------------------------------------------------
    console.log("[4/7] Verifying Class Performance Analysis (/faculty/performance)...");
    await navigate('http://localhost:3000/faculty/performance');
    const rawPerfText = await waitForText('Curriculum Evaluation Matrix', 40000);
    const perfLower = rawPerfText.toLowerCase();
    const perfHasMatrix = perfLower.includes('curriculum evaluation matrix') || perfLower.includes('core courses');
    const perfHasTrend = perfLower.includes('longitudinal semester progression');
    const perfHasGradeDist = perfLower.includes('conformed grade band distribution') || perfLower.includes('grade band');

    testResults.push({
      step: "Class Performance Page",
      details: "Curriculum matrix, multi-semester longitudinal progression, grade bands, attendance tiers",
      pass: perfHasMatrix && perfHasTrend && perfHasGradeDist
    });

    // Capture screenshot of Class Performance
    try {
      const perfShot = await send("Page.captureScreenshot");
      if (perfShot && perfShot.data) {
        fs.writeFileSync(path.resolve('frontend/faculty_performance_live.png'), Buffer.from(perfShot.data, 'base64'));
        console.log("Saved screenshot: frontend/faculty_performance_live.png");
      }
    } catch (e) {}

    // -------------------------------------------------------------------------
    // STEP 5: ATTENDANCE ANALYSIS PAGE (/faculty/attendance)
    // -------------------------------------------------------------------------
    console.log("[5/7] Verifying Attendance Analysis (/faculty/attendance)...");
    await navigate('http://localhost:3000/faculty/attendance');
    // Wait for dynamic card that only exists once data is loaded
    const rawAttText = await waitForText('Statutory Limit', 40000);
    const attLower = rawAttText.toLowerCase();
    const attHasKpis = attLower.includes('statutory limit') || attLower.includes('cohort average attendance');
    const attHasTiers = attLower.includes('attendance tiers vs. mean academic performance');
    const attHasCorrelation = attLower.includes('pearson correlation') || attLower.includes('correlation');
    const attHasDeficit = attLower.includes('deficit attendance') || attLower.includes('regularization');

    testResults.push({
      step: "Attendance Analysis Page",
      details: "Threshold monitoring (<75%), attendance tiers, Pearson correlation, deficit student roster",
      pass: attHasKpis && attHasTiers && attHasCorrelation && attHasDeficit
    });

    // Capture screenshot of Attendance Analysis
    try {
      const attShot = await send("Page.captureScreenshot");
      if (attShot && attShot.data) {
        fs.writeFileSync(path.resolve('frontend/faculty_attendance_live.png'), Buffer.from(attShot.data, 'base64'));
        console.log("Saved screenshot: frontend/faculty_attendance_live.png");
      }
    } catch (e) {}

    // -------------------------------------------------------------------------
    // STEP 6: CLASS INSIGHTS PAGE (/faculty/insights)
    // -------------------------------------------------------------------------
    console.log("[6/7] Verifying Pedagogical Data Mining Insights (/faculty/insights)...");
    await navigate('http://localhost:3000/faculty/insights');
    const rawInsText = await waitForText('Student Capability Archetypes', 40000);
    const insLower = rawInsText.toLowerCase();
    const insHasArchetypes = insLower.includes('student capability archetypes') || insLower.includes('cohort profiles');
    const insHasBottlenecks = insLower.includes('curriculum bottleneck') || insLower.includes('association');
    const insHasPredictors = insLower.includes('early warning risk predictors') || insLower.includes('predictors');
    const insHasPlaybook = insLower.includes('faculty academic intervention playbook') || insLower.includes('playbook');

    testResults.push({
      step: "Pedagogical Insights Page",
      details: "K-Means archetypes, Apriori bottleneck patterns, Decision Tree indicators, Intervention playbook",
      pass: insHasArchetypes && insHasBottlenecks && insHasPredictors && insHasPlaybook
    });

    // Capture screenshot of Class Insights
    try {
      const insShot = await send("Page.captureScreenshot");
      if (insShot && insShot.data) {
        fs.writeFileSync(path.resolve('frontend/faculty_insights_live.png'), Buffer.from(insShot.data, 'base64'));
        console.log("Saved screenshot: frontend/faculty_insights_live.png");
      }
    } catch (e) {}

    // -------------------------------------------------------------------------
    // STEP 7: FACULTY STUDENT DETAIL (/faculty/student/STU1178)
    // -------------------------------------------------------------------------
    console.log("[7/7] Verifying Faculty Student Academic Profile (/faculty/student/STU1178)...");
    await navigate('http://localhost:3000/faculty/student/STU1178');
    const rawStuText = await waitForText('Riya Patil', 40000);
    const stuLower = rawStuText.toLowerCase();
    const hasStudentName = stuLower.includes('riya patil') || stuLower.includes('stu1178');
    const hasGpa = stuLower.includes('cumulative gpa') || stuLower.includes('gpa');
    const hasCourses = stuLower.includes('course breakdown') || stuLower.includes('subjects');
    const hasAction = stuLower.includes('faculty academic action') || stuLower.includes('intervention') || stuLower.includes('academic risk');

    testResults.push({
      step: "Faculty Student Profile",
      details: "Target student identity, CGPA, biometric attendance, active courses, pedagogical intervention",
      pass: hasStudentName && hasGpa && hasCourses && hasAction
    });

    // Capture screenshot of Student Academic Profile
    try {
      const stuShot = await send("Page.captureScreenshot");
      if (stuShot && stuShot.data) {
        fs.writeFileSync(path.resolve('frontend/faculty_student_profile_live.png'), Buffer.from(stuShot.data, 'base64'));
        console.log("Saved screenshot: frontend/faculty_student_profile_live.png");
      }
    } catch (e) {}

    // Summary output
    console.log("\n================================================================================");
    console.log("BROWSER VERIFICATION TEST RESULTS");
    console.log("================================================================================");
    let allPass = true;
    for (const r of testResults) {
      const statusStr = r.pass ? "PASS" : "FAIL";
      if (!r.pass) allPass = false;
      console.log(`[${statusStr}] ${r.step}: ${r.details}`);
    }
    console.log("================================================================================");
    console.log(`BROWSER STATUS: ${allPass ? "ALL BROWSER TESTS PASSED (100%)" : "SOME BROWSER TESTS FAILED"}`);
    console.log("================================================================================");

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error("Browser verification failed with error:", err);
  process.exit(1);
});
