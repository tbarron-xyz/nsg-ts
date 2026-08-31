import { updateElementAccess } from '../node_modules/typescript/lib/typescript';
import NumericalMonoid, { Factorization } from '../NumericalMonoid';
import { tupleGCD, flattenArray, euclideanDistance, product } from '../utils';

declare var Plotly;

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
    document.getElementById('euclidean-checkbox').onchange = e => {
        updateEuclideanCheckbox((<HTMLInputElement>e.target).checked);
    }
    document.getElementById('explode-button').onclick = e => {
        updateStateElement(state.element, true);
    }

    const applyMoveElement = (x: number, b: boolean) => updateStateElement(moveUpOrDownByElement(x, b, state.element));
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

    readStateFromHash();
    (<HTMLInputElement>document.getElementById('euclidean-checkbox')).checked = state.useEuclidean;
    state.numericalMonoid = numericalMonoidOfCurrentInputs();
    updateStateElement(state.element);
}

const updateStateElement = (element: number, explode = false) => {
    state.element = element;
    (<HTMLInputElement>document.getElementById('element-input')).value = element.toString();
    (<HTMLInputElement>document.getElementById('catenary-input')).value = catenaryFunction(state.numericalMonoid, state.useEuclidean)(element).toString();
    renderPlotly(explode);
    persistStateToHash();
}

const persistStateToHash = () => {
    const params = new URLSearchParams();
    params.set('element', state.element.toString());
    if (state.useEuclidean) params.set('euclidean', '1');
    history.replaceState(null, '', `#${params.toString()}`);
}

const readStateFromHash = () => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const element = parseInt(params.get('element'));
    if (!isNaN(element)) state.element = element;
    state.useEuclidean = params.get('euclidean') === '1';
}

const updateEuclideanCheckbox = (useEuclidean: boolean) => {
    state.useEuclidean = useEuclidean;
    updateStateElement(state.element);
}

// const maxnonredFunction = (nm: NumericalMonoid, useEuclidean: boolean) => (useEuclidean ? nm.maxnonreducibleEdgesEuclidean : nm.maxnonreducibleEdges).bind(nm);
const catenaryFunction = (nm: NumericalMonoid, useEuclidean: boolean) =>
    (x: number) =>
        nm.catenaryDegreeByMetric(x, metricFunction(useEuclidean));
const metricFunction = (useEuclidean: boolean) => useEuclidean ? euclideanDistance : NumericalMonoid.distanceForClassicCatenary;

const state: {
    numericalMonoid: NumericalMonoid,
    element: number,
    useEuclidean: boolean
} = {
    numericalMonoid: null,
    element: 0,
    useEuclidean: false
};

const getInput = (id: number) => <HTMLInputElement>document.getElementById(`input${id}`);

const getValueOfInput = (id: number) => parseInt(getInput(id).value);

const fourthGeneratorActive = () => getInput(4).value.trim() !== '' && !isNaN(getValueOfInput(4));

const numericalMonoidOfCurrentInputs = () => new NumericalMonoid(fourthGeneratorActive()
    ? [getValueOfInput(1), getValueOfInput(2), getValueOfInput(3), getValueOfInput(4)]
    : [getValueOfInput(1), getValueOfInput(2), getValueOfInput(3)]);

const updateGenerators = () => {
    state.numericalMonoid = numericalMonoidOfCurrentInputs();
    renderPlotly();
}

const moveUpOrDownByElement = (generatorIndex: number, up: boolean, currentElement: number) => {
    return currentElement + (up ? 1 : -1) * getValueOfInput(generatorIndex);
}

/**
 * Create a 4D -> 3D isometric projection for
 *
 *     a*x + b*y + c*z + d*t = n
 *
 * The returned function maps a solution [x,y,z,t] to [X,Y,Z].
 *
 * Distances between points are preserved exactly.
 */
function makeDisplayMapper([a, b, c, d]: number[], n = 1) {
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

  return function ([x, y, z, t]: number[]) {
    return [
      x * e1[0] + y * e1[1] + z * e1[2] + t * e1[3],
      x * e2[0] + y * e2[1] + z * e2[2] + t * e2[3],
      x * e3[0] + y * e3[1] + z * e3[2] + t * e3[3]
    ];
  };
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

const roundWeight = (w: number) => Math.round(w * 1e9) / 1e9;

/**
 * Group edges into one Plotly trace per distinct distance (measured with the
 * selected metric, classic or euclidean), instead of one anonymous trace per edge.
 * All segments of equal length are merged into a single scatter3d lines trace
 * (nulls separate the segments), named `d = <distance>`, so the legend reads
 * distances rather than "trace 0", "trace 1", ...
 * Expects edges in Kruskal order (ascending weight); groups preserve that order.
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
    return groups.map(group => {
        const coord = (dim: number) => group.edges.reduce((acc: number[], edge, i) => {
            const start = display[edge[0]][dim];
            const end = display[edge[1]][dim];
            return i === 0 ? acc.concat([start, end]) : acc.concat([null, start, end]);
        }, []);
        return Object.assign({
            name: `d = ${Math.round(group.weight * 100) / 100}`,
            legendgroup: String(group.weight),
            showlegend: true,
            x: coord(0),
            y: coord(1),
            z: coord(2),
            mode: 'lines',
            type: 'scatter3d'
        }, extraProps);
    });
};

const upByLcmOverG = (i, lcm, g) => (z, j) => j == i ? (z + lcm / g) : z;
const upByG = (i, lcm, g) => (z, j) => z + g;

const renderPlotly = (explode = false) => {
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

        const metric = metricFunction(state.useEuclidean);
        const MST = state.numericalMonoid.minimalSpanningTreeByMetric(state.element, metric);
        const minEdges = MST;
        const distances = minEdges.map(([index1, index2]) => metric(factorizations[index1], factorizations[index2]));
        let minimalMSTTraces = [];
        let aggregateGlobalAxisMax = 0;
        explodedDisplay.forEach((display, i) => {
            minimalMSTTraces = minimalMSTTraces.concat(groupedEdgeTracesByDistance(minEdges, distances, display, {
                showlegend: i === 0,
                marker: {
                    size: 11,
                    line: {
                        color: colorMap(i),
                        width: 0.5
                    },
                    opacity: 0.8
                }
            }));
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
        const projected = factorizations.map(fac => projectFactorization(fac, element, generators, (document.getElementById("collapse3-checkbox") as any).checked));
        const display = applyShift(projected, axisMins(projected));
        const trace1 = facsMap(display, 'rgba(217, 217, 217, 0.14)', factorizations.map(facText));

        const metric = metricFunction(state.useEuclidean);
        const MST = state.numericalMonoid.minimalSpanningTreeByMetric(state.element, metric);
        const minEdges = MST;
        const distances = minEdges.map(([index1, index2]) => metric(factorizations[index1], factorizations[index2]));
        const minimalMSTTraces = groupedEdgeTracesByDistance(minEdges, distances, display);
        const globalAxisMax = Math.max(0, ...flattenArray(display));
        const axisLayout = { range: [0, globalAxisMax] };
        layout = {
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
        data = [trace1, ...minimalMSTTraces];
    }

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
}