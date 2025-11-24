# Architecture Overview: Enhanced Features

This document provides a technical overview of how the enhanced features are integrated into Browser MCP.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MCP Client                               │
│                   (Claude, VS Code, etc.)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ MCP Protocol (stdio)
┌───────────────────────────▼─────────────────────────────────────┐
│                      MCP Server (Node.js)                        │
│                                                                   │
│  ┌──────────────────┐   ┌──────────────────┐   ┌─────────────┐ │
│  │  Standard Tools  │   │  Enhanced Tools  │   │  Resources  │ │
│  │  - navigate      │   │  - enumerate     │   │  - learned  │ │
│  │  - click         │   │  - click_sel     │   │    selectors│ │
│  │  - type          │   │  - teach         │   │             │ │
│  │  - snapshot      │   │  - get_learned   │   │             │ │
│  │  - screenshot    │   │  - enhanced_snap │   │             │ │
│  └──────────────────┘   └──────────────────┘   └─────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            In-Memory Selector Storage                     │   │
│  │  Map<actionDescription, {selector, notes, timestamp}>    │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ WebSocket
┌───────────────────────────▼─────────────────────────────────────┐
│                   Browser Extension                              │
│                                                                   │
│  ┌──────────────────┐   ┌──────────────────┐                    │
│  │ Existing Handlers│   │  New Handlers    │                    │
│  │  - navigate      │   │  - enumerate     │                    │
│  │  - click         │   │  - click_sel     │                    │
│  │  - screenshot    │   │                  │                    │
│  │  - snapshot      │   │                  │                    │
│  └──────────────────┘   └──────────────────┘                    │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                         Browser Tab                              │
│                     (Chrome/Edge/etc.)                           │
│                                                                   │
│  - DOM Elements with CSS Selectors                               │
│  - Interactive Elements (buttons, inputs, links)                 │
│  - Visual Content                                                │
└──────────────────────────────────────────────────────────────────┘
```

## Component Details

### MCP Server Components

#### Standard Tools (`src/tools/`)
- **snapshot.ts** - Existing tools for ARIA-based interaction
- **common.ts** - Navigation, keyboard, wait tools
- **custom.ts** - Console logs and screenshots

#### Enhanced Tools (`src/tools/enhanced.ts`)
New tools added for element enumeration and teaching:

```typescript
// Core interfaces
interface ElementData {
  tag: string;
  text?: string;
  selector: string;
  id?: string;
  classes?: string;
  type?: string;
  role?: string;
}

// Storage
const learnedSelectors = Map<string, {
  selector: string;
  notes?: string;
  timestamp: Date;
}>()

// Tools
- enumerateElements: Tool
- clickBySelector: Tool
- teachSelector: Tool
- getLearnedSelectors: Tool
- enhancedSnapshot: Tool
```

#### Resources (`src/resources/`)
- **resource.ts** - Base resource interface
- **selectors.ts** - NEW: Exposes learned selectors as JSON resource

### Data Flow

#### 1. Element Enumeration Flow

```
User Request
    │
    ▼
MCP Client sends call_tool(browser_enumerate_elements)
    │
    ▼
MCP Server receives request
    │
    ▼
Server sends WebSocket message to extension
    │
    ▼
Extension queries DOM:
  - querySelectorAll('button', 'a', 'input', etc.)
  - Generate CSS selectors
  - Extract element properties
    │
    ▼
Extension returns ElementData[]
    │
    ▼
Server formats response with formatElementText()
    │
    ▼
Returns to MCP Client as markdown text
```

#### 2. Click by Selector Flow

```
User Request
    │
    ▼
MCP Client sends call_tool(browser_click_by_selector, {selector})
    │
    ▼
MCP Server receives request
    │
    ▼
Server sends WebSocket message to extension
    │
    ▼
Extension:
  - document.querySelector(selector)
  - Scroll element into view
  - element.click()
    │
    ▼
Extension confirms success
    │
    ▼
Server captures new ARIA snapshot
    │
    ▼
Returns to MCP Client with snapshot
```

#### 3. Teach Selector Flow

```
User Request
    │
    ▼
MCP Client sends call_tool(browser_teach_selector, {actionDescription, selector})
    │
    ▼
MCP Server receives request
    │
    ▼
Server stores in learnedSelectors Map:
  key: actionDescription
  value: {selector, notes, timestamp}
    │
    ▼
Returns confirmation to MCP Client
    │
    ▼
Selector now available via:
  - browser_get_learned_selectors tool
  - selectors://learned resource
```

#### 4. Enhanced Snapshot Flow

```
User Request
    │
    ▼
MCP Client sends call_tool(browser_enhanced_snapshot, {includeElements})
    │
    ▼
MCP Server sends multiple messages:
  1. browser_screenshot
  2. getUrl
  3. getTitle
  4. browser_snapshot
  5. browser_enumerate_elements (if includeElements=true)
    │
    ▼
Extension responds with each piece
    │
    ▼
Server combines:
  - Screenshot (image)
  - URL and title (text)
  - ARIA snapshot (text)
  - Element list (text, optional)
    │
    ▼
