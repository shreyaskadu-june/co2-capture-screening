const fs = require('fs');
const html = fs.readFileSync('/home/claude/co2-capture-screening/index.html', 'utf8');
const a = html.indexOf('// ---- BEGIN CALC'), b = html.indexOf('// ---- END CALC');
const C = new Function(html.slice(a, b) + '\nreturn {screen,specificEnergy,warnings,sensitivity,CO2_KG_PER_KG_PER_LOAD,MOL_MEA_PER_KG};')();
const base = { fgNm3h: 100000, y: 12, cap: 90, aLean: 0.21, aRich: 0.42, hours: 8000, src: 'gas', eff: 90 };
let fails = 0; const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + ' ' + (info || '')); if (!ok) fails++; };

// 1. Mass balance: CO2 in = 100000/22.414 kmol * 0.12 * 44.01 kg/h
const r = C.screen(base);
const co2In = 100000 / 22.414 * 0.12 * 44.01 / 1000;     // t/h
check('CO2 captured = 90% of inlet', Math.abs(r.co2CapT - co2In * 0.9) < 1e-9, r.co2CapT.toFixed(3) + ' t/h');
// 2. Solvent: CO2 kg/h / (0.216 * dA)
const solvExpected = r.co2CapT * 1000 / (C.CO2_KG_PER_KG_PER_LOAD * 0.21);
check('solvent = CO2 / (0.216 * dA)', Math.abs(r.solvT * 1000 - solvExpected) < 1e-6, r.solvT.toFixed(1) + ' t/h');
// 3. MEA moles per kg solution sanity
check('30 wt% MEA = 4.91 mol/kg', Math.abs(C.MOL_MEA_PER_KG - 4.9116) < 0.001, C.MOL_MEA_PER_KG.toFixed(4));
// 4. Literature cross-check: 5.5% CO2, 90% capture, swing 0.19–0.23 -> L/G should bracket 1.58–1.64
const lo = C.screen({ ...base, y: 5.5, aLean: 0.23, aRich: 0.42 }).LG;   // dA 0.19
const hi = C.screen({ ...base, y: 5.5, aLean: 0.19, aRich: 0.42 }).LG;   // dA 0.23
const minLG = Math.min(lo, hi), maxLG = Math.max(lo, hi);
check('L/G range at 5.5% CO2 overlaps paper optimum 1.58–1.64', minLG <= 1.64 && maxLG >= 1.58, 'range ' + minLG.toFixed(2) + ' to ' + maxLG.toFixed(2));
// 5. Energy interpolation through source points
check('E at 0.21 = 4.4', Math.abs(C.specificEnergy(0.21) - 4.4) < 1e-9);
check('E at 0.26 = 3.64', Math.abs(C.specificEnergy(0.26) - 3.64) < 1e-9);
check('E midpoint 0.235 = 4.02', Math.abs(C.specificEnergy(0.235) - 4.02) < 1e-9, C.specificEnergy(0.235).toFixed(3));
// 6. Reboiler MW = E * kg/h / 3600
check('reboiler MW = E*kg/h/3600', Math.abs(r.QMW - 4.4 * r.co2CapT * 1000 / 3600) < 1e-6, r.QMW.toFixed(2) + ' MW');
// 7. Net capture ratio: gas, 90% eff -> regen kgCO2/kgCO2 = (4.4/3.6)/0.9*0.18231
const netExp = 1 - (4.4 / 3.6) / 0.9 * 0.18231;
check('net capture ratio (gas)', Math.abs(r.netRatio - netExp) < 1e-9, (r.netRatio * 100).toFixed(1) + '%');
// 8. Electric option uses grid factor and 100% efficiency
const el = C.screen({ ...base, src: 'elec' });
check('net capture ratio (grid electric)', Math.abs(el.netRatio - (1 - (4.4 / 3.6) * 0.13096)) < 1e-9, (el.netRatio * 100).toFixed(1) + '%');
// 9. Trade-off: solvent rises with lean loading, energy falls
const s = C.sensitivity(base);
const mono = s.every((x, i) => i === 0 || (x.dA <= 0 || s[i - 1].dA <= 0) || (x.solvT >= s[i - 1].solvT - 1e-9 && x.E <= s[i - 1].E + 1e-9));
check('trade-off monotonic (solvent up, energy down with lean)', mono);
// 10. Invalid dA gives no solvent
check('dA<=0 returns NaN solvent', !isFinite(C.screen({ ...base, aLean: 0.42 }).solvT));
// 11. Warnings fire for out-of-range inputs
check('warning for capture > 95%', C.warnings({ ...base, cap: 97 }).some(w => /95%/.test(w[1])));
check('no warnings for base case', C.warnings(base).length === 0, JSON.stringify(C.warnings(base)));
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
console.log('base case:', JSON.stringify({ co2: r.co2CapT.toFixed(2), solv: r.solvT.toFixed(0), LG: r.LG.toFixed(2), MW: r.QMW.toFixed(1), net: (r.netRatio*100).toFixed(1) }));
