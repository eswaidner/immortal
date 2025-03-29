import { g } from "./globals";
import { Vector } from "./math";

export default function initCamera() {
  g.state.defineAttribute<Vector>("position");
  g.state.defineAttribute<{}>("camera");
  g.state.defineAttribute<{}>("camera-target");

  const cam = g.state.createEntity();
  cam.setAttribute("position", new Vector());
  cam.setAttribute("camera", {});

  g.app.ticker.add(() => {
    const q = g.state.query({ include: ["camera-target", "position"] });
    if (q.entities.length === 0) return;

    const targetPos = q.entities[0].attributes["position"] as Vector;

    const currentPos = cam.getAttribute<Vector>("position")!;

    const pos = new Vector(
      targetPos.x - g.app.screen.width * 0.5,
      targetPos.y - g.app.screen.height * 0.5,
    );

    const sqDist = new Vector(pos.x, pos.y).sub(currentPos).squaredMagnitude();

    if (sqDist > 5) {
      const lerped = currentPos.lerp(pos, 0.1);
      cam.setAttribute("position", lerped);
    }
  });
}
