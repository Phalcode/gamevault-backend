export interface IgdbCompany {
  id: number;
  change_date?: number;
  change_date_category: number;
  country: number;
  created_at: number;
  description: string;
  developed: number[];
  logo: number;
  name: string;
  published: number[];
  slug: string;
  start_date: number;
  start_date_category: number;
  updated_at: number;
  url: string;
  checksum: string;
  websites?: number[];
  parent?: number;
}
