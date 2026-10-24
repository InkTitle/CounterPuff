import assert from "node:assert/strict";

function dailyCost(p) {
  if (p.quantityPerDay != null && p.packSize != null && p.packSize > 0 && p.pricePerPack != null && p.pricePerPack > 0) {
    return (p.quantityPerDay / p.packSize) * p.pricePerPack;
  }
  if (p.monthlySpend != null && p.monthlySpend > 0) return p.monthlySpend / 30;
  return 0;
}

function combinedDailyCost(products) {
  return products.reduce((s, p) => s + dailyCost(p), 0);
}

const cigs = { productType: "cigarettes", quantityPerDay: 20, packSize: 20, pricePerPack: 10, monthlySpend: null };
assert.equal(dailyCost(cigs), 10);
const vape = { productType: "pod_systems", quantityPerDay: null, packSize: null, pricePerPack: null, monthlySpend: 30 };
assert.equal(dailyCost(vape), 1);
assert.equal(combinedDailyCost([cigs, vape]), 11);

const reduced = { ...cigs, quantityPerDay: 10 };
assert.equal(dailyCost(reduced), 5);

console.log("calculation checks passed");
