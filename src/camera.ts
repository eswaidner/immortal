import { g } from "./globals";
import { Vector } from "./math";

export default function initCamera() {
  g.state.addAttribute<Vector>("position");
  g.state.addAttribute<{}>("camera");

  const speed = 10;

  const cam = g.state.addEntity();
  cam.set(
    "position",
    new Vector(g.app.screen.width * 0.5, g.app.screen.height * 0.5),
  );
  cam.set("camera", {});

  g.app.ticker.add((tk) => {
    let dx = 0;
    if (g.input.isKeyDown("d")) dx += 1;
    if (g.input.isKeyDown("a")) dx -= 1;

    let dy = 0;
    if (g.input.isKeyDown("s")) dy += 1;
    if (g.input.isKeyDown("w")) dy -= 1;

    const dir = new Vector(dx, dy).normalize();
    const pos = cam.get<Vector>("position")!;

    cam.set(
      "position",
      new Vector(
        pos.x + dir.x * speed * tk.deltaTime,
        pos.y + dir.y * speed * tk.deltaTime,
      ),
    );
  });
}
