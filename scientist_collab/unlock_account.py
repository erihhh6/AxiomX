#!/usr/bin/env python
"""
Simple script to unlock accounts locked by django-axes.
This script directly modifies the django-axes files.
"""

import os
import glob

def unlock_all_accounts():
    """
    Unlock all accounts by removing the relevant django-axes cache files
    """
    axes_file_pattern = os.path.join(".", ".axes", "*.json")
    
    # Identify and print all axes files
    axes_files = glob.glob(axes_file_pattern)
    if not axes_files:
        print("No django-axes lock files found.")
        return
    
    print(f"Found {len(axes_files)} lockout files:")
    for file in axes_files:
        print(f" - {file}")

    # Delete all axes files
    for file in axes_files:
        try:
            os.remove(file)
            print(f"Deleted lockout file: {file}")
        except Exception as e:
            print(f"Error deleting {file}: {str(e)}")
    
    print("\nAll account lockouts should be cleared.")
    print("You should now be able to log in again.")

if __name__ == "__main__":
    unlock_all_accounts() 