export default class State {
  dbs: Record<string, Database> = {};

  addDatabase(db: Database): State {
    this.dbs[db.name] = db;
    return this;
  }

  getDatabase(name: string): Database {
    const db = this.dbs[name];
    if (!db) throw new Error(`undefined world '${name}'`);

    return db;
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
      (c as Attribute<any>).instances.delete(id);
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

  query(q: Query): QueryResult {
    const base = this.getAttribute(q.include[0]);
    const result: QueryResult = { entities: [] };

    // check all instances of base attribute for matches
    for (let [entId, baseVal] of base.instances.entries()) {
      const ent: EntityView = {
        id: entId,
        attributes: { [base.name]: baseVal },
      };

      let match = true;

      // reject entity if a required attribute is missing
      for (let j = 1; j < q.include.length; j += 1) {
        const attr = this.getAttribute(q.include[j]);

        const val = attr.instances.get(entId);
        if (val === undefined) {
          match = false;
          break;
        }

        ent.attributes[attr.name] = val;
      }

      // reject entity if an excluded attribute is set
      if (match && q.exclude) {
        for (let j = 0; j < q.exclude.length; j += 1) {
          const attr = this.getAttribute(q.exclude[j]);

          if (attr.instances.get(entId) !== undefined) {
            match = false;
            break;
          }
        }
      }

      // check for optional attributes
      if (match && q.optional) {
        for (let j = 0; j < q.optional.length; j += 1) {
          const attr = this.getAttribute(q.optional[j]);

          const val = attr.instances.get(entId);
          ent.attributes[attr.name] = val;
        }
      }

      // add values to query result
      if (match) result.entities.push(ent);
    }

    return result;
  }
}

interface Query {
  include: string[];
  exclude?: string[];
  optional?: string[];
}

interface EntityView {
  id: number;
  attributes: Record<string, any>;
}

interface QueryResult {
  entities: EntityView[];
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
    return attr.instances.get(this.id);
  }

  set<T>(name: string, value: T) {
    const attr = this.world.getAttribute<T>(name);
    attr.instances.set(this.id, value);
    attr.change();
  }

  delete(name: string) {
    const attr = this.world.getAttribute(name);
    attr.instances.delete(this.id);
    attr.change();
  }
}

export class Attribute<T> {
  name: string;
  instances: Map<number, T> = new Map();

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
