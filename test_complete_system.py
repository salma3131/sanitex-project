#!/usr/bin/env python3
"""
Complete system test to verify all components are working
"""

import asyncio
import websockets
import requests
import json

async def test_websocket():
    """Test WebSocket connection"""
    print("🔌 Testing WebSocket connection...")
    try:
        async with websockets.connect("ws://localhost:8001/ws") as websocket:
            print("✅ WebSocket connected successfully!")
            
            # Send test message
            await websocket.send("Test message from system test")
            response = await websocket.recv()
            print(f"📥 WebSocket response: {response}")
            
            return True
    except Exception as e:
        print(f"❌ WebSocket test failed: {str(e)}")
        return False

def test_api_endpoints():
    """Test main API endpoints"""
    print("\n🌐 Testing API endpoints...")
    
    # Test health check
    try:
        response = requests.get("http://localhost:8001/health")
        if response.status_code == 200:
            print("✅ Health check working")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
        return False
    
    # Test authentication
    try:
        login_data = {"username": "user@sanitix.com", "password": "user123"}
        response = requests.post("http://localhost:8001/api/auth/login", data=login_data)
        if response.status_code == 200:
            token = response.json()["access_token"]
            print("✅ Authentication working")
            
            # Test reports endpoint
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get("http://localhost:8001/api/reports/my-reports", headers=headers)
            if response.status_code == 200:
                print("✅ Reports endpoint working")
                return True
            else:
                print(f"❌ Reports endpoint failed: {response.status_code}")
                return False
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API test error: {str(e)}")
        return False

def test_frontend_server():
    """Test if frontend server is running"""
    print("\n🎨 Testing frontend server...")
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend server running")
            return True
        else:
            print(f"❌ Frontend server responded with: {response.status_code}")
            return False
    except requests.exceptions.Timeout:
        print("❌ Frontend server timeout")
        return False
    except Exception as e:
        print(f"❌ Frontend server error: {str(e)}")
        return False

async def main():
    print("🚀 Starting Complete System Test")
    print("=" * 50)
    
    # Test all components
    websocket_ok = await test_websocket()
    api_ok = test_api_endpoints()
    frontend_ok = test_frontend_server()
    
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS:")
    print(f"WebSocket: {'✅ PASS' if websocket_ok else '❌ FAIL'}")
    print(f"API: {'✅ PASS' if api_ok else '❌ FAIL'}")
    print(f"Frontend: {'✅ PASS' if frontend_ok else '❌ FAIL'}")
    
    if websocket_ok and api_ok and frontend_ok:
        print("\n🎉 ALL SYSTEMS OPERATIONAL!")
        print("Your Sanitex website is ready for use!")
        print("\n🔗 Access URLs:")
        print("  Frontend: http://localhost:3000")
        print("  Backend: http://localhost:8001")
        print("\n👤 Login Credentials:")
        print("  User: user@sanitix.com / user123")
        print("  Admin: admin@sanitix.com / admin123")
    else:
        print("\n⚠️  Some systems need attention")
        print("Please check the failed components above")
    
    return websocket_ok and api_ok and frontend_ok

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
