# Enhanced Features: Element Enumeration and User Teaching

This document describes the enhanced features added to Browser MCP that allow for better element interaction and user-guided corrections.

## Overview

The enhanced features provide:

1. **Element Enumeration** - Automatically discover and list all interactive elements on a page with their CSS selectors
2. **Screenshot Integration** - Capture screenshots alongside page snapshots for visual context
3. **CSS Selector-Based Interaction** - Click elements directly using CSS selectors
4. **User Teaching System** - Teach the model which selectors to use for specific actions
5. **Learned Selector Retrieval** - Query previously taught selectors

## New Tools

### 1. `browser_enumerate_elements`

Enumerates all interactive elements on the page with their CSS selectors, text content, and attributes.

**Parameters:**
- `includeHidden` (optional, boolean): Whether to include hidden elements. Defaults to `false`.

**Returns:**
A numbered list of interactive elements with:
- Tag name
- Text content (truncated if long)
- CSS selector
- ID (if present)
- Classes (if present)
- Type (for inputs)
- ARIA role (if present)

**Example Usage:**
```json
{
  "name": "browser_enumerate_elements",
  "arguments": {
    "includeHidden": false
  }
}
```

**Example Output:**
```
## Enumerated Interactive Elements

1. **button** - "Login"
   - CSS Selector: `#login-btn`
   - ID: login-btn
   - Classes: btn btn-primary
   - Type: button

2. **input** - ""
   - CSS Selector: `input[name="username"]`
   - Type: text
   - ID: username-field

3. **a** - "Sign up"
   - CSS Selector: `a.signup-link`
   - Classes: signup-link
```

### 2. `browser_click_by_selector`

Click an element using a CSS selector. This provides precise control over which element to click.

**Parameters:**
- `selector` (required, string): CSS selector for the element to click
- `description` (optional, string): Description of what this element is

**Returns:**
Confirmation message and updated page snapshot.

**Example Usage:**
```json
{
  "name": "browser_click_by_selector",
  "arguments": {
    "selector": "#login-btn",
    "description": "main login button"
  }
}
```

### 3. `browser_teach_selector`

Teach the model which CSS selector to use for a specific action or element description. This creates a mapping that can be referenced later.

**Parameters:**
- `actionDescription` (required, string): Description of the action or element (e.g., "login button")
- `selector` (required, string): The correct CSS selector to use
- `notes` (optional, string): Notes about when to use this selector

**Returns:**
Confirmation that the selector has been learned.

**Example Usage:**
```json
{
  "name": "browser_teach_selector",
  "arguments": {
    "actionDescription": "login button",
    "selector": "#login-btn",
    "notes": "Use this for the main login, not the modal login"
  }
}
```

### 4. `browser_get_learned_selectors`

Retrieve all CSS selectors that have been taught to the model.

**Parameters:**
None.

**Returns:**
A list of action descriptions and their corresponding selectors.

**Example Usage:**
```json
{
  "name": "browser_get_learned_selectors",
  "arguments": {}
}
```

**Example Output:**
```
## Learned CSS Selectors

- **login button**
  - Selector: `#login-btn`
  - Notes: Use this for the main login, not the modal login
  - Taught: 2025-11-24T02:30:00.000Z

- **search box**
  - Selector: `input[type="search"]`
  - Taught: 2025-11-24T02:31:00.000Z
