export function isRequired(value: string) {
  return value.trim().length > 0;
}

export function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
