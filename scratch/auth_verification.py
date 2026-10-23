import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

def make_request(path, headers=None, method="GET"):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode('utf-8')
            return resp.status, json.loads(data) if data else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed
    except Exception as e:
        return 0, str(e)

def run_tests():
    results = []

    # 1. Admin Verification
    print("Testing Admin APIs...")
    admin_headers = {
        "X-User-Role": "Academic Administrator",
        "X-User-Email": "admin@university.edu"
    }
    status, body = make_request("/api/warehouse/status", admin_headers)
    results.append(("Admin: /api/warehouse/status", 200, status, status == 200))
    status, body = make_request("/api/kpis", admin_headers)
    results.append(("Admin: /api/kpis", 200, status, status == 200))

    # 2. Faculty Verification
    print("Testing Faculty APIs...")
    faculty_headers = {
        "X-User-Role": "Faculty",
        "X-User-Email": "faculty@university.edu"
    }
    status, body = make_request("/api/courses", faculty_headers)
    results.append(("Faculty: /api/courses", 200, status, status == 200))
    status, body = make_request("/api/students/at-risk", faculty_headers)
    results.append(("Faculty: /api/students/at-risk", 200, status, status == 200))

    # 3. Analytics Verification
    print("Testing Analytics APIs...")
    analytics_headers = {
        "X-User-Role": "Analyst",
        "X-User-Email": "analyst@university.edu"
    }
    status, body = make_request("/api/olap/matrix", analytics_headers)
    results.append(("Analytics: /api/olap/matrix", 200, status, status == 200))
    status, body = make_request("/api/mining/overview", analytics_headers)
    results.append(("Analytics: /api/mining/overview", 200, status, status == 200))
    status, body = make_request("/api/mining/clusters?k=3", analytics_headers)
    results.append(("Analytics: /api/mining/clusters", 200, status, status == 200))

    # 4. Student Verification (Legitimate access)
    print("Testing Student legitimate access...")
    student_headers = {
        "X-User-Role": "Student",
        "X-Student-Id": "STU1178",
        "X-User-Email": "student@university.edu"
    }
    status, body = make_request("/api/student/me/dashboard", student_headers)
    correct_student = False
    if status == 200 and isinstance(body, dict):
        profile = body.get("profile", {})
        correct_student = (profile.get("studentId") == "STU1178" and profile.get("studentName") == "Riya Patil")
    results.append(("Student: /api/student/me/dashboard (own STU1178)", 200, status, status == 200 and correct_student))

    # 5. Student Security Isolation & URL/Query Spoofing Tests
    print("Testing Student security isolation & spoofing attempts...")
    # Attempt to spoof student_id=STU102 via query param
    status, body = make_request("/api/student/me/dashboard?student_id=STU102", student_headers)
    results.append(("Student: Spoof student_id=STU102 on /api/student/me/dashboard", 403, status, status == 403))

    # Attempt to access another student via /api/student/STU102
    status, body = make_request("/api/student/STU102", student_headers)
    results.append(("Student: URL spoof /api/student/STU102", 403, status, status == 403))

    # Attempt to access /api/students (cohort directory)
    status, body = make_request("/api/students", student_headers)
    results.append(("Student: Access /api/students", 403, status, status == 403))

    # Attempt to access /api/students/at-risk
    status, body = make_request("/api/students/at-risk", student_headers)
    results.append(("Student: Access /api/students/at-risk", 403, status, status == 403))

    # Attempt to access /api/olap/matrix
    status, body = make_request("/api/olap/matrix", student_headers)
    results.append(("Student: Access /api/olap/matrix", 403, status, status == 403))

    # Attempt to access /api/warehouse/status
    status, body = make_request("/api/warehouse/status", student_headers)
    results.append(("Student: Access /api/warehouse/status", 403, status, status == 403))

    # Attempt to access /api/etl/run
    status, body = make_request("/api/etl/run", student_headers, method="POST")
    results.append(("Student: Trigger /api/etl/run", 403, status, status == 403))

    # Attempt to access /api/mining/overview
    status, body = make_request("/api/mining/overview", student_headers)
    results.append(("Student: Access /api/mining/overview", 403, status, status == 403))

    # Attempt to access /api/mining/clusters
    status, body = make_request("/api/mining/clusters?k=3", student_headers)
    results.append(("Student: Access /api/mining/clusters", 403, status, status == 403))

    # Attempt to access /api/mining/rules
    status, body = make_request("/api/mining/rules", student_headers)
    results.append(("Student: Access /api/mining/rules", 403, status, status == 403))

    # Attempt to access /api/mining/decision-tree
    status, body = make_request("/api/mining/decision-tree", student_headers)
    results.append(("Student: Access /api/mining/decision-tree", 403, status, status == 403))

    print("\n" + "="*80)
    print(f"{'TEST':<55} | {'EXPECTED':<10} | {'ACTUAL':<10} | {'PASS/FAIL'}")
    print("="*80)
    all_pass = True
    for name, expected, actual, passed in results:
        res_str = "PASS" if passed else "FAIL"
        if not passed:
            all_pass = False
        print(f"{name:<55} | {expected:<10} | {actual:<10} | {res_str}")
    print("="*80)
    print(f"Overall Result: {'ALL PASS' if all_pass else 'FAILURES DETECTED'}\n")
    return all_pass

if __name__ == "__main__":
    run_tests()
