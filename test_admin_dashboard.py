#!/usr/bin/env python3
"""
Test admin dashboard functionality
"""

import requests
import json

def test_admin_dashboard():
    """Test admin authentication and dashboard access"""
    print("🔐 Testing Admin Dashboard Access")
    print("=" * 40)
    
    # Test admin login
    try:
        login_data = {"username": "admin@sanitix.com", "password": "admin123"}
        response = requests.post("http://localhost:8001/api/auth/login", data=login_data)
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            print("✅ Admin login successful")
            
            # Test admin reports endpoint
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get("http://localhost:8001/api/admin/reports", headers=headers)
            
            if response.status_code == 200:
                reports_data = response.json()
                print(f"✅ Admin reports endpoint working ({len(reports_data.get('reports', []))} reports)")
            else:
                print(f"❌ Admin reports endpoint failed: {response.status_code}")
                return False
            
            # Test admin analytics endpoint
            response = requests.get("http://localhost:8001/api/admin/analytics", headers=headers)
            
            if response.status_code == 200:
                analytics_data = response.json()
                print(f"✅ Admin analytics endpoint working")
                print(f"   Total reports: {analytics_data.get('summary', {}).get('total_reports', 0)}")
                print(f"   High severity: {analytics_data.get('summary', {}).get('high_severity', 0)}")
                print(f"   Pending: {analytics_data.get('summary', {}).get('pending', 0)}")
            else:
                print(f"❌ Admin analytics endpoint failed: {response.status_code}")
                return False
            
            return True
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Admin dashboard test error: {str(e)}")
        return False

def test_user_access_to_admin():
    """Test that regular users cannot access admin endpoints"""
    print("\n🚫 Testing User Access to Admin Endpoints")
    print("=" * 40)
    
    try:
        # Login as regular user
        login_data = {"username": "user@sanitix.com", "password": "user123"}
        response = requests.post("http://localhost:8001/api/auth/login", data=login_data)
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            print("✅ User login successful")
            
            # Try to access admin reports endpoint
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get("http://localhost:8001/api/admin/reports", headers=headers)
            
            if response.status_code == 403:
                print("✅ User correctly blocked from admin reports endpoint")
            else:
                print(f"❌ User should be blocked from admin endpoint but got: {response.status_code}")
                return False
            
            # Try to access admin analytics endpoint
            response = requests.get("http://localhost:8001/api/admin/analytics", headers=headers)
            
            if response.status_code == 403:
                print("✅ User correctly blocked from admin analytics endpoint")
            else:
                print(f"❌ User should be blocked from admin endpoint but got: {response.status_code}")
                return False
            
            return True
        else:
            print(f"❌ User login failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ User access test error: {str(e)}")
        return False

def main():
    print("🚀 Admin Dashboard Test Suite")
    print("=" * 50)
    
    admin_ok = test_admin_dashboard()
    user_blocked_ok = test_user_access_to_admin()
    
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS:")
    print(f"Admin Access: {'✅ PASS' if admin_ok else '❌ FAIL'}")
    print(f"User Blocking: {'✅ PASS' if user_blocked_ok else '❌ FAIL'}")
    
    if admin_ok and user_blocked_ok:
        print("\n🎉 Admin Dashboard is working correctly!")
        print("✅ Admin users can access dashboard data")
        print("✅ Regular users are properly blocked")
        print("\n🔗 Admin Login Credentials:")
        print("  Email: admin@sanitix.com")
        print("  Password: admin123")
        print("\n🌐 Access Admin Dashboard:")
        print("  1. Login at http://localhost:3000/login")
        print("  2. Use admin credentials")
        print("  3. You'll be redirected to admin dashboard")
    else:
        print("\n⚠️  Admin dashboard has issues")
        print("Please check the failed components above")
    
    return admin_ok and user_blocked_ok

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
