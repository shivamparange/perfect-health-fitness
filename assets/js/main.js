(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (selector, context) {
    return (context || document).querySelector(selector);
  };
  var $$ = function (selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  };

  var header = $("#site-header");
  var progress = $("#scroll-progress");
  var navLinks = $$("[data-nav]");
  var sectionIds = ["home", "facilities", "programs", "reviews", "contact"];
  var sections = sectionIds.map(function (id) {
    return document.getElementById(id);
  }).filter(Boolean);
  var ticking = false;

  function updateScrollUi() {
    var scrollY = window.scrollY || window.pageYOffset;
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    if (header) {
      header.classList.toggle("is-scrolled", scrollY > 14);
    }

    if (progress) {
      var ratio = maxScroll > 0 ? scrollY / maxScroll : 0;
      progress.style.transform = "scaleX(" + Math.min(Math.max(ratio, 0), 1) + ")";
    }

    var current = "home";
    sections.forEach(function (section) {
      if (scrollY >= section.offsetTop - 180) {
        current = section.id;
      }
    });

    navLinks.forEach(function (link) {
      var isActive = link.getAttribute("href") === "#" + current;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function requestScrollUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateScrollUi();
      ticking = false;
    });
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  updateScrollUi();

  var menu = $("#mobile-menu");
  var menuToggle = $("#menu-toggle");
  var menuCloseTargets = $$("[data-menu-close]");
  var lastFocused = null;

  function openMenu() {
    if (!menu || !menuToggle) return;
    lastFocused = document.activeElement;
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close navigation menu");
    document.body.style.overflow = "hidden";
    var firstLink = $(".mobile-link", menu);
    if (firstLink) {
      window.setTimeout(function () {
        firstLink.focus();
      }, 160);
    }
  }

  function closeMenu(returnFocus) {
    if (!menu || !menuToggle) return;
    var wasOpen = menu.classList.contains("is-open");
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    document.body.style.overflow = "";
    if (returnFocus && wasOpen && lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      if (menu.classList.contains("is-open")) {
        closeMenu(true);
      } else {
        openMenu();
      }
    });
  }

  menuCloseTargets.forEach(function (target) {
    target.addEventListener("click", function () {
      closeMenu(false);
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menu && menu.classList.contains("is-open")) {
      closeMenu(true);
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 1024) {
      closeMenu(false);
    }
  });

  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var hash = link.getAttribute("href");
      if (!hash || hash === "#") return;

      var target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();

      if (menu && menu.classList.contains("is-open")) {
        closeMenu(false);
      }

      var headerOffset = header ? header.getBoundingClientRect().bottom + 20 : 104;
      var targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: reduceMotion ? "auto" : "smooth"
      });

      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", hash);
      } else {
        window.location.hash = hash;
      }
    });
  });

  var revealElements = $$("[data-reveal]");

  if (reduceMotion) {
    revealElements.forEach(function (element) {
      element.classList.add("is-revealed");
    });
  } else if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealElements.forEach(function (element) {
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach(function (element) {
      element.classList.add("is-revealed");
    });
  }

  var counters = $$("[data-counter]");

  function runCounter(element) {
    var target = parseFloat(element.getAttribute("data-counter"));
    var decimals = parseInt(element.getAttribute("data-decimals") || "0", 10);

    if (reduceMotion || isNaN(target)) {
      element.textContent = isNaN(target) ? element.textContent : target.toFixed(decimals);
      return;
    }

    var duration = 1500;
    var start = null;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progressValue = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progressValue, 3);
      element.textContent = (target * eased).toFixed(decimals);
      if (progressValue < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = target.toFixed(decimals);
      }
    }

    window.requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (counter) {
      counterObserver.observe(counter);
    });
  } else {
    counters.forEach(runCounter);
  }

  var tabs = $$('[role="tab"]');
  var panels = $$('[role="tabpanel"]');

  function selectTab(tab, moveFocus) {
    if (!tab) return;

    tabs.forEach(function (item) {
      var selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });

    panels.forEach(function (panel) {
      var shouldShow = panel.id === tab.getAttribute("aria-controls");
      panel.hidden = !shouldShow;
      if (shouldShow) {
        panel.classList.remove("is-entering");
        void panel.offsetWidth;
        panel.classList.add("is-entering");
      }
    });

    if (moveFocus) {
      tab.focus();
    }
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      selectTab(tab, false);
    });

    tab.addEventListener("keydown", function (event) {
      var nextIndex = null;

      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        selectTab(tabs[nextIndex], true);
      }
    });
  });

  var hoursRows = $$(".hours-row");
  var openPills = $$("[data-open-pill]");
  var openStatusLabels = $$("[data-open-status]");

  function getIndiaTime() {
    try {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).formatToParts(new Date());
      var lookup = {};
      parts.forEach(function (part) {
        lookup[part.type] = part.value;
      });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return {
        day: days[lookup.weekday],
        hour: parseInt(lookup.hour, 10) % 24,
        minute: parseInt(lookup.minute, 10)
      };
    } catch (error) {
      var now = new Date();
      return { day: now.getDay(), hour: now.getHours(), minute: now.getMinutes() };
    }
  }

  function updateOpenStatus() {
    var time = getIndiaTime();
    var minutes = time.hour * 60 + time.minute;
    var isOpen = time.day !== 0 && minutes >= 6 * 60 && minutes < 22 * 60;

    openPills.forEach(function (pill) {
      pill.classList.toggle("is-open", isOpen);
      pill.classList.toggle("is-closed", !isOpen);
    });

    openStatusLabels.forEach(function (label) {
      label.textContent = isOpen ? "Open now" : "Closed now";
    });

    hoursRows.forEach(function (row) {
      var rowDays = (row.getAttribute("data-day") || "").split(",").map(Number);
      row.classList.toggle("is-today", rowDays.indexOf(time.day) !== -1);
    });
  }

  updateOpenStatus();
  window.setInterval(updateOpenStatus, 60000);

  var form = $("#inquiry-form");
  var successPanel = $("#form-success");

  if (form && successPanel) {
    var nameInput = $("#inquiry-name");
    var phoneInput = $("#inquiry-phone");
    var goalInput = $("#inquiry-goal");
    var waContinue = $("#wa-continue");
    var resetButton = $("#form-reset");
    var formFields = [nameInput, phoneInput, goalInput];

    function getErrorElement(input) {
      var field = input.closest("[data-field]");
      return field ? field.querySelector("[data-error]") : null;
    }

    function setFieldError(input, message) {
      input.classList.add("field-invalid");
      input.setAttribute("aria-invalid", "true");
      var errorElement = getErrorElement(input);
      if (errorElement) errorElement.textContent = message;
    }

    function clearFieldError(input) {
      input.classList.remove("field-invalid");
      input.removeAttribute("aria-invalid");
      var errorElement = getErrorElement(input);
      if (errorElement) errorElement.textContent = "";
    }

    formFields.forEach(function (input) {
      var eventName = input.tagName === "SELECT" ? "change" : "input";
      input.addEventListener(eventName, function () {
        clearFieldError(input);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      formFields.forEach(clearFieldError);

      var name = (nameInput.value || "").trim();
      var phone = (phoneInput.value || "").trim();
      var goal = goalInput.value;
      var digits = phone.replace(/\D/g, "");
      var firstInvalid = null;

      if (name.length < 2) {
        setFieldError(nameInput, "Please enter your full name.");
        firstInvalid = firstInvalid || nameInput;
      }

      var validPhone = digits.length === 10 ||
        (digits.length === 12 && digits.indexOf("91") === 0) ||
        (digits.length === 11 && digits.indexOf("0") === 0);

      if (!validPhone) {
        setFieldError(phoneInput, "Enter a valid 10-digit mobile number.");
        firstInvalid = firstInvalid || phoneInput;
      }

      if (!goal) {
        setFieldError(goalInput, "Please select your fitness goal.");
        firstInvalid = firstInvalid || goalInput;
      }

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      var message = "Hi! I want to check membership details and claim a free trial pass.\n\n" +
        "Name: " + name + "\n" +
        "Phone: " + phone + "\n" +
        "Fitness goal: " + goal;
      var whatsappUrl = "https://wa.me/917768879921?text=" + encodeURIComponent(message);

      waContinue.setAttribute("href", whatsappUrl);

      try {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      } catch (error) {
        /* The success panel provides a direct WhatsApp link as a fallback. */
      }

      form.hidden = true;
      form.setAttribute("aria-hidden", "true");
      successPanel.hidden = false;
      successPanel.classList.add("is-entering");
      successPanel.focus({ preventScroll: true });

      window.requestAnimationFrame(function () {
        var top = successPanel.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({
          top: top,
          behavior: reduceMotion ? "auto" : "smooth"
        });
      });
    });

    if (resetButton) {
      resetButton.addEventListener("click", function () {
        form.reset();
        formFields.forEach(clearFieldError);
        successPanel.hidden = true;
        successPanel.classList.remove("is-entering");
        form.hidden = false;
        form.removeAttribute("aria-hidden");
        nameInput.focus();
      });
    }
  }

  var yearElement = $("#year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
})();
