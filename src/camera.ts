import { g } from "./globals";
import { Vector } from "./math";

export default function initCamera() {
  g.state.addAttribute<Vector>("position");
  g.state.addAttribute<{}>("camera");
  g.state.addAttribute<{}>("camera-target");

  const cam = g.state.addEntity();
  cam.set("position", new Vector());
  cam.set("camera", {});

  g.app.ticker.add(() => {
    const q = g.state.query({ include: ["camera-target", "position"] });
    if (q.entities.length === 0) return;

    const targetPos = q.entities[0].attributes["position"] as Vector;

    const currentPos = cam.get<Vector>("position")!;

    const pos = new Vector(
      targetPos.x - g.app.screen.width * 0.5,
      targetPos.y - g.app.screen.height * 0.5,
    );

    const lerped = currentPos.lerp(pos, 0.1);

    cam.set("position", lerped);
  });
}
