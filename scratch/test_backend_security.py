import urllib.request
import urllib.error
import json

BASE = "http://127.0.0.1:8000"

def test_req(url, headers=None, method="GET"):
    headers = headers or {}
    req = urllib.request.Request(url, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = None
        try:
            body = json.loads(e.read().decode())
        except:
            pass
        return e.code, body

print("--- Testing Backend Endpoints ---")

# 1. Student accessing own dashboard
status, body = test_req(f"{BASE}/api/student/me/dashboard", headers={"X-Student-Id": "STU1178", "X-User-Role": "Student"})
print(f"1. Student ME dashboard: status={status}, name={body.get('profile', {}).get('studentName') if body else None}")

# 2. Student trying to query another student ID via query param
status, body = test_req(f"{BASE}/api/student/me/dashboard?student_id=STU102", headers={"X-Student-Id": "STU1178", "X-User-Role": "Student"})
print(f"2. Student query param spoof STU102: status={status} (expected 403)")

# 3. Student trying /api/student/STU102 (another student)
status, body = test_req(f"{BASE}/api/student/STU102", headers={"X-Student-Id": "STU1178", "X-User-Role": "Student"})
print(f"3. Student accessing /api/student/STU102: status={status} (expected 403)")

# 4. Student trying /api/student/STU1178 (own ID)
status, body = test_req(f"{BASE}/api/student/STU1178", headers={"X-Student-Id": "STU1178", "X-User-Role": "Student"})
print(f"4. Student accessing /api/student/STU1178: status={status} (expected 200)")

# 5. Student trying institutional at-risk roster
status, body = test_req(f"{BASE}/api/students/at-risk", headers={"X-Student-Id": "STU1178", "X-User-Role": "Student"})
print(f"5. Student accessing /api/students/at-risk: status={status} (expected 403)")

# 6. Student trying institutional student directory
status, body = test_req(f"{BASE}/api/students", headers={"X-Student-Id": "STU1178", "X-User-Role": "Student"})
print(f"6. Student accessing /api/students: status={status} (expected 403)")

# 7. Student trying data mining overview
status, body = test_req(f"{BASE}/api/mining/overview", headers={"X-Student-Id": "STU1178", "X-User-Role": "Student"})
print(f"7. Student accessing /api/mining/overview: status={status} (expected 403)")

# 8. Student trying warehouse status
status, body = test_req(f"{BASE}/api/warehouse/status", headers={"X-Student-Id": "STU1178", "X-User-Role": "Student"})
print(f"8. Student accessing /api/warehouse/status: status={status} (expected 403)")

# 9. Student trying ETL run
status, body = test_req(f"{BASE}/api/etl/run", headers={"X-Student-Id": "STU1178", "X-User-Role": "Student"}, method="POST")
print(f"9. Student accessing /api/etl/run: status={status} (expected 403)")

# 10. Student trying OLAP matrix
status, body = test_req(f"{BASE}/api/olap/matrix", headers={"X-Student-Id": "STU1178", "X-User-Role": "Student"})
print(f"10. Student accessing /api/olap/matrix: status={status} (expected 403)")

# 11. Faculty accessing students and at-risk
status, body = test_req(f"{BASE}/api/students/at-risk", headers={"X-User-Role": "Faculty"})
print(f"11. Faculty accessing /api/students/at-risk: status={status} (expected 200)")

# 12. Admin accessing warehouse status
status, body = test_req(f"{BASE}/api/warehouse/status", headers={"X-User-Role": "System Administrator"})
print(f"12. Admin accessing /api/warehouse/status: status={status} (expected 200)")
