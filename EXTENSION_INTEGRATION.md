# Browser Extension Integration Guide

This document provides implementation guidance for integrating the enhanced features into the Browser MCP Chrome extension.

## Required Message Handlers

The extension needs to implement handlers for two new message types:

1. `browser_enumerate_elements` - Enumerate interactive elements with their CSS selectors
2. `browser_click_by_selector` - Click an element using a CSS selector

## Implementation Examples

### 1. Element Enumeration Handler

Add this to your content script or background script message handler:

```javascript
// Content script: content.js or similar

/**
 * Check if an element is visible
 */
function isElementVisible(element) {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  return (
    element.offsetWidth > 0 &&
    element.offsetHeight > 0 &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    style.opacity !== '0'
  );
}

/**
 * Generate a unique CSS selector for an element
 */
function generateCSSSelector(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  // If element has an ID, use it (most specific)
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  // Build path from element to root
  const path = [];
  let current = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase();
    
    // Add classes if present
    if (current.className && typeof current.className === 'string') {
      const classes = current.className
        .trim()
        .split(/\s+/)
        .filter(c => c && !/^\d/.test(c)); // Filter out numeric-only classes
      
      if (classes.length > 0) {
        selector += '.' + classes.map(c => CSS.escape(c)).join('.');
      }
    }

    // Add attribute selectors for better specificity
    if (current.hasAttribute('name')) {
      selector += `[name="${CSS.escape(current.getAttribute('name'))}"]`;
    }
    if (current.hasAttribute('type')) {
      selector += `[type="${CSS.escape(current.getAttribute('type'))}"]`;
    }

    // Check if selector is unique at this level
    const matches = document.querySelectorAll(selector);
    if (matches.length === 1) {
      path.unshift(selector);
      break;
    }

    // Add nth-child if needed
    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children);
      const index = siblings.indexOf(current) + 1;
      selector += `:nth-child(${index})`;
    }

    path.unshift(selector);
    current = current.parentElement;

    // Limit depth to avoid overly long selectors
    if (path.length >= 5) break;
  }

  return path.join(' > ');
}

/**
 * Get text content of an element (truncated)
 */
function getElementText(element, maxLength = 100) {
  let text = '';
  
  // For inputs, get the value or placeholder
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    text = element.value || element.placeholder || '';
  } else {
    // Get text content, but exclude script and style tags
    const clone = element.cloneNode(true);
    const scripts = clone.querySelectorAll('script, style');
    scripts.forEach(s => s.remove());
    text = clone.textContent || '';
  }
  
  text = text.trim().replace(/\s+/g, ' ');
  
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }
  
  return text;
}

/**
 * Enumerate all interactive elements on the page
 */
function enumerateElements(params) {
  const includeHidden = params.includeHidden || false;
  
  // Selectors for interactive elements
  const interactiveSelectors = [
    'a[href]',
    'button',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    '[role="button"]',
    '[role="link"]',
    '[role="menuitem"]',
    '[role="tab"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[onclick]',
    '[ng-click]',
    '[data-action]',
    '[tabindex]:not([tabindex="-1"])',
    'label[for]'
  ];

  const elements = [];
  const seen = new Set();

  interactiveSelectors.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(element => {
        // Skip if already processed
        if (seen.has(element)) return;
        
        // Skip if hidden (unless includeHidden is true)
        if (!includeHidden && !isElementVisible(element)) return;
        
        seen.add(element);

        const elementData = {
          tag: element.tagName.toLowerCase(),
          text: getElementText(element),
          selector: generateCSSSelector(element),
          id: element.id || undefined,
          classes: element.className || undefined,
          type: element.type || undefined,
          role: element.getAttribute('role') || undefined,
          ariaLabel: element.getAttribute('aria-label') || undefined,
          title: element.title || undefined,
          href: element.href || undefined,
          name: element.name || undefined
        };

        // Remove undefined properties
        Object.keys(elementData).forEach(key => {
          if (elementData[key] === undefined) {
            delete elementData[key];
          }
        });

        elements.push(elementData);
      });
    } catch (error) {
      console.error(`Error processing selector ${selector}:`, error);
    }
  });

  return elements;
}

/**
 * Click an element using a CSS selector
 */
function clickBySelector(params) {
  const { selector } = params;
  
  if (!selector) {
    throw new Error('Selector is required');
  }

  try {
    const element = document.querySelector(selector);
    
    if (!element) {
      throw new Error(`No element found with selector: ${selector}`);
    }

    // Scroll element into view if needed
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Wait a bit for scroll to complete
    setTimeout(() => {
      // Try multiple click methods to ensure it works
      
      // Method 1: Direct click
      element.click();
      
      // Method 2: Dispatch mouse events (for elements that need them)
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        composed: true
      });
      element.dispatchEvent(clickEvent);
      
      // Method 3: Focus + Enter (for some custom components)
      if (typeof element.focus === 'function') {
        element.focus();
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          bubbles: true,
          cancelable: true
        });
        element.dispatchEvent(enterEvent);
      }
    }, 100);

    return { success: true };
  } catch (error) {
    throw new Error(`Failed to click element: ${error.message}`);
  }
}

// Add message handlers
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    switch (message.type) {
      case 'browser_enumerate_elements':
        const elements = enumerateElements(message.payload || {});
        sendResponse({ success: true, data: elements });
        break;
        
      case 'browser_click_by_selector':
        const result = clickBySelector(message.payload || {});
        sendResponse({ success: true, data: result });
        break;
        
      default:
        // Let other handlers process this message
        return false;
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
  
  return true; // Keep channel open for async response
});
```

