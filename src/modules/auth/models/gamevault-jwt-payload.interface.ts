export interface GamevaultJwtPayload {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  preferred_username: string;
  email: string;
  birthdate: string;
  role: string;
  /** Session the token was issued for. Enforced only when configured. */
  sid?: string;
}
