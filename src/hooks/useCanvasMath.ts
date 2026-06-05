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

// Line segment intersection (Standard algorithm)
export function lineSegmentsIntersect(
  p1: { x: number, y: number },
  q1: { x: number, y: number },
  p2: { x: number, y: number },
  q2: { x: number, y: number }
) {
  const orientation = (p: {x:number, y:number}, q: {x:number, y:number}, r: {x:number, y:number}) => {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val === 0) return 0; // colinear
    return (val > 0) ? 1 : 2; // clock or counterclock wise
  };

  const onSegment = (p: {x:number, y:number}, q: {x:number, y:number}, r: {x:number, y:number}) => {
    if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
        q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y))
       return true;
    return false;
  };

  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) return true;

  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;

  return false;
}

export function doesIntersectWalls(
  p1: { x: number, y: number },
  p2: { x: number, y: number },
  walls: any[]
): boolean {
  for (const wall of walls) {
    if (!wall.points || wall.points.length < 2) continue;
    for (let i = 0; i < wall.points.length - 1; i++) {
      if (lineSegmentsIntersect(p1, p2, wall.points[i], wall.points[i + 1])) {
        return true;
      }
    }
  }
  return false;
}
