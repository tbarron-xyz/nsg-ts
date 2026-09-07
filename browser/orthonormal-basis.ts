/**
 * Create a 4D -> 3D isometric projection for
 *
 *     a*x + b*y + c*z + d*t = n
 *
 * The returned function maps a solution [x,y,z,t] to [X,Y,Z].
 *
 * Distances between points are preserved exactly.
 */
export function makeDisplayMapper([a, b, c, d]: number[], n = 1) {
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