```

### 5. `browser_enhanced_snapshot`

Capture an enhanced page snapshot that includes both the accessibility tree and a screenshot.

**Parameters:**
- `includeElements` (optional, boolean): Whether to also include enumerated elements. Defaults to `false`.

**Returns:**
- Screenshot (PNG image)
- Page URL and title
- ARIA snapshot
- Optionally: enumerated interactive elements

**Example Usage:**
```json
{
  "name": "browser_enhanced_snapshot",
  "arguments": {
    "includeElements": true
  }
}
```

## Workflow Examples

### Example 1: Discovering Elements

1. Navigate to a page:
```json
{
  "name": "browser_navigate",
  "arguments": { "url": "https://example.com/login" }
}
```

2. Take enhanced snapshot with elements:
```json
{
  "name": "browser_enhanced_snapshot",
  "arguments": { "includeElements": true }
}
```

3. Or enumerate elements separately:
```json
{
  "name": "browser_enumerate_elements",
  "arguments": {}
}
```

### Example 2: Teaching the Model

When the AI clicks the wrong element:

1. User provides correction:
```json
{
  "name": "browser_teach_selector",
  "arguments": {
    "actionDescription": "submit form button",
    "selector": "button[type='submit'].main-form-btn",
    "notes": "Don't use the cancel button"
  }
}
```

2. AI can now use the correct selector:
```json
{
  "name": "browser_click_by_selector",
  "arguments": {
    "selector": "button[type='submit'].main-form-btn",
    "description": "submit form button"
  }
}
```

### Example 3: Using CSS Selectors Directly

If you know the exact selector you want to use:

```json
{
  "name": "browser_click_by_selector",
  "arguments": {
    "selector": "#specific-button-id",
    "description": "specific action button"
  }
}
```

## Browser Extension Integration

These features require corresponding support in the Browser MCP Chrome extension. The extension should handle these message types:

- `browser_enumerate_elements` - Scans the DOM for interactive elements
- `browser_click_by_selector` - Clicks an element using `document.querySelector()`

### Example Browser Extension Handler (Conceptual)

```javascript
// In the browser extension's content script or background script
function enumerateElements(includeHidden) {
  const selectors = [
    'button',
    'a[href]',
    'input',
    'select',
    'textarea',
    '[role="button"]',
    '[onclick]',
    '[tabindex]:not([tabindex="-1"])'
  ];
  
  const elements = [];
  const seen = new Set();
  
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach((el, idx) => {
      if (seen.has(el)) return;
      if (!includeHidden && !isVisible(el)) return;
      
      seen.add(el);
      
      const cssSelector = generateCSSSelector(el);
      elements.push({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim().substring(0, 100) || '',
        selector: cssSelector,
        id: el.id || undefined,
        classes: el.className || undefined,
        type: el.type || undefined,
        role: el.getAttribute('role') || undefined
      });
    });
  });
  
  return elements;
}

function clickBySelector(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found with selector: ${selector}`);
  }
  element.click();
}

function isVisible(el) {
  return el.offsetWidth > 0 && 
         el.offsetHeight > 0 && 
         window.getComputedStyle(el).visibility !== 'hidden';
}

function generateCSSSelector(el) {
  // Simple CSS selector generation
  if (el.id) return `#${el.id}`;
  
  let path = [];
  while (el && el.nodeType === Node.ELEMENT_NODE) {
    let selector = el.nodeName.toLowerCase();
    if (el.className) {
      selector += '.' + el.className.trim().split(/\s+/).join('.');
    }
    path.unshift(selector);
    el = el.parentNode;
  }
  return path.join(' > ');
}
```

## Violentmonkey Script Example

If you want to use Violentmonkey to help with element selection, here's an example script that highlights elements and shows their selectors:

```javascript
// ==UserScript==
// @name        Browser MCP Element Helper
// @namespace   Violentmonkey Scripts
// @match       *://*/*
// @grant       none
// @version     1.0
// @author      Browser MCP
// @description Helps identify CSS selectors for Browser MCP teaching
// ==/UserScript==

