#!/usr/bin/env python3
"""
Test admin dashboard functionality and identify the exact issue
"""

import requests
import json

def test_admin_endpoints():
    """Test all admin endpoints to identify the issue"""
    print("🔧 Testing Admin Dashboard Endpoints")
    print("=" * 40)
    
    # Test admin login
    try:
        login_data = {"username": "admin@sanitix.com", "password": "admin123"}
        response = requests.post("http://localhost:8001/api/auth/login", data=login_data)
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            print("✅ Admin login successful")
            print(f"Token: {token[:50]}...")
            
            headers = {"Authorization": f"Bearer {token}"}
            
            # Test admin reports endpoint
            print("\n📊 Testing Admin Reports Endpoint...")
            response = requests.get("http://localhost:8001/api/admin/reports", headers=headers)
            print(f"Status: {response.status_code}")
            print(f"OK: {response.ok}")
            print(f"Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Reports endpoint working ({len(data.get('reports', []))} reports)")
                print(f"Response keys: {list(data.keys())}")
            else:
                print(f"❌ Reports endpoint failed: {response.status_code}")
                print(f"Response text: {response.text}")
                return False
            
            # Test admin analytics endpoint
            print("\n📈 Testing Admin Analytics Endpoint...")
            response = requests.get("http://localhost:8001/api/admin/analytics", headers=headers)
            print(f"Status: {response.status_code}")
            print(f"OK: {response.ok}")
            print(f"Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Analytics endpoint working")
                print(f"Response keys: {list(data.keys())}")
                print(f"Summary: {data.get('summary', {})}")
            else:
                print(f"❌ Analytics endpoint failed: {response.status_code}")
                print(f"Response text: {response.text}")
                return False
            
            return True
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Admin test error: {str(e)}")
        return False

def test_user_access():
    """Test that regular users are properly blocked"""
    print("\n🚫 Testing User Access to Admin Endpoints")
    print("=" * 40)
    
    try:
        # Login as regular user
        login_data = {"username": "user@sanitix.com", "password": "user123"}
        response = requests.post("http://localhost:8001/api/auth/login", data=login_data)
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # Try to access admin reports
            response = requests.get("http://localhost:8001/api/admin/reports", headers=headers)
            print(f"User access to reports: {response.status_code}")
            
            # Try to access admin analytics
            response = requests.get("http://localhost:8001/api/admin/analytics", headers=headers)
            print(f"User access to analytics: {response.status_code}")
            
            return True
        else:
            print(f"User login failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"User access test error: {str(e)}")
        return False

def test_invalid_token():
    """Test behavior with invalid token"""
    print("\n🔐 Testing Invalid Token Behavior")
    print("=" * 40)
    
    try:
        headers = {"Authorization": "Bearer invalid_token"}
        
        # Test admin reports with invalid token
        response = requests.get("http://localhost:8001/api/admin/reports", headers=headers)
        print(f"Invalid token to reports: {response.status_code}")
        
        # Test admin analytics with invalid token
        response = requests.get("http://localhost:8001/api/admin/analytics", headers=headers)
        print(f"Invalid token to analytics: {response.status_code}")
        
        return True
    except Exception as e:
        print(f"Invalid token test error: {str(e)}")
        return False

def main():
    print("🚀 Admin Dashboard Comprehensive Test")
    print("=" * 50)
    
    admin_ok = test_admin_endpoints()
    user_blocked_ok = test_user_access()
    invalid_token_ok = test_invalid_token()
    
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS:")
    print(f"Admin Access: {'✅ PASS' if admin_ok else '❌ FAIL'}")
    print(f"User Blocking: {'✅ PASS' if user_blocked_ok else '❌ FAIL'}")
    print(f"Invalid Token: {'✅ PASS' if invalid_token_ok else '❌ FAIL'}")
    
    if admin_ok and user_blocked_ok and invalid_token_ok:
        print("\n🎉 All Admin Endpoints Working Correctly!")
        print("The issue is likely in the frontend error handling logic.")
        print("\n🔧 Frontend Fix Needed:")
        print("1. Check response.ok logic in AdminDashboard.tsx")
        print("2. Verify token is being passed correctly")
        print("3. Check for race conditions in fetch calls")
    else:
        print("\n⚠️  Some backend endpoints have issues")
        print("Please check the failed components above")
    
    return admin_ok and user_blocked_ok and invalid_token_ok

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
