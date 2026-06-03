export function isPointInPolygon(point: { x: number, y: number }, vs: { x: number, y: number }[]) {
  const x = point.x, y = point.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x, yi = vs[i].y;
    const xj = vs[j].x, yj = vs[j].y;
    const intersect = ((yi > y) !== (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getPolygonCentroid(points: { x: number, y: number }[]) {
  let x = 0, y = 0;
  points.forEach(p => { x += p.x; y += p.y; });
  return { x: x / points.length, y: y / points.length };
}

export function distanceToSegment(p: { x: number, y: number }, v: { x: number, y: number }, w: { x: number, y: number }) {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projection = {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y)
  };
  return Math.sqrt((p.x - projection.x) ** 2 + (p.y - projection.y) ** 2);
}

export function distanceToPolygonEdge(point: { x: number, y: number }, points: { x: number, y: number }[]) {
  let minDistance = Infinity;
  for (let i = 0; i < points.length; i++) {
    const v = points[i];
    const w = points[(i + 1) % points.length];
    const d = distanceToSegment(point, v, w);
    if (d < minDistance) minDistance = d;
  }
  return minDistance;
}

// Ray casting to find closest intersection for volume source point
export function findClosestIntersection(start: { x: number, y: number }, dir: { dx: number, dy: number }, points: { x: number, y: number }[]) {
  let minT = Infinity;
  for (let i = 0; i < points.length; i++) {
    const v1 = points[i];
    const v2 = points[(i + 1) % points.length];

    const v1ToV2 = { dx: v2.x - v1.x, dy: v2.y - v1.y };

    const det = dir.dx * v1ToV2.dy - dir.dy * v1ToV2.dx;
    if (Math.abs(det) < 0.001) continue;

    const startToV1 = { dx: v1.x - start.x, dy: v1.y - start.y };
    const t = (startToV1.dx * v1ToV2.dy - startToV1.dy * v1ToV2.dx) / det;
    const u = (startToV1.dx * dir.dy - startToV1.dy * dir.dx) / det;

    if (t > 0 && u >= 0 && u <= 1) {
      if (t < minT) minT = t;
    }
  }
  return minT;
}
