import type { Context } from "@/context";

import type { Resource, ResourceResult } from "./resource";

// This will be shared with the enhanced tools module
// For now, we'll export a getter function to access learned selectors
export function createSelectorsResource(
  getLearnedSelectors: () => Map<
    string,
    { selector: string; notes?: string; timestamp: Date }
  >,
): Resource {
  return {
    schema: {
      uri: "selectors://learned",
      name: "Learned CSS Selectors",
      description:
        "CSS selectors that have been taught to the model for specific actions",
      mimeType: "application/json",
    },
    read: async (_context: Context, _uri: string): Promise<ResourceResult[]> => {
      const selectors = getLearnedSelectors();
      const data: Record<string, any> = {};

      selectors.forEach((value, key) => {
        data[key] = {
          selector: value.selector,
          notes: value.notes,
          timestamp: value.timestamp.toISOString(),
        };
      });

      return [
        {
          uri: "selectors://learned",
          mimeType: "application/json",
          text: JSON.stringify(data, null, 2),
        },
      ];
    },
  };
}
