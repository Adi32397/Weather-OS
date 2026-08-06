// GSAP, ScrollTrigger, and Lenis smooth scrolling setup

let lenis;

function initAnimations() {
    // 1. Initialize Lenis Smooth Scroll on the main-content area
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        lenis = new Lenis({
            wrapper: mainContent,
            content: mainContent.querySelector('.dashboard-grid'),
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Initial Loading Animation
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    let progress = { val: 0 };
    gsap.to(progress, {
        val: 100,
        duration: 2.5, // Slightly longer for "premium" feel
        ease: "power2.inOut",
        onUpdate: function() {
            const p = Math.round(progress.val);
            if(progressBar) progressBar.style.width = p + '%';
            if(progressText) progressText.innerText = p + '%';
        },
        onComplete: () => {
            const loader = document.getElementById('loader');
            if(loader) {
                gsap.to(loader, {
                    opacity: 0,
                    duration: 0.8,
                    onComplete: () => {
                        loader.style.visibility = 'hidden';
                        // Initial UI reveal
                        gsap.from(".sidebar", { x: -50, opacity: 0, duration: 1, ease: "power3.out" });
                        gsap.from(".top-nav", { y: -30, opacity: 0, duration: 1, delay: 0.2, ease: "power3.out" });
                    }
                });
            }
        }
    });

    let tiltTicking = false;
    document.addEventListener("mousemove", (e) => {
        if (window.animMaster === false || window.animCards === false) return;
        if (!tiltTicking) {
            requestAnimationFrame(() => {
                const cards = document.querySelectorAll(".tilt-card");
                for (let i = 0; i < cards.length; i++) {
                    const card = cards[i];
                    const rect = card.getBoundingClientRect();
                    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        const centerX = rect.width / 2;
                        const centerY = rect.height / 2;
                        const rotateX = ((y - centerY) / centerY) * -5;
                        const rotateY = ((x - centerX) / centerX) * 5;
                        
                        gsap.to(card, {
                            rotateX: rotateX,
                            rotateY: rotateY,
                            transformPerspective: 1000,
                            ease: "power2.out",
                            duration: 0.5
                        });
                    }
                }
                tiltTicking = false;
            });
            tiltTicking = true;
        }
    });
    
    document.querySelectorAll(".tilt-card").forEach((card) => {
        card.addEventListener("mouseleave", () => {
            if (window.animMaster === false || window.animCards === false) return;
            gsap.to(card, { rotateX: 0, rotateY: 0, ease: "power2.out", duration: 0.5 });
        });
    });
}

// Called after weather data is fetched and DOM updated
// Called after weather data is fetched and DOM updated, or when switching SPA pages
window.animateDashboardReveal = function(container = document) {
    // Stagger reveal all widgets in the target container
    const widgets = container.querySelectorAll('.widget');
    if (widgets.length > 0) {
        if (window.animMaster === false) {
            gsap.set(widgets, { y: 0, opacity: 1 });
        } else {
            gsap.fromTo(widgets, 
                { y: 30, opacity: 0 }, 
                { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power2.out", overwrite: "auto" }
            );
        }
    }
};
