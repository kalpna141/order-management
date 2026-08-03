export function normalizePhone(phone = '') {
  return String(phone).replace(/\D/g, '');
}

// Matches the entered digits at the end of a stored phone number while
// allowing formatting characters such as spaces, dashes, and parentheses.
export function phoneSuffixPattern(phone) {
  return normalizePhone(phone).split('').join('\\D*') + '\\D*$';
}
