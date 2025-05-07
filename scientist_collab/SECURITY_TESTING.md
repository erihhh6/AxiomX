# Ghid de Testare a Securității pentru AxiomX

Acest document descrie cum poți testa și verifica funcționalitățile de securitate implementate în platforma AxiomX.

## Scriptul de Testare Automată

Am creat un script Python care poate testa automat mai multe funcționalități de securitate:

- Protecția împotriva atacurilor de tip brute force
- Configurarea headerelor de securitate 
- Implementarea Content Security Policy (CSP)
- Protecția Cross-Site Request Forgery (CSRF)

### Cerințe

Pentru a rula scriptul, ai nevoie de:

- Python 3.6+
- Biblioteca `requests` (poți instala cu `pip install requests`)
- Serverul Django să fie pornit și accesibil

### Cum să rulezi scriptul

1. Asigură-te că serverul Django rulează:

```bash
python manage.py runserver
```

2. Într-un alt terminal, rulează scriptul de testare:

```bash
python security_test.py
```

### Opțiuni și parametri

Scriptul acceptă mai mulți parametri opționali pentru personalizarea testelor:

```bash
python security_test.py --url http://localhost:8000 --username test_user --password test_password --email test@example.com --test all
```

Parametrii disponibili:
- `--url` - URL-ul de bază al aplicației (implicit: http://localhost:8000)
- `--username` - Numele de utilizator pentru testele de autentificare (implicit: test_user)
- `--password` - Parola pentru testele de autentificare (implicit: test_password)
- `--email` - Adresa de email pentru crearea utilizatorului de test (implicit: test@example.com)
- `--test` - Tipul specific de test de rulat:
  - `all` - Rulează toate testele (implicit)
  - `brute` - Testează doar protecția împotriva brute force
  - `csp` - Testează doar configurarea Content Security Policy
  - `headers` - Testează doar headerele de securitate
  - `csrf` - Testează doar protecția CSRF

## Testare Manuală a Funcționalităților de Securitate

### 1. Testarea Protecției Împotriva Brute Force & Pagina de Lockout

Pentru a testa manual și a vedea pagina de blocare, urmează acești pași:

1. Accesează pagina de login la `/accounts/login/`
2. Încearcă să te autentifici cu un utilizator existent, dar folosește o parolă greșită
3. Repetă încercarea de 5 ori (limita configurată în `settings.py` ca `AXES_FAILURE_LIMIT = 5`)
4. După a 5-a încercare eșuată, ar trebui să fii redirecționat către pagina de lockout (`/accounts/locked_out/`)
5. Chiar dacă ulterior vei încerca parola corectă, nu vei putea să te autentifici timp de 1 oră (configurat ca `AXES_COOLOFF_TIME = 1`)

Pagina de lockout ar trebui să arate ceva similar cu:
- Un mesaj care indică că contul a fost blocat temporar
- Informații despre durata de blocare (1 oră)
- Un link pentru resetarea parolei
- Un link pentru a reveni la pagina principală

### 2. Verificarea Headerelor de Securitate

Folosind Developer Tools din browser (F12):

1. Accesează orice pagină a aplicației
2. Deschide tab-ul Network
3. Selectează orice cerere HTTP
4. Verifică headerele răspunsului în tab-ul Headers

Ar trebui să vezi următoarele headere de securitate:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy: ...` (conținut variat)
- În producție, și headere suplimentare precum `Strict-Transport-Security`

### 3. Verificarea Protecției CSRF

Toate formularele din aplicație ar trebui să conțină un token CSRF:

1. Accesează orice formular (ex: pagina de login)
2. Verifică codul sursă al paginii (Click dreapta -> View Page Source)
3. Caută un input de tip hidden cu numele `csrfmiddlewaretoken`

Exemplu:
```html
<input type="hidden" name="csrfmiddlewaretoken" value="...">
```

### 4. Verificarea Configurării HTTPS (în producție)

În mediul de producție (când `DEBUG = False`):

1. Încearcă să accesezi site-ul folosind `http://` în loc de `https://`
2. Ar trebui să fii redirecționat automat către versiunea HTTPS
3. Verifică în Developer Tools că headerul `Strict-Transport-Security` este prezent

### 5. Testarea Configurărilor de Sesiune

Pentru a verifica expirarea sesiunii:

1. Autentifică-te în aplicație
2. Așteptă mai mult de 1 oră fără activitate (configurat prin `SESSION_COOKIE_AGE = 3600`)
3. Încearcă să accesezi o pagină protejată
4. Ar trebui să fii redirecționat către pagina de login deoarece sesiunea a expirat

## Rezolvarea Problemelor

### "Nu văd pagina de lockout după încercări eșuate"

Verifică:
- Că `axes` este adăugat în `INSTALLED_APPS` în `settings.py`
- Că `axes.middleware.AxesMiddleware` este adăugat în `MIDDLEWARE`
- Că `axes.backends.AxesBackend` este primul în lista `AUTHENTICATION_BACKENDS`
- Că `AXES_LOCKOUT_TEMPLATE` este setat corect la `'accounts/locked_out.html'`

### "Headerele de securitate nu sunt prezente"

Verifică:
- Că `SecurityHeadersMiddleware` și `ContentSecurityPolicyMiddleware` sunt adăugate în `MIDDLEWARE`
- În mediul de dezvoltare (`DEBUG = True`), unele configurări de securitate pot fi dezactivate

### "Nu reușesc să rulezi scriptul de testare"

Verifică:
- Că ai instalat biblioteca `requests`: `pip install requests`
- Că serverul Django rulează și este accesibil la URL-ul specificat
- Că ai drepturile necesare pentru a crea fișiere de log (dacă este cazul)

## Resurse Suplimentare

- [Documentația Django-Axes](https://django-axes.readthedocs.io/)
- [Ghidul de securitate Django](https://docs.djangoproject.com/en/stable/topics/security/)
- [OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/) 