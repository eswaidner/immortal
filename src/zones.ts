export const zones: Record<number, Zone> = {
  0: { id: 0, name: "NONE" },
  1: { id: 1, name: "Arid" },
  2: { id: 2, name: "Rivers" },
  3: { id: 3, name: "Plains" },
  4: { id: 4, name: "Forrest" },
  5: { id: 5, name: "Mountains" },
  253: { id: 253, name: "Jerusalem" },
  254: { id: 254, name: "Minotaur" },
  255: { id: 255, name: "Player Spawn" },
  // ...
  // valid up to id 255
};

export interface Zone {
  id: number;
  name: string;
  //TODO chance table for spawing
}