Returns combined content to MCP Client
```

## File Structure

```
mcp/
├── src/
│   ├── index.ts                    # Entry point, tool registration
│   ├── server.ts                   # MCP server setup
│   ├── context.ts                  # WebSocket context
│   ├── ws.ts                       # WebSocket server
│   ├── tools/
│   │   ├── tool.ts                 # Tool type definitions
│   │   ├── snapshot.ts             # Existing snapshot tools
│   │   ├── common.ts               # Existing common tools
│   │   ├── custom.ts               # Existing custom tools
│   │   └── enhanced.ts             # NEW: Enhanced tools
│   ├── resources/
│   │   ├── resource.ts             # Resource type definitions
│   │   └── selectors.ts            # NEW: Selectors resource
│   └── utils/
│       └── aria-snapshot.ts        # ARIA snapshot capture
├── ENHANCED_FEATURES.md            # NEW: Feature documentation
├── EXTENSION_INTEGRATION.md        # NEW: Extension implementation
├── USAGE_EXAMPLES.md               # NEW: Usage examples
├── QUICK_START.md                  # NEW: Quick start guide
├── ARCHITECTURE.md                 # NEW: This file
├── README.md                       # Updated with features
└── package.json                    # Dependencies
```

## Key Design Decisions

### 1. In-Memory Storage
**Decision**: Store learned selectors in memory (Map)

**Rationale**:
- Simple implementation
- Fast access
- No file I/O complexity
- Suitable for session-based learning

**Future**: Could be extended to persist to:
- JSON file
- SQLite database
- Cloud storage

### 2. Separate Tools vs. Extensions
**Decision**: Create new tools rather than modifying existing ones

**Rationale**:
- Backward compatibility
- Clear separation of concerns
- Users can choose which tools to use
- Easier to test and maintain

### 3. Message-Based Architecture
**Decision**: Use WebSocket messages for extension communication

**Rationale**:
- Already established pattern in codebase
- Async communication
- Decouples server from browser
- Enables multiple browser support

### 4. TypeScript Interfaces
**Decision**: Add proper TypeScript types for all new code

**Rationale**:
- Type safety
- Better IDE support
- Self-documenting code
- Catch errors at compile time

### 5. Helper Functions
**Decision**: Extract shared logic into helper functions

**Rationale**:
- Reduce code duplication
- Easier to test
- Consistent behavior
- Easier to maintain

## Extension Points

### Adding New Element Types

To enumerate new types of interactive elements:

1. Update `EXTENSION_INTEGRATION.md` with new selector
2. Extension adds selector to `interactiveSelectors` array
3. No changes needed in MCP server

### Adding New Selector Sources

To add new ways to provide selectors:

1. Create new tool in `enhanced.ts`
2. Register tool in `index.ts`
3. Implement handler in extension if needed

### Persisting Learned Selectors

To persist selectors across sessions:

```typescript
// In enhanced.ts, replace Map with:
class PersistentSelectorStore {
  private map: Map<string, SelectorData>;
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.map = this.load();
  }

  set(key: string, value: SelectorData) {
    this.map.set(key, value);
    this.save();
  }

  private load(): Map<...> { /* load from file */ }
  private save(): void { /* save to file */ }
}
```

## Testing Strategy

### Unit Tests
- Test formatElementText() with various inputs
- Test selector storage and retrieval
- Test error handling

### Integration Tests
- Test tool registration
- Test resource creation
- Test WebSocket communication

### E2E Tests
- Test full workflows
- Test with real browser
- Test error scenarios

## Performance Considerations

### Element Enumeration
- **Cost**: O(n) where n = number of DOM elements
- **Optimization**: Filter by visibility early
- **Cache**: Could cache results for short period

### Selector Storage
- **Cost**: O(1) lookup and insert (Map)
- **Memory**: Minimal (few KB per selector)
- **Limit**: Could add max selector limit

### Enhanced Snapshots
- **Cost**: Multiple WebSocket round trips
- **Optimization**: Parallel requests when possible
- **Size**: Screenshots can be large (100KB-1MB)

## Security Considerations

### CSS Selector Injection
- **Risk**: Malicious selectors could target sensitive elements
- **Mitigation**: Selector validation, CSP compliance
- **Status**: ✅ CodeQL scan passed

### Data Exposure
- **Risk**: Element text might contain sensitive data
- **Mitigation**: Truncate text, filter sensitive fields
- **Status**: ✅ Text truncated to 100 chars

### Storage Security
- **Risk**: Learned selectors stored in memory
- **Mitigation**: Session-only storage, no persistence
- **Status**: ✅ No persistent storage by default

## Future Enhancements

### Planned
- [ ] Persistent selector storage (file/DB)
- [ ] Selector validation and testing
- [ ] Visual element highlighting in screenshots
- [ ] Fuzzy matching for similar elements
- [ ] Selector pattern templates

### Possible
- [ ] Machine learning for selector generation
- [ ] Selector suggestion based on context
- [ ] Integration with browser DevTools
- [ ] Multi-browser support (Firefox, Safari)
- [ ] Selector performance analytics

## Maintenance

### Updating Tools
When modifying enhanced tools:
1. Update TypeScript interfaces
2. Update tool schemas
3. Update documentation
4. Run type checking: `npm run typecheck`
5. Test with real browser

### Updating Extension
When adding new message types:
1. Document in EXTENSION_INTEGRATION.md
2. Add handler in extension
3. Add type definitions
4. Test WebSocket communication

### Updating Documentation
When changing features:
1. Update relevant .md files
2. Update examples
3. Update quick start guide
4. Update README.md

## Support

For questions or issues:
- Check QUICK_START.md for common questions
- Check USAGE_EXAMPLES.md for examples
- Check EXTENSION_INTEGRATION.md for integration
- Open GitHub issue for bugs/features

## References

- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Playwright MCP Server](https://github.com/microsoft/playwright-mcp)
- [CSS Selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/)
