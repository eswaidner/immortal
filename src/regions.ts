export const regions: Region[] = [
  { id: 0, name: "Mesopotamia" },
  { id: 1, name: "Levant" },
  { id: 2, name: "Africa" },
  { id: 3, name: "Anatolia" },
  { id: 4, name: "Persia" },
  // ...
  // valid up to id 255
];

export interface Region {
  id: number;
  name: string;
}
