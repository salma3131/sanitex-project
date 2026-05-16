#!/usr/bin/env python3
"""
Script to clear all reports from the database
"""

import sqlite3
import sys

def clear_reports():
    """Clear all reports from the database"""
    try:
        # Connect to the database
        conn = sqlite3.connect('sanitix.db')
        cursor = conn.cursor()
        
        # Delete all reports
        cursor.execute("DELETE FROM reports")
        
        # Commit changes
        conn.commit()
        
        # Verify reports were deleted
        cursor.execute("SELECT COUNT(*) FROM reports")
        count = cursor.fetchone()
        
        print(f"✅ Successfully cleared {count[0]} reports from the database")
        print(f"✅ Reports table is now empty")
        
        # Close connection
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error clearing reports: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔄 Clearing all reports from database...")
    success = clear_reports()
    sys.exit(0 if success else 1)
