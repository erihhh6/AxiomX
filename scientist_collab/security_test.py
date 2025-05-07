#!/usr/bin/env python
"""
Script de testare pentru verificarea măsurilor de securitate AxiomX.
Rulează diferite teste pentru a verifica funcționalitatea măsurilor de securitate.
"""

import os
import sys
import requests
import time
import argparse
from urllib.parse import urljoin

# Configurare
DEFAULT_BASE_URL = 'http://localhost:8000'
DEFAULT_USERNAME = 'test_user'
DEFAULT_PASSWORD = 'test_password'
DEFAULT_EMAIL = 'test@example.com'

# Culori pentru output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
ENDC = '\033[0m'

def print_header(text):
    """Afișează un header formatat pentru teste"""
    print(f"\n{BLUE}{'=' * 70}{ENDC}")
    print(f"{BLUE}== {text.center(64)} =={ENDC}")
    print(f"{BLUE}{'=' * 70}{ENDC}\n")

def print_success(text):
    """Afișează un mesaj de succes"""
    print(f"{GREEN}✓ {text}{ENDC}")

def print_fail(text):
    """Afișează un mesaj de eșec"""
    print(f"{RED}✗ {text}{ENDC}")

def print_info(text):
    """Afișează informații"""
    print(f"{YELLOW}ℹ {text}{ENDC}")

def create_test_user(base_url, username, password, email):
    """Creează un utilizator de test dacă nu există"""
    try:
        # Încearcă să acceseze pagina de register
        session = requests.Session()
        register_url = urljoin(base_url, '/accounts/register/')
        response = session.get(register_url)
        
        if response.status_code != 200:
            print_fail(f"Nu s-a putut accesa pagina de înregistrare. Status code: {response.status_code}")
            return False
        
        # Extrage CSRF token
        csrf_token = None
        if 'csrftoken' in session.cookies:
            csrf_token = session.cookies['csrftoken']
        
        if not csrf_token:
            print_fail("Nu s-a putut obține CSRF token-ul")
            return False
            
        # Înregistrează utilizatorul
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
            print_success(f"Utilizator {username} creat cu succes!")
            return True
        else:
            print_info(f"Utilizatorul {username} probabil există deja.")
            return True
            
    except Exception as e:
        print_fail(f"Eroare la crearea utilizatorului de test: {str(e)}")
        return False

def test_brute_force_protection(base_url, username, password):
    """Testează protecția împotriva atacurilor de tip brute force"""
    print_header("Test protecție Brute Force")
    print_info(f"Se simulează un atac brute force pe utilizatorul '{username}'")
    
    session = requests.Session()
    login_url = urljoin(base_url, '/accounts/login/')
    
    # Prima dată obține pagina de login pentru a extrage CSRF token
    response = session.get(login_url)
    
    if response.status_code != 200:
        print_fail(f"Nu s-a putut accesa pagina de login. Status code: {response.status_code}")
        return False
    
    # Extrage CSRF token
    csrf_token = None
    if 'csrftoken' in session.cookies:
        csrf_token = session.cookies['csrftoken']
    
    if not csrf_token:
        print_fail("Nu s-a putut obține CSRF token-ul")
        return False
    
    # Încercări repetate de login cu parolă greșită
    attempts = 7  # Setat la 7 pentru a depăși AXES_FAILURE_LIMIT de 5
    print_info(f"Se efectuează {attempts} încercări de login cu parola greșită...")
    
    locked_out = False
    for i in range(attempts):
        data = {
            'username': username,
            'password': f"wrong_password_{i}",  # Parolă greșită
            'csrfmiddlewaretoken': csrf_token
        }
        
        headers = {
            'Referer': login_url,
            'X-CSRFToken': csrf_token
        }
        
        response = session.post(login_url, data=data, headers=headers, allow_redirects=True)
        
        # Verifică dacă suntem redirecționați la pagina de lockout
        if 'locked_out.html' in response.url or 'Account Temporarily Locked' in response.text:
            print_success(f"După {i+1} încercări, contul a fost blocat! Pagina de lockout afișată.")
            locked_out = True
            break
        
        # Actualizează CSRF token pentru următoarea încercare
        if 'csrftoken' in session.cookies:
            csrf_token = session.cookies['csrftoken']
        
        # Adaugă o mică pauză pentru a nu supraîncărca serverul
        time.sleep(0.5)
    
    if not locked_out:
        print_fail(f"După {attempts} încercări, contul NU a fost blocat!")
        return False
    
    # Verifică dacă putem face login cu parola corectă după blocare
    print_info("Se încearcă login cu parola corectă după blocare...")
    
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
        print_fail("Utilizatorul a putut să se autentifice deși ar trebui să fie blocat!")
        return False
    else:
        print_success("Utilizatorul este în continuare blocat, chiar și cu parola corectă.")
        print_info("Pagina de lockout este afișată corect.")
        return True

