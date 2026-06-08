/* ============================================================================
 * PurpleSec — Dynamic Effects
 * Matrix rain, typing effect, scroll reveals, animated counters
 * ============================================================================ */

document.addEventListener("DOMContentLoaded", function () {

  /* --------------------------------------------------------------------------
   * Matrix Rain Canvas
   * Renders falling characters on a canvas behind the hero section
   * -------------------------------------------------------------------------- */
  function initMatrixRain() {
    var canvas = document.getElementById("ps-matrix-canvas");
    if (!canvas) return;

    var ctx = canvas.getContext("2d");
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    var chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン><{}[]|/\\=+-_:;!@#$%^&*ABCDEF";
    var charArr = chars.split("");
    var fontSize = 13;
    var columns = Math.floor(canvas.width / fontSize);
    var drops = [];

    for (var i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    function draw() {
      ctx.fillStyle = "rgba(5, 8, 13, 0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(187, 134, 252, 0.35)";
      ctx.font = fontSize + "px JetBrains Mono, monospace";

      for (var i = 0; i < drops.length; i++) {
        var text = charArr[Math.floor(Math.random() * charArr.length)];

        // Randomly make some chars green for variety
        if (Math.random() > 0.92) {
          ctx.fillStyle = "rgba(0, 255, 102, 0.5)";
        } else {
          ctx.fillStyle = "rgba(187, 134, 252, 0.25)";
        }

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.4 + Math.random() * 0.3;
      }
    }

    setInterval(draw, 50);
  }

  /* --------------------------------------------------------------------------
   * Hero Terminal Animation
   * Types out a command and reveals output in the realistic terminal
   * -------------------------------------------------------------------------- */
  function initHeroTerminal() {
    var cmdEl = document.getElementById("ps-hero-cmd");
    var outputEl = document.getElementById("ps-hero-output");
    if (!cmdEl || !outputEl) return;

    var cmd = "./launch_purplesec.sh";
    var i = 0;

    function typeCmd() {
      if (i < cmd.length) {
        cmdEl.textContent += cmd.charAt(i);
        i++;
        setTimeout(typeCmd, 50 + Math.random() * 50);
      } else {
        setTimeout(function() {
          outputEl.style.opacity = "1";
        }, 500);
      }
    }

    // Start typing after a short delay
    setTimeout(typeCmd, 800);
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
   * Initialize Everything
   * -------------------------------------------------------------------------- */
  // Home page specific scripts
  if (document.querySelector(".ps-home")) {
    initMatrixRain();
    initHeroTerminal();
    initTypingEffect();
  }

  // Global scripts (run on all pages including About/Resume)
  initGlitchEffect();
  initCardGlow();

  // Delay scroll reveal slightly so initial view state is set
  setTimeout(initScrollReveal, 100);
});
