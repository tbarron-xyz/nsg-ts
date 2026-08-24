import NumericalMonoid from './NumericalMonoid';

class Hypotheses extends NumericalMonoid {
    _catenaryBoundHypothesis = () => this.frobenius() + Math.max(...this.bettiElements());

    _satisfiesCatenaryBoundHypothesis(metric: Metric) {
        const lcm = product(this.generators);
        const boundHypothesis = this.frobenius() + Math.max(...this.bettiElements());
        console.log('boundHypothesis:', boundHypothesis, 'lcm:', lcm);
        const v1 = this._non_dynamic_catenaryDegreeByMetric(boundHypothesis, metric);
        console.log(`catenaryDegree(${boundHypothesis}):`, v1);
        console.log(`calculating catenaryDegree(${boundHypothesis + lcm})`);
        for (let i = 0; i < product(this.generators.slice(1)); i++) {
            // preload
            const next = boundHypothesis + this.generators[0] * i;
            const unsafeStdout = process.stdout as any;
            if (unsafeStdout.clearLine) {
                unsafeStdout.clearLine();
                unsafeStdout.cursorTo(0);
                process.stdout.write(`memoizing factorizations(${next})`);
            }

            this.factorizations(next);
        }
        const facsup = this.factorizations(boundHypothesis + lcm);
        const v2 = this._non_dynamic_catenaryDegreeByMetric(boundHypothesis + lcm, metric);
        console.log(`catenaryDegree(${boundHypothesis + lcm}): ${v2}`);
        return v1 === v2;
    }

    _satisfiesCatenaryBoundHypothesisEuclidean = () => this._satisfiesCatenaryBoundHypothesis(euclideanDistance);
}