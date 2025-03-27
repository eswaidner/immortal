export const zones: Zone[] = [
  { id: 0, name: "NONE" },
  { id: 1, name: "1" },
  { id: 2, name: "2" },
  { id: 3, name: "3" },
  { id: 4, name: "4" },
  { id: 5, name: "5" },
  // ...
  // valid up to id 255
];

export interface Zone {
  id: number;
  name: string;
  //TODO chance table for spawing
}
