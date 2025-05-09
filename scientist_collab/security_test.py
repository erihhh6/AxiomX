#!/usr/bin/env python
"""
Testing script for checking ElectraX security measures.
Runs various tests to verify the functionality of security measures.
"""

import os
import sys
import requests
import time
import argparse
from urllib.parse import urljoin

# Configuration
DEFAULT_BASE_URL = 'http://localhost:8000'
DEFAULT_USERNAME = 'test_user'
DEFAULT_PASSWORD = 'test_password'
DEFAULT_EMAIL = 'test@example.com'

# Output colors
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
ENDC = '\033[0m'

def print_header(text):
    """Displays a formatted header for tests"""
    print(f"\n{BLUE}{'=' * 70}{ENDC}")
    print(f"{BLUE}== {text.center(64)} =={ENDC}")
    print(f"{BLUE}{'=' * 70}{ENDC}\n")

def print_success(text):
    """Displays a success message"""
    print(f"{GREEN}✓ {text}{ENDC}")

def print_fail(text):
    """Displays a failure message"""
    print(f"{RED}✗ {text}{ENDC}")

def print_info(text):
    """Displays information"""
    print(f"{YELLOW}ℹ {text}{ENDC}")

def create_test_user(base_url, username, password, email):
    """Creates a test user if it doesn't exist"""
    try:
        # Try to access the register page
        session = requests.Session()
        register_url = urljoin(base_url, '/accounts/register/')
        response = session.get(register_url)
        
        if response.status_code != 200:
            print_fail(f"Could not access the registration page. Status code: {response.status_code}")
            return False
        
        # Extract CSRF token
        csrf_token = None
        if 'csrftoken' in session.cookies:
            csrf_token = session.cookies['csrftoken']
        
        if not csrf_token:
            print_fail("Could not obtain CSRF token")
            return False
            
        # Register the user
        data = {
            'username': username,
            'email': email,
            'password1': password,
            'password2': password,
            'csrfmiddlewaretoken': csrf_token
        }
        
        headers = {
            'Referer': register_url,
            'X-CSRFToken': csrf_token
        }
        
        response = session.post(register_url, data=data, headers=headers)
        
        if response.status_code == 302 or 'Your account has been created' in response.text:
            print_success(f"User {username} created successfully!")
            return True
        else:
            print_info(f"User {username} probably already exists.")
            return True
            
    except Exception as e:
        print_fail(f"Error creating test user: {str(e)}")
        return False

def test_brute_force_protection(base_url, username, password):
    """Tests protection against brute force attacks"""
    print_header("Brute Force Protection Test")
    print_info(f"Simulating a brute force attack on user '{username}'")
    
    session = requests.Session()
    login_url = urljoin(base_url, '/accounts/login/')
    
    # First get the login page to extract CSRF token
    response = session.get(login_url)
    
    if response.status_code != 200:
        print_fail(f"Could not access login page. Status code: {response.status_code}")
        return False
    
    # Extract CSRF token
    csrf_token = None
    if 'csrftoken' in session.cookies:
        csrf_token = session.cookies['csrftoken']
    
    if not csrf_token:
        print_fail("Could not obtain CSRF token")
        return False
    
    # Repeated login attempts with wrong password
    attempts = 7  # Set to 7 to exceed AXES_FAILURE_LIMIT of 5
    print_info(f"Performing {attempts} login attempts with wrong password...")
    
    locked_out = False
    for i in range(attempts):
        data = {
            'username': username,
            'password': f"wrong_password_{i}",  # Wrong password
            'csrfmiddlewaretoken': csrf_token
        }
        
        headers = {
            'Referer': login_url,
            'X-CSRFToken': csrf_token
        }
        
        response = session.post(login_url, data=data, headers=headers, allow_redirects=True)
        
        # Check if we are redirected to lockout page
        if 'locked_out.html' in response.url or 'Account Temporarily Locked' in response.text:
            print_success(f"After {i+1} attempts, the account was locked! Lockout page displayed.")
            locked_out = True
            break
        
        # Update CSRF token for next attempt
        if 'csrftoken' in session.cookies:
            csrf_token = session.cookies['csrftoken']
        
        # Add a small pause to avoid overloading the server
        time.sleep(0.5)
    
    if not locked_out:
        print_fail(f"After {attempts} attempts, the account was NOT locked!")
        return False
    
    # Check if we can login with correct password after lockout
    print_info("Attempting to login with correct password after lockout...")
    
    data = {
        'username': username,
        'password': password,
        'csrfmiddlewaretoken': csrf_token
    }
    
    headers = {
        'Referer': login_url,
        'X-CSRFToken': csrf_token
    }
    
    response = session.post(login_url, data=data, headers=headers, allow_redirects=True)
    
    if 'locked_out.html' not in response.url and 'Account Temporarily Locked' not in response.text:
        print_fail("User was able to authenticate even though the account should be locked!")
        return False
    else:
        print_success("User is still locked out, even with the correct password.")
        print_info("Lockout page is correctly displayed.")
        return True

