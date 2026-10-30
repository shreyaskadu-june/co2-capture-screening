# Amine CO₂ Capture Screening Calculator

A screening calculator for a 30 wt% MEA absorber–stripper: solvent circulation, regeneration energy, solvent-to-gas ratio, net capture ratio after regeneration emissions, annual totals, and a lean-loading trade-off table (CSV export).

Open `index.html` in a browser. No build step, no dependencies.

## Scope
This is a screening tool, not a design basis. It does not size columns, model temperature profiles, estimate capital or operating cost, or replace a rate-based simulator.

## Sources
- Specific regeneration energy and solvent-to-gas ratio: Rezazadeh, Gale, Akram, Hughes & Pourkashanian (2016), International Journal of Greenhouse Gas Control 53, pp. 243–253. https://eprints.whiterose.ac.uk/104320/3/PerformanceEvaluation.pdf
- Carbon factors (gas 0.18231 kg CO₂e/kWh gross CV; grid electricity 0.13096 kg CO₂e/kWh): DESNZ GHG conversion factors 2026.

## Assumptions to replace with site data
- Boiler efficiency (default 90%).
- Rich loading (default 0.42), which should come from absorber design.
- Bulk flue gas molar mass 28.5 kg/kmol (dry, N₂/O₂).

## Tests
`node test_calc.js` runs the formula checks, including a cross-check against the paper's solvent-to-gas ratio.
