
import cytoscape = require('cytoscape');

import { JSONHashSet, HashSet } from './Hash';
import { zeroThroughN, addOneAtIndex, tupleMinus, tupleGCD, sum, euclideanDistance, flattenArray, product, numberArrayEqualityCheck, canonicalDifference } from './utils';

// / <reference path="kruskal.d.ts" />
import { Kruskal } from './lib/kruskal';

export type Factorization = number[];
type Metric = ((a: Factorization, b: Factorization) => number);
type NodeAsIndex = number;
type EdgeAsIndices = [NodeAsIndex, NodeAsIndex];
type MSTAsIndices = EdgeAsIndices[];    // expressed as indexes in this.factorizations(n) which has a fixed order

export default class NumericalMonoid {
    generators: number[];
    cachedFacs: Map<number, Factorization[]>;
    cachedCatenaryDegrees: Map<number, number>;
    cachedCatenaryDegreesByMetric: Map<Metric, Map<number, number>>;
    cachedMSTsByMetric: Map<Metric, Map<number, MSTAsIndices>>;

    calculatingNewMemoizedFactorizationCallback?: ((n: number) => void);

    constructor(generators: number[]) {
        this.generators = generators.slice().sort((a, b) => a - b);
        this.cachedFacs = new Map<number, number[][]>();
        this.cachedCatenaryDegrees = new Map<number, number>();
        this.cachedCatenaryDegreesByMetric = new Map();
        this.cachedMSTsByMetric = new Map();
    }

    factorizations(n: number): Factorization[] {
        if (n < 0) {
            return [];
        } else if (n == 0) {
            return [(new Array(this.generators.length)).fill(0)];
        } else if (this.cachedFacs.has(n)) {
            return this.cachedFacs.get(n);
        } else {
            if (this.calculatingNewMemoizedFactorizationCallback) this.calculatingNewMemoizedFactorizationCallback(n);
            const predecessorFactorizationsUpped = this.generators.map((generator, index) => {
                return this.factorizations(n - generator).map(x => addOneAtIndex(x, index));
            });
            const returnSet = new JSONHashSet<number[]>();
            predecessorFactorizationsUpped.forEach(x => {
                x.forEach(factorization => returnSet.add(factorization));
            });
            const returnArray = returnSet.toArray();
            this.cachedFacs.set(n, returnArray);
            return returnArray;
        }
    }

    hasElement(n: number): boolean {
        return this.factorizations(n).length > 0;
    }

    frobenius(): number {
        for (let n = 0; ; n++) {
            if (zeroThroughN(Math.min(...this.generators)).every(x => this.hasElement(n + x))) {
                return n - 1;
            }
        }
    }

    AperyListOfNumericalSemigroupWRTElement(n: number): number[] {
        return zeroThroughN(n).map(x => {
            for (let i = 0; ; i++) {
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

    /**
     * Computes the MST over the candidate edges of n. When prioritizedDiffs is
     * non-empty, candidate edges whose canonicalized factorization difference
     * matches one of those diffs are placed first in the edge list handed to
     * Kruskal, so weight ties are broken in their favor (Kruskal's sort is
     * stable, so its tie-breaking follows input order). Prioritized runs are
     * not cached; sub-MSTs computed recursively stay in the plain cache.
     */
    minimalSpanningTreeByMetric(n: number, metric: Metric, prioritizedDiffs: Factorization[] = []): MSTAsIndices {
        // Returns a list of pairs of indices pointing to factorizations within this.factorizations
        // Is dynamic
        const prioritized = prioritizedDiffs.length > 0;
        if (!prioritized) {
            if (this.cachedMSTsByMetric.has(metric)) {
                const metricCache = this.cachedMSTsByMetric.get(metric);
                if (metricCache.has(n)) {
                    return metricCache.get(n);
                }
            }
        }
        const factorizations = this.factorizations(n);
        let edges: EdgeAsIndices[];
        if (n > this.crudeBoundForMaxBettiElement()) {
            const pairsOfElAndMst = this.generators
                .map(g => [n - g, this.minimalSpanningTreeByMetric(n - g, metric)] as [number, MSTAsIndices]);
            const factorizationPairs = pairsOfElAndMst
                .map(([el, mst], i) => mst
                    .map(([index1, index2]) => [
                        addOneAtIndex(this.factorizations(el)[index1], i),
                        addOneAtIndex(this.factorizations(el)[index2], i)
                    ] as [Factorization, Factorization]))
                .reduce((a, b) => a.concat(b), []);
            const factorizationsIndexMap = new Map<string, number>();
            factorizations.forEach((fac, i) => {
                factorizationsIndexMap.set(JSON.stringify(fac), i);
            });
            edges = [];
            factorizationPairs.forEach(([fac1, fac2]) => {
                const index1 = factorizationsIndexMap.get(JSON.stringify(fac1));
                const index2 = factorizationsIndexMap.get(JSON.stringify(fac2));
                edges.push([index1, index2]);
            });
        } else {
            edges = factorizations
                .map((fac1, index1) => factorizations
                    .map((fac2, index2) => [index1, index2] as [number, number]))
                .reduce((a, b) => a.concat(b), []);
        }
        const vertices = zeroThroughN(factorizations.length);
        let orderedEdges = edges;
        if (prioritized) {
            const diffKeys = prioritizedDiffs.map(diff => JSON.stringify(diff));
            orderedEdges = edges
                .map((edge, order) => ({
                    edge: edge,
                    rank: diffKeys.indexOf(JSON.stringify(canonicalDifference(factorizations[edge[0]], factorizations[edge[1]]))),
                    order: order
                }))
                .sort((a, b) => (a.rank - b.rank) || (a.order - b.order))
                .map(x => x.edge);
        }
        const mstAsIndexPairs = Kruskal.kruskal(vertices, orderedEdges, (index1, index2) => metric(factorizations[index1], factorizations[index2]));
        if (!prioritized) {
            const metricCache = (this.cachedMSTsByMetric.get(metric) || this.cachedMSTsByMetric.set(metric, new Map()).get(metric));
            metricCache.set(n, mstAsIndexPairs);
        }
        return mstAsIndexPairs;
    }

    catenaryDegreeByMetric(n: number, metric: Metric): number {
        const mst = this.minimalSpanningTreeByMetric(n, metric);
        const factorizations = this.factorizations(n);
        return Math.max(...mst.map(([index1, index2]) => metric(factorizations[index1], factorizations[index2])));
    }

    dynamicMST(n: number, metric: Metric): MSTAsIndices {
        return this.minimalSpanningTreeByMetric(n, metric);
    }

    dynamicCatenaryByMetric(n: number, metric: Metric): number {
        const mst = this.dynamicMST(n, metric);
        const factorizations = this.factorizations(n);
        return Math.max(...mst.map(x => metric(factorizations[x[0]], factorizations[x[1]])));
    }

    static maxDistanceToGCD(fac1: Factorization, fac2: Factorization): number {
        const gcd = tupleGCD(fac1, fac2);
        return Math.max(sum(tupleMinus(fac1, gcd)), sum(tupleMinus(fac2, gcd)));
    }

    static distanceForClassicCatenary(fac1: Factorization, fac2: Factorization): number {
        return NumericalMonoid.maxDistanceToGCD(fac1, fac2);
    }
}


