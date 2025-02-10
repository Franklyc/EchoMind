document.addEventListener('DOMContentLoaded', () => {
    // Enhanced Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-up');
                
                // Add stagger effect for child elements
                const children = entry.target.querySelectorAll('.stagger-child');
                children.forEach((child, index) => {
                    child.style.transitionDelay = `${index * 0.1}s`;
                    child.classList.add('animate-up');
                });
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Enhanced Mouse Movement Effect for Feature Cards
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => {
        observer.observe(card);
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // Enhanced Step Animation
    document.querySelectorAll('.step').forEach((step, index) => {
        observer.observe(step);
        step.style.animationDelay = `${index * 0.2}s`;
    });

    // Enhanced Install Cards Animation
    document.querySelectorAll('.install-card').forEach(card => {
        observer.observe(card);
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const targetPosition = target.offsetTop;
                const startPosition = window.pageYOffset;
                const distance = targetPosition - startPosition;
                const duration = 1000;
                let start = null;
                
                function animation(currentTime) {
                    if (start === null) start = currentTime;
                    const timeElapsed = currentTime - start;
                    const progress = Math.min(timeElapsed / duration, 1);
                    const ease = easeOutCubic(progress);
                    
                    window.scrollTo(0, startPosition + distance * ease);
                    
                    if (timeElapsed < duration) {
                        requestAnimationFrame(animation);
                    }
                }
                
                function easeOutCubic(t) {
                    return 1 - Math.pow(1 - t, 3);
                }
                
                requestAnimationFrame(animation);
            }
        });
    });

    // Enhanced Parallax Effect
    const parallaxWrapper = document.querySelector('.parallax-wrapper');
    const heroContent = document.querySelector('.hero-content');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        if (parallaxWrapper) {
            parallaxWrapper.style.transform = `translateY(${scrolled * 0.1}px)`;
        }
        
        if (heroContent) {
            heroContent.style.transform = `translateY(${scrolled * 0.4}px)`;
            heroContent.style.opacity = 1 - (scrolled * 0.003);
        }
    });

    // Enhanced Floating Elements Animation
    const floatingElements = document.querySelectorAll('.float-item');
    floatingElements.forEach((item, index) => {
        const randomDelay = Math.random() * 2;
        const randomDuration = 3 + Math.random() * 2;
        
        item.style.animationDelay = `${randomDelay}s`;
        item.style.animationDuration = `${randomDuration}s`;
        
        item.addEventListener('mouseover', () => {
            item.style.animationPlayState = 'paused';
        });
        
        item.addEventListener('mouseout', () => {
            item.style.animationPlayState = 'running';
        });
    });

    // Enhanced Button Hover Effects
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            button.style.setProperty('--x', `${x}px`);
            button.style.setProperty('--y', `${y}px`);
        });
    });

    // Add dynamic gradient animation to hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        let mouseX = 0;
        let mouseY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX / window.innerWidth;
            mouseY = e.clientY / window.innerHeight;
            
            const gradientX = 50 + (mouseX * 20);
            const gradientY = 50 + (mouseY * 20);
            
            hero.style.backgroundImage = `linear-gradient(${gradientX}deg, #f5f7fa ${gradientY}%, #e4e9f2 100%)`;
        });
    }
});