import NumericalMonoid, { Factorization } from '../NumericalMonoid';
import { tupleGCD, flattenArray, euclideanDistance, product, taxicabDistance } from '../utils';
import { makeDisplayMapper } from './orthonormal-basis';
import { smallestEdgeReparametrization, reparametrizePoints, ReparamSelection } from './smallest-indep-basis';

declare var Plotly;

export enum MetricType { Classic = 0, Euclidean = 1, Taxicab = 2 }

window.onload = () => {
    [1, 2, 3, 4].map(x => getInput(x)).forEach(x => {
        x.onchange = updateGenerators;
    });
    document.getElementById('element-input').onchange = e => {
        try {
            updateStateElement(parseInt((<HTMLInputElement>e.target).value))
        } catch (e) {
            console.error(e);
        }
    };
    Array.from(<NodeListOf<HTMLInputElement>>document.querySelectorAll('input[name="metric"]')).forEach(radio => {
        radio.onchange = e => {
            updateMetric(parseInt((<HTMLInputElement>e.target).value));
        }
    });
    document.getElementById('collapse3-checkbox').onchange = e => {
        renderPlotly(false, true);
    }
    document.getElementById('reparam-checkbox').onchange = e => {
        renderPlotly(false, true);
    }
    document.getElementById('polytope-checkbox').onchange = e => {
        renderPlotly();
    }
    document.getElementById("renderTable").onchange = e => {
        renderCatenaryTable();
    }
    // document.getElementById('explode-button').onclick = e => {
    //     updateStateElement(state.element, true);
    // }

    const applyMoveElement = (genIndex: number, up: boolean) => updateStateElement(moveUpOrDownByElement(genIndex, up, state.element));
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
                if (fourthGeneratorActive()) applyMoveElement(4, true);
                break;
            case 'v':
                if (fourthGeneratorActive()) applyMoveElement(4, false);
                break;
            default:
                return;
        }
    }
    [1,2,3,4].map(i => {
        document.getElementById(`up${i}`).onclick = e => {
            applyMoveElement(i, true);
        }
        document.getElementById(`down${i}`).onclick = e => {
            applyMoveElement(i, false);
        }
    })

    readStateFromHash();
    (<HTMLInputElement>document.querySelector(`input[name="metric"][value="${state.metric}"]`)).checked = true;
    state.numericalMonoid = numericalMonoidOfCurrentInputs();
    updateStateElement(state.element);
}

const updateStateElement = (element: number, explode = false, animate = false) => {
    state.element = element;
    (<HTMLInputElement>document.getElementById('element-input')).value = element.toString();
    (<HTMLInputElement>document.getElementById('catenary-input')).value = catenaryFunction(state.numericalMonoid, state.metric)(element).toString();
    renderPlotly(explode, animate);
    renderCatenaryTable();
    persistStateToHash();
}

const persistStateToHash = () => {
    const params = [
        `gens=${currentGenerators().join(',')}`,
        `element=${state.element}`,
        state.metric !== MetricType.Classic ? `metric=${MetricType[state.metric].toLowerCase()}` : '',
    ].filter(x => x !== '').join('&');
    history.replaceState(null, '', `#${params}`);
}

const readStateFromHash = () => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const element = parseInt(params.get('element'));
    if (!isNaN(element)) state.element = element;
    const metricParam = params.get('metric');
    if (metricParam === 'euclidean' || metricParam === 'taxicab') state.metric = metricParam === 'euclidean' ? MetricType.Euclidean : MetricType.Taxicab;
    (params.get('gens') || '').split(',').map(s => parseInt(s)).forEach((gen, i) => {
        if (!isNaN(gen) && i < 4) getInput(i + 1).value = gen.toString();
    });
}

const updateMetric = (metric: MetricType) => {
    state.metric = metric;
    updateStateElement(state.element, false, true);
}

