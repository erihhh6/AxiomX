"""
Custom security middleware for the Scientist Collaboration Platform.
Adds additional security headers and measures.
"""

class SecurityHeadersMiddleware:
    """
    Middleware to add security headers to all responses
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Process the request
        response = self.get_response(request)
        
        # Add security headers
        # X-Content-Type-Options prevents MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        
        # X-Frame-Options prevents clickjacking by frame/iframe embedding
        # Changed from DENY to ALLOW-FROM to permit specific sites like TryHackMe
        response['X-Frame-Options'] = 'DENY'
        
        # X-XSS-Protection for older browsers that don't fully support CSP
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Permissions Policy (formerly Feature Policy) restricts API usage
        response['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
        
        # Cross-Origin-Embedder-Policy requires explicit permission for cross-origin resources
        # Disable this for now to allow embedding external content
        # response['Cross-Origin-Embedder-Policy'] = 'require-corp'
        
        # Cross-Origin-Opener-Policy restricts sharing of browsing context
        # Modified to allow external links
        response['Cross-Origin-Opener-Policy'] = 'unsafe-none'
        
        # Cache-Control prevents storing sensitive pages
        if request.path.startswith('/accounts/') or request.path.startswith('/admin/'):
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            
        return response

class ContentSecurityPolicyMiddleware:
    """
    Middleware to add Content-Security-Policy headers to responses
    Implementare proprie fără a depinde de django-csp
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        response = self.get_response(request)
        
        # Get settings module
        from django.conf import settings
        
        # Skip CSP for Django debug toolbar
        is_debug_toolbar = request.path.startswith('/__debug__/') if hasattr(settings, 'DEBUG') and settings.DEBUG else False
        if is_debug_toolbar:
            return response
            
        # În modul DEBUG, folosim setări foarte permisive pentru a nu bloca dezvoltarea
        if settings.DEBUG:
            # Setare foarte permisivă pentru dezvoltare
            csp = (
                "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; "
                "script-src * 'unsafe-inline' 'unsafe-eval'; "
                "style-src * 'unsafe-inline'; "
                "img-src * data: blob:; "
                "font-src * data:; "
                "connect-src * blob:; "
                "frame-src * data: https://*.tryhackme.com https://tryhackme.com; "
            )
        else:
            # În producție, folosim setări stricte pentru securitate
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://code.jquery.com https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://stackpath.bootstrapcdn.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https://via.placeholder.com https://*.tryhackme.com; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "frame-src 'self' https://*.tryhackme.com https://tryhackme.com; "
                "frame-ancestors 'self'; "
            )
        
        # Adaugă headerul CSP
        response['Content-Security-Policy'] = csp
            
        return response 