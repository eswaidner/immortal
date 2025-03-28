import { Container } from "pixi.js";
import { g } from "./globals";
import { clamp } from "./math";
import { Entity } from "./state";

export function initHitpoints() {
  g.state.addAttribute<Hitpoints>("hitpoints");
  g.state.addAttribute<Regenerate>("regenerate");
  g.state.addAttribute<Invulnerable>("invulnerable");
  g.state.addAttribute("dead");

  g.app.ticker.add(() => {
    updateHitpoints();
    updateRegen();
    updateInvul();
    updateDead();
  });
}

export interface Hitpoints {
  hp: number;
  maxHp: number;
}

export interface Regenerate {
  rate: number;
  maxRegenPercent: number;
  delay: number;
  elapsedDelay: number;
}

export interface Invulnerable {
  timeToLive: number;
}

export function damage(damage: number, ent: Entity) {
  const hp = ent.get("hitpoints") as Hitpoints;
  if (!hp) return;

  hp.hp = Math.max(0, hp.hp - damage);
  ent.set<Invulnerable>("invulnerable", { timeToLive: 0.25 });
}

function updateHitpoints() {
  const q = g.state.query({ include: ["hitpoints"], exclude: ["dead"] });

  for (const e of q.entities) {
    const hp = e.attributes["hitpoints"] as Hitpoints;

    hp.hp = clamp(hp.hp, 0, hp.maxHp);

    if (hp.hp === 0) e.entity.set("dead", {});
  }
}

function updateRegen() {
  const q = g.state.query({
    include: ["regenerate", "hitpoints"],
    exclude: ["dead"],
  });

  for (const e of q.entities) {
    const regen = e.attributes["regenerate"] as Regenerate;
    const hp = e.attributes["hitpoints"] as Hitpoints;

    const dt = g.app.ticker.deltaMS * 0.001;

    if (regen.elapsedDelay > regen.delay) {
      const newHp = Math.min(
        hp.hp + regen.rate * dt,
        hp.maxHp * regen.maxRegenPercent,
      );

      hp.hp = Math.max(hp.hp, newHp);
    } else {
      regen.elapsedDelay += dt;
    }
  }
}

function updateInvul() {
  const q = g.state.query({
    include: ["invulnerable"],
  });

  for (const e of q.entities) {
    const invul = e.attributes["invulnerable"] as Invulnerable;
    invul.timeToLive -= g.app.ticker.deltaMS * 0.001;
    if (invul.timeToLive <= 0) e.entity.delete("invulnerable");
  }
}

function updateDead() {
  const q = g.state.query({
    include: ["dead", "container"],
  });

  for (const e of q.entities) {
    const [c, scale] = e.attributes["container"] as [Container, number];
    c.scale.y = -scale;
    c.alpha = Math.max(0, c.alpha - 0.02 * g.app.ticker.deltaTime);
  }
}
