#!/usr/bin/env python
"""
Reset Django-Axes lockouts for a user or IP address.

This script helps you unlock accounts that have been temporarily locked due to 
too many failed login attempts.
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def reset_all_lockouts():
    """Reset all lockout records from django-axes"""
    from axes.models import AccessAttempt, AccessLog
    
    # Clear all lockout records
    attempts_deleted = AccessAttempt.objects.all().delete()[0]
    print(f"Deleted {attempts_deleted} lockout records.")
    
    # Optional: clear logs too
    # logs_deleted = AccessLog.objects.all().delete()[0]
    # print(f"Deleted {logs_deleted} access logs.")
    
    print("All lockouts have been cleared. You should be able to log in now.")

def reset_lockout_for_username(username):
    """Reset lockout records for a specific username"""
    from axes.models import AccessAttempt
    
    # Delete lockout records for the specified username
    deleted = AccessAttempt.objects.filter(username=username).delete()[0]
    print(f"Deleted {deleted} lockout records for username '{username}'.")
    
    if deleted > 0:
        print(f"Account for '{username}' has been unlocked.")
    else:
        print(f"No lockout records found for username '{username}'.")

def reset_lockout_for_ip(ip_address):
    """Reset lockout records for a specific IP address"""
    from axes.models import AccessAttempt
    
    # Delete lockout records for the specified IP address
    deleted = AccessAttempt.objects.filter(ip_address=ip_address).delete()[0]
    print(f"Deleted {deleted} lockout records for IP address '{ip_address}'.")
    
    if deleted > 0:
        print(f"IP address '{ip_address}' has been unlocked.")
    else:
        print(f"No lockout records found for IP address '{ip_address}'.")

def list_lockouts():
    """List all current lockouts"""
    from axes.models import AccessAttempt
    
    lockouts = AccessAttempt.objects.all()
    
    if not lockouts:
        print("No lockouts found.")
        return
    
    print("\nCurrent lockouts:")
    print("-" * 70)
    print(f"{'Username':<20} {'IP Address':<20} {'Failures':<10} {'Last Attempt'}")
    print("-" * 70)
    
    for lockout in lockouts:
        print(f"{lockout.username:<20} {lockout.ip_address:<20} {lockout.failures_since_start:<10} {lockout.attempt_time}")

def print_usage():
    """Print usage instructions"""
    print("""
Reset Django-Axes Lockouts

Usage:
    python reset_account_lockout.py [option]

Options:
    --all           Reset all lockouts
    --username=USER Reset lockouts for specific username
    --ip=IP         Reset lockouts for specific IP address
    --list          List all current lockouts
    --help          Show this help message
    
Examples:
    python reset_account_lockout.py --all
    python reset_account_lockout.py --username=john_doe
    python reset_account_lockout.py --ip=127.0.0.1
    python reset_account_lockout.py --list
    """)

if __name__ == "__main__":
    # Handle command line arguments
    if len(sys.argv) < 2 or '--help' in sys.argv:
        print_usage()
    elif '--all' in sys.argv:
        reset_all_lockouts()
    elif '--list' in sys.argv:
        list_lockouts()
    else:
        # Check for username argument
        for arg in sys.argv:
            if arg.startswith('--username='):
                username = arg.split('=')[1]
                reset_lockout_for_username(username)
                break
                
            # Check for IP argument
            elif arg.startswith('--ip='):
                ip_address = arg.split('=')[1]
                reset_lockout_for_ip(ip_address)
                break
        else:
            print("Invalid option.")
            print_usage() 