def test_content_security_policy(base_url):
    """Checks Content Security Policy implementation"""
    print_header("Content Security Policy (CSP) Test")
    print_info("Checking CSP headers...")
    
    try:
        response = requests.get(base_url)
        
        # Check the main Content-Security-Policy header
        if 'Content-Security-Policy' in response.headers:
            csp = response.headers['Content-Security-Policy']
            print_success(f"CSP header is present: {csp[:80]}...")
            
            # Check if the header contains essential directives
            essential_directives = ['default-src', 'script-src', 'style-src']
            found_directives = [directive for directive in essential_directives if directive in csp]
            
            if found_directives:
                print_success(f"CSP directives found: {', '.join(found_directives)}")
            else:
                print_info("Basic CSP directives were not identified, but the header exists.")
                
            return True
        # Check for alternative versions
        elif any(header.startswith('Content-Security-Policy') for header in response.headers):
            alt_headers = [header for header in response.headers if header.startswith('Content-Security-Policy')]
            print_success(f"Alternative CSP header found: {alt_headers[0]}")
            return True
        else:
            print_fail("Content-Security-Policy header was not found!")
            print_info("Check if:")
            print_info("1. ContentSecurityPolicyMiddleware is added to MIDDLEWARE")
            print_info("2. The middleware correctly adds the Content-Security-Policy header to responses")
            return False
    except Exception as e:
        print_fail(f"Error checking CSP: {str(e)}")
        return False

def test_security_headers(base_url):
    """Checks security headers"""
    print_header("Security Headers Test")
    print_info("Checking security headers...")
    
    try:
        response = requests.get(base_url)
        
        headers_to_check = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
        }
        
        all_present = True
        for header, expected_value in headers_to_check.items():
            if header in response.headers and response.headers[header] == expected_value:
                print_success(f"Header {header} is present with correct value: {expected_value}")
            else:
                actual_value = response.headers.get(header, 'absent')
                print_fail(f"Header {header}: expected '{expected_value}', actual '{actual_value}'")
                all_present = False
        
        return all_present
    except Exception as e:
        print_fail(f"Error checking security headers: {str(e)}")
        return False

def test_csrf_protection(base_url):
    """Tests CSRF protection"""
    print_header("CSRF Protection Test")
    print_info("Attempting a POST without CSRF token...")
    
    try:
        # Choose a resource that requires CSRF protection
        url = urljoin(base_url, '/accounts/login/')
        
        # Try to submit without CSRF token
        data = {
            'username': 'someuser',
            'password': 'somepassword'
        }
        
        response = requests.post(url, data=data)
        
        # Check if the request was rejected due to missing CSRF token
        if response.status_code == 403 or 'CSRF' in response.text:
            print_success("POST without CSRF token was correctly rejected!")
            return True
        else:
            print_fail(f"POST without CSRF token returned status {response.status_code}")
            print_info("Check if django.middleware.csrf.CsrfViewMiddleware is in MIDDLEWARE")
            return False
    except Exception as e:
        print_fail(f"Error testing CSRF protection: {str(e)}")
        return False

def test_https_redirect(base_url):
    """Tests HTTPS redirect"""
    print_header("HTTPS Redirect Test")
    
    # Only perform test if we're not already testing with HTTPS
    if base_url.startswith('https://'):
        print_info("Already using HTTPS, skipping redirect test.")
        return True
    
    # Try to construct an HTTP URL that should redirect to HTTPS
    http_url = base_url.replace('http://', 'https://')
    if base_url == http_url:
        # If no change was made, manually ensure we have HTTP
        http_url = base_url
        if not http_url.startswith('http://'):
            http_url = 'http://' + http_url.lstrip('/')
    
    print_info(f"Testing HTTP to HTTPS redirect from {base_url}...")
    
    try:
        # Using allow_redirects=False to just check the initial response
        response = requests.get(base_url, allow_redirects=False)
        
        # Check for redirect status codes
        if response.status_code in (301, 302, 307, 308):
            location = response.headers.get('Location', '')
            if location.startswith('https://'):
                print_success(f"Correctly redirects to HTTPS: {location}")
                return True
            else:
                print_fail(f"Redirects, but not to HTTPS: {location}")
                return False
        else:
            print_info(f"No HTTPS redirect (status code {response.status_code}).")
            print_info("This is normal in development, but should be enabled in production.")
            return True  # Not failing this in case it's being run in dev
    except Exception as e:
        print_fail(f"Error testing HTTPS redirect: {str(e)}")
        return False

