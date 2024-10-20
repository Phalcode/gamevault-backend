import { IgdbCompany } from "./igdb-company.interface";

export interface IgdbInvolvedCompany {
  id: number;
  company: IgdbCompany;
  created_at: number;
  developer: boolean;
  game: number;
  porting: boolean;
  publisher: boolean;
  supporting: boolean;
  updated_at: number;
  checksum: string;
}
