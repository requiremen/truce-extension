/**
 * Gmail Theme Detection
 * Detects whether Gmail is in light or dark mode by inspecting DOM/CSS.
 */

/**
 * Detect Gmail's current theme (light or dark)
 * Gmail applies dark mode via CSS variables and background colors.
 * @returns {'light' | 'dark'}
 */
export function detectGmailTheme() {
  try {
    // Gmail's body background changes in dark mode
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    if (bodyBg) {
      const rgb = bodyBg.match(/\d+/g)?.map(Number);
      if (rgb && rgb.length >= 3) {
        // Calculate luminance — dark mode has low luminance
        const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
        return luminance < 0.5 ? 'dark' : 'light';
      }
    }
  } catch (e) {
    // Fallback
  }
  return 'light';
}

/**
 * Watch for Gmail theme changes using MutationObserver
 * @param {function} callback - Called with 'light' or 'dark' when theme changes
 * @returns {function} Cleanup function to disconnect observer
 */
export function watchGmailTheme(callback) {
  let currentTheme = detectGmailTheme();
  callback(currentTheme);

  const observer = new MutationObserver(() => {
    const newTheme = detectGmailTheme();
    if (newTheme !== currentTheme) {
      currentTheme = newTheme;
      callback(newTheme);
    }
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class', 'style'],
    subtree: false,
  });

  // Also check periodically as Gmail may change theme without DOM mutations
  const interval = setInterval(() => {
    const newTheme = detectGmailTheme();
    if (newTheme !== currentTheme) {
      currentTheme = newTheme;
      callback(newTheme);
    }
  }, 2000);

  return () => {
    observer.disconnect();
    clearInterval(interval);
  };
}