def test_content_security_policy(base_url):
    """Verifică implementarea Content Security Policy"""
    print_header("Test Content Security Policy (CSP)")
    print_info("Se verifică headerele CSP...")
    
    try:
        response = requests.get(base_url)
        
        # Verifică headerul principal Content-Security-Policy
        if 'Content-Security-Policy' in response.headers:
            csp = response.headers['Content-Security-Policy']
            print_success(f"Headerul CSP este prezent: {csp[:80]}...")
            
            # Verifică dacă headerul conține directivele esențiale
            essential_directives = ['default-src', 'script-src', 'style-src']
            found_directives = [directive for directive in essential_directives if directive in csp]
            
            if found_directives:
                print_success(f"Directivele CSP găsite: {', '.join(found_directives)}")
            else:
                print_info("Directivele CSP de bază nu au fost identificate, dar headerul există.")
                
            return True
        # Verifică și variantele alternative 
        elif any(header.startswith('Content-Security-Policy') for header in response.headers):
            alt_headers = [header for header in response.headers if header.startswith('Content-Security-Policy')]
            print_success(f"Headerul CSP alternativ găsit: {alt_headers[0]}")
            return True
        else:
            print_fail("Headerul Content-Security-Policy nu a fost găsit!")
            print_info("Verifică dacă:")
            print_info("1. Middleware-ul ContentSecurityPolicyMiddleware este adăugat în MIDDLEWARE")
            print_info("2. Middleware-ul adaugă corect headerul Content-Security-Policy la răspunsuri")
            return False
    except Exception as e:
        print_fail(f"Eroare la verificarea CSP: {str(e)}")
        return False

def test_security_headers(base_url):
    """Verifică headerele de securitate"""
    print_header("Test Headere de Securitate")
    print_info("Se verifică headerele de securitate...")
    
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
                print_success(f"Header {header} este prezent cu valoarea corectă: {expected_value}")
            else:
                actual_value = response.headers.get(header, 'absent')
                print_fail(f"Header {header}: așteptat '{expected_value}', actual '{actual_value}'")
                all_present = False
        
        return all_present
    except Exception as e:
        print_fail(f"Eroare la verificarea headerelor de securitate: {str(e)}")
        return False

def test_csrf_protection(base_url):
    """Testează protecția CSRF"""
    print_header("Test protecție CSRF")
    print_info("Se încearcă un POST fără token CSRF...")
    
    try:
        # Alege o resursă care necesită protecție CSRF
        url = urljoin(base_url, '/accounts/login/')
        
        # Încearcă un POST fără CSRF token
        response = requests.post(url, data={'username': 'test', 'password': 'test'})
        
        if 'CSRF' in response.text or response.status_code == 403:
            print_success("Protecția CSRF funcționează! Cererea a fost respinsă.")
            return True
        else:
            print_fail(f"Cererea POST fără token CSRF a fost acceptată! Status: {response.status_code}")
            return False
    except Exception as e:
        print_fail(f"Eroare la testarea protecției CSRF: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Testare securitate pentru AxiomX')
    parser.add_argument('--url', type=str, default=DEFAULT_BASE_URL, help='URL-ul de bază al aplicației')
    parser.add_argument('--username', type=str, default=DEFAULT_USERNAME, help='Numele de utilizator pentru testare')
    parser.add_argument('--password', type=str, default=DEFAULT_PASSWORD, help='Parola pentru testare')
    parser.add_argument('--email', type=str, default=DEFAULT_EMAIL, help='Email-ul pentru testare')
    parser.add_argument('--test', type=str, choices=['all', 'brute', 'csp', 'headers', 'csrf'], 
                        default='all', help='Testul specific de rulat')
    
    args = parser.parse_args()
    
    print_header("SCRIPT DE TESTARE SECURITATE AXIOMX")
    print_info(f"Se testează aplicația la URL-ul: {args.url}")
    
    # Creează utilizatorul de test pentru teste ce necesită autentificare
    if args.test in ['all', 'brute']:
        if not create_test_user(args.url, args.username, args.password, args.email):
            print_fail("Nu s-a putut crea utilizatorul de test. Unele teste ar putea eșua.")
    
    # Rulează testele conform opțiunii --test
    results = {}
    
    if args.test in ['all', 'brute']:
        results['brute_force'] = test_brute_force_protection(args.url, args.username, args.password)
        
    if args.test in ['all', 'csp']:
        results['csp'] = test_content_security_policy(args.url)
        
    if args.test in ['all', 'headers']:
        results['headers'] = test_security_headers(args.url)
        
    if args.test in ['all', 'csrf']:
        results['csrf'] = test_csrf_protection(args.url)
    
    # Sumar rezultate
    print_header("REZUMAT REZULTATE")
    
    all_passed = True
    for test_name, result in results.items():
        if result:
            print_success(f"Test {test_name}: TRECUT")
        else:
            print_fail(f"Test {test_name}: EȘUAT")
            all_passed = False
    
    if all_passed:
        print_success("\nToate testele au trecut! Aplicația ta este bine securizată.")
    else:
        print_fail("\nUnele teste au eșuat. Verifică rezultatele de mai sus pentru detalii.")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main()) 