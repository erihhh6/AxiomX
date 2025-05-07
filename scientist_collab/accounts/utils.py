"""
Security utility functions for the accounts app
"""
import logging
import hashlib
import ipaddress
from functools import wraps
from django.http import HttpResponseForbidden
from django.conf import settings

# Get the security logger
security_logger = logging.getLogger('django.security')

def log_security_event(event_type, user=None, ip=None, details=None, request=None):
    """
    Log security events with standardized format
    
    Args:
        event_type: Type of event (authentication, access, etc)
        user: User object or username string
        ip: IP address as string
        details: Dict of event details
        request: HttpRequest object
    """
    if request:
        ip = ip or request.META.get('REMOTE_ADDR', 'unknown')
        username = getattr(request.user, 'username', 'anonymous') if user is None else user
    else:
        ip = ip or 'unknown'
        username = 'unknown' if user is None else user
        
    # Convert user object to username if needed
    if hasattr(username, 'username'):
        username = username.username
    
    # Anonymize IP for GDPR compliance
    if ip and ip != 'unknown':
        try:
            ip_obj = ipaddress.ip_address(ip)
            # For IPv4, mask the last octet
            if ip_obj.version == 4:
                ip_parts = ip.split('.')
                ip = f"{ip_parts[0]}.{ip_parts[1]}.{ip_parts[2]}.*"
            # For IPv6, mask the last 80 bits
            else:
                ip = f"{ip.split(':')[0]}:{ip.split(':')[1]}:****:****:****"
        except ValueError:
            # Invalid IP, leave as is
            pass
            
    # Create structured log message
    log_data = {
        'event_type': event_type,
        'username': username,
        'ip': ip,
    }
    
    # Add additional details if provided
    if details:
        log_data.update(details)
    
    # Log the event
    security_logger.info(f"SECURITY EVENT: {log_data}")
    
    return log_data

def require_secure_transport(view_func):
    """
    Decorator that requires HTTPS for the decorated view
    """
    @wraps(view_func)
    def _wrapped_view(request_or_self, *args, **kwargs):
        # Handle both function-based and class-based views
        if hasattr(request_or_self, 'request'):
            # This is a class-based view (the first arg is 'self')
            request = request_or_self.request
        else:
            # This is a function-based view (the first arg is 'request')
            request = request_or_self
        
        # Check if DEBUG mode is enabled (skip check)
        if settings.DEBUG:
            return view_func(request_or_self, *args, **kwargs)
            
        # Check if the connection is secure
        if not request.is_secure():
            # Log the insecure access attempt
            log_security_event(
                'insecure_access_attempt',
                request.user,
                request=request,
                details={'path': request.path}
            )
            return HttpResponseForbidden("HTTPS is required for this resource")
            
        return view_func(request_or_self, *args, **kwargs)
    return _wrapped_view

def generate_verification_token(user, expiry_hours=24):
    """
    Generate a secure verification token for use in email verification, etc.
    """
    import time
    import jwt
    
    # Calculate expiry timestamp
    expiry = int(time.time()) + (expiry_hours * 3600)
    
    # Create a payload
    payload = {
        'user_id': user.id,
        'username': user.username,
        'exp': expiry
    }
    
    # Sign with SECRET_KEY
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    
    return token

def verify_token(token):
    """
    Verify a token is valid and return the user if successful
    """
    import jwt
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    try:
        # Decode and verify token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        
        # Get user from payload
        user = User.objects.get(id=payload['user_id'])
        
        return user
    except (jwt.PyJWTError, User.DoesNotExist) as e:
        # Log verification failure
        security_logger.warning(f"Token verification failed: {str(e)}")
        return None 