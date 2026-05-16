#!/usr/bin/env python3
"""
Test feedback submission functionality
"""

import requests
import json

def test_feedback_submission_anonymous():
    """Test feedback submission without authentication"""
    print("🔧 Testing Anonymous Feedback Submission")
    print("=" * 45)
    
    try:
        feedback_data = {
            "name": "Test User",
            "email": "test@example.com",
            "category": "General",
            "subject": "Test Feedback Submission",
            "message": "This is a test feedback submission to verify the functionality works correctly.",
            "priority": "Medium"
        }
        
        response = requests.post(
            "http://localhost:8001/api/feedback/submit",
            json=feedback_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Anonymous feedback submission successful!")
            print(f"Feedback ID: {data.get('feedback', {}).get('id')}")
            print(f"Message: {data.get('message')}")
            return True
        else:
            print(f"❌ Feedback submission failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False

def test_feedback_submission_authenticated():
    """Test feedback submission with authentication"""
    print("\n🔐 Testing Authenticated Feedback Submission")
    print("=" * 50)
    
    try:
        # Login as user first
        login_data = {"username": "user@sanitix.com", "password": "user123"}
        response = requests.post("http://localhost:8001/api/auth/login", data=login_data)
        
        if response.status_code != 200:
            print("❌ User login failed")
            return False
            
        token = response.json()["access_token"]
        print("✅ User login successful")
        
        feedback_data = {
            "name": "Authenticated Test User",
            "email": "auth@example.com", 
            "category": "Bug",
            "subject": "Test Authenticated Feedback",
            "message": "This is a test feedback submission with authentication to verify the functionality works correctly.",
            "priority": "High"
        }
        
        response = requests.post(
            "http://localhost:8001/api/feedback/submit",
            json=feedback_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Authenticated feedback submission successful!")
            print(f"Feedback ID: {data.get('feedback', {}).get('id')}")
            print(f"Message: {data.get('message')}")
            return True
        else:
            print(f"❌ Authenticated feedback submission failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False

def test_feedback_validation():
    """Test feedback validation"""
    print("\n🔍 Testing Feedback Validation")
    print("=" * 35)
    
    try:
        # Test missing subject
        feedback_data = {
            "name": "Test User",
            "email": "test@example.com",
            "category": "General",
            "subject": "",  # Empty subject
            "message": "This message has no subject",
            "priority": "Medium"
        }
        
        response = requests.post(
            "http://localhost:8001/api/feedback/submit",
            json=feedback_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 400:
            print("✅ Subject validation working correctly")
        else:
            print(f"❌ Subject validation failed: {response.status_code}")
            return False
        
        # Test missing message
        feedback_data["subject"] = "Valid subject"
        feedback_data["message"] = ""  # Empty message
        
        response = requests.post(
            "http://localhost:8001/api/feedback/submit",
            json=feedback_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 400:
            print("✅ Message validation working correctly")
            return True
        else:
            print(f"❌ Message validation failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Validation test error: {str(e)}")
        return False

def main():
    print("🚀 Feedback Submission Test Suite")
    print("=" * 40)
    
    # Test anonymous submission
    anonymous_ok = test_feedback_submission_anonymous()
    
    # Test authenticated submission  
    authenticated_ok = test_feedback_submission_authenticated()
    
    # Test validation
    validation_ok = test_feedback_validation()
    
    print("\n" + "=" * 40)
    print("📊 TEST RESULTS:")
    print(f"Anonymous Submission: {'✅ PASS' if anonymous_ok else '❌ FAIL'}")
    print(f"Authenticated Submission: {'✅ PASS' if authenticated_ok else '❌ FAIL'}")
    print(f"Validation: {'✅ PASS' if validation_ok else '❌ FAIL'}")
    
    if anonymous_ok and authenticated_ok and validation_ok:
        print("\n🎉 Feedback Submission Working Correctly!")
        print("✅ Backend API is functional")
        print("📱 The issue is likely in the frontend form submission")
    else:
        print("\n⚠️  Feedback Submission Issues Detected")
        print("Check the failed components above")
    
    return anonymous_ok and authenticated_ok and validation_ok

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
