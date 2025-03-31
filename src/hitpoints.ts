import { clamp } from "./math";
import { SceneObject } from "./pixi";
import * as Zen from "./zen";

function init() {
  Zen.defineAttribute(Hitpoints);
  Zen.defineAttribute(Regenerate);
  Zen.defineAttribute(Invulnerable);
  Zen.defineAttribute(DamageFlash);
  Zen.defineAttribute(Dead);

  Zen.createSystem(
    { with: [Hitpoints], without: [Dead] },
    { foreach: updateHitpoints },
  );

  Zen.createSystem(
    { with: [Regenerate, Hitpoints], without: [Dead] },
    { foreach: updateRegen },
  );

  Zen.createSystem({ with: [Invulnerable] }, { foreach: updateInvul });

  Zen.createSystem(
    { with: [DamageFlash, SceneObject] },
    { foreach: updateDamageFlash },
  );

  Zen.createSystem({ with: [Dead] }, { foreach: updateDead });
}

export class Hitpoints {
  hp: number;
  maxHp: number;

  constructor(hp: number, maxHp: number) {
    this.hp = hp;
    this.maxHp = maxHp;
  }
}

export class Regenerate {
  rate: number;
  maxRegenPercent: number;
  delay: number;
  elapsedDelay: number = 0;

  constructor(rate: number, maxRegenPercent: number, delay: number) {
    this.rate = rate;
    this.maxRegenPercent = maxRegenPercent;
    this.delay = delay;
  }
}

export class Invulnerable {
  duration: number;

  constructor(duration: number) {
    this.duration = duration;
  }
}

export class DamageFlash {
  duration: number;
  elapsed: number = 0;

  constructor(duration: number) {
    this.duration = duration;
  }
}

export class Dead {}

export function damage(damage: number, ent: Zen.Entity) {
  const hp = ent.getAttribute<Hitpoints>(Hitpoints);
  if (!hp) return;

  hp.hp = Math.max(0, hp.hp - damage);
  ent.addAttribute<Invulnerable>(Invulnerable, { duration: 0.1 });
  ent.addAttribute<DamageFlash>(DamageFlash, { duration: 0.1, elapsed: 0 });

  const regen = ent.getAttribute<Regenerate>(Regenerate);
  if (regen) regen.elapsedDelay = 0;
}

function updateHitpoints() {
  const q = Zen.query({ with: [Hitpoints], without: [Dead] });

  for (let i = 0; i < q.length; i++) {
    const e = q[i];
    const hp = e.getAttribute<Hitpoints>(Hitpoints)!;

    hp.hp = clamp(hp.hp, 0, hp.maxHp);

    if (hp.hp === 0) e.addAttribute(Dead, {});
  }
}

function updateRegen(e: Zen.Entity, ctx: Zen.SystemContext) {
  const regen = e.getAttribute<Regenerate>(Regenerate)!;
  const hp = e.getAttribute<Hitpoints>(Hitpoints)!;

  if (regen.elapsedDelay > regen.delay) {
    const newHp = Math.min(
      hp.hp + regen.rate * ctx.deltaTime,
      hp.maxHp * regen.maxRegenPercent,
    );

    hp.hp = Math.max(hp.hp, newHp);
  } else {
    regen.elapsedDelay += ctx.deltaTime;
  }
}

function updateInvul(e: Zen.Entity, ctx: Zen.SystemContext) {
  const invul = e.getAttribute<Invulnerable>(Invulnerable)!;

  invul.duration -= ctx.deltaTime;
  if (invul.duration <= 0) e.removeAttribute(Invulnerable);
}

function updateDamageFlash(e: Zen.Entity, ctx: Zen.SystemContext) {
  const flash = e.getAttribute<DamageFlash>(DamageFlash)!;
  const so = e.getAttribute<SceneObject>(SceneObject)!;

  if (flash.elapsed === 0) so.container.tint = 0xff2000;

  flash.elapsed += ctx.deltaTime;

  if (flash.elapsed >= flash.duration) {
    e.removeAttribute(DamageFlash);
    if (so) so.container.tint = 0xffffff; // reset tint
  }
}

function updateDead(e: Zen.Entity, ctx: Zen.SystemContext) {
  const so = e.getAttribute<SceneObject>(SceneObject)!;
  so.container.scale.y *= -1;
  so.container.alpha = Math.max(0, so.container.alpha - 0.25 * ctx.deltaTime);
}

init();
