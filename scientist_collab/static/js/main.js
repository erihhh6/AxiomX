/**
 * AxiomX - Main JavaScript
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Inițializare explicită pentru bootstrap dropdowns
    var dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
    var dropdownList = dropdownElementList.map(function(dropdownToggleEl) {
        return new bootstrap.Dropdown(dropdownToggleEl);
    });

    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Navbar scroll behavior
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        // Set initial navbar state based on scroll position
        updateNavbarOnScroll();
        
        // Listen for scroll events
        window.addEventListener('scroll', updateNavbarOnScroll);
    }
    
    // Function to update navbar on scroll
    function updateNavbarOnScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
            navbar.classList.remove('transparent');
        } else {
            if (window.location.pathname === '/' || window.location.pathname === '/home/') {
                navbar.classList.add('transparent');
                navbar.classList.remove('scrolled');
            }
        }
    }
    
    // Handle active navigation links
    highlightActiveNavLink();
    
    function highlightActiveNavLink() {
        const currentPath = window.location.pathname;
        
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            
            // Skip dropdown toggles
            if (link.classList.contains('dropdown-toggle')) return;
            
            // Match path exactly or as a prefix (for section highlighting)
            if (href === currentPath || 
                (href !== '/' && currentPath.startsWith(href))) {
                link.classList.add('active');
            }
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const closeButton = alert.querySelector('.btn-close');
            if (closeButton) {
                closeButton.click();
            }
        }, 5000);
    });

    // Preview uploaded file name
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const fileNameElement = document.querySelector('.custom-file-label');
            if (fileNameElement && this.files[0]) {
                fileNameElement.textContent = this.files[0].name;
            }
        });
    });
}); 