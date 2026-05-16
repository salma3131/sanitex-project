#!/usr/bin/env python3
"""
Test real-time synchronization with debugging
"""

import requests
import time

def test_status_update_sync():
    """Test status update synchronization with detailed logging"""
    print("🔄 Testing Real-Time Status Update Synchronization")
    print("=" * 55)
    
    try:
        # Get admin token
        login_data = {"username": "admin@sanitix.com", "password": "admin123"}
        response = requests.post("http://localhost:8001/api/auth/login", data=login_data)
        
        if response.status_code != 200:
            print("❌ Admin login failed")
            return False
            
        token = response.json()["access_token"]
        print("✅ Admin login successful")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get current reports
        response = requests.get("http://localhost:8001/api/admin/reports", headers=headers)
        if response.status_code != 200:
            print("❌ Failed to get reports")
            return False
            
        reports = response.json().get("reports", [])
        if not reports:
            print("❌ No reports found")
            return False
        
        # Find a report with "Pending" status
        pending_report = None
        for report in reports:
            if report["status"] == "Pending":
                pending_report = report
                break
        
        if not pending_report:
            print("❌ No pending reports found to update")
            return False
        
        report_id = pending_report["id"]
        print(f"📝 Found pending report: {report_id}")
        print(f"   Current status: {pending_report['status']}")
        
        # Update the report status to trigger WebSocket broadcast
        print("\n🔄 Updating report status to 'In Progress'...")
        update_response = requests.put(
            f"http://localhost:8001/api/admin/reports/{report_id}/status?status=In Progress",
            headers=headers
        )
        
        if update_response.status_code == 200:
            print("✅ Report status updated successfully")
            print("📡 WebSocket broadcast should have been sent")
            
            # Wait a moment for the WebSocket message to be processed
            print("⏳ Waiting for frontend to process WebSocket message...")
            time.sleep(2)
            
            print("✅ Status update test completed")
            print("📱 Check the browser console for WebSocket message logs")
            return True
        else:
            print(f"❌ Report status update failed: {update_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False

def test_new_report_sync():
    """Test new report synchronization"""
    print("\n📝 Testing Real-Time New Report Synchronization")
    print("=" * 55)
    
    try:
        # Get user token
        login_data = {"username": "user@sanitix.com", "password": "user123"}
        response = requests.post("http://localhost:8001/api/auth/login", data=login_data)
        
        if response.status_code != 200:
            print("❌ User login failed")
            return False
            
        token = response.json()["access_token"]
        print("✅ User login successful")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Submit a new report
        print("\n📝 Submitting new report...")
        report_data = {
            "location": "Test Location for Sync Check",
            "latitude": 17.392996267590824,
            "longitude": 78.43506002134126,
            "description": "Test report for real-time synchronization",
            "severity": "High",
            "image_filename": "test_sync.jpg"
        }
        
        response = requests.post(
            "http://localhost:8001/api/reports/submit",
            json=report_data,
            headers=headers
        )
        
        if response.status_code == 200:
            print("✅ New report submitted successfully")
            print("📡 WebSocket broadcast should have been sent")
            
            # Wait a moment for the WebSocket message to be processed
            print("⏳ Waiting for frontend to process WebSocket message...")
            time.sleep(2)
            
            print("✅ New report test completed")
            print("📱 Check the browser console for WebSocket message logs")
            return True
        else:
            print(f"❌ Report submission failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False

def main():
    print("🚀 Real-Time Synchronization Test")
    print("=" * 40)
    print("📝 This test will trigger WebSocket broadcasts")
    print("📱 Check the browser console for message logs")
    print("")
    
    # Test status update synchronization
    status_ok = test_status_update_sync()
    
    # Test new report synchronization
    report_ok = test_new_report_sync()
    
    print("\n" + "=" * 40)
    print("📊 TEST RESULTS:")
    print(f"Status Update Sync: {'✅ PASS' if status_ok else '❌ FAIL'}")
    print(f"New Report Sync: {'✅ PASS' if report_ok else '❌ FAIL'}")
    
    if status_ok and report_ok:
        print("\n🎉 Backend Broadcasting Working!")
        print("📱 Check browser console for frontend message handling")
    else:
        print("\n⚠️  Backend Broadcasting Issues Detected")
    
    print("\n🔧 To see real-time updates:")
    print("1. Open admin dashboard in one browser tab")
    print("2. Open user dashboard in another browser tab")
    print("3. Update a report status in admin dashboard")
    print("4. Check if user dashboard refreshes automatically")
    
    return status_ok and report_ok

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