// const maxnonredFunction = (nm: NumericalMonoid, useEuclidean: boolean) => (useEuclidean ? nm.maxnonreducibleEdgesEuclidean : nm.maxnonreducibleEdges).bind(nm);
const catenaryFunction = (nm: NumericalMonoid, metric: MetricType) =>
    (x: number) =>
        nm.catenaryDegreeByMetric(x, metricFunction(metric));
const metricFunction = (metric: MetricType) => {
    switch (metric) {
        case MetricType.Euclidean:
            return euclideanDistance;
        case MetricType.Taxicab:
            return taxicabDistance;
        default:
            return NumericalMonoid.distanceForClassicCatenary;
    }
}

const state: {
    numericalMonoid: NumericalMonoid,
    element: number,
    metric: MetricType
} = {
    numericalMonoid: null,
    element: 0,
    metric: MetricType.Classic
};

const getInput = (id: number) => <HTMLInputElement>document.getElementById(`input${id}`);

const getValueOfInput = (id: number) => parseInt(getInput(id).value);

const fourthGeneratorActive = () => getInput(4).value.trim() !== '' && !isNaN(getValueOfInput(4));

const currentGenerators = () => fourthGeneratorActive()
    ? [getValueOfInput(1), getValueOfInput(2), getValueOfInput(3), getValueOfInput(4)]
    : [getValueOfInput(1), getValueOfInput(2), getValueOfInput(3)];

const numericalMonoidOfCurrentInputs = () => new NumericalMonoid(currentGenerators());

const updateGenerators = () => {
    state.numericalMonoid = numericalMonoidOfCurrentInputs();
    updateStateElement(state.element);
}

const moveUpOrDownByElement = (generatorIndex: number, up: boolean, currentElement: number) => {
    return currentElement + (up ? 1 : -1) * getValueOfInput(generatorIndex);
}

const catenaryDegreePalette = ['#d62728', '#1f77b4', '#2ca02c', '#9467bd', '#ff7f0e', '#8c564b', '#e377c2', '#17becf', '#bcbd22', '#7f7f7f'];

const renderCatenaryTable = () => {
    if (!state.numericalMonoid || !(document.getElementById("renderTable") as HTMLInputElement).checked) {
        (<HTMLPreElement>document.getElementById('catenary-table')).innerHTML = '';
        return;
    }
    const element = state.element;
    const generators = state.numericalMonoid.generators;
    const minGen = Math.min(...generators);
    const maxGen = Math.max(...generators);
    const cat = catenaryFunction(state.numericalMonoid, state.metric);
    const gridValues: (number | null)[][] = Array.from({ length: maxGen }, (_, r) =>
        Array.from({ length: minGen }, (_, c) => {
            const el = element + r * minGen + c * maxGen;
            return state.numericalMonoid.hasElement(el) ? cat(el) : null;
        }));
    const distinctValues = <number[]>Array.from(new Set([].concat(...gridValues).filter(v => v !== null)))
        .sort((a, b) => a - b);
    const colorOfValue = new Map<number, string>();
    distinctValues.forEach((v, i) => colorOfValue.set(v, catenaryDegreePalette[i % catenaryDegreePalette.length]));
    const span = (text: string, color: string) => `<span style="color:${color}">${text}</span>`;
    const pad = (text: string, width: number) => ' '.repeat(Math.max(0, width - text.length)) + text;
    const cellText = (v: number | null) => v === null ? '-' : v.toString();
    const headerRow = [''].concat(Array.from({ length: minGen }, (_, c) => (element + c * maxGen).toString()));
    const rowLabel = (r: number) => (element + r * minGen).toString();
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
    (<HTMLPreElement>document.getElementById('catenary-table')).innerHTML = legendLines.concat(lines).join('\n');
}

const projectFactorization = (fac: Factorization, element: number, generators: number[], collapse3: boolean = false): Factorization => {
    if (generators.length === 3) return [fac[0], fac[1], collapse3 ? 0 : fac[2]];
    if (element === 0) return [0, 0, 0];
    return makeDisplayMapper(generators)(fac);
    // return [fac[1] * generators[1] / element, fac[2] * generators[2] / element, fac[3] * generators[3] / element];
}

