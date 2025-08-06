// Main JS for Ryan Wyskowski Resume Website

document.addEventListener('DOMContentLoaded', () => {
  // Section scroll animation
  const sections = document.querySelectorAll('section');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(section => {
    observer.observe(section);
  });


  // Burger menu toggle
  const burger = document.createElement('div');
  burger.classList.add('burger');
  burger.innerHTML = '<span></span><span></span><span></span>';
  document.querySelector('nav').appendChild(burger);

  const navLinks = document.querySelector('nav ul');

  burger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });

  // Scroll spy for nav highlighting
  const navItems = document.querySelectorAll('nav ul li a');

  const smoothScrollTo = (target) => {
    const element = document.querySelector(target);
    if (element) {
element.scrollIntoView({ behavior: "smooth", block: "start" });
return;
    }
  };

  navItems.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      smoothScrollTo(href);
    });
  });

  // Create scroll progress bar
  const progressBar = document.createElement('div');
  progressBar.style.position = 'fixed';
  progressBar.style.top = '0';
  progressBar.style.left = '0';
  progressBar.style.height = '4px';
  progressBar.style.backgroundColor = 'var(--accent)';
  progressBar.style.width = '0%';
  progressBar.style.zIndex = '999';
  progressBar.style.transition = 'width 0.25s ease';
  document.body.appendChild(progressBar);

  const navBar = document.querySelector('nav');
  const defaultNavBg = navBar.style.backgroundColor;

  window.addEventListener('scroll', () => {
    let fromTop = window.scrollY + 80;

    navItems.forEach(link => {
      const section = document.querySelector(link.getAttribute('href'));
      if (
        section.offsetTop <= fromTop &&
        section.offsetTop + section.offsetHeight > fromTop
      ) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Scroll progress bar update
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    progressBar.style.width = `${scrollPercent}%`;

    // Navbar background change on scroll
    if (scrollTop > 10) {
      navBar.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)';
    } else {
      navBar.style.boxShadow = 'none';
    }
  });

  // Typewriter effect for home hero
  const typewriter = document.querySelector('.typewriter');
  if (typewriter) {
    const words = ["Business Student", "Data Explorer", "Future Strategist"];
    let i = 0;

    const typing = () => {
      let word = words[i].split("");
      const loopTyping = () => {
        if (word.length > 0) {
          typewriter.innerHTML += word.shift();
          setTimeout(loopTyping, 120);
        } else {
          setTimeout(deleting, 1500);
        }
      };

      const deleting = () => {
        let word = words[i].split("");
        const loopDeleting = () => {
          if (word.length > 0) {
            word.pop();
            typewriter.innerHTML = word.join("");
            setTimeout(loopDeleting, 60);
          } else {
            i = (i + 1) % words.length;
            typing();
          }
        };
        loopDeleting();
      };

      loopTyping();
    };

    typing();
  }
});

document.querySelectorAll('.tab-btn').forEach(button => {
  button.addEventListener('click', () => {
    const category = button.dataset.category;

    // Remove active state from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // Show/hide skill cards
    document.querySelectorAll('.skill-card').forEach(card => {
      const match = card.dataset.category === category || category === 'all';
      card.style.display = match ? 'block' : 'none';
    });
  });
});