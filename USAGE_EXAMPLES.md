# Usage Examples

This document provides practical examples of how to use the enhanced features in Browser MCP.

## Example 1: Discovering and Clicking Elements

### Scenario
You want to click a login button on a website, but the AI is clicking the wrong button.

### Steps

1. **Navigate to the page:**
```json
{
  "name": "browser_navigate",
  "arguments": {
    "url": "https://example.com/login"
  }
}
```

2. **Take an enhanced snapshot to see the page:**
```json
{
  "name": "browser_enhanced_snapshot",
  "arguments": {
    "includeElements": true
  }
}
```

This returns:
- A screenshot of the page
- The page structure (ARIA tree)
- A numbered list of all interactive elements

3. **Review the enumerated elements** from the response:
```
## Interactive Elements

1. button - "Login" (`#main-login-btn`)
2. button - "Cancel" (`#cancel-btn`)
3. a - "Forgot password?" (`.forgot-link`)
4. input - "" (`input[name="username"]`)
5. input - "" (`input[name="password"]`)
```

4. **Click the specific button using its selector:**
```json
{
  "name": "browser_click_by_selector",
  "arguments": {
    "selector": "#main-login-btn",
    "description": "main login button"
  }
}
```

5. **Teach the model for future use:**
```json
{
  "name": "browser_teach_selector",
  "arguments": {
    "actionDescription": "login button",
    "selector": "#main-login-btn",
    "notes": "This is the primary login button, not the modal one"
  }
}
```

Now, next time the model needs to click the login button on this site, it can reference the learned selector.

## Example 2: Correcting AI Behavior

### Scenario
The AI clicked a "Cancel" button instead of "Submit" on a form.

### Steps

1. **Identify the issue:**
The AI tried to submit but clicked the wrong button.

2. **Enumerate elements to find the correct one:**
```json
{
  "name": "browser_enumerate_elements",
  "arguments": {
    "includeHidden": false
  }
}
```

Response shows:
```
10. button - "Cancel" (`button.cancel-btn`)
11. button - "Submit" (`button[type="submit"].submit-btn`)
```

3. **Click the correct button:**
```json
{
  "name": "browser_click_by_selector",
  "arguments": {
    "selector": "button[type=\"submit\"].submit-btn"
  }
}
```

4. **Teach the model:**
```json
{
  "name": "browser_teach_selector",
  "arguments": {
    "actionDescription": "submit form button",
    "selector": "button[type=\"submit\"].submit-btn",
    "notes": "Use type=submit, not the cancel button"
  }
}
```

## Example 3: Working with Dynamic Content

### Scenario
A page has dynamically loaded content with changing selectors.

### Steps

1. **Navigate and wait for content:**
```json
{
  "name": "browser_navigate",
  "arguments": {
    "url": "https://example.com/dashboard"
  }
}
```

```json
{
  "name": "browser_wait",
  "arguments": {
    "time": 2
  }
}
```

2. **Take a fresh snapshot with elements:**
```json
{
  "name": "browser_enhanced_snapshot",
  "arguments": {
    "includeElements": true
  }
}
```

3. **Use the most stable selector:**
Look for selectors with:
- IDs (most stable)
- Data attributes
- Semantic HTML

4. **Teach stable patterns:**
```json
{
  "name": "browser_teach_selector",
  "arguments": {
    "actionDescription": "open menu",
    "selector": "[data-testid=\"menu-button\"]",
    "notes": "Use data-testid for stability on this site"
  }
}
```

## Example 4: Complex Form Filling

### Scenario
Fill out a multi-step form with proper element targeting.

### Steps

1. **Enumerate form elements:**
```json
{
  "name": "browser_enumerate_elements",
  "arguments": {}
}
```

Response:
```
1. input - "" (`input[name="firstName"]`)
2. input - "" (`input[name="lastName"]`)
3. input - "" (`input[name="email"]`)
4. button - "Next" (`button.next-step`)
```

2. **Fill in the form** (using existing tools):
```json
{
  "name": "browser_type",
  "arguments": {
    "element": "first name input",
    "ref": "input[name=\"firstName\"]",
    "text": "John"
  }
}
```

3. **Click Next button with precision:**
```json
{
  "name": "browser_click_by_selector",
  "arguments": {
    "selector": "button.next-step"
  }
}
```

4. **Save the workflow:**
```json
{
  "name": "browser_teach_selector",
  "arguments": {
    "actionDescription": "form next button step 1",
    "selector": "button.next-step"
  }
}
```

## Example 5: Using Violentmonkey to Find Selectors

### Scenario
You need to find the exact CSS selector for an element.

### Steps

1. **Install the Violentmonkey helper script** (see ENHANCED_FEATURES.md)

2. **Activate the helper:**
- Press `Ctrl+Shift+H` on any webpage

3. **Hover over elements:**
- The script shows the CSS selector in a floating overlay
- Click any element to copy its selector

4. **Use the copied selector:**
```json
{
  "name": "browser_click_by_selector",
  "arguments": {
    "selector": "<paste copied selector here>"
  }
}
```

5. **Teach it to the model:**
```json
{
  "name": "browser_teach_selector",
  "arguments": {
    "actionDescription": "specific button",
    "selector": "<paste copied selector here>"
  }
}
```

## Example 6: Debugging with Screenshots

### Scenario
The AI says it clicked something but you want to verify visually.

### Steps

1. **Take before screenshot:**
```json
{
  "name": "browser_enhanced_snapshot",
  "arguments": {}
}
```

2. **Perform the action:**
```json
{
  "name": "browser_click_by_selector",
  "arguments": {
    "selector": "#target-button"
  }
}
```

3. **Take after screenshot:**
```json
{
  "name": "browser_enhanced_snapshot",
  "arguments": {}
}
```

4. **Compare the screenshots** to verify the action worked.

## Example 7: Retrieving Learned Selectors

### Scenario
You want to see what selectors have been taught to the model.

### Steps

1. **Query learned selectors:**
```json
{
  "name": "browser_get_learned_selectors",
  "arguments": {}
}
```

Response:
```
## Learned CSS Selectors

