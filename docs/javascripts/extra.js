/* ============================================================================
 * PurpleSec — Dynamic Effects
 * Matrix rain, typing effect, scroll reveals, animated counters
 * ============================================================================ */

function initPurpleSecJS() {

  /* --------------------------------------------------------------------------
   * Idempotency / cleanup
   * On instant navigation (document$), this whole function re-runs. Clear any
   * timers and listeners from the previous page so they don't stack up and leak.
   * -------------------------------------------------------------------------- */
  window.__psTimers = window.__psTimers || {};
  if (window.__psTimers.matrix) { clearInterval(window.__psTimers.matrix); window.__psTimers.matrix = null; }
  if (window.__psTimers.quote) { clearInterval(window.__psTimers.quote); window.__psTimers.quote = null; }
  if (window.__psTimers.typing) { clearTimeout(window.__psTimers.typing); window.__psTimers.typing = null; }
  if (window.__psTimers.matrixResize) {
    window.removeEventListener("resize", window.__psTimers.matrixResize);
    window.__psTimers.matrixResize = null;
  }

  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --------------------------------------------------------------------------
   * Matrix Rain Canvas
   * Renders falling characters on a canvas behind the hero section
   * -------------------------------------------------------------------------- */
  function initMatrixRain() {
    var canvas = document.getElementById("ps-matrix-canvas");
    if (!canvas) return;
    // Skip the (heavy) animation entirely when reduced motion is requested
    if (prefersReducedMotion) { canvas.style.display = "none"; return; }

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
    window.__psTimers.matrixResize = resize;

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
    window.__psTimers.matrix = setInterval(draw, 50);
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
      "Attack. Understand. Defend.",
      "From Foothold to Domain Admin.",
      "Active Directory, Demystified.",
      "Real Exploits. Real Defense.",
      "Offense Informs Defense.",
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
          window.__psTimers.typing = setTimeout(type, pauseAfterType);
          return;
        }
        window.__psTimers.typing = setTimeout(type, typeSpeed + Math.random() * 40);
      } else {
        el.textContent = current.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          window.__psTimers.typing = setTimeout(type, pauseAfterDelete);
          return;
        }
        window.__psTimers.typing = setTimeout(type, deleteSpeed);
      }
    }

    type();
  }

  /* --------------------------------------------------------------------------
   * Animated Count-Up
   * Counts numbers from 0 to their data-count target when scrolled into view
   * -------------------------------------------------------------------------- */
  function initCounters() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);

        var target = parseInt(el.getAttribute("data-count"), 10) || 0;

        if (prefersReducedMotion) { el.textContent = target.toString(); return; }

        var duration = 1500;
        var startTime = null;

        function step(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          // easeOutCubic for a snappy finish
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target).toString();
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            el.textContent = target.toString();
          }
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });

    nums.forEach(function (n) { observer.observe(n); });
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
      window.__psTimers.quote = intervalId;
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
   * Interactive Terminal for About Page
   * Handles commands like whoami, cat, etc.
   * -------------------------------------------------------------------------- */
  function initInteractiveTerminal() {
    var inputEl = document.getElementById("terminal-input");
    var historyEl = document.getElementById("terminal-history");
    var terminalWindow = document.getElementById("interactive-terminal");

    if (!inputEl || !historyEl || !terminalWindow) return;

    var commands = {
      "help": "Available commands:<br>&nbsp;&nbsp;<span style='color: var(--ps-accent);'>whoami</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Display current user info<br>&nbsp;&nbsp;<span style='color: var(--ps-accent);'>cat profile.txt</span>&nbsp;&nbsp;Print profile summary<br>&nbsp;&nbsp;<span style='color: var(--ps-accent);'>cat experience.txt</span>&nbsp;Print work experience<br>&nbsp;&nbsp;<span style='color: var(--ps-accent);'>cat skills.txt</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Print top skills<br>&nbsp;&nbsp;<span style='color: var(--ps-accent);'>clear</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Clear terminal output",
      "whoami": "bilash-j-shahi<br>role: Senior Cybersecurity Engineer<br>status: Active<br>location: Greater Bengaluru Area",
      "cat profile.txt": "I am a dedicated Cybersecurity Engineer with a deep passion for offensive security. I firmly believe that understanding exactly how an attack works is the key to becoming an elite defender. Combining extensive experience in cloud infrastructure with a relentless drive to master Red Team tactics, I strive to be an invaluable, defense-first asset to any forward-thinking cybersecurity team.",
      "cat experience.txt": "<span style='color: var(--ps-neon-green);'>Senior Cybersecurity Engineer @ Convera (Mar 2024 - Present)</span><br>Focusing on enterprise defense, Identity Protection, SIEM orchestration, and endpoint security.<br><br><span style='color: var(--ps-neon-green);'>Specialist @ LTIMindtree (Jul 2021 - Mar 2024)</span><br>Led a 20+ member team managing Azure IaaS architectures and automated security patch management.",
      "cat skills.txt": "Azure IaaS & Cloud Infra [████████████████████] 95%<br>Active Directory Security  [███████████████████░] 90%<br>Crowdstrike / SIEM         [███████████████████░] 90%<br>PowerShell Automation      [██████████████████░░] 85%<br>Offensive Security         [█████████████████░░░] 80%",
      "sudo": "guest is not in the sudoers file. This incident will be reported."
    };

    inputEl.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        var cmd = inputEl.value.trim();
        inputEl.value = "";
        
        if (cmd === "") return;

        // Add the user's command to the history
        var cmdLine = document.createElement("div");
        cmdLine.className = "ps-terminal-line";
        cmdLine.style.marginBottom = "0.5rem";
        
        // Escape HTML
        var safeCmd = cmd.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        cmdLine.innerHTML = "<span class='ps-prompt-user'>guest</span><span class='ps-prompt-at'>@</span><span class='ps-prompt-host'>purplesec</span>:<span class='ps-prompt-path'>~</span>$ <span style='color: var(--md-code-fg-color);'>" + safeCmd + "</span>";
        historyEl.appendChild(cmdLine);

        // Process command
        if (cmd === "clear") {
          historyEl.innerHTML = "";
        } else {
          var responseLine = document.createElement("div");
          responseLine.className = "ps-terminal-output";
          responseLine.style.marginBottom = "1.5rem";
          responseLine.style.marginTop = "0.5rem";
          responseLine.style.color = "var(--md-default-fg-color--light)";
          responseLine.style.lineHeight = "1.6";
          
          if (commands[cmd]) {
            responseLine.innerHTML = commands[cmd];
          } else if (cmd.startsWith("cat ")) {
             responseLine.innerHTML = "cat: " + safeCmd.substring(4) + ": No such file or directory";
          } else if (cmd.startsWith("sudo ")) {
             responseLine.innerHTML = "guest is not in the sudoers file. This incident will be reported.";
          } else {
            responseLine.innerHTML = "bash: " + safeCmd + ": command not found";
          }
          historyEl.appendChild(responseLine);
        }

        // Scroll to bottom
        terminalWindow.scrollTop = terminalWindow.scrollHeight;
      }
    });
  }

  /* --------------------------------------------------------------------------
   * Browser Window Frames
   * Wraps a screenshot in an auto-generated browser chrome: traffic-light dots,
   * a fake URL bar (from data-url), and a copy-URL button.
   * Authoring (markdown + md_in_html):
   *   <div class="ps-browser" data-url="http://SERVER_IP:PORT/" markdown>
   *   ![alt](path/to/shot.png)
   *   </div>
   * (A bare <img class="ps-browser" data-url="..."> is also supported.)
   * -------------------------------------------------------------------------- */
  function initBrowserFrames() {
    var targets = document.querySelectorAll(".ps-browser:not([data-psb-done])");
    if (!targets.length) return;

    var ICON = {
      copy:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
      check:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      back:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>',
      forward: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>',
      reload:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>',
      lock:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
      info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
      globe:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
      star:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
      close:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
      plus:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>',
      menu:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>'
    };

    function fallbackCopy(text) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (err) {}
      document.body.removeChild(ta);
    }

    function buildBar(url, title) {
      var isSecure = /^https:\/\//i.test(url);

      var wrap = document.createDocumentFragment();

      // --- Tab strip: window controls + active tab + new-tab button ---
      var tabs = document.createElement("div");
      tabs.className = "ps-browser-tabs";
      tabs.innerHTML =
        '<span class="ps-browser-dots"><i></i><i></i><i></i></span>' +
        '<div class="ps-browser-tab">' +
          '<span class="ps-browser-tab-fav">' + ICON.globe + '</span>' +
          '<span class="ps-browser-tab-title"></span>' +
          '<span class="ps-browser-tab-close" aria-hidden="true">' + ICON.close + '</span>' +
        '</div>' +
        '<button type="button" class="ps-browser-tab-new" tabindex="-1" aria-label="New tab">' + ICON.plus + '</button>';
      tabs.querySelector(".ps-browser-tab-title").textContent = title;

      // --- Toolbar: nav buttons + address bar + actions ---
      var bar = document.createElement("div");
      bar.className = "ps-browser-bar";
      bar.innerHTML =
        '<div class="ps-browser-nav">' +
          '<button type="button" class="ps-browser-navbtn is-disabled" tabindex="-1" aria-label="Back">' + ICON.back + '</button>' +
          '<button type="button" class="ps-browser-navbtn is-disabled" tabindex="-1" aria-label="Forward">' + ICON.forward + '</button>' +
          '<button type="button" class="ps-browser-navbtn ps-browser-reload" tabindex="-1" aria-label="Reload">' + ICON.reload + '</button>' +
        '</div>' +
        '<div class="ps-browser-url' + (isSecure ? '' : ' is-insecure') + '">' +
          '<span class="ps-browser-url-icon">' + (isSecure ? ICON.lock : ICON.info) + '</span>' +
          '<span class="ps-browser-url-text"></span>' +
          '<button type="button" class="ps-browser-copy" title="Copy URL" aria-label="Copy URL">' + ICON.copy + '</button>' +
        '</div>' +
        '<button type="button" class="ps-browser-iconbtn ps-browser-star" tabindex="-1" aria-label="Bookmark">' + ICON.star + '</button>' +
        '<button type="button" class="ps-browser-iconbtn" tabindex="-1" aria-label="Menu">' + ICON.menu + '</button>';
      // Set URL text safely (no HTML injection)
      bar.querySelector(".ps-browser-url-text").textContent = url;

      var copyBtn = bar.querySelector(".ps-browser-copy");
      copyBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        function showCopied() {
          copyBtn.classList.add("is-copied");
          copyBtn.innerHTML = ICON.check;
          setTimeout(function () {
            copyBtn.classList.remove("is-copied");
            copyBtn.innerHTML = ICON.copy;
          }, 1500);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(showCopied).catch(function () {
            fallbackCopy(url); showCopied();
          });
        } else {
          fallbackCopy(url); showCopied();
        }
      });

      // Playful reload spin
      var reloadBtn = bar.querySelector(".ps-browser-reload");
      reloadBtn.addEventListener("click", function () {
        reloadBtn.classList.remove("is-spinning");
        void reloadBtn.offsetWidth; // restart animation
        reloadBtn.classList.add("is-spinning");
      });

      wrap.appendChild(tabs);
      wrap.appendChild(bar);
      return wrap;
    }

    targets.forEach(function (el) {
      el.setAttribute("data-psb-done", "1");

      var img, container, url;

      if (el.tagName === "IMG") {
        // Bare image form: build a fresh frame and move the image into it
        img = el;
        if (!img.parentNode) return;
        url = img.getAttribute("data-url") || "http://SERVER_IP:PORT/";
        container = document.createElement("div");
        img.parentNode.insertBefore(container, img);
      } else {
        // Container form (md_in_html): reuse this element as the frame
        img = el.querySelector("img");
        if (!img) return;
        url = el.getAttribute("data-url") || img.getAttribute("data-url") || "http://SERVER_IP:PORT/";
        container = el;
        container.innerHTML = "";
      }

      container.classList.add("ps-browser-frame");

      // Tab title acts like a real browser tab. Priority: explicit data-title,
      // else the image alt text (page title), else fall back to the URL.
      var title = (el.getAttribute && el.getAttribute("data-title")) ||
                  img.getAttribute("data-title") ||
                  (img.getAttribute("alt") || "").trim() ||
                  url;

      var viewport = document.createElement("div");
      viewport.className = "ps-browser-viewport";

      container.appendChild(buildBar(url, title));
      container.appendChild(viewport);
      viewport.appendChild(img);
    });
  }

  /* --------------------------------------------------------------------------
   * Window Frames (image viewer / shell / editor)
   * Same authoring pattern as .ps-browser, but type-appropriate chrome.
   *   <div class="ps-image"  data-title="login.png"        markdown>![alt](shot.png)</div>
   *   <div class="ps-shell"  data-title="kali@kali: ~"     markdown>![alt](shot.png)</div>
   *   <div class="ps-editor" data-title="reverse-shell.php" markdown>![alt](shot.png)</div>
   * Each can also wrap real text/code (a fenced block) instead of an image.
   * -------------------------------------------------------------------------- */
  function initWindowFrames() {
    var targets = document.querySelectorAll(".ps-image:not([data-psb-done]), .ps-shell:not([data-psb-done]), .ps-editor:not([data-psb-done])");
    if (!targets.length) return;

    var WICON = {
      image:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="m21 15-5-5L5 21"></path></svg>',
      shell:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>',
      editor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
      close:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>'
    };

    // Color the editor "modified" dot / accent by file extension
    function extColor(name) {
      var m = String(name).toLowerCase().match(/\.([a-z0-9]+)$/);
      var ext = m ? m[1] : "";
      var map = {
        php: "#8993be", py: "#ffd43b", js: "#f0db4f", ts: "#3178c6",
        sh: "#4cc77f", bash: "#4cc77f", html: "#e34c26", css: "#2965f1",
        json: "#cbcb41", rb: "#cc342d", go: "#00add8", rs: "#dea584",
        c: "#5f9ea0", cpp: "#5f9ea0", java: "#e76f00", sql: "#e38c00",
        ps1: "#5391fe", txt: "#9aa4b2", conf: "#9aa4b2", yml: "#cb171e", yaml: "#cb171e"
      };
      return map[ext] || "var(--ps-accent)";
    }

    targets.forEach(function (el) {
      el.setAttribute("data-psb-done", "1");

      var type = el.classList.contains("ps-shell") ? "shell"
               : el.classList.contains("ps-editor") ? "editor"
               : "image";

      var img, container;

      if (el.tagName === "IMG") {
        img = el;
        if (!img.parentNode) return;
        container = document.createElement("div");
        img.parentNode.insertBefore(container, img);
        var hold = img;
        container.appendChild(hold);
      } else {
        container = el;
        img = el.querySelector("img");
      }

      // Default titles per window type
      var defaultTitle = type === "shell" ? "bash"
                       : type === "editor" ? "untitled"
                       : "Preview";

      var title = (container.getAttribute && container.getAttribute("data-title")) ||
                  (img && img.getAttribute("data-title")) ||
                  (img && (img.getAttribute("alt") || "").trim()) ||
                  defaultTitle;

      // Collect existing content and move it into the body
      var body = document.createElement("div");
      body.className = "ps-win-body " + (img ? "ps-win-body--media" : "ps-win-body--text");
      while (container.firstChild) {
        body.appendChild(container.firstChild);
      }

      container.classList.add("ps-win-frame", "ps-win--" + type);

      // Build the title bar
      var bar = document.createElement("div");
      bar.className = "ps-win-bar";

      var dots = '<span class="ps-win-dots"><i></i><i></i><i></i></span>';

      if (type === "editor") {
        // A single file tab (icon + filename + modified dot + close)
        bar.innerHTML =
          dots +
          '<div class="ps-win-tab">' +
            '<span class="ps-win-title-icon">' + WICON.editor + '</span>' +
            '<span class="ps-win-title-text"></span>' +
            '<span class="ps-win-dot" aria-hidden="true"></span>' +
            '<span class="ps-win-tabclose" aria-hidden="true">' + WICON.close + '</span>' +
          '</div>' +
          '<span class="ps-win-spacer"></span>';
        bar.querySelector(".ps-win-title-text").textContent = title;
        bar.querySelector(".ps-win-dot").style.background = extColor(title);
      } else {
        // Centered title for image viewer + shell
        bar.innerHTML =
          dots +
          '<span class="ps-win-title">' +
            '<span class="ps-win-title-icon">' + WICON[type] + '</span>' +
            '<span class="ps-win-title-text"></span>' +
          '</span>' +
          '<span class="ps-win-spacer"></span>';
        bar.querySelector(".ps-win-title-text").textContent = title;
      }

      container.appendChild(bar);
      container.appendChild(body);
    });
  }

  /* --------------------------------------------------------------------------
   * Auto Code Windows
   * Automatically wraps fenced code blocks in window chrome based on language,
   * so you don't have to wrap them by hand. Shell-ish languages get a terminal
   * window; everything else gets an editor window. Native syntax highlighting,
   * the copy button, and line numbers are preserved.
   * Opt out per block (or a region) with class `.ps-noframe` / `.no-window`.
   * Skips code inside manual window wrappers, admonitions, and tabbed blocks.
   * -------------------------------------------------------------------------- */
  function initCodeWindows() {
    var blocks = document.querySelectorAll(".md-typeset div.highlight:not([data-psb-done])");
    if (!blocks.length) return;

    var shellLangs = {
      shell: 1, bash: 1, sh: 1, console: 1, "shell-session": 1, "sh-session": 1,
      zsh: 1, fish: 1, ps: 1, ps1: 1, powershell: 1, pwsh: 1, cmd: 1, bat: 1,
      dos: 1, text: 1, output: 1
    };
    var labelMap = {
      ps: "powershell", ps1: "powershell", pwsh: "powershell",
      "shell-session": "shell", "sh-session": "shell", js: "javascript"
    };

    var ICN = {
      shell:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>',
      editor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>'
    };

    blocks.forEach(function (hl) {
      hl.setAttribute("data-psb-done", "1");

      // Skip code already inside a manual wrapper, opt-outs, admonitions, tabs
      if (hl.closest && hl.closest(".ps-win-frame, .ps-browser-frame, .ps-codewin, .ps-noframe, .no-window, .admonition, .tabbed-content")) return;
      // Skip mermaid diagrams
      if (hl.classList.contains("mermaid") || hl.querySelector(".mermaid")) return;

      var m = hl.className.match(/language-([a-z0-9_-]+)/i);
      var lang = m ? m[1].toLowerCase() : "";
      var isShell = !!shellLangs[lang];
      var type = isShell ? "shell" : "editor";

      // Title: an explicit fence title (.filename), else a friendly language name
      var title, fnEl = hl.querySelector(".filename");
      if (fnEl && fnEl.textContent.trim()) {
        title = fnEl.textContent.trim();
        fnEl.parentNode.removeChild(fnEl);
      } else {
        title = labelMap[lang] || lang || (isShell ? "terminal" : "code");
      }
      var badge = (labelMap[lang] || lang || "").toUpperCase();

      var win = document.createElement("div");
      win.className = "ps-codewin ps-codewin--" + type;

      var bar = document.createElement("div");
      bar.className = "ps-codewin-bar";
      bar.innerHTML =
        '<span class="ps-win-dots"><i></i><i></i><i></i></span>' +
        '<span class="ps-codewin-title">' +
          '<span class="ps-codewin-icon">' + ICN[type] + '</span>' +
          '<span class="ps-codewin-name"></span>' +
        '</span>' +
        (badge ? '<span class="ps-codewin-lang"></span>' : '');
      bar.querySelector(".ps-codewin-name").textContent = title;
      if (badge) bar.querySelector(".ps-codewin-lang").textContent = badge;

      hl.parentNode.insertBefore(win, hl);
      win.appendChild(bar);
      win.appendChild(hl);
    });
  }

  /* --------------------------------------------------------------------------
   * Auto Media Frames
   * Turns plain content images into window frames WITHOUT a wrapper div, using
   * native markdown image syntax. The frame type comes from the image title:
   *   ![alt](shot.png)                          -> image viewer (default)
   *   ![alt](shot.png "http://SERVER_IP:PORT/")  -> browser window (title = URL)
   *   ![alt](shot.png "browser:http://host/")    -> browser window
   *   ![alt](shot.png "shell:kali@kali: ~")      -> terminal window
   *   ![alt](shot.png "editor:exploit.py")       -> editor window
   *   ![alt](shot.png "image:custom title")      -> image viewer w/ explicit title
   * It only creates the wrapper markup; initBrowserFrames()/initWindowFrames()
   * (which run right after) do the actual chrome building.
   * Skips: linked images, inline images, banners, and component/opt-out regions.
   * -------------------------------------------------------------------------- */
  function initAutoMedia() {
    var imgs = document.querySelectorAll(".md-content .md-typeset p > img:not([data-psb-auto])");
    if (!imgs.length) return;

    function baseName(src) {
      var s = String(src).split(/[?#]/)[0];
      var parts = s.split("/");
      return decodeURIComponent(parts[parts.length - 1] || "image");
    }

    imgs.forEach(function (img) {
      img.setAttribute("data-psb-auto", "1");

      // Skip manual wrappers, opt-outs, links, tables, figures
      if (img.closest(".ps-browser, .ps-image, .ps-shell, .ps-editor, .ps-win-frame, .ps-browser-frame, .ps-noframe, .no-window, a, table, figure")) return;

      var p = img.parentNode;
      if (!p || p.tagName !== "P") return;

      // Skip inline images (paragraph also contains text)
      if (p.textContent.replace(/\s+/g, "").length > 0) return;

      var alt = (img.getAttribute("alt") || "").trim();
      // Skip hero/banner images — they read better full-bleed, unframed
      if (/banner/i.test(alt)) return;

      var t = (img.getAttribute("title") || "").trim();
      var cls = "ps-image", url = null, dataTitle = null;

      if (/^https?:\/\//i.test(t)) {
        cls = "ps-browser"; url = t;
      } else if (/^browser:/i.test(t)) {
        cls = "ps-browser"; url = t.replace(/^browser:/i, "").trim();
      } else if (/^shell:/i.test(t)) {
        cls = "ps-shell"; dataTitle = t.replace(/^shell:/i, "").trim() || null;
      } else if (/^editor:/i.test(t)) {
        cls = "ps-editor"; dataTitle = t.replace(/^editor:/i, "").trim() || null;
      } else if (/^image:/i.test(t)) {
        cls = "ps-image"; dataTitle = t.replace(/^image:/i, "").trim() || null;
      } else {
        // Default: image viewer. Title = explicit title, else alt, else filename.
        cls = "ps-image";
        dataTitle = t || alt || baseName(img.getAttribute("src"));
      }

      // Remove the title attr so it doesn't also show as a hover tooltip
      img.removeAttribute("title");

      var wrap = document.createElement("div");
      wrap.className = cls;
      if (url) wrap.setAttribute("data-url", url);
      if (dataTitle) wrap.setAttribute("data-title", dataTitle);

      p.parentNode.insertBefore(wrap, p);
      wrap.appendChild(img);

      // Drop the (now image-less) paragraph
      if (!p.querySelector("img") && p.textContent.replace(/\s+/g, "").length === 0) {
        p.parentNode.removeChild(p);
      }
    });
  }

  /* --------------------------------------------------------------------------
   * Image Zoom (lightbox)
   * Click any content image to view it enlarged on a dimmed overlay.
   * Click anywhere / press Esc / hit the × to close.
   * -------------------------------------------------------------------------- */
  function getLightbox() {
    // Build the overlay once and reuse it across pages (survives instant nav)
    var overlay = document.getElementById("ps-lightbox");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "ps-lightbox";
      overlay.className = "ps-lightbox";
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML =
        '<div class="ps-lightbox-stage"></div>' +
        '<button type="button" class="ps-lightbox-close" aria-label="Close (Esc)">&times;</button>';
      document.body.appendChild(overlay);

      var stage = overlay.querySelector(".ps-lightbox-stage");

      // --- State for zoom + pan ---
      overlay._zoomScale = 1;
      overlay._panX = 0;
      overlay._panY = 0;
      var _isPanning = false;
      var _panStartX = 0;
      var _panStartY = 0;
      var _panOriginX = 0;
      var _panOriginY = 0;
      var _didPan = false;

      function applyTransform() {
        stage.style.transform = "translate(" + overlay._panX + "px, " + overlay._panY + "px) scale(" + overlay._zoomScale + ")";
      }

      function resetTransform() {
        overlay._zoomScale = 1;
        overlay._panX = 0;
        overlay._panY = 0;
        stage.style.transform = "";
      }

      var closeLightbox = function () {
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        document.documentElement.style.overflow = "";
        resetTransform();
        setTimeout(function () {
          if (!overlay.classList.contains("is-open")) stage.innerHTML = "";
        }, 260);
      };

      // Close on backdrop click (but not after a pan drag)
      overlay.addEventListener("click", function (e) {
        if (_didPan) { _didPan = false; return; }
        if (e.target === overlay || e.target === stage) closeLightbox();
      });
      overlay.querySelector(".ps-lightbox-close").addEventListener("click", closeLightbox);
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && overlay.classList.contains("is-open")) closeLightbox();
      });

      // --- Scroll-to-zoom ---
      overlay.addEventListener("wheel", function (e) {
        if (!overlay.classList.contains("is-open")) return;
        e.preventDefault();
        var delta = e.deltaY > 0 ? -0.15 : 0.15;
        overlay._zoomScale = Math.min(5, Math.max(0.5, overlay._zoomScale + delta));
        applyTransform();
      }, { passive: false });

      // --- Pan (drag to move) ---
      overlay.addEventListener("mousedown", function (e) {
        if (!overlay.classList.contains("is-open")) return;
        // Only pan with left button, not on close button
        if (e.button !== 0) return;
        if (e.target.closest(".ps-lightbox-close")) return;
        _isPanning = true;
        _didPan = false;
        _panStartX = e.clientX;
        _panStartY = e.clientY;
        _panOriginX = overlay._panX;
        _panOriginY = overlay._panY;
        stage.style.cursor = "grabbing";
        e.preventDefault();
      });

      document.addEventListener("mousemove", function (e) {
        if (!_isPanning) return;
        var dx = e.clientX - _panStartX;
        var dy = e.clientY - _panStartY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) _didPan = true;
        overlay._panX = _panOriginX + dx;
        overlay._panY = _panOriginY + dy;
        applyTransform();
      });

      document.addEventListener("mouseup", function () {
        if (!_isPanning) return;
        _isPanning = false;
        stage.style.cursor = "";
      });

      // --- Touch pan support ---
      overlay.addEventListener("touchstart", function (e) {
        if (!overlay.classList.contains("is-open")) return;
        if (e.touches.length !== 1) return;
        if (e.target.closest(".ps-lightbox-close")) return;
        _isPanning = true;
        _didPan = false;
        _panStartX = e.touches[0].clientX;
        _panStartY = e.touches[0].clientY;
        _panOriginX = overlay._panX;
        _panOriginY = overlay._panY;
      }, { passive: true });

      overlay.addEventListener("touchmove", function (e) {
        if (!_isPanning || e.touches.length !== 1) return;
        var dx = e.touches[0].clientX - _panStartX;
        var dy = e.touches[0].clientY - _panStartY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) _didPan = true;
        overlay._panX = _panOriginX + dx;
        overlay._panY = _panOriginY + dy;
        applyTransform();
        e.preventDefault();
      }, { passive: false });

      overlay.addEventListener("touchend", function () {
        _isPanning = false;
      });

      // --- Double-click to reset view ---
      overlay.addEventListener("dblclick", function (e) {
        if (e.target.closest(".ps-lightbox-close")) return;
        resetTransform();
        applyTransform();
      });

      overlay.__openNode = function (node, stageClass) {
        stage.innerHTML = "";
        stage.className = "ps-lightbox-stage" + (stageClass ? " " + stageClass : "");
        resetTransform();
        stage.appendChild(node);
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
        document.documentElement.style.overflow = "hidden";
      };
    }
    return overlay;
  }

  function initImageZoom() {
    var overlay = getLightbox();

    var imgs = document.querySelectorAll(".md-content .md-typeset img:not([data-ps-zoom])");
    imgs.forEach(function (img) {
      img.setAttribute("data-ps-zoom", "1");
      // Skip icons, emoji, avatars, and linked images
      if (img.classList.contains("twemoji") || img.classList.contains("emojione")) return;
      if (img.closest("a, .md-social, .ps-blog-card-author")) return;

      img.classList.add("ps-zoomable");
      img.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        // If the image lives inside a window frame, zoom the whole frame
        var frame = img.closest(".ps-browser-frame, .ps-win-frame");
        var node;
        if (frame) {
          node = frame.cloneNode(true);
          node.classList.add("ps-lightbox-frame");
          node.removeAttribute("data-psb-done");
        } else {
          node = document.createElement("img");
          node.className = "ps-lightbox-img";
          node.src = img.currentSrc || img.src;
          node.alt = img.alt || "";
        }
        overlay.__openNode(node);
      });
    });
  }

  /* --------------------------------------------------------------------------
   * Diagram Zoom — make rendered Mermaid diagrams zoomable like images.
   * Material renders Mermaid SVGs into a CLOSED shadow DOM, so we can't clone
   * the SVG directly. Source is captured early (saveMermaidSources), and a
   * MutationObserver + this fallback poll ensures all diagrams get zoom.
   * On click, re-renders the diagram into the lightbox via mermaid.render().
   * -------------------------------------------------------------------------- */

  function initDiagramZoom() {
    getLightbox(); // ensure overlay exists

    var diagrams = document.querySelectorAll(
      ".md-content .md-typeset .mermaid:not([data-ps-zoom])"
    );
    diagrams.forEach(function (el) {
      attachDiagramZoom(el);
    });
  }

  /* --------------------------------------------------------------------------
   * Layout Toggles — collapse the left navigation and/or the right TOC
   * Adds slim arrow tabs on the page edges. State persists in localStorage.
   * -------------------------------------------------------------------------- */
  function initLayoutToggles() {
    var chevL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
    var chevR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';

    // Restore persisted state
    if (localStorage.getItem("ps-nav-collapsed") === "1") document.body.classList.add("ps-nav-collapsed");
    if (localStorage.getItem("ps-toc-collapsed") === "1") document.body.classList.add("ps-toc-collapsed");

    function ensureBtn(id, cls, html, key, clsName) {
      var btn = document.getElementById(id);
      if (!btn) {
        btn = document.createElement("button");
        btn.id = id;
        btn.type = "button";
        btn.className = "ps-layout-toggle " + cls;
        btn.innerHTML = html;
        btn.addEventListener("click", function () {
          var on = document.body.classList.toggle(clsName);
          localStorage.setItem(key, on ? "1" : "0");
        });
        document.body.appendChild(btn);
      }
      return btn;
    }

    var navBtn = ensureBtn("ps-nav-toggle", "ps-layout-toggle--nav", chevL, "ps-nav-collapsed", "ps-nav-collapsed");
    navBtn.setAttribute("aria-label", "Toggle navigation sidebar");
    var tocBtn = ensureBtn("ps-toc-toggle", "ps-layout-toggle--toc", chevR, "ps-toc-collapsed", "ps-toc-collapsed");
    tocBtn.setAttribute("aria-label", "Toggle table of contents");

    // Show a toggle only when its sidebar actually exists on this page
    var hasNav = !!document.querySelector(".md-sidebar--primary .md-nav__list");
    var tocEl = document.querySelector(".md-sidebar--secondary .md-nav--secondary .md-nav__link");
    var hasToc = !!tocEl;

    navBtn.style.display = hasNav ? "" : "none";
    tocBtn.style.display = hasToc ? "" : "none";
  }

  /* --------------------------------------------------------------------------
   * Reading Settings — let users pick the body font + text size
   * Applied via Material's --md-text-font-family (code stays monospace) and a
   * --ps-reading-scale multiplier. Persists in localStorage.
   * -------------------------------------------------------------------------- */
  function initReadingSettings() {
    var SIZES = { sm: 0.9, md: 1, lg: 1.12, xl: 1.28 };
    var root = document.documentElement;

    var curFont = localStorage.getItem("ps-font") || "mono";
    var curSize = localStorage.getItem("ps-size") || "md";

    function applyFont(key) {
      root.classList.remove("ps-font-mono", "ps-font-sans", "ps-font-serif");
      root.classList.add("ps-font-" + key);
    }
    function applySize(key) {
      root.style.setProperty("--ps-reading-scale", SIZES[key] || 1);
    }
    applyFont(curFont);
    applySize(curSize);

    // Build the UI once; it persists across instant navigation
    if (document.getElementById("ps-reading-fab")) return;

    var fab = document.createElement("button");
    fab.id = "ps-reading-fab";
    fab.type = "button";
    fab.className = "ps-reading-fab";
    fab.setAttribute("aria-label", "Reading settings");
    fab.innerHTML = "Aa";

    var panel = document.createElement("div");
    panel.id = "ps-reading-panel";
    panel.className = "ps-reading-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Reading settings");
    panel.innerHTML =
      '<div class="ps-reading-title">Reading</div>' +
      '<div class="ps-reading-group">' +
        '<div class="ps-reading-label">Font</div>' +
        '<div class="ps-reading-chips">' +
          '<button type="button" class="ps-reading-chip" data-font="mono">Mono</button>' +
          '<button type="button" class="ps-reading-chip" data-font="sans">Sans</button>' +
          '<button type="button" class="ps-reading-chip" data-font="serif">Serif</button>' +
        '</div>' +
      '</div>' +
      '<div class="ps-reading-group">' +
        '<div class="ps-reading-label">Size</div>' +
        '<div class="ps-reading-chips">' +
          '<button type="button" class="ps-reading-chip" data-size="sm">S</button>' +
          '<button type="button" class="ps-reading-chip" data-size="md">M</button>' +
          '<button type="button" class="ps-reading-chip" data-size="lg">L</button>' +
          '<button type="button" class="ps-reading-chip" data-size="xl">XL</button>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="ps-reading-reset">Reset to default</button>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    function markActive() {
      panel.querySelectorAll("[data-font]").forEach(function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-font") === curFont);
      });
      panel.querySelectorAll("[data-size]").forEach(function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-size") === curSize);
      });
    }
    markActive();

    fab.addEventListener("click", function (e) {
      e.stopPropagation();
      panel.classList.toggle("is-open");
    });
    panel.addEventListener("click", function (e) { e.stopPropagation(); });
    document.addEventListener("click", function () { panel.classList.remove("is-open"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") panel.classList.remove("is-open");
    });

    panel.querySelectorAll("[data-font]").forEach(function (b) {
      b.addEventListener("click", function () {
        curFont = b.getAttribute("data-font");
        localStorage.setItem("ps-font", curFont);
        applyFont(curFont);
        markActive();
      });
    });
    panel.querySelectorAll("[data-size]").forEach(function (b) {
      b.addEventListener("click", function () {
        curSize = b.getAttribute("data-size");
        localStorage.setItem("ps-size", curSize);
        applySize(curSize);
        markActive();
      });
    });
    panel.querySelector(".ps-reading-reset").addEventListener("click", function () {
      curFont = "mono"; curSize = "md";
      localStorage.setItem("ps-font", "mono");
      localStorage.setItem("ps-size", "md");
      applyFont("mono"); applySize("md"); markActive();
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
    initCounters();
    initScrollIndicator();
    initQuoteCarousel();
  }

  /* --------------------------------------------------------------------------
   * Blog Pagination
   * Handles "Load More" logic for the blog index grid
   * -------------------------------------------------------------------------- */
  function initBlogPagination() {
    var loadMoreBtn = document.getElementById("ps-load-more-btn");
    var loadMoreContainer = document.querySelector(".ps-blog-load-more-container");
    
    if (!loadMoreBtn) return;
    
    loadMoreBtn.addEventListener("click", function() {
      // Find all currently hidden posts
      var hiddenPosts = document.querySelectorAll(".ps-blog-card.is-hidden");
      
      // Reveal the next 9
      var limit = Math.min(hiddenPosts.length, 9);
      for (var i = 0; i < limit; i++) {
        hiddenPosts[i].classList.remove("is-hidden");
        hiddenPosts[i].style.display = "flex";
      }
      
      // If no more hidden posts remain, hide the container
      if (hiddenPosts.length <= 9) {
        if (loadMoreContainer) {
          loadMoreContainer.style.display = "none";
        }
      }
    });
  }

  /* --------------------------------------------------------------------------
   * Archive Toggle
   * Handles expanding/collapsing the blog archive years
   * -------------------------------------------------------------------------- */
  function initArchiveToggle() {
    var headers = document.querySelectorAll(".ps-archive-year-header");
    if (!headers.length) return;

    headers.forEach(function(header) {
      header.addEventListener("click", function() {
        var year = this.getAttribute("data-year");
        var content = document.getElementById("archive-" + year);
        var toggleSpan = this.querySelector(".ps-archive-toggle");
        
        if (content) {
          if (content.classList.contains("is-hidden")) {
            content.classList.remove("is-hidden");
            if (toggleSpan) toggleSpan.textContent = "[-]";
          } else {
            content.classList.add("is-hidden");
            if (toggleSpan) toggleSpan.textContent = "[+]";
          }
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
   * Tag Filtering
   * Handles filtering the blog index by tags
   * -------------------------------------------------------------------------- */
  function initTagFilter() {
    var filterBtns = document.querySelectorAll(".ps-tag-filter");
    var cards = document.querySelectorAll(".ps-blog-card");
    var loadMoreContainer = document.querySelector(".ps-blog-load-more-container");
    var emptyEl = document.getElementById("ps-blog-empty");
    
    if (!filterBtns.length || !cards.length) return;

    filterBtns.forEach(function(btn) {
      btn.addEventListener("click", function() {
        // Remove active class from all
        filterBtns.forEach(function(b) { b.classList.remove("ps-tag-active"); });
        // Add active class to clicked
        this.classList.add("ps-tag-active");
        
        var selectedTag = this.getAttribute("data-tag");
        var visibleCount = 0;

        cards.forEach(function(card) {
          var cardTags = card.getAttribute("data-tags");
          if (!cardTags) cardTags = "";
          var tagsArray = cardTags.split(",");

          // Reset pagination hidden class
          card.classList.remove("is-hidden");

          if (selectedTag === "all" || tagsArray.includes(selectedTag)) {
            if (visibleCount < 9) {
              card.style.display = "flex";
            } else {
              card.style.display = "none";
              card.classList.add("is-hidden"); // Re-apply for load more
            }
            visibleCount++;
          } else {
            card.style.display = "none";
          }
        });

        // Hide/Show load more container
        if (loadMoreContainer) {
          if (visibleCount > 9) {
            loadMoreContainer.style.display = "block";
          } else {
            loadMoreContainer.style.display = "none";
          }
        }

        // Show empty-state message when nothing matches
        if (emptyEl) {
          emptyEl.style.display = visibleCount === 0 ? "block" : "none";
        }
      });
    });
  }

  // Global scripts (run on all pages including About/Resume)
  initGlitchEffect();
  initCardGlow();
  initInteractiveTerminal();
  initBlogPagination();
  initArchiveToggle();
  initTagFilter();
  initAutoMedia();
  initBrowserFrames();
  initWindowFrames();
  initCodeWindows();
  initImageZoom();
  // Mermaid renders asynchronously into a closed shadow DOM — wait for processing
  setTimeout(initDiagramZoom, 800);
  setTimeout(initDiagramZoom, 2500);
  initLayoutToggles();
  initReadingSettings();

  // Delay scroll reveal slightly so initial view state is set
  setTimeout(initScrollReveal, 100);
}

// Support for MkDocs Material Instant Navigation
// _mermaidSources is populated by an inline <script> in main.html BEFORE the bundle loads.
// This ensures we capture mermaid source text from <pre class="mermaid"> elements before
// Material's bundle removes the class and replaces them with closed-shadow-DOM divs.
// For instant navigation (document$), we re-capture since new page content loads.
function saveMermaidSources() {
  if (typeof _mermaidSources === "undefined") window._mermaidSources = [];
  _mermaidSources.length = 0;
  var pres = document.querySelectorAll("pre.mermaid");
  for (var i = 0; i < pres.length; i++) {
    var code = pres[i].querySelector("code");
    var src = code ? (code.textContent || "").trim() : (pres[i].textContent || "").trim();
    if (src) _mermaidSources.push(src);
  }
}

// Also observe for Material's mermaid replacement (handles all timing issues)
var _mermaidObserver = null;
function startMermaidObserver() {
  if (_mermaidObserver) return;
  var content = document.querySelector(".md-content");
  if (!content) return;

  // Track sources from removed <pre> nodes (Material removes the pre synchronously
  // but the textContent is still readable in the removed node)
  var _observedSources = [];

  _mermaidObserver = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var mut = mutations[i];

      // Capture text from removed <pre> nodes (Material replaces pre with div)
      var removed = mut.removedNodes;
      for (var k = 0; k < removed.length; k++) {
        var rn = removed[k];
        if (rn.nodeType === 1 && rn.tagName === "PRE") {
          var code = rn.querySelector("code");
          var txt = code ? (code.textContent || "").trim() : (rn.textContent || "").trim();
          if (txt && txt.length > 5) _observedSources.push(txt);
        }
      }

      // Attach zoom to new .mermaid divs
      var added = mut.addedNodes;
      for (var j = 0; j < added.length; j++) {
        var node = added[j];
        if (node.nodeType === 1 && node.classList && node.classList.contains("mermaid") && node.tagName === "DIV" && !node.hasAttribute("data-ps-zoom")) {
          // Use _observedSources (captured from the removed pre in the same mutation batch)
          // or fall back to global _mermaidSources
          var srcList = _observedSources.length > 0 ? _observedSources : _mermaidSources;
          var all = document.querySelectorAll(".md-content .md-typeset .mermaid[data-ps-zoom]");
          var idx = all.length; // this will be the next index (before we mark it)
          var src = (idx < srcList.length) ? srcList[idx] : null;
          if (src) node.setAttribute("data-ps-src", src);
          attachDiagramZoom(node);
        }
      }
    }
  });
  _mermaidObserver.observe(content, { childList: true, subtree: true });
}

function attachDiagramZoom(el) {
  // Ensure the lightbox overlay exists (creates it if not yet built)
  var overlay = document.getElementById("ps-lightbox");
  if (!overlay || !overlay.__openNode) {
    // Lightbox not ready yet — defer until initPurpleSecJS creates it
    setTimeout(function () { attachDiagramZoom(el); }, 500);
    return;
  }

  el.setAttribute("data-ps-zoom", "1");

  // Find source: check data attr first, then use saved sources by counting existing zoomed diagrams
  var src = el.getAttribute("data-ps-src");
  if (!src) {
    // Count how many .mermaid[data-ps-zoom] exist BEFORE this one in document order
    var all = document.querySelectorAll(".md-content .md-typeset .mermaid[data-ps-zoom]");
    var idx = -1;
    for (var i = 0; i < all.length; i++) {
      if (all[i] === el) { idx = i; break; }
    }
    if (idx >= 0 && idx < _mermaidSources.length) {
      src = _mermaidSources[idx];
    }
  }

  if (!src) return;
  el.setAttribute("data-ps-src", src);
  el.classList.add("ps-zoomable");
  el.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    renderMermaidToLightbox(el.getAttribute("data-ps-src"), overlay);
  });
}

function renderMermaidToLightbox(src, overlay) {
  if (!src || typeof mermaid === "undefined" || !mermaid.render) return;

  var id = "__ps_mermaid_zoom_" + Date.now();
  var container = document.createElement("div");
  container.className = "ps-lightbox-mermaid";

  // We render using Material's existing mermaid config (themeCSS with --md-mermaid-* vars).
  // Those CSS vars are defined on the page and auto-switch with the color scheme,
  // so the diagram will have correct colors in both dark and light mode.

  try {
    var result = mermaid.render(id, src);
    if (result && typeof result.then === "function") {
      result.then(function (res) {
        container.innerHTML = res.svg || res;
        patchMermaidSvg(container);
        scaleMermaidSvg(container);
        overlay.__openNode(container, "ps-lightbox-stage--diagram");
        cleanupMermaidArtifact(id);
      }).catch(function () {
        showMermaidFallback(container, src, overlay);
        cleanupMermaidArtifact(id);
      });
    } else {
      container.innerHTML = result.svg || result;
      patchMermaidSvg(container);
      scaleMermaidSvg(container);
      overlay.__openNode(container, "ps-lightbox-stage--diagram");
      cleanupMermaidArtifact(id);
    }
  } catch (err) {
    showMermaidFallback(container, src, overlay);
    cleanupMermaidArtifact(id);
  }
}

// Material renders mermaid inside a closed shadow DOM, so its themeCSS
// uses --md-mermaid-* vars that resolve from the host page. When we render
// outside a shadow DOM (in the lightbox), the SVG inherits from the page
// and those vars work directly. But mermaid v11 wraps styles inside the SVG
// in a <style> tag — if Material's themeCSS wasn't applied (because mermaid
// was re-initialized elsewhere), we inject a fallback <style> that maps
// node colors to the page's CSS vars.
function patchMermaidSvg(container) {
  var svg = container.querySelector("svg");
  if (!svg) return;
  // Check if the SVG already has Material's themeCSS (look for --md-mermaid)
  var existingStyle = svg.querySelector("style");
  if (existingStyle && existingStyle.textContent.indexOf("--md-mermaid") !== -1) return;

  // Inject fallback CSS that maps to Material's mermaid vars
  var style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent =
    ".node circle, .node ellipse, .node path, .node polygon, .node rect { fill: var(--md-mermaid-node-bg-color); stroke: var(--md-mermaid-node-fg-color); }" +
    "marker { fill: var(--md-mermaid-edge-color) !important; }" +
    ".edgeLabel .label rect { fill: transparent; }" +
    ".label, .edgeLabel, .edgeLabel p, .label div .edgeLabel { color: var(--md-mermaid-label-fg-color); font-family: var(--md-mermaid-font-family); }" +
    ".flowchartTitleText { fill: var(--md-mermaid-label-fg-color); }" +
    "text { fill: var(--md-mermaid-label-fg-color); font-family: var(--md-mermaid-font-family); }" +
    ".edgePath .path { stroke: var(--md-mermaid-edge-color); }" +
    ".cluster rect { fill: var(--md-mermaid-node-bg-color); stroke: var(--md-mermaid-node-fg-color); }" +
    ".actor { fill: var(--md-mermaid-sequence-actor-bg-color); stroke: var(--md-mermaid-sequence-actor-border-color); }" +
    "text.actor > tspan { fill: var(--md-mermaid-sequence-actor-fg-color); }" +
    ".actor-line { stroke: var(--md-mermaid-sequence-actor-line-color); }" +
    ".messageLine0, .messageLine1 { stroke: var(--md-mermaid-edge-color); }" +
    ".messageText { fill: var(--md-mermaid-edge-color); font-family: var(--md-mermaid-font-family); }" +
    ".labelBox { fill: var(--md-mermaid-sequence-label-bg-color); stroke: var(--md-mermaid-sequence-label-fg-color); }" +
    ".labelText, .labelText > tspan { fill: var(--md-mermaid-sequence-label-fg-color); }" +
    ".loopText, .loopText > tspan { fill: var(--md-mermaid-sequence-loop-fg-color); }" +
    ".loopLine { stroke: var(--md-mermaid-sequence-loop-fg-color); }" +
    ".note { fill: var(--md-mermaid-note-bg-color); stroke: var(--md-mermaid-note-border-color); }" +
    ".noteText, .noteText > tspan { fill: var(--md-mermaid-note-fg-color); }" +
    "#arrowhead path { fill: var(--md-mermaid-edge-color); stroke: var(--md-mermaid-edge-color); }";
  svg.insertBefore(style, svg.firstChild);
}

function scaleMermaidSvg(container) {
  var svg = container.querySelector("svg");
  if (svg) {
    svg.removeAttribute("id");
    svg.classList.add("ps-lightbox-svg");
    svg.removeAttribute("width");
    svg.style.maxWidth = "100%";
    svg.style.maxHeight = "86vh";
    svg.style.height = "auto";
    svg.style.width = "100%";
  }
}

function showMermaidFallback(container, src, overlay) {
  container.textContent = src;
  container.style.whiteSpace = "pre-wrap";
  container.style.padding = "2rem";
  container.style.fontFamily = "var(--md-code-font)";
  overlay.__openNode(container, "ps-lightbox-stage--diagram");
}

function cleanupMermaidArtifact(id) {
  var stale = document.getElementById(id);
  if (stale) stale.remove();
}

if (typeof document$ !== "undefined") {
  document$.subscribe(function() {
    saveMermaidSources(); // Also capture for instant-nav page transitions
    startMermaidObserver(); // Start watching BEFORE init so we catch Material's replacements
    initPurpleSecJS();
  });
} else {
  document.addEventListener("DOMContentLoaded", function () {
    initPurpleSecJS();
  });
}
