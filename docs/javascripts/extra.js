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

      // Tab title acts like a real browser tab = the PAGE title, not the URL.
      // Priority: explicit data-title, else the image alt text, else "New Tab".
      var title = (el.getAttribute && el.getAttribute("data-title")) ||
                  img.getAttribute("data-title") ||
                  (img.getAttribute("alt") || "").trim() ||
                  "New Tab";

      var viewport = document.createElement("div");
      viewport.className = "ps-browser-viewport";

      container.appendChild(buildBar(url, title));
      container.appendChild(viewport);
      viewport.appendChild(img);
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
  initBrowserFrames();

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
