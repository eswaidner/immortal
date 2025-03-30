import { clamp } from "./math";
import Zen, { Entity } from "./state";
import { SceneObject } from "./movement";

export function initHitpoints() {
  Zen.defineAttribute<Hitpoints>(Hitpoints);
  Zen.defineAttribute<Regenerate>(Regenerate);
  Zen.defineAttribute<Invulnerable>(Invulnerable);
  Zen.defineAttribute<DamageFlash>(DamageFlash);
  Zen.defineAttribute(Dead);

  g.app.ticker.add(() => {
    updateHitpoints();
    updateRegen();
    updateInvul();
    updateDamageFlash();
    updateDead();
  });
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

export function damage(damage: number, ent: Entity) {
  const hp = ent.getAttribute<Hitpoints>(Hitpoints);
  if (!hp) return;

  hp.hp = Math.max(0, hp.hp - damage);
  ent.setAttribute<Invulnerable>(Invulnerable, { duration: 0.1 });
  ent.setAttribute<DamageFlash>(DamageFlash, { duration: 0.1, elapsed: 0 });

  const regen = ent.getAttribute<Regenerate>(Regenerate);
  if (regen) regen.elapsedDelay = 0;
}

function updateHitpoints() {
  const q = Zen.query({ include: [Hitpoints], exclude: [Dead] });

  for (let i = 0; i < q.length; i++) {
    const e = q[i];
    const hp = e.getAttribute<Hitpoints>(Hitpoints)!;

    hp.hp = clamp(hp.hp, 0, hp.maxHp);

    if (hp.hp === 0) e.setAttribute(Dead, {});
  }
}

function updateRegen() {
  const q = Zen.query({
    include: [Regenerate, Hitpoints],
    exclude: [Dead],
  });

  for (let i = 0; i < q.length; i++) {
    const e = q[i];
    const regen = e.getAttribute<Regenerate>(Regenerate)!;
    const hp = e.getAttribute<Hitpoints>(Hitpoints)!;

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
  const q = Zen.query({
    include: [Invulnerable],
  });

  for (let i = 0; i < q.length; i++) {
    const e = q[i];
    const invul = e.getAttribute<Invulnerable>(Invulnerable)!;
    invul.duration -= g.app.ticker.deltaMS * 0.001;
    if (invul.duration <= 0) e.removeAttribute(Invulnerable);
  }
}

function updateDamageFlash() {
  const q = Zen.query({
    include: [DamageFlash],
  });

  for (let i = 0; i < q.length; i++) {
    const e = q[i];
    const flash = e.getAttribute<DamageFlash>(DamageFlash)!;
    const so = e.getAttribute<SceneObject>(SceneObject)!;

    if (flash.elapsed === 0) so.container.tint = 0xff2000;

    const dt = g.app.ticker.deltaMS * 0.001;
    flash.elapsed += dt;

    if (flash.elapsed >= flash.duration) {
      e.removeAttribute(DamageFlash);
      if (so) so.container.tint = 0xffffff; // reset tint
    }
  }
}

function updateDead() {
  const q = Zen.query({
    include: [Dead, SceneObject],
  });

  for (let i = 0; i < q.length; i++) {
    const e = q[i];
    const so = e.getAttribute<SceneObject>(SceneObject)!;
    so.container.scale.y *= -1;
    so.container.alpha = Math.max(
      0,
      so.container.alpha - 0.02 * g.app.ticker.deltaTime,
    );
  }
}
