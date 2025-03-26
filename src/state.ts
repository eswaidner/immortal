export default class State {
  worlds: Record<string, Database> = {};

  addDatabase(w: Database): State {
    this.worlds[w.name] = w;
    return this;
  }

  getDatabase(name: string): Database {
    const w = this.worlds[name];
    if (!w) throw new Error(`undefined world '${name}'`);

    return w;
  }
}

export class Database {
  name: string;
  entities: (number | undefined)[] = [];
  attributes: Record<string, object> = {};

  constructor(name: string) {
    this.name = name;
  }

  addEntity(): Entity {
    //TODO progressively recycle ids
    const ent = new Entity(this.entities.length, this);
    this.entities.push(ent.id);
    return ent;
  }

  deleteEntity(id: number) {
    this.entities[id] = undefined;

    for (const c of Object.values(this.attributes)) {
      delete (c as Attribute<any>).instances[id];
    }
  }

  addAttribute<T>(name: string): Attribute<T> {
    const attr = new Attribute<T>(name);
    this.attributes[name] = attr;
    return attr;
  }

  getEntity(id: number): Entity | undefined {
    const val = this.entities[id];
    return val !== undefined ? new Entity(id, this) : undefined;
  }

  getAttribute<T>(name: string): Attribute<T> {
    const attr = this.attributes[name];
    if (!attr) throw new Error(`undefined attribute '${name}'`);

    return attr as Attribute<T>;
  }
}

export class Entity {
  id: number;
  world: Database;

  constructor(id: number, world: Database) {
    this.id = id;
    this.world = world;
  }

  get<T>(name: string): T | undefined {
    const attr = this.world.getAttribute<T>(name);
    return attr.instances[this.id];
  }

  set<T>(name: string, value: T) {
    const attr = this.world.getAttribute<T>(name);
    attr.instances[this.id] = value;
    attr.change();
  }

  delete(name: string) {
    const attr = this.world.getAttribute(name);
    delete attr.instances[this.id];
    attr.change();
  }
}

export class Attribute<T> {
  name: string;
  instances: Record<number, T> = {};

  // hooks
  changeEffects: Map<object, Effect<T>> = new Map();

  constructor(name: string) {
    this.name = name;
  }

  onChange(key: object, effect: Effect<T>) {
    this.changeEffects.set(key, effect);
  }

  change() {
    for (const e of this.changeEffects.values()) {
      e(this);
    }
  }
}

export type Effect<T> = (attr: Attribute<T>) => void;
