# AxiomX Authentication System - Detailed Explanation

This document provides a comprehensive explanation of the authentication system implemented in the AxiomX scientific collaboration platform, detailing how user registration, login, password management, and security features work.

## Table of Contents

1. [User Model & Storage](#user-model--storage)
2. [Password Security](#password-security)
3. [Registration Flow](#registration-flow)
4. [Login Process](#login-process)
5. [Session Management](#session-management)
6. [Password Reset Process](#password-reset-process)
7. [Brute Force Protection](#brute-force-protection)
8. [Security Logging](#security-logging)
9. [Additional Security Measures](#additional-security-measures)

## User Model & Storage

### Base User Model

AxiomX uses Django's built-in `User` model from `django.contrib.auth.models`, which provides:

- Username (unique identifier)
- Email address
- First and last name
- Password (stored as a hash, not plaintext)
- Account status flags (active, staff, superuser)
- Date fields (date joined, last login)

### Extended Profile Model

The application extends the base User model through a one-to-one relationship with a `Profile` model:

```python
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True)
    institution = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    field_of_study = models.CharField(max_length=100, blank=True)
    website = models.URLField(max_length=200, blank=True)
    # Additional fields for user relations and badges
```

When a new User is created, a related Profile is automatically created through Django's signals:

```python
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
```

### Database Storage

All user data is stored in a MySQL database with these security measures:

1. Connection using SSL in production mode
2. Strict mode enabled with `SET sql_mode='STRICT_TRANS_TABLES'`
3. No direct access to password hashes from application code

## Password Security

### Password Hashing

AxiomX uses a multi-layer approach to password security:

1. **Argon2 as primary hasher** - Argon2 won the Password Hashing Competition and is considered the most secure algorithm available:

```python
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',  # Primary hasher
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]
```

2. **Multiple backup hashers** - In case Argon2 is unavailable, the system falls back to other secure algorithms

3. **How the hashing works:**
   - When a user registers or changes password, the plaintext password is:
     - Combined with a random salt (preventing rainbow table attacks)
     - Processed through the Argon2 algorithm with memory-hard functions
     - The resulting hash + algorithm information + salt is stored in the database
   - Django never stores the original password
   - The hash format looks like: `algorithm$iterations$salt$hash`

### Password Validation

The system enforces strong passwords through validators:

```python
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 10,  # Minimum password length of 10 characters
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]
```

These validators ensure:
- Passwords are not similar to the user's personal information
- Passwords are at least 10 characters long
- Passwords aren't common/easily guessable (from a dictionary of common passwords)
- Passwords aren't entirely numeric

## Registration Flow

1. **Form Submission**
   - The `UserRegisterForm` extends Django's `UserCreationForm`
   - Required fields: username, first_name, last_name, email, password1, password2 (confirmation)
   - All fields use Bootstrap styling for consistent UI

2. **Validation Process**
   - Form validates all fields and ensures passwords match
   - System checks for existing usernames and emails
   - Password validators are applied to ensure strong passwords

3. **User Creation**
   - The `RegisterView` class handles the registration:
   ```python
   class RegisterView(CreateView):
       form_class = UserRegisterForm
       template_name = 'accounts/register.html'
       success_url = reverse_lazy('accounts:login')
   ```
   - When valid form is submitted, a new User object is created
   - The password is hashed using Argon2 before storing
   - A Profile object is automatically created via signals
   - Success message is displayed to the user

4. **Initial Security Measures**
   - CSRF protection prevents cross-site request forgery attacks
   - Rate limiting prevents mass account creation attempts
   - All sensitive operations are logged for security auditing

## Login Process

1. **Login Form**
   - The system uses a customized Django `LoginView`
   - Login requires username/password combination

2. **Authentication Flow**
   ```python
   class CustomLoginView(LoginView):
       template_name = 'accounts/login.html'
       redirect_authenticated_user = True
       
       def form_valid(self, form):
           # Log successful login
           user = form.get_user()
           logger.info(f"Successful login for user '{user.username}' from IP {self.request.META.get('REMOTE_ADDR')}")
           # Add success message
           messages.success(self.request, f'Welcome back, {user.get_full_name() or user.username}!')
           # Generate a new session key on login for security
           self.request.session.create()
           return super().form_valid(form)
   ```

3. **Password Verification Process**
   - When a user submits login credentials:
     1. The system retrieves the User object by username
     2. Takes the provided password and applies the same hashing algorithm
     3. Compares the resulting hash with the stored hash
     4. If they match, authentication succeeds; if not, it fails

4. **Security Enhancements**
   - Failed logins are logged with username and anonymized IP
   - New session key is generated on successful login
   - Sessions are protected with HttpOnly and SameSite cookie attributes
   - Django-axes middleware monitors and blocks brute force attempts

## Session Management

Sessions are carefully managed for security:

1. **Session Duration**
   ```python
   SESSION_COOKIE_AGE = 3600  # Session expires after 1 hour of inactivity
   SESSION_EXPIRE_AT_BROWSER_CLOSE = True  # Session expires when browser closes
   SESSION_SAVE_EVERY_REQUEST = True  # Extend session on each request
   SESSION_COOKIE_SAMESITE = 'Lax'  # Restricts cookies to same site requests
   ```

2. **Secure Session Handling**
   - In production mode, cookies are secured with:
     ```python
     SESSION_COOKIE_SECURE = True  # Only sent over HTTPS
     SESSION_COOKIE_HTTPONLY = True  # Not accessible via JavaScript
     ```

3. **Logout Process**
   ```python
   @login_required
   def logout_view(request):
       # Log logout action
       if request.user.is_authenticated:
           username = request.user.username
           logger.info(f"User '{username}' logged out from IP {request.META.get('REMOTE_ADDR')}")
       
       # Get session key before logout to invalidate it properly
       session_key = request.session.session_key
       
       # Perform logout
       logout(request)
       
       # Clear any session cookies by setting expiry to past
       if session_key:
           request.session.flush()
           
       # Add success message
       messages.success(request, 'You have been logged out successfully.')
       
       # Redirect to home page
       return redirect('home')
   ```

## Password Reset Process

The system provides a secure password reset flow:

1. **Initiating Reset**
   - User requests reset with their email address
   - System generates a secure time-limited token using JWT
   - Token contains user ID and expiration timestamp
   - Token is signed with the application's SECRET_KEY

2. **Email Delivery**
   - Reset link with token is sent to user's email
   - In development, emails are printed to console
   - In production, emails are sent via configured SMTP server

3. **Token Verification**
   - When user clicks the reset link, token is verified for:
     - Valid signature (not tampered)
     - Not expired
     - Corresponds to a valid user

4. **Password Change**
   - User enters new password (with confirmation)
   - Password is validated against all validators
   - Once validated, the new password is hashed and stored
   - All existing sessions for the user are invalidated for security

5. **Security Measures**
   - All password reset views use `@require_secure_transport` decorator to enforce HTTPS
   - Every step of the process is logged for security auditing
   - Form submissions are protected by CSRF

## Brute Force Protection

AxiomX uses django-axes to implement sophisticated brute force protection:

```python
# Django-axes configuration for rate limiting
AXES_FAILURE_LIMIT = 5  # Number of login attempts before lockout
AXES_COOLOFF_TIME = 1  # Lockout time in hours
AXES_LOCKOUT_TEMPLATE = 'accounts/locked_out.html'  # Template to show when locked out
AXES_RESET_ON_SUCCESS = True  # Reset failed login attempts after successful login
AXES_LOCKOUT_BY_COMBINATION_USER_AND_IP = True  # Lock out based on both username and IP

# Use Axes as authentication backend
AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesBackend',
    'django.contrib.auth.backends.ModelBackend',
]
```

How it works:
1. The system tracks failed login attempts by username and IP address
2. After 5 failed attempts, the account is temporarily locked for 1 hour
3. Lockout is shown with a specific template that offers password reset
4. Failed attempts are reset after successful authentication
5. All lockouts are logged for security monitoring

## Security Logging

The application implements comprehensive security logging:

```python
def log_security_event(event_type, user=None, ip=None, details=None, request=None):
    """
    Log security events with standardized format
    """
    # Implementation details include IP anonymization and structured logging
```

Events that are logged include:
- Login attempts (successful and failed)
- Password changes and resets
- Account lockouts
- Sensitive data access
- Security-critical operations

Logs are written to both console and a dedicated security log file:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/security.log'),
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django.security': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'axes': {
            'handlers': ['file', 'console'],
            'level': 'WARNING',
            'propagate': True,
        },
    },
}
```

## Additional Security Measures

Beyond authentication, AxiomX implements several additional security features:

1. **Content Security Policy**
   - Custom middleware that sets appropriate CSP headers
   - Differs between development (permissive) and production (strict)

2. **HTTPS Enforcement**
   - In production, all traffic is redirected to HTTPS
   - HSTS headers ensure browsers only use secure connections

3. **Secure Database Connection**
   - SSL is used for database connections in production
   - Prevents sniffing of data in transit

4. **CSRF Protection**
   - All forms include CSRF tokens
   - Prevents cross-site request forgery attacks

5. **Security Headers**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Additional modern security headers

By implementing these comprehensive security measures, AxiomX provides a robust and secure authentication system that protects sensitive scientific data and user accounts. 