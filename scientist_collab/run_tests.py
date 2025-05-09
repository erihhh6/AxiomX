#!/usr/bin/env python
"""
Script for running tests and generating a coverage report.
"""

import os
import sys
import time
import subprocess
import webbrowser
from datetime import datetime

def print_colored(text, color):
    """Displays colored text in the console"""
    colors = {
        'green': '\033[92m',
        'red': '\033[91m',
        'yellow': '\033[93m',
        'blue': '\033[94m',
        'bold': '\033[1m',
        'end': '\033[0m'
    }
    print(f"{colors.get(color, '')}{text}{colors['end']}")

def print_header(text):
    """Displays a formatted header"""
    print("\n" + "=" * 80)
    print_colored(f" {text} ".center(80), 'bold')
    print("=" * 80 + "\n")

def check_requirements():
    """Checks if the required packages are installed"""
    print_header("Checking dependencies")
    
    required_packages = ['coverage', 'django']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print_colored(f"✓ {package} is installed", 'green')
        except ImportError:
            missing_packages.append(package)
            print_colored(f"✗ {package} is missing", 'red')
    
    if missing_packages:
        print_colored("\nInstalling missing packages...", 'yellow')
        subprocess.run([sys.executable, "-m", "pip", "install"] + missing_packages)
        print_colored("Dependencies successfully installed!", 'green')

def run_tests():
    """Runs the tests and generates the coverage report"""
    print_header("Running tests")
    
    # Set environment variables for testing
    os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
    
    # Override database settings for testing - use SQLite in memory
    os.environ['DJANGO_TEST_DB_ENGINE'] = 'django.db.backends.sqlite3'
    os.environ['DJANGO_TEST_DB_NAME'] = ':memory:'
    
    # Disable axes during tests
    os.environ['AXES_ENABLED'] = 'False'
    
    # Import Django and configure
    import django
    django.setup()
    
    # Start time
    start_time = time.time()
    
    # Run tests with coverage
    test_command = [
        sys.executable, "-m", "coverage", "run", 
        "--source=accounts,publications,discussions", 
        "manage.py", "test"
    ]
    
    result = subprocess.run(test_command, capture_output=True, text=True)
    
    # Calculate execution time
    execution_time = time.time() - start_time
    
    # Display test results
    if result.returncode == 0:
        print_colored("All tests passed successfully!", 'green')
    else:
        print_colored("Some tests failed:", 'red')
        print(result.stdout)
        print(result.stderr)
        return False
    
    print_colored(f"Execution time: {execution_time:.2f} seconds", 'blue')
    
    # Generate HTML report
    subprocess.run([sys.executable, "-m", "coverage", "html"])
    
    return True

def generate_test_summary():
    """Generates a test summary"""
    print_header("Test Summary")
    
    # Run coverage report to get data
    result = subprocess.run(
        [sys.executable, "-m", "coverage", "report"], 
        capture_output=True, 
        text=True
    )
    
    print(result.stdout)
    
    # Create a file with the report
    report_dir = "test_reports"
    os.makedirs(report_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file = os.path.join(report_dir, f"test_report_{timestamp}.txt")
    
    with open(report_file, "w") as f:
        f.write("ElectraX - Test Report\n")
        f.write("=" * 50 + "\n")
        f.write(f"Generation date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(result.stdout)
    
    print_colored(f"Report has been saved to: {report_file}", 'blue')
    
    # Open HTML report in browser
    html_report = os.path.join("htmlcov", "index.html")
    if os.path.exists(html_report):
        print_colored("Opening HTML report in browser...", 'blue')
        webbrowser.open(f"file://{os.path.abspath(html_report)}")
    
    return report_file

if __name__ == "__main__":
    # Check dependencies
    check_requirements()
    
    # Run tests
    if run_tests():
        # Generate summary
        report_file = generate_test_summary()
        
        print_header("Testing completed")
        print_colored("Tests have been executed successfully and the report has been generated.", 'green')
        print_colored(f"Text report: {report_file}", 'blue')
        print_colored("HTML report: ./htmlcov/index.html", 'blue')
    else:
        print_header("Testing failed")
        print_colored("Some tests have failed. Check the error above.", 'red') 