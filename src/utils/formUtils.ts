
// Generate a unique user ID
export const generateUserId = (): string => {
  // Format: 'UID' + timestamp + random number (0-999)
  const timestamp = Date.now().toString(36);
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `UID-${timestamp}-${randomNum}`.toUpperCase();
};

// Validation functions
export const validateRequired = (value: string): string | null => {
  return value.trim() === '' ? 'This field is required' : null;
};

export const validateEmail = (email: string): string | null => {
  if (email.trim() === '') return null; // Don't validate empty field (use required validation separately)
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) ? null : 'Please enter a valid email address';
};

export const validatePhone = (phone: string): string | null => {
  if (phone.trim() === '') return null; // Don't validate empty field
  
  // Remove spaces, dashes, parentheses for validation
  const cleaned = phone.replace(/\s+|-|\(|\)/g, '');
  // Check if it's a valid phone number (basic validation)
  const phoneRegex = /^[+]?[\d]{10,15}$/;
  
  return phoneRegex.test(cleaned) ? null : 'Please enter a valid phone number';
};

// Format phone number as user types
export const formatPhoneNumber = (input: string): string => {
  // Remove all non-digit characters
  const digitsOnly = input.replace(/\D/g, '');
  
  // Format based on number of digits
  if (digitsOnly.length <= 3) {
    return digitsOnly;
  } else if (digitsOnly.length <= 6) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
  } else {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
  }
};
