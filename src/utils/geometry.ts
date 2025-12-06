export function getPolygonCentroid(points: { x: number; y: number }[]) {
    let signedArea = 0;
    let Cx = 0;
    let Cy = 0;

    for (let i = 0; i < points.length; i++) {
        const x0 = points[i].x;
        const y0 = points[i].y;
        const x1 = points[(i + 1) % points.length].x;
        const y1 = points[(i + 1) % points.length].y;

        const A = x0 * y1 - x1 * y0;
        signedArea += A;
        Cx += (x0 + x1) * A;
        Cy += (y0 + y1) * A;
    }

    signedArea *= 0.5;
    Cx = Cx / (6 * signedArea);
    Cy = Cy / (6 * signedArea);

    return { x: Cx, y: Cy };
}