(function() {
    'use strict';
    
    let overlay = null;
    let currentElement = null;
    
    // Create overlay to show selector
    function createOverlay() {
        overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 999999;
            max-width: 400px;
            word-wrap: break-word;
        `;
        document.body.appendChild(overlay);
    }
    
    // Generate CSS selector for an element
    function generateSelector(el) {
        if (el.id) return `#${el.id}`;
        
        let path = [];
        while (el && el.nodeType === Node.ELEMENT_NODE) {
            let selector = el.nodeName.toLowerCase();
            if (el.className) {
                const classes = el.className.trim().split(/\s+/).filter(c => c);
                if (classes.length > 0) {
                    selector += '.' + classes.join('.');
                }
            }
            
            // Add nth-child if needed for uniqueness
            if (el.parentNode) {
                const siblings = Array.from(el.parentNode.children);
                const sameTagSiblings = siblings.filter(s => 
                    s.nodeName === el.nodeName && 
                    s.className === el.className
                );
                if (sameTagSiblings.length > 1) {
                    const index = siblings.indexOf(el) + 1;
                    selector += `:nth-child(${index})`;
                }
            }
            
            path.unshift(selector);
            el = el.parentNode;
            
            // Limit depth
            if (path.length > 5) break;
        }
        
        return path.join(' > ');
    }
    
    // Highlight element on hover
    function highlightElement(e) {
        if (currentElement) {
            currentElement.style.outline = '';
        }
        
        currentElement = e.target;
        currentElement.style.outline = '2px solid red';
        
        const selector = generateSelector(e.target);
        const text = e.target.textContent?.trim().substring(0, 50) || '';
        
        if (overlay) {
            overlay.innerHTML = `
                <strong>Element:</strong> ${e.target.tagName.toLowerCase()}<br>
                <strong>Selector:</strong> <span style="color: #00ff00">${selector}</span><br>
                ${text ? `<strong>Text:</strong> ${text}...<br>` : ''}
                <em>Click to copy selector</em>
            `;
        }
    }
    
    // Copy selector on click
    function copySelector(e) {
        const selector = generateSelector(e.target);
        navigator.clipboard.writeText(selector).then(() => {
            const originalText = overlay.innerHTML;
            overlay.innerHTML = '<strong style="color: #00ff00">✓ Selector copied!</strong>';
            setTimeout(() => {
                overlay.innerHTML = originalText;
            }, 1000);
        });
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Toggle helper with Ctrl+Shift+H
    let helperActive = false;
    
    function toggleHelper() {
        helperActive = !helperActive;
        
        if (helperActive) {
            createOverlay();
            document.addEventListener('mouseover', highlightElement);
            document.addEventListener('click', copySelector, true);
        } else {
            if (overlay) {
                overlay.remove();
                overlay = null;
            }
            if (currentElement) {
                currentElement.style.outline = '';
                currentElement = null;
            }
            document.removeEventListener('mouseover', highlightElement);
            document.removeEventListener('click', copySelector, true);
        }
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'H') {
            toggleHelper();
        }
    });
    
    console.log('Browser MCP Element Helper loaded. Press Ctrl+Shift+H to toggle.');
})();
```

### Using the Violentmonkey Script

1. Install Violentmonkey extension in your browser
2. Create a new script and paste the code above
3. Save and enable the script
4. On any webpage, press `Ctrl+Shift+H` to activate
5. Hover over elements to see their CSS selectors
6. Click on an element to copy its selector
7. Use the copied selector with `browser_teach_selector` or `browser_click_by_selector`

## Implementation Notes

### Storage

Currently, learned selectors are stored in memory and will be lost when the MCP server restarts. For production use, consider:

- Persisting to a file (JSON or SQLite)
- Using a resource to expose the learned selectors
- Syncing with a configuration file

### Browser Extension Requirements

The new tools require the browser extension to implement handlers for:

1. `browser_enumerate_elements` - DOM scanning and element collection
2. `browser_click_by_selector` - Direct selector-based clicking

These handlers should be added to the extension's message handling system.

### CSS Selector Generation

The browser extension should implement robust CSS selector generation that:

- Prefers IDs when available
- Uses classes for better maintainability
- Falls back to structural selectors when needed
- Generates selectors that are as specific as needed but no more

## Benefits

1. **Transparency** - Users can see exactly which elements are available
2. **Control** - Users can override AI decisions with specific selectors
3. **Learning** - The system remembers corrections for future use
4. **Debugging** - Screenshots + enumeration help troubleshoot issues
5. **Precision** - CSS selectors provide exact element targeting
6. **Flexibility** - Works with dynamic pages and complex UIs

## Future Enhancements

- Persist learned selectors to disk
- Export/import selector mappings
- Selector validation and testing
- Visual element highlighting in screenshots
- Fuzzy matching for similar elements
- Selector pattern templates
- Integration with browser DevTools
