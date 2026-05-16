#!/usr/bin/env python3
"""
Migration script to add voice-related columns to the reports table
"""

import sqlite3
import sys

def add_voice_columns():
    """Add voice-related columns to the reports table"""
    try:
        # Connect to the database
        conn = sqlite3.connect('sanitix.db')
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(reports)")
        columns = [row[1] for row in cursor.fetchall()]
        
        # Add missing voice-related columns
        voice_columns = [
            ("original_text", "TEXT"),
            ("detected_language", "TEXT"),
            ("translated_text", "TEXT"),
            ("input_method", "TEXT DEFAULT 'text'")
        ]
        
        for column_name, column_type in voice_columns:
            if column_name not in columns:
                print(f"Adding column: {column_name}")
                cursor.execute(f"ALTER TABLE reports ADD COLUMN {column_name} {column_type}")
            else:
                print(f"Column {column_name} already exists")
        
        # Commit changes
        conn.commit()
        print("✅ Voice-related columns added successfully!")
        
        # Verify the columns were added
        cursor.execute("PRAGMA table_info(reports)")
        updated_columns = [row[1] for row in cursor.fetchall()]
        print(f"Current columns: {updated_columns}")
        
    except Exception as e:
        print(f"❌ Error adding columns: {str(e)}")
        return False
    finally:
        conn.close()
    
    return True

if __name__ == "__main__":
    print("🔄 Adding voice-related columns to reports table...")
    success = add_voice_columns()
    sys.exit(0 if success else 1)