def test_password_policy(base_url):
    """Tests password policy enforcement"""
    print_header("Password Policy Test")
    print_info("Testing password strength requirements...")
    
    try:
        session = requests.Session()
        register_url = urljoin(base_url, '/accounts/register/')
        response = session.get(register_url)
        
        if response.status_code != 200:
            print_fail(f"Could not access registration page. Status code: {response.status_code}")
            return False
        
        # Extract CSRF token
        csrf_token = None
        if 'csrftoken' in session.cookies:
            csrf_token = session.cookies['csrftoken']
        
        if not csrf_token:
            print_fail("Could not obtain CSRF token")
            return False
        
        # Test several weak passwords
        weak_passwords = [
            'password',  # Common password
            '12345678',  # Numeric only
            'qwerty',    # Too short & common
            'user1234',  # Too similar to username
        ]
        
        passed = True
        for password in weak_passwords:
            data = {
                'username': 'test_password_policy',
                'email': 'test_policy@example.com',
                'password1': password,
                'password2': password,
                'csrfmiddlewaretoken': csrf_token
            }
            
            headers = {
                'Referer': register_url,
                'X-CSRFToken': csrf_token
            }
            
            response = session.post(register_url, data=data, headers=headers)
            
            # If we got a redirect, the weak password was accepted
            if response.status_code == 302:
                print_fail(f"Weak password '{password}' was accepted!")
                passed = False
            else:
                print_success(f"Weak password '{password}' was correctly rejected")
            
            # Update CSRF token for next attempt
            if 'csrftoken' in session.cookies:
                csrf_token = session.cookies['csrftoken']
        
        if passed:
            print_success("Password policy is correctly enforced!")
        
        return passed
    except Exception as e:
        print_fail(f"Error testing password policy: {str(e)}")
        return False

def main():
    """Main function to run the tests"""
    parser = argparse.ArgumentParser(description='ElectraX security testing script')
    parser.add_argument('--url', default=DEFAULT_BASE_URL, help='Base URL of the ElectraX site')
    parser.add_argument('--username', default=DEFAULT_USERNAME, help='Test username')
    parser.add_argument('--password', default=DEFAULT_PASSWORD, help='Test password')
    parser.add_argument('--email', default=DEFAULT_EMAIL, help='Test email')
    parser.add_argument('--skip-creation', action='store_true', help='Skip test user creation')
    
    args = parser.parse_args()
    
    print_header("ElectraX Security Test")
    print_info(f"Testing against: {args.url}")
    
    # Results tracking
    test_results = {}
    
    # Create test user if needed
    if not args.skip_creation:
        print_info(f"Creating test user: {args.username}")
        user_created = create_test_user(args.url, args.username, args.password, args.email)
        test_results['User Creation'] = user_created
    
    # Run tests
    test_results['Brute Force Protection'] = test_brute_force_protection(args.url, args.username, args.password)
    test_results['Content Security Policy'] = test_content_security_policy(args.url)
    test_results['Security Headers'] = test_security_headers(args.url)
    test_results['CSRF Protection'] = test_csrf_protection(args.url)
    test_results['HTTPS Redirect'] = test_https_redirect(args.url)
    test_results['Password Policy'] = test_password_policy(args.url)
    
    # Display summary
    print_header("Test Results Summary")
    
    all_passed = True
    for test_name, result in test_results.items():
        if result:
            print_success(f"{test_name}: PASSED")
        else:
            print_fail(f"{test_name}: FAILED")
            all_passed = False
    
    if all_passed:
        print_header("All Security Tests Passed!")
        print_success("Your ElectraX instance has passed all basic security checks.")
        print_info("Note: These tests are not comprehensive. Regular security audits are recommended.")
        return 0
    else:
        print_header("Some Security Tests Failed")
        print_fail("Your ElectraX instance failed some security checks. Please review the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 