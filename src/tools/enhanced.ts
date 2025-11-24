import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

import type { Context } from "@/context";
import { captureAriaSnapshot } from "@/utils/aria-snapshot";

import type { Tool } from "./tool";

// Schema for enumerating elements
const EnumerateElementsSchema = z.object({
  name: z.literal("browser_enumerate_elements"),
  description: z.literal(
    "Enumerate all interactive elements on the page with their CSS selectors, text content, and attributes. Returns a numbered list of elements that can be clicked, typed into, or interacted with.",
  ),
  arguments: z.object({
    includeHidden: z
      .boolean()
      .optional()
      .describe(
        "Whether to include hidden elements in the enumeration. Defaults to false.",
      ),
  }),
});

// Schema for clicking by CSS selector
const ClickBySelectorSchema = z.object({
  name: z.literal("browser_click_by_selector"),
  description: z.literal(
    "Click an element using a CSS selector. This allows precise control over which element to click, and is useful when the AI needs to be corrected about which element to interact with.",
  ),
  arguments: z.object({
    selector: z.string().describe("CSS selector for the element to click"),
    description: z
      .string()
      .optional()
      .describe("Optional description of what this element is"),
  }),
});

// Schema for teaching the model
const TeachSelectorSchema = z.object({
  name: z.literal("browser_teach_selector"),
  description: z.literal(
    "Teach the model which CSS selector to use for a specific action or element description. This creates a mapping that can be referenced later.",
  ),
  arguments: z.object({
    actionDescription: z
      .string()
      .describe("Description of the action or element (e.g., 'login button')"),
    selector: z.string().describe("The correct CSS selector to use"),
    notes: z
      .string()
      .optional()
      .describe("Optional notes about when to use this selector"),
  }),
});

// Schema for querying learned selectors
const GetLearnedSelectorsSchema = z.object({
  name: z.literal("browser_get_learned_selectors"),
  description: z.literal(
    "Retrieve all CSS selectors that have been taught to the model. Returns a list of action descriptions and their corresponding selectors.",
  ),
  arguments: z.object({}),
});

// Schema for enhanced snapshot with screenshot
const EnhancedSnapshotSchema = z.object({
  name: z.literal("browser_enhanced_snapshot"),
  description: z.literal(
    "Capture an enhanced page snapshot that includes both the accessibility tree and a screenshot of the current page. This provides both structural and visual information.",
  ),
  arguments: z.object({
    includeElements: z
      .boolean()
      .optional()
      .describe(
        "Whether to also include enumerated elements. Defaults to false.",
      ),
  }),
});

// Type definitions for element data
interface ElementData {
  tag: string;
  text?: string;
  selector: string;
  id?: string;
  classes?: string;
  type?: string;
  role?: string;
  ariaLabel?: string;
  [key: string]: string | undefined;
}

// Storage for learned selectors (in-memory for now)
const learnedSelectors = new Map<
  string,
  { selector: string; notes?: string; timestamp: Date }
>();

// Export getter for resource access
export function getLearnedSelectorsMap() {
  return learnedSelectors;
}

// Helper function to format element text
function formatElementText(
  elements: ElementData[],
  includeDetails: boolean = true,
): string {
  let text = "";

  if (elements.length === 0) {
    return "No interactive elements found.\n";
  }

  elements.forEach((el, index) => {
    text += `${index + 1}. **${el.tag || "element"}**`;
    if (el.text) {
      const truncated = el.text.substring(0, 50);
      text += ` - "${truncated}${el.text.length > 50 ? "..." : ""}"`;
    }
    
    if (includeDetails) {
      text += `\n   - CSS Selector: \`${el.selector}\``;
      if (el.id) text += `\n   - ID: ${el.id}`;
      if (el.classes) text += `\n   - Classes: ${el.classes}`;
      if (el.type) text += `\n   - Type: ${el.type}`;
      if (el.role) text += `\n   - Role: ${el.role}`;
    } else {
      text += ` (\`${el.selector}\`)`;
    }
    text += `\n`;
  });

  return text;
}

export const enumerateElements: Tool = {
  schema: {
    name: EnumerateElementsSchema.shape.name.value,
    description: EnumerateElementsSchema.shape.description.value,
    inputSchema: zodToJsonSchema(EnumerateElementsSchema.shape.arguments),
  },
  handle: async (context: Context, params) => {
    const validatedParams =
      EnumerateElementsSchema.shape.arguments.parse(params);

    // Send message to browser extension to enumerate elements
    const rawElements = await context.sendSocketMessage("browser_enumerate_elements", {
      includeHidden: validatedParams.includeHidden ?? false,
    });

    // Format the elements as a numbered list
    let text = "## Enumerated Interactive Elements\n\n";
    
    if (Array.isArray(rawElements) && rawElements.length > 0) {
      const elements = rawElements as ElementData[];
      text += formatElementText(elements, true);
    } else {
      text += "No interactive elements found or enumeration not supported.\n";
      if (rawElements && typeof rawElements === 'object') {
        text += `Note: Received data of type ${typeof rawElements} - extension may need to implement this handler.\n`;
      }
    }

    return {
      content: [
        {
          type: "text",
          text,
        },
      ],
    };
  },
};

