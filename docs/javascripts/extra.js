/* ============================================================================
 * PurpleSec — Dynamic Effects
 * Matrix rain, typing effect, scroll reveals, animated counters
 * ============================================================================ */

function initPurpleSecJS() {

  /* --------------------------------------------------------------------------
   * Matrix Rain Canvas
   * Renders falling characters on a canvas behind the hero section
   * -------------------------------------------------------------------------- */
  function initMatrixRain() {
    var canvas = document.getElementById("ps-matrix-canvas");
    if (!canvas) return;

    var ctx = canvas.getContext("2d");
    var fontSize = 16;
    var columns = 0;
    var drops = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize) + 1;
      
      // Preserve existing drops to prevent flashing on resize
      while (drops.length < columns) {
        drops.push(Math.floor(Math.random() * -100)); // Start off-screen
      }
    }
    resize();
    window.addEventListener("resize", resize);

    // Authentic mix of Katakana, Latin, and Numerals
    var chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ=+-*/";
    var charArr = chars.split("");

    function draw() {
      // Semi-transparent deep dark purple/black to create the fading trail
      ctx.fillStyle = "rgba(10, 8, 18, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = fontSize + "px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";

      for (var i = 0; i < columns; i++) {
        var text = charArr[Math.floor(Math.random() * charArr.length)];

        var rand = Math.random();
        if (rand > 0.98) {
          // Occasional bright white 'head' or glitch character
          ctx.fillStyle = "#ffffff";
        } else if (rand > 0.88) {
          // Hacker neon green highlights
          ctx.fillStyle = "#00ff66";
        } else {
          // Primary base color is a vibrant PurpleSec purple
          ctx.fillStyle = "#bb86fc"; 
        }

        var x = i * fontSize + (fontSize/2);
        var y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        // Reset drop to the top randomly after crossing the screen
        if (y > canvas.height && Math.random() > 0.95) {
          drops[i] = 0;
        }

        // Discrete increment for the authentic blocky Matrix look
        drops[i]++;
      }
    }

    // 50ms interval gives a perfect pace
    setInterval(draw, 50);
  }

  /* --------------------------------------------------------------------------
   * Hero Terminal Animation
   * Types out a command and reveals output in the realistic terminal
   * -------------------------------------------------------------------------- */
  function initHeroTerminal() {
    var outputEl = document.getElementById("ps-hero-output");
    if (!outputEl) return;

    // Fade in the welcome message smoothly
    setTimeout(function() {
      outputEl.style.opacity = "1";
    }, 300);
  }

  /* --------------------------------------------------------------------------
   * Typing Effect
   * Cycles through phrases with a typing/deleting animation
   * -------------------------------------------------------------------------- */
  function initTypingEffect() {
    var el = document.getElementById("ps-typed-text");
    if (!el) return;

    var phrases = [
      "Offensive Security. Documented.",
      "Hack. Learn. Document. Repeat.",
      "From Foothold to Domain Admin.",
      "Enumerate Everything.",
      "Red Team Mindset. Purple Team Heart.",
    ];

    var phraseIndex = 0;
    var charIndex = 0;
    var isDeleting = false;
    var typeSpeed = 60;
    var deleteSpeed = 35;
    var pauseAfterType = 2200;
    var pauseAfterDelete = 400;

    function type() {
      var current = phrases[phraseIndex];

      if (!isDeleting) {
        el.textContent = current.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === current.length) {
          isDeleting = true;
          setTimeout(type, pauseAfterType);
          return;
        }
        setTimeout(type, typeSpeed + Math.random() * 40);
      } else {
        el.textContent = current.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          setTimeout(type, pauseAfterDelete);
          return;
        }
        setTimeout(type, deleteSpeed);
      }
    }

    type();
  }

  /* --------------------------------------------------------------------------
   * Scroll-Triggered Reveal Animations
   * Uses IntersectionObserver to reveal elements as they enter viewport
   * -------------------------------------------------------------------------- */
  function initScrollReveal() {
    var revealClasses = [
      "ps-reveal",
      "ps-reveal-left",
      "ps-reveal-right",
      "ps-reveal-scale"
    ];

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("ps-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -50px 0px"
    });

    revealClasses.forEach(function (cls) {
      document.querySelectorAll("." + cls).forEach(function (el) {
        observer.observe(el);
      });
    });
  }

  /* --------------------------------------------------------------------------
   * Glitch Effect Data Attributes
   * Sets data-text attribute for CSS glitch effect
   * -------------------------------------------------------------------------- */
  function initGlitchEffect() {
    document.querySelectorAll(".ps-glitch-wrap").forEach(function (el) {
      var text = el.textContent.trim();
      el.setAttribute("data-text", text);
    });
  }

  /* --------------------------------------------------------------------------
   * Interactive Hover Glow on Cards
   * Makes cards glow subtly following the mouse cursor
   * -------------------------------------------------------------------------- */
  function initCardGlow() {
    document.querySelectorAll(".ps-stat-card, .ps-cert-card, .ps-terminal-card, .ps-featured").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        card.style.background = "radial-gradient(circle at " + x + "px " + y + "px, rgba(187, 134, 252, 0.08) 0%, transparent 60%)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.background = "";
      });
    });
  }

  /* --------------------------------------------------------------------------
   * Scroll Indicator Click Handler
   * Prevent instant navigation bug and smoothly scroll to next section
   * -------------------------------------------------------------------------- */
  function initScrollIndicator() {
    var indicator = document.querySelector(".ps-scroll-indicator");
    if (indicator) {
      // Remove any existing listeners if this runs multiple times
      var newIndicator = indicator.cloneNode(true);
      indicator.parentNode.replaceChild(newIndicator, indicator);
      
      newIndicator.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        var target = document.getElementById("ps-stats-section");
        if (target) {
          // Adjust scroll position for fixed header
          var headerOffset = 60;
          var elementPosition = target.getBoundingClientRect().top;
          var offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
   * Quote Carousel
   * Handles the rotating quote logic
   * -------------------------------------------------------------------------- */
  function initQuoteCarousel() {
    var carousel = document.getElementById("ps-quote-carousel");
    if (!carousel) return;

    var slides = carousel.querySelectorAll(".ps-quote-slide");
    var dots = carousel.querySelectorAll(".ps-quote-dot");
    var prevBtn = document.getElementById("ps-quote-prev");
    var nextBtn = document.getElementById("ps-quote-next");
    var currentIndex = 0;
    var intervalId;

    if (slides.length === 0) return;

    function showSlide(index) {
      slides.forEach(function(s) { s.classList.remove("active"); });
      dots.forEach(function(d) { d.classList.remove("active"); });

      slides[index].classList.add("active");
      if (dots[index]) dots[index].classList.add("active");
      currentIndex = index;
    }

    function nextSlide() {
      var next = (currentIndex + 1) % slides.length;
      showSlide(next);
    }

    function prevSlide() {
      var prev = (currentIndex - 1 + slides.length) % slides.length;
      showSlide(prev);
    }

    function resetTimer() {
      clearInterval(intervalId);
      intervalId = setInterval(nextSlide, 8000); // rotate every 8s
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function() {
        prevSlide();
        resetTimer();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function() {
        nextSlide();
        resetTimer();
      });
    }

    dots.forEach(function(dot) {
      dot.addEventListener("click", function() {
        var idx = parseInt(this.getAttribute("data-index"));
        showSlide(idx);
        resetTimer();
      });
    });

    // Initial setup
    showSlide(0);
    resetTimer();
  }

  /* --------------------------------------------------------------------------
   * Initialize Everything
   * -------------------------------------------------------------------------- */
  // Home page specific scripts
  if (document.querySelector(".ps-home")) {
    initMatrixRain();
    initHeroTerminal();
    initTypingEffect();
    initScrollIndicator();
    initQuoteCarousel();
  }

  // Global scripts (run on all pages including About/Resume)
  initGlitchEffect();
  initCardGlow();

  // Delay scroll reveal slightly so initial view state is set
  setTimeout(initScrollReveal, 100);
}

// Support for MkDocs Material Instant Navigation
if (typeof document$ !== "undefined") {
  document$.subscribe(function() {
    initPurpleSecJS();
  });
} else {
  document.addEventListener("DOMContentLoaded", function () {
    initPurpleSecJS();
  });
}