const axisMins = (projected: number[][]) => [0, 1, 2].map(i => Math.min(0, ...projected.map(p => p[i])));

const applyShift = (projected: number[][], mins: number[]) =>
    projected.map(p => [p[0] - mins[0], p[1] - mins[1], p[2] - mins[2]]);

const facText = (fac: Factorization) => '(' + fac.join(', ') + ')';

const renderReparamEdges = (origin: Factorization | null, selection: ReparamSelection) => {
    const lines: string[] = [];
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
    (<HTMLPreElement>document.getElementById('reparam-edges')).innerHTML = lines.join('\n');
};

const facsMap = (projected: number[][], color: string, text: string[]) => {
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
}

const colorMap = i => i == 0 ? "red" : i == 1 ? "blue" : i == 2 ? "green" : "purple";

const polytopeCorners = (element: number, generators: number[]): Factorization[] =>
    generators.map((g, i) => generators.map((_, j) => j === i ? element / g : 0));

/**
 * Simplex with corners (element/g_1, 0, ...), ..., (0, ..., element/g_n) that
 * contains every factorization. Renders its 1-skeleton only: corner markers
 * plus one lines trace joining every pair of corners (no faces), at 0.2 opacity.
 */
const polytopeTraces = (corners: Factorization[], displayCorners: number[][]) => {
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
    const pairs: [number, number][] = [];
    for (let i = 0; i < displayCorners.length; i++) {
        for (let j = i + 1; j < displayCorners.length; j++) pairs.push([i, j]);
    }
    const coord = (dim: number) => pairs.reduce((acc: number[], pair, k) => {
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

const roundWeight = (w: number) => Math.round(w * 1e9) / 1e9;

const edgeCoordsFromPoints = (edges: [number, number][], display: number[][], dim: number) =>
    edges.reduce((acc: number[], edge, i) => {
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
const groupedEdgeTracesByDistance = (
    edges: [number, number][],
    weights: number[],
    display: number[][],
    extraProps: any = {},
) => {
    const groups: { weight: number, edges: [number, number][] }[] = [];
    edges.forEach((edge, i) => {
        const weight = roundWeight(weights[i]);
        const group = groups.find(g => g.weight === weight);
        if (group) group.edges.push(edge);
        else groups.push({ weight: weight, edges: [edge] });
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

const upByLcmOverG = (i, lcm, g) => (z, j) => j == i ? (z + lcm / g) : z;
const upByG = (i, lcm, g) => (z, j) => z + g;

const ANIMATION_DURATION_MS = 450;
const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const interpolatePoints = (from: number[][], to: number[][], t: number) =>
    from.map((p, i) => [0, 1, 2].map(d => lerp(p[d], to[i][d], t)));

type LastFrame = {
    points: number[][],
    corners: number[][],
    edgeGroups: { edges: [number, number][], trace: any }[],
    axisMax: number
};

let lastFrame: LastFrame = null;
let animationGeneration = 0;

const plotReact = (data: any[], layout: any) => {
    const container = document.getElementById('plotly-container') as any;
    if (container && container._fullLayout) {
        const currentCamera = container._fullLayout.scene && container._fullLayout.scene.camera;
        if (currentCamera) {
            layout.scene.camera = currentCamera;
        }
        Plotly.react('plotly-container', data, layout);
    } else {
        Plotly.newPlot('plotly-container', data, layout);
    }
};

const sceneLayout = (axisMax: number) => {
    const axisLayout = { range: [0, axisMax] };
    return {
        uirevision: 'true', // Keep this value constant on updates
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
const animateMetricTransition = (
    generation: number,
    from: LastFrame,
    to: LastFrame,
    buildFrame: (points: number[][], corners: number[][], axisMax: number) => { data: any[], layout: any },
) => {
    const startedAt = performance.now();
    const step = (now: number) => {
        if (generation !== animationGeneration) return;
        const raw = Math.min(1, (now - startedAt) / ANIMATION_DURATION_MS);
        const t = easeInOutCubic(raw);
        const frame = buildFrame(
            interpolatePoints(from.points, to.points, t),
            interpolatePoints(from.corners, to.corners, t),
            lerp(from.axisMax, to.axisMax, t));
        plotReact(frame.data, frame.layout);
        if (raw < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
};

const renderPlotly = (explode = false, animate = false) => {
    const generation = ++animationGeneration;
    let data: any[];
    let layout: any;

    if (explode) {
        const factorizations = state.numericalMonoid.factorizations(state.element);
        const element = state.element;
        const generators = state.numericalMonoid.generators;
        const lcm = product(generators);
        const exploded: Factorization[][] = generators.map((g, i) =>
            factorizations.map(y => y.map(
                upByLcmOverG(i, lcm, g))));
        const explodedProjected: number[][][] = exploded.map(explodee =>
            explodee.map(fac => projectFactorization(fac, element, generators)));
        const mins = axisMins(flattenArray(explodedProjected));
        const explodedDisplay = explodedProjected.map(projected => applyShift(projected, mins));
        const traces = explodedDisplay.map((display, i) => facsMap(display, colorMap(i), factorizations.map(facText)));

        const metric = metricFunction(state.metric);
        const MST = state.numericalMonoid.minimalSpanningTreeByMetric(state.element, metric);
        const minEdges = MST;
        const distances = minEdges.map(([index1, index2]) => metric(factorizations[index1], factorizations[index2]));
        (<HTMLPreElement>document.getElementById('reparam-edges')).innerHTML = '';
        const minimalMSTTraces: any[] = [];
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
            aggregateGlobalAxisMax = Math.max(aggregateGlobalAxisMax, ...flattenArray(display));
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
    } else {
        const factorizations = state.numericalMonoid.factorizations(state.element);
        const element = state.element;
        const generators = state.numericalMonoid.generators;
        const metric = metricFunction(state.metric);
        const MST = state.numericalMonoid.minimalSpanningTreeByMetric(state.element, metric);
        const minEdges = MST;
        const distances = minEdges.map(([index1, index2]) => metric(factorizations[index1], factorizations[index2]));
        const reparamChecked = (<HTMLInputElement>document.getElementById("reparam-checkbox")).checked;
        const reparam = reparamChecked ? smallestEdgeReparametrization(factorizations, minEdges, distances) : null;
        const collapse3Checked = (<HTMLInputElement>document.getElementById("collapse3-checkbox")).checked;
        const polytopeChecked = (<HTMLInputElement>document.getElementById("polytope-checkbox")).checked;
        const projected = reparam
            ? reparam.projected
            : factorizations.map(fac => projectFactorization(fac, element, generators, collapse3Checked));
        if (reparam) {
            renderReparamEdges(reparam.origin, reparam.selection);
        } else {
            (<HTMLPreElement>document.getElementById('reparam-edges')).innerHTML = '';
        }
        const corners = polytopeChecked && (reparam === null || reparam.origin !== null)
            ? polytopeCorners(element, generators)
            : [];
        const projectedCorners = corners.length === 0
            ? []
            : reparam
                ? reparametrizePoints(corners, reparam.origin, reparam.selection.basis)
                : corners.map(corner => projectFactorization(corner, element, generators, collapse3Checked));
        const mins = axisMins(projected.concat(projectedCorners));
        const display = applyShift(projected, mins);
        const displayCorners = applyShift(projectedCorners, mins);
        const trace1 = facsMap(display, 'rgba(217, 217, 217, 0.14)', factorizations.map(facText));
        const minimalMSTGroups = groupedEdgeTracesByDistance(minEdges, distances, display);
        const globalAxisMax = Math.max(0, ...flattenArray(display), ...flattenArray(displayCorners));
        const currentFrame: LastFrame = {
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
            const buildFrame = (points: number[][], cornerPoints: number[][], axisMax: number) => ({
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
        } else {
            plotReact(data, layout);
        }
        lastFrame = currentFrame;
        return;
    }

    plotReact(data, layout);
}