export const clickBySelector: Tool = {
  schema: {
    name: ClickBySelectorSchema.shape.name.value,
    description: ClickBySelectorSchema.shape.description.value,
    inputSchema: zodToJsonSchema(ClickBySelectorSchema.shape.arguments),
  },
  handle: async (context: Context, params) => {
    const validatedParams = ClickBySelectorSchema.shape.arguments.parse(params);

    await context.sendSocketMessage("browser_click_by_selector", {
      selector: validatedParams.selector,
    });

    const snapshot = await captureAriaSnapshot(context);

    return {
      content: [
        {
          type: "text",
          text: `Clicked element with selector: ${validatedParams.selector}${validatedParams.description ? ` (${validatedParams.description})` : ""}`,
        },
        ...snapshot.content,
      ],
    };
  },
};

export const teachSelector: Tool = {
  schema: {
    name: TeachSelectorSchema.shape.name.value,
    description: TeachSelectorSchema.shape.description.value,
    inputSchema: zodToJsonSchema(TeachSelectorSchema.shape.arguments),
  },
  handle: async (context: Context, params) => {
    const validatedParams = TeachSelectorSchema.shape.arguments.parse(params);

    // Store the learned selector using the original description as key
    // This preserves the user's intended casing and formatting
    learnedSelectors.set(validatedParams.actionDescription, {
      selector: validatedParams.selector,
      notes: validatedParams.notes,
      timestamp: new Date(),
    });

    return {
      content: [
        {
          type: "text",
          text: `✓ Learned selector for "${validatedParams.actionDescription}": \`${validatedParams.selector}\`${validatedParams.notes ? `\n  Notes: ${validatedParams.notes}` : ""}`,
        },
      ],
    };
  },
};

export const getLearnedSelectors: Tool = {
  schema: {
    name: GetLearnedSelectorsSchema.shape.name.value,
    description: GetLearnedSelectorsSchema.shape.description.value,
    inputSchema: zodToJsonSchema(GetLearnedSelectorsSchema.shape.arguments),
  },
  handle: async (_context: Context, _params) => {
    let text = "## Learned CSS Selectors\n\n";

    if (learnedSelectors.size === 0) {
      text += "No selectors have been taught yet.\n\n";
      text +=
        "Use the `browser_teach_selector` tool to teach the model which selectors to use for specific actions.";
    } else {
      learnedSelectors.forEach((value, key) => {
        text += `- **${key}**\n`;
        text += `  - Selector: \`${value.selector}\`\n`;
        if (value.notes) {
          text += `  - Notes: ${value.notes}\n`;
        }
        text += `  - Taught: ${value.timestamp.toISOString()}\n`;
      });
    }

    return {
      content: [
        {
          type: "text",
          text,
        },
      ],
    };
  },
};

export const enhancedSnapshot: Tool = {
  schema: {
    name: EnhancedSnapshotSchema.shape.name.value,
    description: EnhancedSnapshotSchema.shape.description.value,
    inputSchema: zodToJsonSchema(EnhancedSnapshotSchema.shape.arguments),
  },
  handle: async (context: Context, params) => {
    const validatedParams =
      EnhancedSnapshotSchema.shape.arguments.parse(params);

    // Get screenshot
    const screenshot = await context.sendSocketMessage(
      "browser_screenshot",
      {},
    );

    // Get regular snapshot
    const snapshot = await captureAriaSnapshot(context);

    const content: any[] = [
      {
        type: "image",
        data: screenshot,
        mimeType: "image/png",
      },
      ...snapshot.content,
    ];

    // Optionally include enumerated elements
    if (validatedParams.includeElements) {
      try {
        const rawElements = await context.sendSocketMessage(
          "browser_enumerate_elements",
          { includeHidden: false },
        );

        let elementsText = "\n## Interactive Elements\n\n";
        if (Array.isArray(rawElements) && rawElements.length > 0) {
          const elements = rawElements as ElementData[];
          elementsText += formatElementText(elements, false);
        } else {
          elementsText += "No interactive elements found.\n";
        }

        content.push({
          type: "text",
          text: elementsText,
        });
      } catch (error) {
        // If enumeration fails, just skip it
        console.error("Failed to enumerate elements:", error);
      }
    }

    return {
      content,
    };
  },
};
