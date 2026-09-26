import { describe, it, expect } from "vitest";
import { genCode, stageOfStatus, parseLatLngInput, isColdSelection, VEHICLE_TYPES } from "@/lib/constants";

describe("code generation", () => {
  it("pads sequence numbers", () => {
    expect(genCode("QT", 7, 4)).toMatch(/0007$/);
    expect(genCode("QT", 7, 4)).toContain("QT");
  });
});

describe("trip stages", () => {
  it("orders the lifecycle correctly", () => {
    const order = ["DISPATCHED", "COLLECTING", "IN_TRANSIT", "AT_DELIVERY", "DELIVERED"].map(stageOfStatus);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(new Set(order).size).toBe(order.length);
  });
});

describe("map link parsing", () => {
  it("reads plain lat, lng text", () => {
    expect(parseLatLngInput("21.5433, 39.1728")).toEqual({ lat: 21.5433, lng: 39.1728 });
  });
  it("returns null for junk", () => {
    expect(parseLatLngInput("not a location")).toBeNull();
  });
});

describe("cold-chain equipment", () => {
  it("flags reefer selections and not dry freight", () => {
    const cold = VEHICLE_TYPES.filter((v) => v.cold).map((v) => v.code);
    const dry = VEHICLE_TYPES.filter((v) => !v.cold).map((v) => v.code);
    expect(cold.length).toBeGreaterThan(0);
    expect(isColdSelection(cold.slice(0, 1))).toBe(true);
    expect(isColdSelection(dry.slice(0, 1))).toBe(false);
  });
});
