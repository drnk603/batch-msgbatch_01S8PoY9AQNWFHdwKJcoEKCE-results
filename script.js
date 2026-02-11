(function() {
  'use strict';

  if (typeof window.__app === 'undefined') {
    window.__app = {};
  }

  var app = window.__app;

  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  function throttle(func, limit) {
    var inThrottle;
    return function() {
      var args = arguments;
      var context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function() {
          inThrottle = false;
        }, limit);
      }
    };
  }

  function initBurgerMenu() {
    if (app.burgerInit) return;
    app.burgerInit = true;

    var toggle = document.querySelector('.navbar-toggler, .c-nav__toggle');
    var navCollapse = document.querySelector('.navbar-collapse, .c-nav__list');
    var navLinks = document.querySelectorAll('.nav-link, .c-nav__link');
    var body = document.body;

    if (!toggle || !navCollapse) return;

    var isOpen = false;
    var focusableElements = [];

    function updateFocusableElements() {
      focusableElements = Array.prototype.slice.call(
        navCollapse.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      );
    }

    function openMenu() {
      isOpen = true;
      navCollapse.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      body.classList.add('u-no-scroll');
      updateFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    function closeMenu() {
      isOpen = false;
      navCollapse.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('u-no-scroll');
    }

    function trapFocus(e) {
      if (!isOpen || focusableElements.length === 0) return;

      var firstElement = focusableElements[0];
      var lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }

    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
        toggle.focus();
      }
      if (e.key === 'Tab' && isOpen) {
        trapFocus(e);
      }
    });

    document.addEventListener('click', function(e) {
      if (isOpen && !toggle.contains(e.target) && !navCollapse.contains(e.target)) {
        closeMenu();
      }
    });

    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', function() {
        if (window.innerWidth < 1024) {
          closeMenu();
        }
      });
    }

    var resizeHandler = debounce(function() {
      if (window.innerWidth >= 1024 && isOpen) {
        closeMenu();
      }
    }, 150);

    window.addEventListener('resize', resizeHandler, { passive: true });
  }

  function initSmoothScroll() {
    if (app.smoothScrollInit) return;
    app.smoothScrollInit = true;

    var header = document.querySelector('.l-header, header');

    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (!target) return;

      var href = target.getAttribute('href');
      if (!href || href === '#' || href === '#!') return;

      if (href.indexOf('#') === 0) {
        e.preventDefault();
        var targetId = href.substring(1);
        var targetElement = document.getElementById(targetId);

        if (targetElement) {
          var headerHeight = header ? header.offsetHeight : 80;
          var elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
          var offsetPosition = elementPosition - headerHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  }

  function initScrollSpy() {
    if (app.scrollSpyInit) return;
    app.scrollSpyInit = true;

    var navLinks = document.querySelectorAll('.nav-link[href^="#"], .c-nav__link[href^="#"]');
    if (navLinks.length === 0) return;

    var sections = [];
    for (var i = 0; i < navLinks.length; i++) {
      var href = navLinks[i].getAttribute('href');
      if (href && href !== '#' && href !== '#!') {
        var section = document.querySelector(href);
        if (section) {
          sections.push({
            link: navLinks[i],
            section: section,
            id: href.substring(1)
          });
        }
      }
    }

    if (sections.length === 0) return;

    var header = document.querySelector('.l-header, header');
    var headerHeight = header ? header.offsetHeight : 80;

    function updateActiveLink() {
      var scrollPosition = window.pageYOffset + headerHeight + 100;

      var currentSection = null;
      for (var i = 0; i < sections.length; i++) {
        var sectionTop = sections[i].section.offsetTop;
        var sectionBottom = sectionTop + sections[i].section.offsetHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          currentSection = sections[i];
          break;
        }
      }

      for (var j = 0; j < sections.length; j++) {
        sections[j].link.classList.remove('active');
        sections[j].link.removeAttribute('aria-current');
      }

      if (currentSection) {
        currentSection.link.classList.add('active');
        currentSection.link.setAttribute('aria-current', 'location');
      }
    }

    var scrollHandler = throttle(updateActiveLink, 100);
    window.addEventListener('scroll', scrollHandler, { passive: true });
    updateActiveLink();
  }

  function initActiveMenuState() {
    if (app.activeMenuInit) return;
    app.activeMenuInit = true;

    var navLinks = document.querySelectorAll('.nav-link, .c-nav__link');
    var currentPath = window.location.pathname;

    if (currentPath === '' || currentPath === '/') {
      currentPath = '/index.html';
    }

    for (var i = 0; i < navLinks.length; i++) {
      var link = navLinks[i];
      var linkPath = link.getAttribute('href');

      if (!linkPath || linkPath.indexOf('#') === 0) continue;

      link.removeAttribute('aria-current');
      link.classList.remove('active');

      if (linkPath === currentPath ||
          (currentPath.indexOf('index.html') !== -1 && linkPath === '/') ||
          (currentPath === '/' && linkPath === '/index.html')) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      }
    }
  }

  function initImages() {
    if (app.imagesInit) return;
    app.imagesInit = true;

    var images = document.querySelectorAll('img');

    function createPlaceholderSVG() {
      return 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#f0f0f0" width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#999">Image not available</text></svg>'
      );
    }

    for (var i = 0; i < images.length; i++) {
      var img = images[i];

      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }

      var hasLoadingAttr = img.hasAttribute('loading');
      var isCritical = img.hasAttribute('data-critical');
      var isLogo = img.classList.contains('c-logo__img');

      if (!hasLoadingAttr && !isCritical && !isLogo) {
        img.setAttribute('loading', 'lazy');
      }

      img.addEventListener('error', function() {
        this.src = createPlaceholderSVG();
        this.style.objectFit = 'contain';

        if (this.classList.contains('c-logo__img')) {
          this.style.maxHeight = '40px';
        }
      });
    }
  }

  function initForms() {
    if (app.formsInit) return;
    app.formsInit = true;

    var contactForm = document.querySelector('.c-form');
    if (!contactForm) return;

    app.notify = function(message, type) {
      var container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.setAttribute('style', 'position:fixed;top:20px;right:20px;z-index:9999;max-width:350px;');
        document.body.appendChild(container);
      }

      var toast = document.createElement('div');
      toast.className = 'alert alert-' + (type || 'info') + ' alert-dismissible fade show';
      toast.setAttribute('role', 'alert');
      toast.innerHTML = message + '<button type="button" class="btn-close" onclick="this.parentElement.remove()" aria-label="Close">&times;</button>';

      container.appendChild(toast);

      setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 150);
      }, 5000);
    };

    function validateEmail(email) {
      var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    }

    function validatePhone(phone) {
      var regex = /^[\+\d\s\(\)\-]{10,20}$/;
      return regex.test(phone);
    }

    function validateName(name) {
      var regex = /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/;
      return regex.test(name);
    }

    function showError(field, message) {
      var errorElement = field.parentElement.querySelector('.c-form__error, .invalid-feedback');
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'c-form__error invalid-feedback';
        field.parentElement.appendChild(errorElement);
      }
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      field.classList.add('is-invalid');
      field.parentElement.classList.add('has-error');
    }

    function clearError(field) {
      var errorElement = field.parentElement.querySelector('.c-form__error, .invalid-feedback');
      if (errorElement) {
        errorElement.style.display = 'none';
      }
      field.classList.remove('is-invalid');
      field.parentElement.classList.remove('has-error');
    }

    function validateField(field) {
      var value = field.value.trim();
      var fieldName = field.name;
      var isValid = true;

      clearError(field);

      if (field.hasAttribute('required') && !value) {
        showError(field, 'Dit veld is verplicht');
        return false;
      }

      if (value) {
        if (fieldName === 'name') {
          if (!validateName(value)) {
            showError(field, 'Voer een geldige naam in (2-50 karakters)');
            isValid = false;
          }
        } else if (fieldName === 'email') {
          if (!validateEmail(value)) {
            showError(field, 'Voer een geldig e-mailadres in');
            isValid = false;
          }
        } else if (fieldName === 'phone') {
          if (!validatePhone(value)) {
            showError(field, 'Voer een geldig telefoonnummer in (10-20 karakters)');
            isValid = false;
          }
        } else if (fieldName === 'message') {
          if (value.length < 10) {
            showError(field, 'Bericht moet minimaal 10 karakters bevatten');
            isValid = false;
          }
        }
      }

      return isValid;
    }

    var formFields = contactForm.querySelectorAll('input[required], textarea[required], input[type="email"], input[type="tel"]');
    for (var i = 0; i < formFields.length; i++) {
      formFields[i].addEventListener('blur', function() {
        validateField(this);
      });

      formFields[i].addEventListener('input', function() {
        if (this.classList.contains('is-invalid')) {
          clearError(this);
        }
      });
    }

    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopPropagation();

      var form = this;
      var isFormValid = true;

      var nameField = form.querySelector('#contact-name');
      var emailField = form.querySelector('#contact-email');
      var phoneField = form.querySelector('#contact-phone');
      var messageField = form.querySelector('#contact-message');
      var privacyField = form.querySelector('#contact-privacy');

      if (nameField && !validateField(nameField)) isFormValid = false;
      if (emailField && !validateField(emailField)) isFormValid = false;
      if (phoneField && !validateField(phoneField)) isFormValid = false;
      if (messageField && !validateField(messageField)) isFormValid = false;

      if (privacyField && !privacyField.checked) {
        showError(privacyField, 'U moet akkoord gaan met het privacybeleid');
        isFormValid = false;
      } else if (privacyField) {
        clearError(privacyField);
      }

      if (!isFormValid) {
        app.notify('Controleer de formuliervelden en probeer het opnieuw', 'danger');
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.innerHTML : '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Verzenden...';
      }

      setTimeout(function() {
        app.notify('Uw bericht is succesvol verzonden!', 'success');
        
        setTimeout(function() {
          window.location.href = 'thank_you.html';
        }, 1500);
      }, 1000);
    });
  }

  function initScrollToTop() {
    if (app.scrollToTopInit) return;
    app.scrollToTopInit = true;

    var button = document.createElement('button');
    button.className = 'c-scroll-to-top';
    button.setAttribute('aria-label', 'Scroll naar boven');
    button.innerHTML = '↑';
    button.setAttribute('style', 'position:fixed;bottom:20px;right:20px;width:48px;height:48px;background:var(--color-accent);color:#fff;border:none;border-radius:50%;cursor:pointer;opacity:0;visibility:hidden;transition:opacity 0.3s,visibility 0.3s;z-index:999;font-size:24px;');

    document.body.appendChild(button);

    function toggleButton() {
      if (window.pageYOffset > 300) {
        button.style.opacity = '1';
        button.style.visibility = 'visible';
      } else {
        button.style.opacity = '0';
        button.style.visibility = 'hidden';
      }
    }

    button.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    var scrollHandler = throttle(toggleButton, 100);
    window.addEventListener('scroll', scrollHandler, { passive: true });
  }

  function initHeaderShadow() {
    if (app.headerShadowInit) return;
    app.headerShadowInit = true;

    var header = document.querySelector('.l-header, header');
    if (!header) return;

    function updateHeaderShadow() {
      if (window.pageYOffset > 10) {
        header.classList.add('l-header--scrolled');
      } else {
        header.classList.remove('l-header--scrolled');
      }
    }

    var scrollHandler = throttle(updateHeaderShadow, 100);
    window.addEventListener('scroll', scrollHandler, { passive: true });
    updateHeaderShadow();
  }

  function initModalPrivacy() {
    if (app.modalPrivacyInit) return;
    app.modalPrivacyInit = true;

    var privacyLinks = document.querySelectorAll('a[href*="privacy"]');
    
    for (var i = 0; i < privacyLinks.length; i++) {
      privacyLinks[i].addEventListener('click', function(e) {
        var href = this.getAttribute('href');
        if (href && href.indexOf('privacy') !== -1 && href.indexOf('#') === -1) {
          return;
        }
      });
    }
  }

  function initButtonRipple() {
    if (app.buttonRippleInit) return;
    app.buttonRippleInit = true;

    var buttons = document.querySelectorAll('.c-button, .btn');

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function(e) {
        var button = this;
        var rect = button.getBoundingClientRect();
        var ripple = document.createElement('span');
        
        var size = Math.max(rect.width, rect.height);
        var x = e.clientX - rect.left - size / 2;
        var y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = 'position:absolute;border-radius:50%;background:rgba(255,255,255,0.5);width:' + size + 'px;height:' + size + 'px;left:' + x + 'px;top:' + y + 'px;pointer-events:none;transform:scale(0);animation:ripple 0.6s ease-out;';

        var style = document.createElement('style');
        if (!document.getElementById('ripple-keyframes')) {
          style.id = 'ripple-keyframes';
          style.textContent = '@keyframes ripple { to { transform: scale(4); opacity: 0; } }';
          document.head.appendChild(style);
        }

        if (button.style.position !== 'absolute' && button.style.position !== 'relative') {
          button.style.position = 'relative';
        }
        button.style.overflow = 'hidden';

        button.appendChild(ripple);

        setTimeout(function() {
          if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
          }
        }, 600);
      });
    }
  }

  app.init = function() {
    initBurgerMenu();
    initSmoothScroll();
    initScrollSpy();
    initActiveMenuState();
    initImages();
    initForms();
    initScrollToTop();
    initHeaderShadow();
    initModalPrivacy();
    initButtonRipple();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }

})();