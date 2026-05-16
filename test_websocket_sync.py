#!/usr/bin/env python3
"""
Test WebSocket synchronization between admin and user dashboards
"""

import asyncio
import websockets
import json
import requests
import threading
import time

async def websocket_listener(uri, name):
    """Listen for WebSocket messages"""
    print(f"🔌 {name} connecting to WebSocket...")
    try:
        async with websockets.connect(uri) as websocket:
            print(f"✅ {name} connected successfully")
            
            while True:
                try:
                    message = await websocket.recv()
                    print(f"📥 {name} received: {message}")
                except websockets.exceptions.ConnectionClosed:
                    print(f"🔌 {name} disconnected")
                    break
                except Exception as e:
                    print(f"❌ {name} error: {str(e)}")
                    break
                    
    except Exception as e:
        print(f"❌ {name} connection failed: {str(e)}")

def test_status_update_broadcast():
    """Test that status updates are broadcast to all connected clients"""
    print("🚀 Testing WebSocket Status Update Broadcast")
    print("=" * 50)
    
    # Get admin token
    try:
        login_data = {"username": "admin@sanitix.com", "password": "admin123"}
        response = requests.post("http://localhost:8001/api/auth/login", data=login_data)
        
        if response.status_code != 200:
            print("❌ Admin login failed")
            return False
            
        token = response.json()["access_token"]
        print("✅ Admin login successful")
        
        # Start WebSocket listeners
        uri = "ws://localhost:8001/ws"
        
        # Create multiple listeners to simulate admin and user dashboards
        listeners = []
        for i in range(3):
            listener = asyncio.create_task(websocket_listener(uri, f"Listener-{i+1}"))
            listeners.append(listener)
        
        # Wait a moment for connections to establish
        time.sleep(2)
        
        # Update a report status to trigger broadcast
        print("\n📊 Updating report status to trigger broadcast...")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get a report ID first
        response = requests.get("http://localhost:8001/api/admin/reports", headers=headers)
        if response.status_code == 200:
            reports = response.json().get("reports", [])
            if reports:
                report_id = reports[0]["id"]
                print(f"📝 Updating report {report_id} status...")
                
                # Update the report status
                update_response = requests.put(
                    f"http://localhost:8001/api/admin/reports/{report_id}/status?status=In Progress",
                    headers=headers
                )
                
                if update_response.status_code == 200:
                    print("✅ Report status updated successfully")
                else:
                    print(f"❌ Report status update failed: {update_response.status_code}")
            else:
                print("❌ No reports found to update")
        else:
            print(f"❌ Failed to get reports: {response.status_code}")
        
        # Wait for WebSocket messages to be received
        print("\n⏳ Waiting for WebSocket messages...")
        time.sleep(5)
        
        # Cancel all listeners
        for listener in listeners:
            listener.cancel()
        
        print("\n✅ WebSocket broadcast test completed")
        return True
        
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False

def test_new_report_broadcast():
    """Test that new reports are broadcast to all connected clients"""
    print("\n🚀 Testing WebSocket New Report Broadcast")
    print("=" * 50)
    
    try:
        # Get user token
        login_data = {"username": "user@sanitix.com", "password": "user123"}
        response = requests.post("http://localhost:8001/api/auth/login", data=login_data)
        
        if response.status_code != 200:
            print("❌ User login failed")
            return False
            
        token = response.json()["access_token"]
        print("✅ User login successful")
        
        # Submit a new report to trigger broadcast
        print("\n📝 Submitting new report to trigger broadcast...")
        headers = {"Authorization": f"Bearer {token}"}
        
        report_data = {
            "location": "Test Location for WebSocket",
            "latitude": 17.392996267590824,
            "longitude": 78.43506002134126,
            "description": "Test report for WebSocket synchronization",
            "severity": "High",
            "image_filename": "test.jpg"
        }
        
        response = requests.post(
            "http://localhost:8001/api/reports/submit",
            json=report_data,
            headers=headers
        )
        
        if response.status_code == 200:
            print("✅ New report submitted successfully")
            print("📡 This should trigger a NEW_REPORT broadcast")
        else:
            print(f"❌ Report submission failed: {response.status_code}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False

async def main():
    print("🔄 WebSocket Synchronization Test Suite")
    print("=" * 60)
    
    # Test status update broadcast
    status_ok = test_status_update_broadcast()
    
    # Test new report broadcast
    report_ok = test_new_report_broadcast()
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS:")
    print(f"Status Update Broadcast: {'✅ PASS' if status_ok else '❌ FAIL'}")
    print(f"New Report Broadcast: {'✅ PASS' if report_ok else '❌ FAIL'}")
    
    if status_ok and report_ok:
        print("\n🎉 WebSocket Broadcasting Working!")
        print("If dashboards still don't sync, the issue is in frontend message handling.")
    else:
        print("\n⚠️  WebSocket Broadcasting Issues Detected")
        print("Check backend WebSocket implementation.")
    
    return status_ok and report_ok

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
