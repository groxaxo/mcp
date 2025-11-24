# Quick Start Guide: Enhanced Features

This guide will get you started with the new element enumeration and user teaching features in 5 minutes.

## What's New?

Browser MCP now includes powerful tools that let you:

1. **See all clickable elements** on a page with their CSS selectors
2. **Click elements precisely** using CSS selectors
3. **Teach the AI** which selectors to use when it makes mistakes
4. **Take enhanced screenshots** that show both the page structure and visual appearance

## Quick Examples

### 1. See All Elements on a Page

Want to know what you can click? Use `browser_enumerate_elements`:

```json
{
  "name": "browser_enumerate_elements",
  "arguments": {}
}
```

**Output:**
```
## Enumerated Interactive Elements

1. **button** - "Login"
   - CSS Selector: `#login-btn`
   - ID: login-btn
   - Type: button

2. **input** - ""
   - CSS Selector: `input[name="email"]`
   - Type: email

3. **a** - "Sign up"
   - CSS Selector: `a.signup-link`
```

### 2. Click a Specific Element

Know exactly which button to click? Use its CSS selector:

```json
{
  "name": "browser_click_by_selector",
  "arguments": {
    "selector": "#login-btn"
  }
}
```

### 3. Teach the AI

Did the AI click the wrong button? Teach it the right one:

```json
{
  "name": "browser_teach_selector",
  "arguments": {
    "actionDescription": "login button",
    "selector": "#login-btn",
    "notes": "Use the main login button, not the modal one"
  }
}
```

Now the AI knows which selector to use for "login button"!

### 4. Take Enhanced Screenshots

Want to see both the page structure AND visual appearance?

```json
{
  "name": "browser_enhanced_snapshot",
  "arguments": {
    "includeElements": true
  }
}
```

This returns:
- A screenshot (PNG image)
- Page URL and title
- Accessibility tree
- List of all interactive elements

### 5. Check What the AI Has Learned

```json
{
  "name": "browser_get_learned_selectors",
  "arguments": {}
}
```

**Output:**
```
## Learned CSS Selectors

- **login button**
  - Selector: `#login-btn`
  - Notes: Use the main login button, not the modal one
  - Taught: 2025-11-24T02:30:00.000Z
```

## Common Workflows

### Workflow 1: First Time on a New Site

```json
// 1. Navigate to the site
{"name": "browser_navigate", "arguments": {"url": "https://example.com"}}

// 2. See everything (screenshot + structure + elements)
{"name": "browser_enhanced_snapshot", "arguments": {"includeElements": true}}

// 3. Click something specific if needed
{"name": "browser_click_by_selector", "arguments": {"selector": "#specific-button"}}
```

### Workflow 2: Correcting the AI

```json
// 1. AI clicked the wrong thing? Find the right element
{"name": "browser_enumerate_elements", "arguments": {}}

// 2. Click the correct element
{"name": "browser_click_by_selector", "arguments": {"selector": "#correct-button"}}

// 3. Teach it for next time
{"name": "browser_teach_selector", "arguments": {
  "actionDescription": "submit button",
  "selector": "#correct-button"
}}
```

### Workflow 3: Using Violentmonkey Helper

1. Install the Violentmonkey extension
2. Add the helper script (see ENHANCED_FEATURES.md)
3. Press `Ctrl+Shift+H` on any page
4. Hover over elements to see their CSS selectors
5. Click to copy the selector
6. Use it with `browser_click_by_selector` or `browser_teach_selector`

## Tips

### ✅ DO:
- Use `browser_enumerate_elements` when you're not sure what's on the page
- Use `browser_click_by_selector` when you know exactly what to click
- Use `browser_teach_selector` to correct AI mistakes
- Use `browser_enhanced_snapshot` to see both structure and visuals

### ❌ DON'T:
- Don't teach generic names like "button" - be specific: "submit form button"
- Don't use fragile selectors like `.css-generated-12345` - prefer IDs or data attributes
- Don't skip enumeration - it helps you find the right selectors

## Troubleshooting

### "Element not found"
1. Run `browser_enumerate_elements` to see what's available
2. Check if the page has finished loading
3. Verify the selector syntax is correct

### "Wrong element clicked"
1. Enumerate elements to see all options
2. Use `browser_click_by_selector` with the exact selector
3. Teach the AI the correct selector

### "Selector stopped working"
1. Page structure probably changed
2. Re-enumerate to find the new selector
3. Update with `browser_teach_selector`

## Examples by Use Case

### Logging In
```json
// Find login form
{"name": "browser_enumerate_elements", "arguments": {}}

// Type credentials (using existing tools)
{"name": "browser_type", "arguments": {"element": "username", "ref": "...", "text": "user"}}
{"name": "browser_type", "arguments": {"element": "password", "ref": "...", "text": "pass"}}

// Click login with exact selector
{"name": "browser_click_by_selector", "arguments": {"selector": "#login-button"}}

// Teach it
{"name": "browser_teach_selector", "arguments": {
  "actionDescription": "example.com login button",
  "selector": "#login-button"
}}
```

### Filling Forms
```json
// See all form fields
{"name": "browser_enumerate_elements", "arguments": {}}

// Fill each field
// ... use browser_type for each field ...

// Submit with precise selector
{"name": "browser_click_by_selector", "arguments": {"selector": "button[type='submit']"}}
```

### Debugging
```json
// Before action - take snapshot
{"name": "browser_enhanced_snapshot", "arguments": {}}

// Do something
{"name": "browser_click_by_selector", "arguments": {"selector": "#target"}}

// After action - take snapshot
{"name": "browser_enhanced_snapshot", "arguments": {}}

// Compare the two screenshots to verify it worked
```

## Need More Help?

- **Detailed docs**: See [ENHANCED_FEATURES.md](./ENHANCED_FEATURES.md)
- **Integration guide**: See [EXTENSION_INTEGRATION.md](./EXTENSION_INTEGRATION.md)
- **More examples**: See [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)
- **Main docs**: See [README.md](./README.md)

## Browser Extension Note

These features require the Browser MCP Chrome extension to implement handlers for:
- `browser_enumerate_elements` - Scans the page for interactive elements
- `browser_click_by_selector` - Clicks elements by CSS selector

See EXTENSION_INTEGRATION.md for implementation details. If you get errors about these message types, the extension needs to be updated to support them.

## What You Can Build

With these tools, you can:

- 🤖 Automate complex workflows with precise control
- 🎯 Create site-specific automation scripts
- 🧪 Build test automation that's resilient to page changes
- 📚 Document page structures with enumeration
- 🔧 Debug automation issues with screenshots
- 🎓 Build self-learning automation systems

## Contributing

Found a bug or have a feature request? Please open an issue on GitHub!

Want to improve the documentation? PRs are welcome!

---

**Happy automating! 🚀**
