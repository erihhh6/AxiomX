// Theme toggle functionality for ElectraX - Scientists Collaboration Platform

document.addEventListener('DOMContentLoaded', function() {
    // Get the theme toggle button
    const themeToggler = document.getElementById('theme-toggler');
    
    // Check if there's a saved theme preference in localStorage
    const savedTheme = localStorage.getItem('theme');
    
    // Apply saved theme or default to light
    if (savedTheme === 'dark') {
        applyTheme('dark');
        updateToggleIcon('dark');
    } else {
        applyTheme('light');
        updateToggleIcon('light');
    }
    
    // Add click event listener to theme toggler
    if (themeToggler) {
        themeToggler.addEventListener('click', function() {
            // Get current theme
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            console.log('Current theme:', currentTheme);
            
            // Toggle theme
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            // Save preference to localStorage first
            localStorage.setItem('theme', newTheme);
            
            // Apply the new theme
            applyTheme(newTheme);
            
            // Update the toggle icon
            updateToggleIcon(newTheme);
            
            // Force reload to ensure all CSS is re-applied properly
            // Add a parameter to the URL to avoid browser cache
            window.location.href = window.location.href.split('?')[0] + '?theme=' + newTheme;
        });
    } else {
        console.error('Theme toggler button not found');
    }
    
    // Function to apply theme to document
    function applyTheme(theme) {
        // Set on HTML element
        document.documentElement.setAttribute('data-theme', theme);
        // Also set on body element for compatibility
        document.body.setAttribute('data-theme', theme);
        console.log(`Applied ${theme} theme to HTML and body elements`);
        
        // Add class for additional styling hooks
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        }
    }
    
    // Function to update toggle icon based on current theme
    function updateToggleIcon(theme) {
        if (!themeToggler) return;
        
        if (theme === 'dark') {
            themeToggler.innerHTML = '<i class="fas fa-sun"></i>'; // Show sun icon in dark mode
        } else {
            themeToggler.innerHTML = '<i class="fas fa-moon"></i>'; // Show moon icon in light mode
        }
    }
}); 