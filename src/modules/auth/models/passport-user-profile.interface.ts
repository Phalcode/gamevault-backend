export default interface PassportUserProfile {
  id?: string;
  provider?: string;
  birthdate?: string;
  preferred_username?: string;
  displayName: string;
  name?: {
    familyName?: string;
    givenName?: string;
    middleName?: string;
  };
  emails?: {
    value: string;
  }[];
  photos?: {
    value: string;
  }[];
}
