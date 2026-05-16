#!/usr/bin/env python3
"""
Debug admin API error issue
"""

import requests
import json

def test_admin_api_detailed():
    """Test admin API with detailed debugging"""
    print("🔧 Admin API Debug Test")
    print("=" * 25)
    
    try:
        # Step 1: Login as admin
        print("1. Testing admin login...")
        login_data = {"username": "admin@sanitix.com", "password": "admin123"}
        response = requests.post("http://localhost:8001/api/auth/login", data=login_data)
        
        if response.status_code != 200:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
        token = response.json()["access_token"]
        print("✅ Login successful")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 2: Test admin reports endpoint
        print("\n2. Testing admin reports endpoint...")
        response = requests.get("http://localhost:8001/api/admin/reports", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Status Text: {response.reason}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Content-Type: {response.headers.get('content-type')}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✅ Reports endpoint working")
                print(f"Data keys: {list(data.keys())}")
                print(f"Reports count: {len(data.get('reports', []))}")
            except json.JSONDecodeError as e:
                print(f"❌ JSON decode error: {e}")
                print(f"Response text: {response.text[:500]}...")
                return False
        else:
            print(f"❌ Reports endpoint failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        # Step 3: Test admin analytics endpoint
        print("\n3. Testing admin analytics endpoint...")
        response = requests.get("http://localhost:8001/api/admin/analytics", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Status Text: {response.reason}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Content-Type: {response.headers.get('content-type')}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✅ Analytics endpoint working")
                print(f"Data keys: {list(data.keys())}")
                print(f"Summary: {data.get('summary', {})}")
            except json.JSONDecodeError as e:
                print(f"❌ JSON decode error: {e}")
                print(f"Response text: {response.text[:500]}...")
                return False
        else:
            print(f"❌ Analytics endpoint failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False

def test_frontend_simulation():
    """Simulate frontend fetch behavior"""
    print("\n📱 Frontend Simulation Test")
    print("=" * 30)
    
    try:
        # Simulate frontend fetch
        import urllib.request
        
        # Login first
        login_data = "username=admin@sanitix.com&password=admin123"
        req = urllib.request.Request(
            "http://localhost:8001/api/auth/login",
            data=login_data.encode(),
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        with urllib.request.urlopen(req) as response:
            token_data = json.loads(response.read().decode())
            token = token_data["access_token"]
        
        print("✅ Frontend login simulation successful")
        
        # Simulate frontend reports fetch
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        req = urllib.request.Request(
            "http://localhost:8001/api/admin/reports",
            headers=headers
        )
        
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            status_text = response.reason
            headers_dict = dict(response.headers)
            
            print(f"Frontend simulation - Status: {status_code}")
            print(f"Frontend simulation - Status Text: {status_text}")
            print(f"Frontend simulation - Headers: {headers_dict}")
            
            if status_code >= 400:
                print("🚨 Frontend simulation would trigger error handling!")
                return False
            else:
                print("✅ Frontend simulation successful")
                return True
                
    except Exception as e:
        print(f"❌ Frontend simulation error: {str(e)}")
        return False

def main():
    print("🚀 Admin API Debug Suite")
    print("=" * 25)
    
    api_ok = test_admin_api_detailed()
    frontend_ok = test_frontend_simulation()
    
    print("\n" + "=" * 25)
    print("📊 DEBUG RESULTS:")
    print(f"API Test: {'✅ PASS' if api_ok else '❌ FAIL'}")
    print(f"Frontend Simulation: {'✅ PASS' if frontend_ok else '❌ FAIL'}")
    
    if api_ok and frontend_ok:
        print("\n🎉 Admin API Working Correctly!")
        print("📱 The issue is likely in frontend error handling logic")
        print("🔍 Check browser console for detailed response logs")
    else:
        print("\n⚠️  Admin API Issues Detected")
        print("Check the failed components above")
    
    return api_ok and frontend_ok

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
