#!/usr/bin/env python3
"""
Test that all reports have been cleared from both admin and user dashboards
"""

import requests
import json

def test_admin_reports():
    """Test admin dashboard reports"""
    try:
        login_data = {"username": "admin@sanitix.com", "password": "admin123"}
        response = requests.post("http://localhost:8001/api/auth/login", data=login_data)
        
        if response.status_code != 200:
            print("❌ Admin login failed")
            return False
            
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get("http://localhost:8001/api/admin/reports", headers=headers)
        if response.status_code == 200:
            data = response.json()
            reports_count = len(data.get("reports", []))
            print(f"✅ Admin dashboard shows {reports_count} reports")
            return reports_count == 0
        else:
            print(f"❌ Admin reports API failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Admin test error: {str(e)}")
        return False

def test_user_reports():
    """Test user dashboard reports"""
    try:
        login_data = {"username": "user@sanitix.com", "password": "user123"}
        response = requests.post("http://localhost:8001/api/auth/login", data=login_data)
        
        if response.status_code != 200:
            print("❌ User login failed")
            return False
            
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get("http://localhost:8001/api/reports/my-reports", headers=headers)
        if response.status_code == 200:
            data = response.json()
            reports_count = len(data.get("reports", []))
            print(f"✅ User dashboard shows {reports_count} reports")
            return reports_count == 0
        else:
            print(f"❌ User reports API failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ User test error: {str(e)}")
        return False

def test_analytics():
    """Test analytics data"""
    try:
        login_data = {"username": "admin@sanitix.com", "password": "admin123"}
        response = requests.post("http://localhost:8001/api/auth/login", data=login_data)
        
        if response.status_code != 200:
            print("❌ Admin login failed")
            return False
            
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get("http://localhost:8001/api/admin/analytics", headers=headers)
        if response.status_code == 200:
            data = response.json()
            summary = data.get("summary", {})
            total_reports = summary.get("total_reports", 0)
            print(f"✅ Analytics shows {total_reports} total reports")
            return total_reports == 0
        else:
            print(f"❌ Analytics API failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Analytics test error: {str(e)}")
        return False

def main():
    print("🧹 Testing Reports Clearance")
    print("=" * 30)
    
    admin_ok = test_admin_reports()
    user_ok = test_user_reports()
    analytics_ok = test_analytics()
    
    print("\n" + "=" * 30)
    print("📊 TEST RESULTS:")
    print(f"Admin Reports: {'✅ CLEARED' if admin_ok else '❌ NOT CLEARED'}")
    print(f"User Reports: {'✅ CLEARED' if user_ok else '❌ NOT CLEARED'}")
    print(f"Analytics: {'✅ CLEARED' if analytics_ok else '❌ NOT CLEARED'}")
    
    if admin_ok and user_ok and analytics_ok:
        print("\n🎉 All Reports Successfully Cleared!")
        print("✅ Both admin and user dashboards are now empty")
        print("✅ Analytics data has been reset")
    else:
        print("\n⚠️  Some reports may still exist")
        print("Please check the failed components above")
    
    return admin_ok and user_ok and analytics_ok

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
