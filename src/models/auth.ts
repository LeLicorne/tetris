export type Auth = {
  access: string;
  refresh: string | null;
};

export type AuthCreate = {
  identifier: string;
  password: string;
};

export type AuthResponse = {
  refreshToken?: string;
  jwt?: string;
};