### 2. WebSocket Message Handler Integration

Add handlers to your WebSocket message processing:

```javascript
// In your WebSocket message handler (background.js or similar)

async function handleWebSocketMessage(message) {
  const { type, payload } = message;
  
  switch (type) {
    case 'browser_enumerate_elements':
      return await sendToContentScript('browser_enumerate_elements', payload);
      
    case 'browser_click_by_selector':
      return await sendToContentScript('browser_click_by_selector', payload);
      
    // ... other existing handlers
  }
}

/**
 * Send message to active tab's content script
 */
async function sendToContentScript(type, payload) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || !tab.id) {
    throw new Error('No active tab found');
  }
  
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tab.id,
      { type, payload },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Unknown error'));
        }
      }
    );
  });
}
```

## Testing

### Test Element Enumeration

1. Navigate to any webpage
2. Open DevTools console
3. Run:
```javascript
chrome.runtime.sendMessage({
  type: 'browser_enumerate_elements',
  payload: { includeHidden: false }
}, response => {
  console.log('Elements:', response);
});
```

### Test Click by Selector

1. Navigate to any webpage
2. Find a button's CSS selector (right-click > Inspect > Copy selector)
3. Run:
```javascript
chrome.runtime.sendMessage({
  type: 'browser_click_by_selector',
  payload: { selector: '#your-button-selector' }
}, response => {
  console.log('Click result:', response);
});
```

## Manifest Configuration

Ensure your extension manifest includes the necessary permissions:

```json
{
  "manifest_version": 3,
  "name": "Browser MCP",
  "permissions": [
    "activeTab",
    "tabs",
    "scripting"
  ],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "background": {
    "service_worker": "background.js"
  }
}
```

## Error Handling

The implementation includes several levels of error handling:

1. **Invalid Selectors**: Catch and report when a selector doesn't match any elements
2. **Hidden Elements**: Option to include or exclude based on visibility
3. **Permission Issues**: Handle cases where content script can't access the page
4. **Timing Issues**: Wait for scrolling before clicking

## Performance Considerations

1. **Caching**: Consider caching enumerated elements for a short period
2. **Throttling**: Limit how often enumeration can be called
3. **Selector Optimization**: Use the most specific selector possible
4. **DOM Observation**: For dynamic pages, consider using MutationObserver

## Security Notes

1. **Selector Validation**: Validate CSS selectors before using them
2. **XSS Prevention**: Use CSS.escape() for user-provided values
3. **Origin Checks**: Ensure messages are from trusted sources
4. **Content Security Policy**: Follow CSP best practices

## Advanced Features

### Element Highlighting

Add visual feedback when hovering over enumerated elements:

```javascript
function highlightElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.style.outline = '2px solid red';
    element.style.outlineOffset = '2px';
    
    setTimeout(() => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    }, 2000);
  }
}
```

### Smart Selector Generation

For better selectors, prioritize:
1. ID attributes (most specific)
2. Unique class combinations
3. Semantic attributes (name, type, role)
4. Structural position (nth-child)
5. Text content (as fallback)

### Element Filtering

Add options to filter elements by:
- Tag type
- Visibility
- Size (minimum width/height)
- Position (viewport vs. off-screen)
- Interactive state (enabled/disabled)

## Troubleshooting

### Elements Not Found
- Ensure content script is injected
- Check if page has loaded completely
- Verify selector syntax is correct

### Click Not Working
- Element might be covered by another element
- Element might require specific events
- Page might be using custom event handlers

### Performance Issues
- Reduce enumeration frequency
- Filter elements more aggressively
- Use more specific selectors

## Integration Checklist

- [ ] Add content script with element enumeration
- [ ] Add click by selector handler
- [ ] Update WebSocket message handler
- [ ] Update manifest.json with permissions
- [ ] Test on various websites
- [ ] Add error handling
- [ ] Optimize performance
- [ ] Document any site-specific issues
