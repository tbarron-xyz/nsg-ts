System.register("Hash", [], function (exports_1, context_1) {
    "use strict";
    var HashSet, JSONHashSet;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            HashSet = class HashSet {
                constructor(hashFunction, reverseHash, initialArray) {
                    this.hashFunction = hashFunction;
                    this.reverseHashFunction = reverseHash;
                    if (initialArray) {
                        this.valueSet = new Set(initialArray);
                    }
                    else {
                        this.valueSet = new Set();
                    }
                }
                add(newEl) {
                    this.valueSet.add(this.hashFunction(newEl));
                }
                has(el) {
                    return this.valueSet.has(this.hashFunction(el));
                }
                forEach(fn) {
                    this.valueSet.forEach(x => fn(this.reverseHashFunction(x)));
                }
                toArray() {
                    const returnArray = [];
                    this.forEach(x => returnArray.push(x));
                    return returnArray;
                }
            };
            exports_1("HashSet", HashSet);
            JSONHashSet = class JSONHashSet extends HashSet {
                constructor() {
                    super(JSON.stringify, JSON.parse);
                }
            };
            exports_1("JSONHashSet", JSONHashSet);
        }
    };
});
System.register("utils", [], function (exports_2, context_2) {
    "use strict";
    var zeroThroughN, addOneAtIndex, tupleGCD, tupleMinus, sum, product, numberArrayEqualityCheck, euclideanDistance, flattenArray, taxicabDistance;
    var __moduleName = context_2 && context_2.id;
    return {
        setters: [],
        execute: function () {
            exports_2("zeroThroughN", zeroThroughN = (n) => Array.from(Array(n).keys()));
            exports_2("addOneAtIndex", addOneAtIndex = (array, index) => {
                const array2 = array.slice();
                array2[index] += 1;
                return array2;
            });
            exports_2("tupleGCD", tupleGCD = (fac1, fac2) => zeroThroughN(fac1.length).map(x => Math.min(fac1[x], fac2[x])));
            exports_2("tupleMinus", tupleMinus = (fac1, fac2) => zeroThroughN(fac1.length).map(x => fac1[x] - fac2[x]));
            exports_2("sum", sum = (fac) => fac.reduce((a, b) => a + b, 0));
            exports_2("product", product = (numbers) => numbers.reduce((a, b) => a * b, 1));
            exports_2("numberArrayEqualityCheck", numberArrayEqualityCheck = (a, b) => zeroThroughN(a.length).every(x => a[x] === b[x]));
            exports_2("euclideanDistance", euclideanDistance = (fac1, fac2) => Math.pow(sum(fac1.map((el, i) => Math.pow(fac2[i] - fac1[i], 2))), 0.5));
            exports_2("flattenArray", flattenArray = (arrOfArrs) => arrOfArrs.reduce((a, b) => a.concat(b), []));
            exports_2("taxicabDistance", taxicabDistance = (fac1, fac2) => sum(fac1.map((x, i) => Math.abs(fac1[i] - fac2[i]))));
        }
    };
});
// Modified version of https://www.npmjs.com/package/union-find https://github.com/mikolalysenko/union-find
System.register("lib/union-find", [], function (exports_3, context_3) {
    "use strict";
    "use restrict";
    var __moduleName = context_3 && context_3.id;
    function UnionFind(count) {
        this.roots = new Array(count);
        this.ranks = new Array(count);
        for (var i = 0; i < count; ++i) {
            this.roots[i] = i;
            this.ranks[i] = 0;
        }
    }
    exports_3("default", UnionFind);
    return {
        setters: [],
        execute: function () {
            UnionFind.prototype.length = function () {
                return this.roots.length;
            };
            UnionFind.prototype.makeSet = function () {
                var n = this.roots.length;
                this.roots.push(n);
                this.ranks.push(0);
                return n;
            };
            UnionFind.prototype.find = function (x) {
                var roots = this.roots;
                while (roots[x] !== x) {
                    var y = roots[x];
                    roots[x] = roots[y];
                    x = y;
                }
                return x;
            };
            UnionFind.prototype.link = function (x, y) {
                var xr = this.find(x), yr = this.find(y);
                if (xr === yr) {
                    return;
                }
                var ranks = this.ranks, roots = this.roots, xd = ranks[xr], yd = ranks[yr];
                if (xd < yd) {
                    roots[xr] = yr;
                }
                else if (yd < xd) {
                    roots[yr] = xr;
                }
                else {
                    roots[yr] = xr;
                    ++ranks[xr];
                }
            };
        }
    };
});
// This is a typescriptified version of https://github.com/abetusk/kruskal.js
System.register("lib/kruskal", ["lib/union-find"], function (exports_4, context_4) {
    "use strict";
    var union_find_1, Kruskal;
    var __moduleName = context_4 && context_4.id;
    return {
        setters: [
            function (union_find_1_1) {
                union_find_1 = union_find_1_1;
            }
        ],
        execute: function () {// This is a typescriptified version of https://github.com/abetusk/kruskal.js
            // vertices hold data that will be used in the distance 'metric' function
            // edges holds position in vertices list
            //
            exports_4("Kruskal", Kruskal = {
                kruskal: (vertices, edgesAsIndexPairs, metric) => {
                    var finalEdges = [];
                    const forest = new union_find_1.default(vertices.length);
                    var edgeDist = [];
                    for (var ind in edgesAsIndexPairs) {
                        const u = edgesAsIndexPairs[ind][0];
                        const v = edgesAsIndexPairs[ind][1];
                        const e = { edge: edgesAsIndexPairs[ind], weight: metric(vertices[u], vertices[v]) };
                        edgeDist.push(e);
                    }
                    edgeDist.sort((a, b) => a.weight - b.weight);
                    for (var i = 0; i < edgeDist.length; i++) {
                        var u = edgeDist[i].edge[0];
                        var v = edgeDist[i].edge[1];
                        if (forest.find(u) != forest.find(v)) {
                            finalEdges.push([u, v]);
                            forest.link(u, v);
                        }
                    }
                    return finalEdges;
                }
            });
        }
    };
});
System.register("NumericalMonoid", ["Hash", "utils", "lib/kruskal"], function (exports_5, context_5) {
    "use strict";
    var Hash_1, utils_1, kruskal_1, NumericalMonoid;
    var __moduleName = context_5 && context_5.id;
    return {
        setters: [
            function (Hash_1_1) {
                Hash_1 = Hash_1_1;
            },
            function (utils_1_1) {
                utils_1 = utils_1_1;
            },
            function (kruskal_1_1) {
                kruskal_1 = kruskal_1_1;
            }
        ],
        execute: function () {
            NumericalMonoid = class NumericalMonoid {
                constructor(generators) {
                    this.generators = generators.slice().sort((a, b) => a - b);
                    this.cachedFacs = new Map();
                    this.cachedCatenaryDegrees = new Map();
                    this.cachedCatenaryDegreesByMetric = new Map();
                    this.cachedMSTsByMetric = new Map();
                }
                factorizations(n) {
                    if (n < 0) {
                        return [];
                    }
                    else if (n == 0) {
                        return [(new Array(this.generators.length)).fill(0)];
                    }
                    else if (this.cachedFacs.has(n)) {
                        return this.cachedFacs.get(n);
                    }
                    else {
                        if (this.calculatingNewMemoizedFactorizationCallback)
                            this.calculatingNewMemoizedFactorizationCallback(n);
                        const predecessorFactorizationsUpped = this.generators.map((generator, index) => {
                            return this.factorizations(n - generator).map(x => utils_1.addOneAtIndex(x, index));
                        });
                        const returnSet = new Hash_1.JSONHashSet();
                        predecessorFactorizationsUpped.forEach(x => {
                            x.forEach(factorization => returnSet.add(factorization));
                        });
                        const returnArray = returnSet.toArray();
                        this.cachedFacs.set(n, returnArray);
                        return returnArray;
                    }
                }
                hasElement(n) {
                    return this.factorizations(n).length > 0;
                }
                frobenius() {
                    for (let n = 0;; n++) {
                        if (utils_1.zeroThroughN(Math.min(...this.generators)).every(x => this.hasElement(n + x))) {
                            return n - 1;
                        }
                    }
                }
                AperyListOfNumericalSemigroupWRTElement(n) {
                    return utils_1.zeroThroughN(n).map(x => {
                        for (let i = 0;; i++) {
                            const elem = x + i * n;
                            if (this.hasElement(elem)) {
                                return elem;
                            }
                        }
                    });
                }
                crudeBoundForMaxBettiElement() {
                    return Math.min(...this.generators) * Math.max(...this.generators);
                    // Math.max(...bettiElements)
                }
                minimalSpanningTreeByMetric(n, metric) {
                    // Returns a list of pairs of indices pointing to factorizations within this.factorizations
                    // Is dynamic
                    if (this.cachedMSTsByMetric.has(metric)) {
                        const metricCache = this.cachedMSTsByMetric.get(metric);
                        if (metricCache.has(n)) {
                            return metricCache.get(n);
                        }
                    }
                    const factorizations = this.factorizations(n);
                    let edges;
                    if (n > this.crudeBoundForMaxBettiElement()) {
                        const pairsOfElAndMst = this.generators
                            .map(g => [n - g, this.minimalSpanningTreeByMetric(n - g, metric)]);
                        const factorizationPairs = pairsOfElAndMst
                            .map(([el, mst], i) => mst
                            .map(([index1, index2]) => [
                            utils_1.addOneAtIndex(this.factorizations(el)[index1], i),
                            utils_1.addOneAtIndex(this.factorizations(el)[index2], i)
                        ]))
                            .reduce((a, b) => a.concat(b), []);
                        const factorizationsIndexMap = new Map();
                        factorizations.forEach((fac, i) => {
                            factorizationsIndexMap.set(JSON.stringify(fac), i);
                        });
                        edges = [];
                        factorizationPairs.forEach(([fac1, fac2]) => {
                            const index1 = factorizationsIndexMap.get(JSON.stringify(fac1));
                            const index2 = factorizationsIndexMap.get(JSON.stringify(fac2));
                            edges.push([index1, index2]);
                        });
                    }
                    else {
                        edges = factorizations
                            .map((fac1, index1) => factorizations
                            .map((fac2, index2) => [index1, index2]))
                            .reduce((a, b) => a.concat(b), []);
                    }
                    const vertices = utils_1.zeroThroughN(factorizations.length);
                    const mstAsIndexPairs = kruskal_1.Kruskal.kruskal(vertices, edges, (index1, index2) => metric(factorizations[index1], factorizations[index2]));
                    const metricCache = (this.cachedMSTsByMetric.get(metric) || this.cachedMSTsByMetric.set(metric, new Map()).get(metric));
                    metricCache.set(n, mstAsIndexPairs);
                    return mstAsIndexPairs;
                }
                catenaryDegreeByMetric(n, metric) {
                    const mst = this.minimalSpanningTreeByMetric(n, metric);
                    const factorizations = this.factorizations(n);
                    return Math.max(...mst.map(([index1, index2]) => metric(factorizations[index1], factorizations[index2])));
                }
                dynamicMST(n, metric) {
                    return this.minimalSpanningTreeByMetric(n, metric);
                }
                dynamicCatenaryByMetric(n, metric) {
                    const mst = this.dynamicMST(n, metric);
                    const factorizations = this.factorizations(n);
                    return Math.max(...mst.map(x => metric(factorizations[x[0]], factorizations[x[1]])));
                }
                static maxDistanceToGCD(fac1, fac2) {
                    const gcd = utils_1.tupleGCD(fac1, fac2);
                    return Math.max(utils_1.sum(utils_1.tupleMinus(fac1, gcd)), utils_1.sum(utils_1.tupleMinus(fac2, gcd)));
                }
                static distanceForClassicCatenary(fac1, fac2) {
                    return NumericalMonoid.maxDistanceToGCD(fac1, fac2);
                }
            };
            exports_5("default", NumericalMonoid);
        }
    };
});
System.register("browser/orthonormal-basis", [], function (exports_6, context_6) {
    "use strict";
    var __moduleName = context_6 && context_6.id;
    /**
     * Create a 4D -> 3D isometric projection for
     *
     *     a*x + b*y + c*z + d*t = n
     *
     * The returned function maps a solution [x,y,z,t] to [X,Y,Z].
     *
     * Distances between points are preserved exactly.
     */
    function makeDisplayMapper([a, b, c, d], n = 1) {
        // Orthonormal basis vectors for the hyperplane
        // a*x + b*y + c*z + d*t = 0
        const ab2 = a * a + b * b;
        const abc2 = ab2 + c * c;
        const ab = Math.sqrt(ab2);
        const abc = Math.sqrt(abc2);
        const N = Math.sqrt(abc2 + d * d);
        const e1 = [
            b / ab,
            -a / ab,
            0,
            0
        ];
        const e2 = [
            a * c / (ab * abc),
            b * c / (ab * abc),
            -ab2 / (ab * abc),
            0
        ];
        const e3 = [
            a * d / (N * abc),
            b * d / (N * abc),
            c * d / (N * abc),
            -abc2 / (N * abc)
        ];
        return function ([x, y, z, t]) {
            return [
                x * e1[0] + y * e1[1] + z * e1[2] + t * e1[3],
                x * e2[0] + y * e2[1] + z * e2[2] + t * e2[3],
                x * e3[0] + y * e3[1] + z * e3[2] + t * e3[3]
            ];
        };
    }
    exports_6("makeDisplayMapper", makeDisplayMapper);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("browser/smallest-indep-basis", ["utils"], function (exports_7, context_7) {
    "use strict";
    var utils_2, lexCompare, canonicalDifference, euclideanNorm, centroidClosestFactorization, sortedDistinctEdgeEntries, independentBasisEntries, solveLinearSystem, solveInBasis, reparametrizePoints, reparametrizeBySmallestEdges, smallestEdgeReparametrization;
    var __moduleName = context_7 && context_7.id;
    return {
        setters: [
            function (utils_2_1) {
                utils_2 = utils_2_1;
            }
        ],
        execute: function () {
            lexCompare = (a, b) => {
                for (let i = 0; i < Math.min(a.length, b.length); i++) {
                    if (a[i] !== b[i])
                        return a[i] - b[i];
                }
                return a.length - b.length;
            };
            canonicalDifference = (fac1, fac2) => {
                const diff = fac2.map((x, i) => x - fac1[i]);
                const firstNonzero = diff.find(x => x !== 0);
                return firstNonzero !== undefined && firstNonzero < 0 ? diff.map(x => -x) : diff;
            };
            euclideanNorm = (v) => Math.sqrt(v.reduce((acc, x) => acc + x * x, 0));
            exports_7("centroidClosestFactorization", centroidClosestFactorization = (factorizations) => {
                const dims = factorizations[0].length;
                const centroid = Array.from({ length: dims }, (_, i) => factorizations.reduce((acc, fac) => acc + fac[i], 0) / factorizations.length);
                let best = factorizations[0];
                let bestDist = Infinity;
                factorizations.forEach(fac => {
                    const dist = Math.sqrt(fac.reduce((acc, x, i) => acc + Math.pow(x - centroid[i], 2), 0));
                    if (dist < bestDist) {
                        bestDist = dist;
                        best = fac;
                    }
                });
                return best;
            });
            exports_7("sortedDistinctEdgeEntries", sortedDistinctEdgeEntries = (factorizations, edges, weights) => {
                const byDifference = new Map();
                edges.forEach((edge, i) => {
                    const diff = canonicalDifference(factorizations[edge[0]], factorizations[edge[1]]);
                    const key = JSON.stringify(diff);
                    const existing = byDifference.get(key);
                    if (!existing || weights[i] < existing.weight)
                        byDifference.set(key, { diff: diff, weight: weights[i] });
                });
                return Array.from(byDifference.values())
                    .sort((a, b) => {
                    if (a.weight !== b.weight)
                        return a.weight - b.weight;
                    const normDelta = euclideanNorm(a.diff) - euclideanNorm(b.diff);
                    if (normDelta !== 0)
                        return normDelta;
                    return lexCompare(a.diff, b.diff);
                });
            });
            exports_7("independentBasisEntries", independentBasisEntries = (entries) => {
                const basis = [];
                const originalRanks = [];
                const ortho = [];
                for (let rank = 0; rank < entries.length && basis.length < 3; rank++) {
                    const candidate = entries[rank].diff;
                    let residual = candidate.slice();
                    ortho.forEach(q => {
                        const proj = q.reduce((acc, x, i) => acc + x * candidate[i], 0);
                        residual = residual.map((x, i) => x - proj * q[i]);
                    });
                    const residualNorm = euclideanNorm(residual);
                    if (residualNorm > 1e-9 * Math.max(1, euclideanNorm(candidate))) {
                        basis.push(entries[rank]);
                        originalRanks.push(rank);
                        ortho.push(residual.map(x => x / residualNorm));
                    }
                }
                return { basis: basis, originalRanks: originalRanks };
            });
            solveLinearSystem = (matrix, rhs) => {
                const n = matrix.length;
                const scale = Math.max(1, ...matrix.map(row => Math.max(...row.map(Math.abs))));
                const eps = 1e-9 * scale;
                const a = matrix.map((row, i) => row.concat([rhs[i]]));
                for (let col = 0; col < n; col++) {
                    let pivot = col;
                    for (let row = col + 1; row < n; row++) {
                        if (Math.abs(a[row][col]) > Math.abs(a[pivot][col]))
                            pivot = row;
                    }
                    if (Math.abs(a[pivot][col]) < eps)
                        return null;
                    const tmp = a[col];
                    a[col] = a[pivot];
                    a[pivot] = tmp;
                    for (let row = 0; row < n; row++) {
                        if (row === col)
                            continue;
                        const factor = a[row][col] / a[col][col];
                        for (let j = col; j <= n; j++)
                            a[row][j] -= factor * a[col][j];
                    }
                }
                return a.map((row, i) => row[n] / row[i]);
            };
            solveInBasis = (basis, v) => {
                const u = [0, 0, 0];
                const active = basis.map((_, i) => i);
                while (active.length > 0) {
                    const k = active.length;
                    const gram = Array.from({ length: k }, () => new Array(k).fill(0));
                    const proj = new Array(k).fill(0);
                    for (let dim = 0; dim < v.length; dim++) {
                        for (let i = 0; i < k; i++) {
                            proj[i] += basis[active[i]][dim] * v[dim];
                            for (let j = 0; j < k; j++) {
                                gram[i][j] += basis[active[i]][dim] * basis[active[j]][dim];
                            }
                        }
                    }
                    const solution = solveLinearSystem(gram, proj);
                    if (solution) {
                        active.forEach((slot, i) => { u[slot] = solution[i]; });
                        return u;
                    }
                    let drop = 0;
                    for (let i = 1; i < k; i++) {
                        if (gram[i][i] < gram[drop][drop])
                            drop = i;
                    }
                    active.splice(drop, 1);
                }
                return u;
            };
            exports_7("reparametrizePoints", reparametrizePoints = (points, origin, basisEntries) => {
                const basis = basisEntries.map(entry => entry.diff);
                return points.map(p => solveInBasis(basis, utils_2.tupleMinus(p, origin)));
            });
            exports_7("reparametrizeBySmallestEdges", reparametrizeBySmallestEdges = (factorizations, basisEntries) => {
                if (factorizations.length === 0)
                    return [];
                const origin = centroidClosestFactorization(factorizations);
                return reparametrizePoints(factorizations, origin, basisEntries);
            });
            exports_7("smallestEdgeReparametrization", smallestEdgeReparametrization = (factorizations, edges, weights) => {
                const sortedEntries = sortedDistinctEdgeEntries(factorizations, edges, weights);
                const selection = independentBasisEntries(sortedEntries);
                const origin = factorizations.length > 0 ? centroidClosestFactorization(factorizations) : null;
                const projected = reparametrizeBySmallestEdges(factorizations, selection.basis);
                return { projected: projected, origin: origin, selection: selection };
            });
        }
    };
});
System.register("browser/main", ["NumericalMonoid", "utils", "browser/orthonormal-basis", "browser/smallest-indep-basis"], function (exports_8, context_8) {
    "use strict";
    var NumericalMonoid_1, utils_3, orthonormal_basis_1, smallest_indep_basis_1, MetricType, updateStateElement, persistStateToHash, readStateFromHash, updateMetric, catenaryFunction, metricFunction, state, getInput, getValueOfInput, fourthGeneratorActive, currentGenerators, numericalMonoidOfCurrentInputs, updateGenerators, moveUpOrDownByElement, catenaryDegreePalette, renderCatenaryTable, projectFactorization, axisMins, applyShift, facText, renderReparamEdges, facsMap, colorMap, polytopeCorners, polytopeTraces, roundWeight, edgeCoordsFromPoints, groupedEdgeTracesByDistance, upByLcmOverG, upByG, ANIMATION_DURATION_MS, easeInOutCubic, lerp, interpolatePoints, lastFrame, animationGeneration, plotReact, sceneLayout, animateMetricTransition, renderPlotly;
    var __moduleName = context_8 && context_8.id;
    return {
        setters: [
            function (NumericalMonoid_1_1) {
                NumericalMonoid_1 = NumericalMonoid_1_1;
            },
            function (utils_3_1) {
                utils_3 = utils_3_1;
            },
            function (orthonormal_basis_1_1) {
                orthonormal_basis_1 = orthonormal_basis_1_1;
            },
            function (smallest_indep_basis_1_1) {
                smallest_indep_basis_1 = smallest_indep_basis_1_1;
            }
        ],
        execute: function () {
            (function (MetricType) {
                MetricType[MetricType["Classic"] = 0] = "Classic";
                MetricType[MetricType["Euclidean"] = 1] = "Euclidean";
                MetricType[MetricType["Taxicab"] = 2] = "Taxicab";
            })(MetricType || (MetricType = {}));
            exports_8("MetricType", MetricType);
            window.onload = () => {
                [1, 2, 3, 4].map(x => getInput(x)).forEach(x => {
                    x.onchange = updateGenerators;
                });
                document.getElementById('element-input').onchange = e => {
                    try {
                        updateStateElement(parseInt(e.target.value));
                    }
                    catch (e) {
                        console.error(e);
                    }
                };
                Array.from(document.querySelectorAll('input[name="metric"]')).forEach(radio => {
                    radio.onchange = e => {
                        updateMetric(parseInt(e.target.value));
                    };
                });
                document.getElementById('collapse3-checkbox').onchange = e => {
                    renderPlotly(false, true);
                };
                document.getElementById('reparam-checkbox').onchange = e => {
                    renderPlotly(false, true);
                };
                document.getElementById('polytope-checkbox').onchange = e => {
                    renderPlotly();
                };
                document.getElementById("renderTable").onchange = e => {
                    renderCatenaryTable();
                };
                // document.getElementById('explode-button').onclick = e => {
                //     updateStateElement(state.element, true);
                // }
                const applyMoveElement = (genIndex, up) => updateStateElement(moveUpOrDownByElement(genIndex, up, state.element));
                document.onkeydown = (ev) => {
                    switch (ev.key) {
                        case 'a':
                            applyMoveElement(1, true);
                            break;
                        case 'z':
                            applyMoveElement(1, false);
                            break;
                        case 's':
                            applyMoveElement(2, true);
                            break;
                        case 'x':
                            applyMoveElement(2, false);
                            break;
                        case 'd':
                            applyMoveElement(3, true);
                            break;
                        case 'c':
                            applyMoveElement(3, false);
                            break;
                        case 'f':
                            if (fourthGeneratorActive())
                                applyMoveElement(4, true);
                            break;
                        case 'v':
                            if (fourthGeneratorActive())
                                applyMoveElement(4, false);
                            break;
                        default:
                            return;
                    }
                };
                [1, 2, 3, 4].map(i => {
                    document.getElementById(`up${i}`).onclick = e => {
                        applyMoveElement(i, true);
                    };
                    document.getElementById(`down${i}`).onclick = e => {
                        applyMoveElement(i, false);
                    };
                });
                readStateFromHash();
                document.querySelector(`input[name="metric"][value="${state.metric}"]`).checked = true;
                state.numericalMonoid = numericalMonoidOfCurrentInputs();
                updateStateElement(state.element);
            };
            updateStateElement = (element, explode = false, animate = false) => {
                state.element = element;
                document.getElementById('element-input').value = element.toString();
                document.getElementById('catenary-input').value = catenaryFunction(state.numericalMonoid, state.metric)(element).toString();
                renderPlotly(explode, animate);
                renderCatenaryTable();
                persistStateToHash();
            };
            persistStateToHash = () => {
                const params = [
                    `gens=${currentGenerators().join(',')}`,
                    `element=${state.element}`,
                    state.metric !== MetricType.Classic ? `metric=${MetricType[state.metric].toLowerCase()}` : '',
                ].filter(x => x !== '').join('&');
                history.replaceState(null, '', `#${params}`);
            };
            readStateFromHash = () => {
                const params = new URLSearchParams(window.location.hash.slice(1));
                const element = parseInt(params.get('element'));
                if (!isNaN(element))
                    state.element = element;
                const metricParam = params.get('metric');
                if (metricParam === 'euclidean' || metricParam === 'taxicab')
                    state.metric = metricParam === 'euclidean' ? MetricType.Euclidean : MetricType.Taxicab;
                (params.get('gens') || '').split(',').map(s => parseInt(s)).forEach((gen, i) => {
                    if (!isNaN(gen) && i < 4)
                        getInput(i + 1).value = gen.toString();
                });
            };
            updateMetric = (metric) => {
                state.metric = metric;
                updateStateElement(state.element, false, true);
            };
            // const maxnonredFunction = (nm: NumericalMonoid, useEuclidean: boolean) => (useEuclidean ? nm.maxnonreducibleEdgesEuclidean : nm.maxnonreducibleEdges).bind(nm);
            catenaryFunction = (nm, metric) => (x) => nm.catenaryDegreeByMetric(x, metricFunction(metric));
            metricFunction = (metric) => {
                switch (metric) {
                    case MetricType.Euclidean:
                        return utils_3.euclideanDistance;
                    case MetricType.Taxicab:
                        return utils_3.taxicabDistance;
                    default:
                        return NumericalMonoid_1.default.distanceForClassicCatenary;
                }
            };
            state = {
                numericalMonoid: null,
                element: 0,
                metric: MetricType.Classic
            };
            getInput = (id) => document.getElementById(`input${id}`);
            getValueOfInput = (id) => parseInt(getInput(id).value);
            fourthGeneratorActive = () => getInput(4).value.trim() !== '' && !isNaN(getValueOfInput(4));
            currentGenerators = () => fourthGeneratorActive()
                ? [getValueOfInput(1), getValueOfInput(2), getValueOfInput(3), getValueOfInput(4)]
                : [getValueOfInput(1), getValueOfInput(2), getValueOfInput(3)];
            numericalMonoidOfCurrentInputs = () => new NumericalMonoid_1.default(currentGenerators());
            updateGenerators = () => {
                state.numericalMonoid = numericalMonoidOfCurrentInputs();
                updateStateElement(state.element);
            };
            moveUpOrDownByElement = (generatorIndex, up, currentElement) => {
                return currentElement + (up ? 1 : -1) * getValueOfInput(generatorIndex);
            };
            catenaryDegreePalette = ['#d62728', '#1f77b4', '#2ca02c', '#9467bd', '#ff7f0e', '#8c564b', '#e377c2', '#17becf', '#bcbd22', '#7f7f7f'];
            renderCatenaryTable = () => {
                if (!state.numericalMonoid || !document.getElementById("renderTable").checked) {
                    document.getElementById('catenary-table').innerHTML = '';
                    return;
                }
                const element = state.element;
                const generators = state.numericalMonoid.generators;
                const minGen = Math.min(...generators);
                const maxGen = Math.max(...generators);
                const cat = catenaryFunction(state.numericalMonoid, state.metric);
                const gridValues = Array.from({ length: maxGen }, (_, r) => Array.from({ length: minGen }, (_, c) => {
                    const el = element + r * minGen + c * maxGen;
                    return state.numericalMonoid.hasElement(el) ? cat(el) : null;
                }));
                const distinctValues = Array.from(new Set([].concat(...gridValues).filter(v => v !== null)))
                    .sort((a, b) => a - b);
                const colorOfValue = new Map();
                distinctValues.forEach((v, i) => colorOfValue.set(v, catenaryDegreePalette[i % catenaryDegreePalette.length]));
                const span = (text, color) => `<span style="color:${color}">${text}</span>`;
                const pad = (text, width) => ' '.repeat(Math.max(0, width - text.length)) + text;
                const cellText = (v) => v === null ? '-' : v.toString();
                const headerRow = [''].concat(Array.from({ length: minGen }, (_, c) => (element + c * maxGen).toString()));
                const rowLabel = (r) => (element + r * minGen).toString();
                const labelWidth = Math.max(...Array.from({ length: maxGen }, (_, r) => rowLabel(r).length));
                const columnWidths = headerRow.map((h, j) => j === 0
                    ? labelWidth
                    : Math.max(h.length, ...gridValues.map(row => cellText(row[j - 1]).length)));
                const lines = [headerRow.map((h, j) => pad(h, columnWidths[j])).join('  ')];
                gridValues.forEach((rowValues, r) => {
                    const cells = rowValues.map((v, c) => {
                        const text = pad(cellText(v), columnWidths[c + 1]);
                        return v === null ? text : span(text, colorOfValue.get(v));
                    });
                    lines.push([pad(rowLabel(r), labelWidth)].concat(cells).join('  '));
                });
                const legendEntries = distinctValues.map(v => span(v.toString(), colorOfValue.get(v)));
                const legendLines = [];
                for (let i = 0; i < legendEntries.length; i += 10) {
                    legendLines.push(legendEntries.slice(i, i + 10).join('  '));
                }
                document.getElementById('catenary-table').innerHTML = legendLines.concat(lines).join('\n');
            };
            projectFactorization = (fac, element, generators, collapse3 = false) => {
                if (generators.length === 3)
                    return [fac[0], fac[1], collapse3 ? 0 : fac[2]];
                if (element === 0)
                    return [0, 0, 0];
                return orthonormal_basis_1.makeDisplayMapper(generators)(fac);
                // return [fac[1] * generators[1] / element, fac[2] * generators[2] / element, fac[3] * generators[3] / element];
            };
            axisMins = (projected) => [0, 1, 2].map(i => Math.min(0, ...projected.map(p => p[i])));
            applyShift = (projected, mins) => projected.map(p => [p[0] - mins[0], p[1] - mins[1], p[2] - mins[2]]);
            facText = (fac) => '(' + fac.join(', ') + ')';
            renderReparamEdges = (origin, selection) => {
                const lines = [];
                if (origin) {
                    lines.push(`origin = ${facText(origin)}`);
                }
                selection.basis.forEach((entry, i) => {
                    const rank = selection.originalRanks[i];
                    const note = rank > i ? `  (${rank + 1 === 3 ? '3rd' : rank + 1 + 'th'} smallest, ${rank - i} dependent skipped)` : '';
                    lines.push(`e${i + 1} = ${facText(entry.diff)}  d = ${Math.round(entry.weight * 100) / 100}${note}`);
                });
                if (selection.basis.length < 3) {
                    const dead = [2, 1, 0].slice(3 - selection.basis.length).map(i => `u${i + 1}`).reverse().join(', ');
                    lines.push(`edge differences span ${selection.basis.length}D — ${dead} ≡ 0`);
                }
                document.getElementById('reparam-edges').innerHTML = lines.join('\n');
            };
            facsMap = (projected, color, text) => {
                return {
                    showlegend: false,
                    x: projected.map(x => x[0]),
                    y: projected.map(x => x[1]),
                    z: projected.map(x => x[2]),
                    text: text,
                    hovertemplate: '%{text}<extra></extra>',
                    mode: 'markers',
                    marker: {
                        size: 5,
                        line: {
                            color: color,
                            width: 0.5
                        },
                        opacity: 0.8
                    },
                    type: 'scatter3d'
                };
            };
            colorMap = i => i == 0 ? "red" : i == 1 ? "blue" : i == 2 ? "green" : "purple";
            polytopeCorners = (element, generators) => generators.map((g, i) => generators.map((_, j) => j === i ? element / g : 0));
            /**
             * Simplex with corners (element/g_1, 0, ...), ..., (0, ..., element/g_n) that
             * contains every factorization. Renders its 1-skeleton only: corner markers
             * plus one lines trace joining every pair of corners (no faces), at 0.2 opacity.
             */
            polytopeTraces = (corners, displayCorners) => {
                const color = 'rgba(0, 0, 0, 0.2)';
                const cornerTrace = {
                    showlegend: false,
                    name: 'containing polytope',
                    x: displayCorners.map(c => c[0]),
                    y: displayCorners.map(c => c[1]),
                    z: displayCorners.map(c => c[2]),
                    text: corners.map(facText),
                    hovertemplate: '%{text}<extra></extra>',
                    mode: 'markers',
                    marker: { size: 5, color: color },
                    type: 'scatter3d'
                };
                const pairs = [];
                for (let i = 0; i < displayCorners.length; i++) {
                    for (let j = i + 1; j < displayCorners.length; j++)
                        pairs.push([i, j]);
                }
                const coord = (dim) => pairs.reduce((acc, pair, k) => {
                    const start = displayCorners[pair[0]][dim];
                    const end = displayCorners[pair[1]][dim];
                    return k === 0 ? acc.concat([start, end]) : acc.concat([null, start, end]);
                }, []);
                const edgeTrace = {
                    showlegend: false,
                    name: 'containing polytope',
                    x: coord(0),
                    y: coord(1),
                    z: coord(2),
                    mode: 'lines',
                    line: { color: color },
                    type: 'scatter3d'
                };
                return [cornerTrace, edgeTrace];
            };
            roundWeight = (w) => Math.round(w * 1e9) / 1e9;
            edgeCoordsFromPoints = (edges, display, dim) => edges.reduce((acc, edge, i) => {
                const start = display[edge[0]][dim];
                const end = display[edge[1]][dim];
                return i === 0 ? acc.concat([start, end]) : acc.concat([null, start, end]);
            }, []);
            /**
             * Group edges into one Plotly trace per distinct distance (measured with the
             * selected metric, classic or euclidean), instead of one anonymous trace per edge.
             * All segments of equal length are merged into a single scatter3d lines trace
             * (nulls separate the segments), named `d = <distance>`, so the legend reads
             * distances rather than "trace 0", "trace 1", ...
             * Expects edges in Kruskal order (ascending weight); groups preserve that order.
             * Returns one { edges, trace } entry per group so callers can rebuild trace
             * coordinates from (interpolated) point positions via edgeCoordsFromPoints.
             */
            groupedEdgeTracesByDistance = (edges, weights, display, extraProps = {}) => {
                const groups = [];
                edges.forEach((edge, i) => {
                    const weight = roundWeight(weights[i]);
                    const group = groups.find(g => g.weight === weight);
                    if (group)
                        group.edges.push(edge);
                    else
                        groups.push({ weight: weight, edges: [edge] });
                });
                return groups.map(group => ({
                    edges: group.edges,
                    trace: Object.assign({
                        name: `d = ${Math.round(group.weight * 100) / 100}`,
                        legendgroup: String(group.weight),
                        showlegend: true,
                        x: edgeCoordsFromPoints(group.edges, display, 0),
                        y: edgeCoordsFromPoints(group.edges, display, 1),
                        z: edgeCoordsFromPoints(group.edges, display, 2),
                        mode: 'lines',
                        type: 'scatter3d'
                    }, extraProps),
                }));
            };
            upByLcmOverG = (i, lcm, g) => (z, j) => j == i ? (z + lcm / g) : z;
            upByG = (i, lcm, g) => (z, j) => z + g;
            ANIMATION_DURATION_MS = 450;
            easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            lerp = (a, b, t) => a + (b - a) * t;
            interpolatePoints = (from, to, t) => from.map((p, i) => [0, 1, 2].map(d => lerp(p[d], to[i][d], t)));
            lastFrame = null;
            animationGeneration = 0;
            plotReact = (data, layout) => {
                const container = document.getElementById('plotly-container');
                if (container && container._fullLayout) {
                    const currentCamera = container._fullLayout.scene && container._fullLayout.scene.camera;
                    if (currentCamera) {
                        layout.scene.camera = currentCamera;
                    }
                    Plotly.react('plotly-container', data, layout);
                }
                else {
                    Plotly.newPlot('plotly-container', data, layout);
                }
            };
            sceneLayout = (axisMax) => {
                const axisLayout = { range: [0, axisMax] };
                return {
                    uirevision: 'true',
                    scene: {
                        aspectmode: "manual",
                        aspectratio: { x: 1, y: 1, z: 1 },
                        margin: { l: 0, r: 0, b: 0, t: 0 },
                        xaxis: axisLayout,
                        yaxis: axisLayout,
                        zaxis: axisLayout
                    }
                };
            };
            /**
             * Glide the previous render's geometry to the target geometry over
             * ANIMATION_DURATION_MS, re-plotting via plotReact every frame with an
             * ease-in-out interpolation of point/corner positions and the axis maximum.
             * A generation token cancels the loop as soon as any newer render starts.
             */
            animateMetricTransition = (generation, from, to, buildFrame) => {
                const startedAt = performance.now();
                const step = (now) => {
                    if (generation !== animationGeneration)
                        return;
                    const raw = Math.min(1, (now - startedAt) / ANIMATION_DURATION_MS);
                    const t = easeInOutCubic(raw);
                    const frame = buildFrame(interpolatePoints(from.points, to.points, t), interpolatePoints(from.corners, to.corners, t), lerp(from.axisMax, to.axisMax, t));
                    plotReact(frame.data, frame.layout);
                    if (raw < 1)
                        requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            };
            renderPlotly = (explode = false, animate = false) => {
                const generation = ++animationGeneration;
                let data;
                let layout;
                if (explode) {
                    const factorizations = state.numericalMonoid.factorizations(state.element);
                    const element = state.element;
                    const generators = state.numericalMonoid.generators;
                    const lcm = utils_3.product(generators);
                    const exploded = generators.map((g, i) => factorizations.map(y => y.map(upByLcmOverG(i, lcm, g))));
                    const explodedProjected = exploded.map(explodee => explodee.map(fac => projectFactorization(fac, element, generators)));
                    const mins = axisMins(utils_3.flattenArray(explodedProjected));
                    const explodedDisplay = explodedProjected.map(projected => applyShift(projected, mins));
                    const traces = explodedDisplay.map((display, i) => facsMap(display, colorMap(i), factorizations.map(facText)));
                    const metric = metricFunction(state.metric);
                    const MST = state.numericalMonoid.minimalSpanningTreeByMetric(state.element, metric);
                    const minEdges = MST;
                    const distances = minEdges.map(([index1, index2]) => metric(factorizations[index1], factorizations[index2]));
                    document.getElementById('reparam-edges').innerHTML = '';
                    const minimalMSTTraces = [];
                    let aggregateGlobalAxisMax = 0;
                    explodedDisplay.forEach((display, i) => {
                        groupedEdgeTracesByDistance(minEdges, distances, display, {
                            showlegend: i === 0,
                            marker: {
                                size: 11,
                                line: {
                                    color: colorMap(i),
                                    width: 0.5
                                },
                                opacity: 0.8
                            }
                        }).forEach(group => minimalMSTTraces.push(group.trace));
                        aggregateGlobalAxisMax = Math.max(aggregateGlobalAxisMax, ...utils_3.flattenArray(display));
                    });
                    const axisLayout = { range: [0, aggregateGlobalAxisMax] };
                    layout = {
                        scene: {
                            aspectmode: "manual",
                            aspectratio: { x: 1, y: 1, z: 1 },
                            margin: { l: 0, r: 0, b: 0, t: 0 },
                            xaxis: axisLayout,
                            yaxis: axisLayout,
                            zaxis: axisLayout
                        }
                    };
                    data = [...traces, ...minimalMSTTraces];
                }
                else {
                    const factorizations = state.numericalMonoid.factorizations(state.element);
                    const element = state.element;
                    const generators = state.numericalMonoid.generators;
                    const metric = metricFunction(state.metric);
                    const MST = state.numericalMonoid.minimalSpanningTreeByMetric(state.element, metric);
                    const minEdges = MST;
                    const distances = minEdges.map(([index1, index2]) => metric(factorizations[index1], factorizations[index2]));
                    const reparamChecked = document.getElementById("reparam-checkbox").checked;
                    const reparam = reparamChecked ? smallest_indep_basis_1.smallestEdgeReparametrization(factorizations, minEdges, distances) : null;
                    const collapse3Checked = document.getElementById("collapse3-checkbox").checked;
                    const polytopeChecked = document.getElementById("polytope-checkbox").checked;
                    const projected = reparam
                        ? reparam.projected
                        : factorizations.map(fac => projectFactorization(fac, element, generators, collapse3Checked));
                    if (reparam) {
                        renderReparamEdges(reparam.origin, reparam.selection);
                    }
                    else {
                        document.getElementById('reparam-edges').innerHTML = '';
                    }
                    const corners = polytopeChecked && (reparam === null || reparam.origin !== null)
                        ? polytopeCorners(element, generators)
                        : [];
                    const projectedCorners = corners.length === 0
                        ? []
                        : reparam
                            ? smallest_indep_basis_1.reparametrizePoints(corners, reparam.origin, reparam.selection.basis)
                            : corners.map(corner => projectFactorization(corner, element, generators, collapse3Checked));
                    const mins = axisMins(projected.concat(projectedCorners));
                    const display = applyShift(projected, mins);
                    const displayCorners = applyShift(projectedCorners, mins);
                    const trace1 = facsMap(display, 'rgba(217, 217, 217, 0.14)', factorizations.map(facText));
                    const minimalMSTGroups = groupedEdgeTracesByDistance(minEdges, distances, display);
                    const globalAxisMax = Math.max(0, ...utils_3.flattenArray(display), ...utils_3.flattenArray(displayCorners));
                    const currentFrame = {
                        points: display,
                        corners: displayCorners,
                        edgeGroups: minimalMSTGroups,
                        axisMax: globalAxisMax
                    };
                    data = [trace1, ...minimalMSTGroups.map(group => group.trace), ...polytopeTraces(corners, displayCorners)];
                    layout = sceneLayout(globalAxisMax);
                    if (animate && lastFrame !== null
                        && lastFrame.points.length === display.length
                        && lastFrame.corners.length === displayCorners.length) {
                        const buildFrame = (points, cornerPoints, axisMax) => ({
                            data: [
                                Object.assign({}, trace1, {
                                    x: points.map(p => p[0]),
                                    y: points.map(p => p[1]),
                                    z: points.map(p => p[2])
                                }),
                                ...minimalMSTGroups.map(group => Object.assign({}, group.trace, {
                                    x: edgeCoordsFromPoints(group.edges, points, 0),
                                    y: edgeCoordsFromPoints(group.edges, points, 1),
                                    z: edgeCoordsFromPoints(group.edges, points, 2)
                                })),
                                ...polytopeTraces(corners, cornerPoints)
                            ],
                            layout: sceneLayout(axisMax)
                        });
                        animateMetricTransition(generation, lastFrame, currentFrame, buildFrame);
                    }
                    else {
                        plotReact(data, layout);
                    }
                    lastFrame = currentFrame;
                    return;
                }
                plotReact(data, layout);
            };
        }
    };
});
