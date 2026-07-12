import { describe, expect, it } from "vitest";
import { sampleCurvedSegment, smoothStep } from "./journey-path";

describe("journey path", () => {
  it("keeps both directional routes joined to the same anchors", () => {
    const from = { x: 100, y: 160 };
    const to = { x: 720, y: 480 };

    expect(sampleCurvedSegment(from, to, 0, 120)).toEqual(from);
    expect(sampleCurvedSegment(from, to, 1, -170)).toEqual(to);
  });

  it("uses a different curve when the user returns upward", () => {
    const from = { x: 100, y: 160 };
    const to = { x: 720, y: 480 };
    const downRoute = sampleCurvedSegment(from, to, 0.5, 120);
    const upRoute = sampleCurvedSegment(from, to, 0.5, -170);

    expect(Math.abs(downRoute.x - upRoute.x)).toBeGreaterThan(40);
    expect(Math.abs(downRoute.y - upRoute.y)).toBeGreaterThan(40);
  });

  it("clamps the eased section progress", () => {
    expect(smoothStep(-1)).toBe(0);
    expect(smoothStep(2)).toBe(1);
  });
});