- **login button**
  - Selector: `#main-login-btn`
  - Notes: This is the primary login button
  - Taught: 2025-11-24T02:30:00.000Z

- **submit form button**
  - Selector: `button[type="submit"].submit-btn`
  - Notes: Use type=submit, not the cancel button
  - Taught: 2025-11-24T02:35:00.000Z
```

2. **Or access as a resource:**
```
Resource URI: selectors://learned
```

This returns a JSON object with all learned selectors.

## Example 8: Site-Specific Configuration

### Scenario
Create a reusable configuration for a specific website.

### Steps

1. **Navigate to the site:**
```json
{
  "name": "browser_navigate",
  "arguments": {
    "url": "https://specific-site.com"
  }
}
```

2. **Enumerate and document elements:**
```json
{
  "name": "browser_enumerate_elements",
  "arguments": {}
}
```

3. **Teach all important selectors:**
```json
{
  "name": "browser_teach_selector",
  "arguments": {
    "actionDescription": "specific-site login",
    "selector": "#login-button"
  }
}
```

```json
{
  "name": "browser_teach_selector",
  "arguments": {
    "actionDescription": "specific-site search",
    "selector": "input[data-search]"
  }
}
```

4. **Export the configuration:**
Read the `selectors://learned` resource and save it for future sessions.

## Best Practices

### 1. Use Descriptive Action Names
```json
{
  "actionDescription": "amazon-checkout-complete-order"
}
```

Better than:
```json
{
  "actionDescription": "button"
}
```

### 2. Add Context in Notes
```json
{
  "notes": "Only visible after adding items to cart"
}
```

### 3. Verify with Screenshots
Always take screenshots before and after critical actions.

### 4. Use Stable Selectors
Prefer:
- IDs: `#login-btn`
- Data attributes: `[data-testid="login"]`
- Semantic attributes: `button[type="submit"]`

Avoid:
- Generated classes: `.css-2b097c-container`
- Deep nesting: `div > div > div > button`
- Position-dependent: `:nth-child(47)`

### 5. Enumerate Before Teaching
Always enumerate elements first to see all available options and their selectors.

### 6. Test Learned Selectors
After teaching, immediately test the selector with `browser_click_by_selector`.

## Common Patterns

### Pattern: Safe Element Interaction
```json
// 1. Take snapshot to see current state
{ "name": "browser_enhanced_snapshot", "arguments": {} }

// 2. Enumerate to find exact element
{ "name": "browser_enumerate_elements", "arguments": {} }

// 3. Click specific element
{ "name": "browser_click_by_selector", "arguments": { "selector": "..." } }

// 4. Verify with new snapshot
{ "name": "browser_enhanced_snapshot", "arguments": {} }

// 5. Teach for future use
{ "name": "browser_teach_selector", "arguments": { ... } }
```

### Pattern: Form Filling
```json
// 1. Enumerate form fields
{ "name": "browser_enumerate_elements", "arguments": {} }

// 2. Fill each field (using existing type tool)
{ "name": "browser_type", "arguments": { ... } }

// 3. Submit with precise selector
{ "name": "browser_click_by_selector", "arguments": { "selector": "button[type='submit']" } }
```

### Pattern: Navigation and Discovery
```json
// 1. Navigate to page
{ "name": "browser_navigate", "arguments": { "url": "..." } }

// 2. Wait for load
{ "name": "browser_wait", "arguments": { "time": 2 } }

// 3. Take full snapshot with elements
{ "name": "browser_enhanced_snapshot", "arguments": { "includeElements": true } }

// 4. Teach important elements
{ "name": "browser_teach_selector", "arguments": { ... } }
```

## Troubleshooting Guide

### Issue: Element Not Found
**Solution:** Re-enumerate elements to see current state:
```json
{ "name": "browser_enumerate_elements", "arguments": {} }
```

### Issue: Wrong Element Clicked
**Solution:** Use `browser_click_by_selector` with exact selector:
```json
{ "name": "browser_click_by_selector", "arguments": { "selector": "..." } }
```

### Issue: Selector Stopped Working
**Solution:** Page structure changed. Re-enumerate and update:
```json
{ "name": "browser_enumerate_elements", "arguments": {} }
{ "name": "browser_teach_selector", "arguments": { "actionDescription": "...", "selector": "..." } }
```

### Issue: Can't See What's Happening
**Solution:** Use enhanced snapshots with screenshots:
```json
{ "name": "browser_enhanced_snapshot", "arguments": {} }
```

## Advanced Usage

### Combining with Existing Tools
The enhanced tools work alongside existing Browser MCP tools:

```json
// Use enhanced snapshot for visual context
{ "name": "browser_enhanced_snapshot", "arguments": {} }

// Use traditional click for ARIA-based interaction
{ "name": "browser_click", "arguments": { "element": "...", "ref": "..." } }

// Use click by selector for precise control
{ "name": "browser_click_by_selector", "arguments": { "selector": "..." } }
```

### Creating Element Maps
Build a map of all important elements on a page:

1. Enumerate elements
2. Teach each important one
3. Export via `selectors://learned` resource
4. Share with team or reuse across sessions

This approach is ideal for repetitive tasks or testing workflows.
