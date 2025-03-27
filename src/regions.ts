export const regions: Region[] = [
  { id: 0, name: "NONE" },
  { id: 1, name: "Mesopotamia" },
  { id: 2, name: "Anatolia" },
  { id: 3, name: "Levant" },
  { id: 4, name: "Arabia" },
  { id: 5, name: "North Africa" },
  { id: 6, name: "Sahara" },
  { id: 7, name: "Persia" },
  { id: 8, name: "Crete" },
  { id: 9, name: "Achaea" },
  { id: 10, name: "Macedonia" },
  { id: 11, name: "Thracia" },
  { id: 12, name: "Media" },
  { id: 13, name: "Black Sea" },
  { id: 14, name: "Aegean Sea" },
  { id: 15, name: "Mediterranian Sea" },
  { id: 16, name: "Red Sea" },
  { id: 17, name: "Persian Gulf" },
  // ...
  // valid up to id 255
];

export interface Region {
  id: number;
  name: string;
}
