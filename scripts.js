//javascript
   // Basic interactivity placeholder
   //console.log('Wrotron Consulting site loaded');
/**
 * This script handles all the interactive elements of the Wrotron Consulting website.
 * It includes functionality for the mobile navigation menu and for revealing
 * elements on the page as the user scrolls.
 */
document.addEventListener('DOMContentLoaded', function () {
    
    /**
     * Mobile Menu Toggle Functionality
     * This part of the script makes the mobile "hamburger" menu work.
     */
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        // Event listener to show/hide the menu when the button is clicked.
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Event listener to close the mobile menu when a link inside it is clicked.
        // This is useful for single-page applications where links scroll to sections.
        const mobileMenuLinks = mobileMenu.querySelectorAll('a');
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    /**
     * Scroll Reveal Animation
     * This uses the Intersection Observer API to add a "visible" class
     * to elements with the "reveal" class when they enter the viewport.
     * The CSS then handles the fade-in and slide-up animation.
     */
    const revealElements = document.querySelectorAll('.reveal');
    
    // Check if the browser supports IntersectionObserver
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // If the element is intersecting the viewport, add the 'visible' class.
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1 // Trigger when 10% of the element is visible
        });

        revealElements.forEach(element => {
            observer.observe(element);
        });
    } else {
        // Fallback for older browsers that don't support IntersectionObserver.
        // This will simply make all reveal elements visible immediately.
        revealElements.forEach(element => {
            element.classList.add('visible');
        });
    }
});

