<a href="https://browsermcp.io">
  <img src="./.github/images/banner.png" alt="Browser MCP banner">
</a>

<h3 align="center">Browser MCP</h3>

<p align="center">
  Automate your browser with AI.
  <br />
  <a href="https://browsermcp.io"><strong>Website</strong></a> 
  •
  <a href="https://docs.browsermcp.io"><strong>Docs</strong></a>
</p>

## About

Browser MCP is an MCP server + Chrome extension that allows you to automate your browser using AI applications like VS Code, Claude, Cursor, and Windsurf.

## Features

- ⚡ Fast: Automation happens locally on your machine, resulting in better performance without network latency.
- 🔒 Private: Since automation happens locally, your browser activity stays on your device and isn't sent to remote servers.
- 👤 Logged In: Uses your existing browser profile, keeping you logged into all your services.
- 🥷🏼 Stealth: Avoids basic bot detection and CAPTCHAs by using your real browser fingerprint.
- 🎯 Precise: Element enumeration and CSS selector-based interaction for exact control.
- 🧠 Teachable: User can teach the model correct selectors when it makes mistakes.
- 📸 Visual: Enhanced snapshots combine screenshots with page structure for better context.

## Contributing

This repo contains all the core MCP code for Browser MCP, but currently cannot yet be built on its own due to dependencies on utils and types from the monorepo where it's developed.

## Enhanced Features

Browser MCP includes powerful tools for precise element interaction:

- **Element Enumeration** - Automatically discover all interactive elements with their CSS selectors
- **CSS Selector Interaction** - Click elements directly using CSS selectors for exact control
- **User Teaching** - Teach the model which selectors to use when it makes mistakes
- **Enhanced Snapshots** - Combine screenshots with accessibility trees for visual and structural context
- **Selector Learning** - Store and retrieve user-provided selector corrections

See [ENHANCED_FEATURES.md](./ENHANCED_FEATURES.md) for detailed documentation and [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) for practical examples.

## Credits

Browser MCP was adapted from the [Playwright MCP server](https://github.com/microsoft/playwright-mcp) in order to automate the user's browser rather than creating new browser instances. This allows using the user's existing browser profile to use logged-in sessions and avoid bot detection mechanisms that commonly block automated browser use.
