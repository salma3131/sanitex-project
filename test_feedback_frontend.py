#!/usr/bin/env python3
"""
Test frontend feedback submission simulation
"""

import requests
import json

def test_frontend_feedback_simulation():
    """Test feedback submission exactly as frontend would do"""
    print("🔧 Testing Frontend Feedback Submission Simulation")
    print("=" * 55)
    
    try:
        # Test without authentication (like frontend)
        print("1. Testing without authentication...")
        feedback_data = {
            "name": "Frontend Test User",
            "email": "frontend@test.com",
            "category": "General",
            "subject": "Frontend Test Feedback",
            "message": "This is a test feedback from frontend simulation",
            "priority": "Medium"
        }
        
        response = requests.post(
            "http://localhost:8001/api/feedback/submit",
            json=feedback_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            print("✅ Frontend simulation successful")
            return True
        else:
            print(f"❌ Frontend simulation failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False

def test_with_different_data():
    """Test with different data formats"""
    print("\n🔍 Testing with different data formats...")
    
    test_cases = [
        {
            "name": "",
            "email": "",
            "category": "General",
            "subject": "Test",
            "message": "Test message",
            "priority": "Medium"
        },
        {
            "category": "General",
            "subject": "Test",
            "message": "Test message",
            "priority": "Medium"
        },
        {
            "name": "Test User",
            "subject": "Test",
            "message": "Test message"
        }
    ]
    
    for i, data in enumerate(test_cases, 1):
        print(f"\n{i}. Testing with data: {data}")
        try:
            response = requests.post(
                "http://localhost:8001/api/feedback/submit",
                json=data,
                headers={"Content-Type": "application/json"}
            )
            print(f"   Status: {response.status_code}")
            if response.status_code != 200:
                print(f"   Error: {response.text}")
        except Exception as e:
            print(f"   Exception: {str(e)}")

def main():
    print("🚀 Frontend Feedback Debug Test")
    print("=" * 35)
    
    basic_test = test_frontend_feedback_simulation()
    test_with_different_data()
    
    print("\n" + "=" * 35)
    if basic_test:
        print("🎉 Basic frontend simulation works!")
        print("📱 Issue is likely in the frontend JavaScript code")
        print("🔍 Check browser console for errors")
    else:
        print("⚠️  Even basic simulation failed")
        print("🔧 Check backend server status")

if __name__ == "__main__":
    main()
