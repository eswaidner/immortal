export default class State {
  static nextId: number = 1;
  static entities: Set<number> = new Set();
  static namedEntities: Map<string, Entity> = new Map();
  static attributes: Map<object, object> = new Map();

  static defineAttribute<T extends object>(
    key: object,
    callbacks?: { onAdd?: Callback<T>; onRemove?: Callback<T> },
  ) {
    const attr = new Attribute<T>(callbacks?.onAdd, callbacks?.onRemove);
    State.attributes.set(key, attr);
  }

  //TODO move to Entity constructor?
  static createEntity(name?: string): Entity {
    //TODO recycle ids
    const ent = new Entity(State.nextId);
    State.nextId++;

    State.entities.add(ent.id);
    if (name) {
      if (State.namedEntities.has(name)) {
        console.log(
          `WARNING: entity with name '${name}' already exists, overwriting`,
        );
      }

      State.namedEntities.set(name, ent);
    }

    return ent;
  }

  static deleteEntity(id: number) {
    State.entities.delete(id);

    for (const c of Object.values(State.attributes)) {
      c.deleteInstance(id);
    }
  }

  static getEntity(id: number): Entity | undefined {
    return State.entities.has(id) !== undefined ? new Entity(id) : undefined;
  }

  static getAttribute<T extends object>(key: object): Attribute<T> {
    const attr = State.attributes.get(key);
    if (!attr) throw new Error(`undefined attribute '${key}'`);

    return attr as Attribute<T>;
  }

  static query(q: Query): Entity[] {
    const base = State.getAttribute(q.include[0]);
    const entities: Entity[] = [];

    // check all instances of base attribute for matches
    for (let entId of base.instances.keys()) {
      const ent = State.getEntity(entId)!;
      let match = true;

      // reject entity if a required attribute is missing
      for (let j = 1; j < q.include.length; j += 1) {
        const attr = State.getAttribute(q.include[j]);

        const val = attr.instances.get(entId);
        if (val === undefined) {
          match = false;
          break;
        }
      }

      // reject entity if an excluded attribute is set
      if (match && q.exclude) {
        for (let j = 0; j < q.exclude.length; j += 1) {
          const attr = State.getAttribute(q.exclude[j]);

          if (attr.instances.get(entId) !== undefined) {
            match = false;
            break;
          }
        }
      }

      // add values to query result
      if (match) entities.push(ent);
    }

    return entities;
  }

  static async init() {
    State.defineAttribute(System);
  }

  static update(deltaTime: number) {
    // update systems
    const sysAttr = State.getAttribute<System>(System);
    for (const sys of sysAttr.instances.values()) {
      sys.update(deltaTime);
    }
  }
}

type Callback<T extends object> = (a: T) => void;

class Attribute<T extends object> {
  instances: Map<number, T> = new Map();
  onAdd?: Callback<T>;
  onRemove?: Callback<T>;

  constructor(onAdd?: Callback<T>, onRemove?: Callback<T>) {
    this.onAdd = onAdd;
    this.onRemove = onRemove;
  }

  removeInstance(entId: number) {
    if (!this.instances.has(entId)) return;

    if (this.onRemove) this.onRemove(this.instances.get(entId)!);
    this.instances.delete(entId);
  }
}

export interface Query {
  include: object[];
  exclude?: object[];
}

export class Entity {
  id: number;

  constructor(id: number) {
    this.id = id;
  }

  getAttribute<T extends object>(key: object): T | undefined {
    const attr = State.getAttribute<T>(key);
    return attr.instances.get(this.id);
  }

  setAttribute<T extends object>(key: object, value: T) {
    const attr = State.getAttribute<T>(key);
    attr.instances.set(this.id, value);
  }

  removeAttribute(key: object) {
    const attr = State.getAttribute(key);
    attr.removeInstance(this.id);
  }
}

export class System {
  interval: number = 0;
  elapsedInterval: number = 0;
  query: Query;
  fn: (e: Entity) => void;

  constructor(q: Query, fn: (e: Entity) => void, frequency?: number) {
    this.query = q;
    this.fn = fn;

    if (frequency) this.interval = 1 / frequency;
  }

  update(dt: number) {
    this.elapsedInterval += dt;
    if (this.elapsedInterval > this.interval) this.execute();
  }

  execute() {
    // invoke fn for each entity returned by query
    const q = State.query(this.query);
    const len = q.length;
    for (let i = 0; i < len; i++) this.fn(q[i]);

    this.elapsedInterval = 0;
  }
}
