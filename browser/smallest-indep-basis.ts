import { Factorization } from '../NumericalMonoid';
import { tupleMinus } from '../utils';

export type BasisEntry = { diff: Factorization, weight: number };

export type ReparamSelection = { basis: BasisEntry[], originalRanks: number[] };

const lexCompare = (a: number[], b: number[]) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] !== b[i]) return a[i] - b[i];
    }
    return a.length - b.length;
};

const canonicalDifference = (fac1: Factorization, fac2: Factorization): Factorization => {
    const diff = fac2.map((x, i) => x - fac1[i]);
    const firstNonzero = diff.find(x => x !== 0);
    return firstNonzero !== undefined && firstNonzero < 0 ? diff.map(x => -x) : diff;
};

const euclideanNorm = (v: number[]) => Math.sqrt(v.reduce((acc, x) => acc + x * x, 0));

export const centroidClosestFactorization = (factorizations: Factorization[]): Factorization => {
    const dims = factorizations[0].length;
    const centroid = Array.from({ length: dims }, (_, i) =>
        factorizations.reduce((acc, fac) => acc + fac[i], 0) / factorizations.length);
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
};

export const sortedDistinctEdgeEntries = (factorizations: Factorization[], edges: [number, number][], weights: number[]): BasisEntry[] => {
    const byDifference = new Map<string, { diff: Factorization, weight: number }>();
    edges.forEach((edge, i) => {
        const diff = canonicalDifference(factorizations[edge[0]], factorizations[edge[1]]);
        const key = JSON.stringify(diff);
        const existing = byDifference.get(key);
        if (!existing || weights[i] < existing.weight) byDifference.set(key, { diff: diff, weight: weights[i] });
    });
    return Array.from(byDifference.values())
        .sort((a, b) => {
            if (a.weight !== b.weight) return a.weight - b.weight;
            const normDelta = euclideanNorm(a.diff) - euclideanNorm(b.diff);
            if (normDelta !== 0) return normDelta;
            return lexCompare(a.diff, b.diff);
        });
};

export const independentBasisEntries = (entries: BasisEntry[]): ReparamSelection => {
    const basis: BasisEntry[] = [];
    const originalRanks: number[] = [];
    const ortho: number[][] = [];
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
};

const solveLinearSystem = (matrix: number[][], rhs: number[]): number[] | null => {
    const n = matrix.length;
    const scale = Math.max(1, ...matrix.map(row => Math.max(...row.map(Math.abs))));
    const eps = 1e-9 * scale;
    const a = matrix.map((row, i) => row.concat([rhs[i]]));
    for (let col = 0; col < n; col++) {
        let pivot = col;
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
        }
        if (Math.abs(a[pivot][col]) < eps) return null;
        const tmp = a[col]; a[col] = a[pivot]; a[pivot] = tmp;
        for (let row = 0; row < n; row++) {
            if (row === col) continue;
            const factor = a[row][col] / a[col][col];
            for (let j = col; j <= n; j++) a[row][j] -= factor * a[col][j];
        }
    }
    return a.map((row, i) => row[n] / row[i]);
};

const solveInBasis = (basis: Factorization[], v: Factorization): number[] => {
    const u = [0, 0, 0];
    const active = basis.map((_, i) => i);
    while (active.length > 0) {
        const k = active.length;
        const gram: number[][] = Array.from({ length: k }, () => new Array(k).fill(0));
        const proj: number[] = new Array(k).fill(0);
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
            if (gram[i][i] < gram[drop][drop]) drop = i;
        }
        active.splice(drop, 1);
    }
    return u;
};

export const reparametrizeBySmallestEdges = (factorizations: Factorization[], basisEntries: BasisEntry[]): number[][] => {
    if (factorizations.length === 0) return [];
    const basis = basisEntries.map(entry => entry.diff);
    const origin = centroidClosestFactorization(factorizations);
    return factorizations.map(fac => solveInBasis(basis, tupleMinus(fac, origin)));
};

export type ReparamResult = {
    projected: number[][],
    origin: Factorization | null,
    selection: ReparamSelection
};

export const smallestEdgeReparametrization = (factorizations: Factorization[], edges: [number, number][], weights: number[]): ReparamResult => {
    const sortedEntries = sortedDistinctEdgeEntries(factorizations, edges, weights);
    const selection = independentBasisEntries(sortedEntries);
    const origin = factorizations.length > 0 ? centroidClosestFactorization(factorizations) : null;
    const projected = reparametrizeBySmallestEdges(factorizations, selection.basis);
    return { projected: projected, origin: origin, selection: selection };
};
