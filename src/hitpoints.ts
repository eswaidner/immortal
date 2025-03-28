import { Container } from "pixi.js";
import { g } from "./globals";
import { clamp, lerp } from "./math";
import { Entity } from "./state";

export function initHitpoints() {
  g.state.addAttribute<Hitpoints>("hitpoints");
  g.state.addAttribute<Regenerate>("regenerate");
  g.state.addAttribute<Invulnerable>("invulnerable");
  g.state.addAttribute<DamageFlash>("damage-flash");
  g.state.addAttribute("dead");

  g.app.ticker.add(() => {
    updateHitpoints();
    updateRegen();
    updateInvul();
    updateDamageFlash();
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
  duration: number;
}

export interface DamageFlash {
  duration: number;
  elapsed: number;
}

export function damage(damage: number, ent: Entity) {
  const hp = ent.get("hitpoints") as Hitpoints;
  if (!hp) return;

  hp.hp = Math.max(0, hp.hp - damage);
  ent.set<Invulnerable>("invulnerable", { duration: 0.1 });
  ent.set<DamageFlash>("damage-flash", { duration: 0.1, elapsed: 0 });

  const regen = ent.get<Regenerate>("regenerate");
  if (regen) regen.elapsedDelay = 0;
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
    invul.duration -= g.app.ticker.deltaMS * 0.001;
    if (invul.duration <= 0) e.entity.delete("invulnerable");
  }
}

function updateDamageFlash() {
  const q = g.state.query({
    include: ["damage-flash"],
    optional: ["container"],
  });

  for (const e of q.entities) {
    const flash = e.attributes["damage-flash"] as DamageFlash;
    const [c, _] = e.attributes["container"] as [Container, number];

    if (flash.elapsed === 0) c.tint = 0xff2000;

    const dt = g.app.ticker.deltaMS * 0.001;
    flash.elapsed += dt;

    if (c) c.tint = lerp(c.tint, 0xffffff, dt * 15);

    if (flash.elapsed >= flash.duration) {
      e.entity.delete("damage-flash");
      if (c) c.tint = 0xffffff; // reset tint
    }
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
