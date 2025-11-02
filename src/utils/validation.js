function isValidEmail(email) {
  // Simple regex for standard email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  // At least 8 characters, contains a letter, a number, and a special character
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':",.<>\/?\\|`~]).{8,}$/.test(password);
}

module.exports={ isValidEmail, isValidPassword }