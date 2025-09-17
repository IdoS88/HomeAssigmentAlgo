# House Rules
- Node.js 22, ESM ("type":"module"), strict TypeScript.
- Use Node's native test runner (`node:test`). No Jest/Vitest.
- No floats for money (use integer agorot everywhere).
- Costs: 30₪/hour (time) + driver.fuelCost ₪/km (fuel).
- Include loaded + deadhead time/km when CLI flags enable them.
- Israel licence legality: B ≤ 8, D1 ≤ 16, D ≥ 17 (and must meet vehicle seats).
- Travel engine is pluggable: Haversine default; OSRM when `--osrm`.
- Ties: prefer lower `fuelCost`, then stable IDs.
- Small, pure, testable functions. Add/update tests with changes.
