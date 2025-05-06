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
    
    // Custom event for AJAX loaded content
    function triggerContentLoadedEvent() {
        const event = new CustomEvent('content-loaded');
        document.dispatchEvent(event);
    }
    
    // Create a MutationObserver to watch for dynamically added content
    const contentObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if any post content was added
                let processVisualizers = false;
                
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        if (node.classList && 
                            (node.classList.contains('post-content') || 
                             node.classList.contains('topic-content') ||
                             node.querySelector('.post-content, .topic-content'))) {
                            processVisualizers = true;
                        }
                    }
                });
                
                if (processVisualizers) {
                    triggerContentLoadedEvent();
                }
            }
        });
    });
    
    // Start observing the document body for added content
    contentObserver.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
    
    // Handle forum topic/reply preview
    const previewButtons = document.querySelectorAll('.preview-button');
    previewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const contentTextarea = this.closest('form').querySelector('textarea');
            const previewContainer = document.getElementById('content-preview');
            
            if (contentTextarea && previewContainer) {
                // Display content with line breaks
                previewContainer.innerHTML = contentTextarea.value
                    .replace(/\n/g, '<br>')
                    .replace(/\[wave\](.*?)\[\/wave\]/gs, '<div class="alert alert-info">Wave Simulator (will be rendered in the actual post)</div>')
                    .replace(/\[dna.*?\](.*?)\[\/dna\]/gs, '<div class="alert alert-info">DNA/RNA Visualizer (will be rendered in the actual post)</div>')
                    .replace(/\[datastructure.*?\](.*?)\[\/datastructure\]/gs, '<div class="alert alert-info">Data Structure Visualizer (will be rendered in the actual post)</div>');
                
                // Show the preview
                previewContainer.style.display = 'block';
            }
        });
    });
}); 