export type AgeRatingMapEntry = {
  system: string;
  name: string;
  minAge: number;
  igdbEnumValue: number;
};

export interface IgdbAgeRating {
  id: number;
  category: number;
  content_descriptions: number[];
  rating: number;
  synopsis: string;
  checksum: string;
}

export const GameVaultIgdbAgeRatingMap: AgeRatingMapEntry[] = [
  { system: "PEGI", name: "Three", minAge: 3, igdbEnumValue: 1 },
  { system: "PEGI", name: "Seven", minAge: 7, igdbEnumValue: 2 },
  { system: "PEGI", name: "Twelve", minAge: 12, igdbEnumValue: 3 },
  { system: "PEGI", name: "Sixteen", minAge: 16, igdbEnumValue: 4 },
  { system: "PEGI", name: "Eighteen", minAge: 18, igdbEnumValue: 5 },
  { system: "ESRB", name: "EC", minAge: 3, igdbEnumValue: 7 },
  { system: "ESRB", name: "E", minAge: 6, igdbEnumValue: 8 },
  { system: "ESRB", name: "E10", minAge: 10, igdbEnumValue: 9 },
  { system: "ESRB", name: "T", minAge: 13, igdbEnumValue: 10 },
  { system: "ESRB", name: "M", minAge: 17, igdbEnumValue: 11 },
  { system: "ESRB", name: "AO", minAge: 18, igdbEnumValue: 12 },
  { system: "CERO", name: "CERO_A", minAge: 0, igdbEnumValue: 13 },
  { system: "CERO", name: "CERO_B", minAge: 12, igdbEnumValue: 14 },
  { system: "CERO", name: "CERO_C", minAge: 15, igdbEnumValue: 15 },
  { system: "CERO", name: "CERO_D", minAge: 17, igdbEnumValue: 16 },
  { system: "CERO", name: "CERO_Z", minAge: 18, igdbEnumValue: 17 },
  { system: "USK", name: "USK_0", minAge: 0, igdbEnumValue: 18 },
  { system: "USK", name: "USK_6", minAge: 6, igdbEnumValue: 19 },
  { system: "USK", name: "USK_12", minAge: 12, igdbEnumValue: 20 },
  { system: "USK", name: "USK_16", minAge: 16, igdbEnumValue: 21 },
  { system: "USK", name: "USK_18", minAge: 18, igdbEnumValue: 22 },
  { system: "GRAC", name: "GRAC_ALL", minAge: 0, igdbEnumValue: 23 },
  { system: "GRAC", name: "GRAC_Twelve", minAge: 12, igdbEnumValue: 24 },
  { system: "GRAC", name: "GRAC_Fifteen", minAge: 15, igdbEnumValue: 25 },
  { system: "GRAC", name: "GRAC_Eighteen", minAge: 18, igdbEnumValue: 26 },
  { system: "CLASS_IND", name: "CLASS_IND_L", minAge: 0, igdbEnumValue: 28 },
  { system: "CLASS_IND", name: "CLASS_IND_Ten", minAge: 10, igdbEnumValue: 29 },
  {
    system: "CLASS_IND",
    name: "CLASS_IND_Twelve",
    minAge: 12,
    igdbEnumValue: 30,
  },
  {
    system: "CLASS_IND",
    name: "CLASS_IND_Fourteen",
    minAge: 14,
    igdbEnumValue: 31,
  },
  {
    system: "CLASS_IND",
    name: "CLASS_IND_Sixteen",
    minAge: 16,
    igdbEnumValue: 32,
  },
  {
    system: "CLASS_IND",
    name: "CLASS_IND_Eighteen",
    minAge: 18,
    igdbEnumValue: 33,
  },
  { system: "ACB", name: "ACB_G", minAge: 0, igdbEnumValue: 34 },
  { system: "ACB", name: "ACB_PG", minAge: 8, igdbEnumValue: 35 },
  { system: "ACB", name: "ACB_M", minAge: 15, igdbEnumValue: 36 },
  { system: "ACB", name: "ACB_MA15", minAge: 15, igdbEnumValue: 37 },
  { system: "ACB", name: "ACB_R18", minAge: 18, igdbEnumValue: 38 },
];
