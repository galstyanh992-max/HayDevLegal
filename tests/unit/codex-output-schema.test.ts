// SECURITY/INTEGRATION REGRESSION — codex --output-schema strict-mode
// sanitizer (provider-connection task, codex-cli 0.155.0 on Windows).
//
// OpenAI structured outputs (the API behind `codex exec --output-schema`)
// run in STRICT mode. zod v4's toJSONSchema() violates that contract in two
// ways, both verified live against codex-cli 0.155.0:
//   1. object nodes omit `additionalProperties` → "In context=(),
//      'additionalProperties' is required to be supplied and to be false";
//   2. Record<string, T> fields emit an object-valued additionalProperties
//      → "In context=('additionalProperties',), schema must have a 'type' key".
// sanitizeJsonSchemaForCodex() must make the emitted schema strictly
// conformant: EVERY object node carries `additionalProperties: false` and a
// `required` array covering EVERY key of its `properties`.

import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { sanitizeJsonSchemaForCodex } from "../../src/lib/ai-runtime/providers/codex-cli";
import { CodexCaseAnalysisSchema } from "../../src/lib/ai-runtime/codex/case-analysis-schema";

function* walkSchemaNodes(node: unknown): Generator<Record<string, unknown>> {
  if (Array.isArray(node)) {
    for (const child of node) yield* walkSchemaNodes(child);
    return;
  }
  if (!node || typeof node !== "object") return;
  const o = node as Record<string, unknown>;
  yield o;
  for (const value of Object.values(o)) yield* walkSchemaNodes(value);
}

describe("sanitizeJsonSchemaForCodex — strict-mode conformance", () => {
  test("real CodexCaseAnalysisSchema becomes fully strict-conformant", () => {
    const raw = (z as unknown as { toJSONSchema: (s: unknown) => unknown })
      .toJSONSchema(CodexCaseAnalysisSchema);
    const fixed = sanitizeJsonSchemaForCodex(raw);

    for (const node of walkSchemaNodes(fixed)) {
      const isObjectShape =
        node.type === "object" ||
        (node.type === undefined &&
          !Array.isArray(node.properties) &&
          node.properties !== null &&
          node.properties !== undefined &&
          typeof node.properties === "object");
      if (!isObjectShape) continue;
      // 1. additionalProperties present and boolean false
      expect(node.additionalProperties).toBe(false);
      // 2. required covers EVERY key of properties
      if (node.properties && typeof node.properties === "object") {
        const keys = Object.keys(node.properties as Record<string, unknown>);
        expect(Array.isArray(node.required)).toBe(true);
        expect([...(node.required as string[])].sort()).toEqual([...keys].sort());
      }
    }
  });

  test("no object-valued additionalProperties survive anywhere", () => {
    const raw = (z as unknown as { toJSONSchema: (s: unknown) => unknown })
      .toJSONSchema(CodexCaseAnalysisSchema);
    const fixed = sanitizeJsonSchemaForCodex(raw);
    for (const node of walkSchemaNodes(fixed)) {
      if ("additionalProperties" in node) {
        expect(typeof node.additionalProperties === "boolean").toBe(true);
      }
    }
  });

  test("plain synthetic schemas: Record fields and optional keys are handled", () => {
    const synthetic = {
      type: "object",
      properties: {
        mapping: { type: "object", additionalProperties: { type: "string" } },
        nested: {
          type: "object",
          properties: { a: { type: "string" }, b: { type: "number" } },
        },
        keepFalse: { type: "object", additionalProperties: false },
      },
    };
    const fixed = sanitizeJsonSchemaForCodex(synthetic) as Record<string, unknown>;
    // booleans preserved
    expect((fixed as any).properties.keepFalse.additionalProperties).toBe(false);
    // required = every property key
    expect([...(fixed.required as string[])].sort()).toEqual(["keepFalse", "mapping", "nested"]);
    const mapping = (fixed as any).properties.mapping;
    expect(mapping.additionalProperties).toBe(false); // object-valued → forced false
    expect([...(mapping.required as string[])]).toEqual([]);
  });

  test("scalars and arrays pass through", () => {
    expect(sanitizeJsonSchemaForCodex("string")).toBe("string");
    expect(sanitizeJsonSchemaForCodex(42)).toBe(42);
    expect(sanitizeJsonSchemaForCodex(null)).toBe(null);
    expect(sanitizeJsonSchemaForCodex([{ type: "string" }])).toEqual([{ type: "string" }]);
  });
});
