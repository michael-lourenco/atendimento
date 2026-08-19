export class LoginDeniedError extends Error {
  constructor(message = 'Este atendente está desativado') {
    super(message);
    this.name = 'LoginDeniedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const LOGIN_DENIED_QUERY = 'denied';
export const LOGIN_DENIED_OFFLINE = 'offline';

export function loginDeniedHref(): string {
  return `/login?${LOGIN_DENIED_QUERY}=${LOGIN_DENIED_OFFLINE}`;
}
