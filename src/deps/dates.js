// Date utility functions

// Helper to validate YYYY/MM/DD format
const validateDateFormat = (dateString) => {
  const regex = /^\d{4}\/\d{2}\/\d{2}$/;
  return regex.test(dateString);
};

// Helper to parse YYYY/MM/DD string to Date object
const parseDate = (dateString) => {
  if (!validateDateFormat(dateString)) {
    return null;
  }
  
  const [year, month, day] = dateString.split('/').map(num => parseInt(num, 10));
  
  // Validate ranges
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  
  // Use UTC to avoid timezone issues
  const date = new Date(Date.UTC(year, month - 1, day));
  
  // Check if the date is valid (handles invalid dates like Feb 30)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  
  return date;
};

// Calculate days between two dates
const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  // Use Math.floor to avoid rounding issues with DST
  return Math.floor((date2 - date1) / oneDay);
};

// Calculate days until a future date
export const daysUntil = (targetDateString) => {
  const targetDate = parseDate(targetDateString);
  if (!targetDate) {
    return { error: "Invalid date format. Please use YYYY/MM/DD format." };
  }
  
  const today = new Date();
  // Use UTC for today's date as well
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  
  const days = daysBetween(todayUTC, targetDate);
  
  if (days < 0) {
    return { 
      error: "Target date is in the past.", 
      suggestion: `Use days_since instead. That date was ${Math.abs(days)} days ago.`
    };
  }
  
  return { days, message: `${days} days until ${targetDateString}` };
};

// Calculate days since a past date
export const daysSince = (pastDateString) => {
  const pastDate = parseDate(pastDateString);
  if (!pastDate) {
    return { error: "Invalid date format. Please use YYYY/MM/DD format." };
  }
  
  const today = new Date();
  // Use UTC for today's date as well
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  
  const days = daysBetween(pastDate, todayUTC);
  
  if (days < 0) {
    return { 
      error: "Date is in the future.", 
      suggestion: `Use days_until instead. That date is ${Math.abs(days)} days away.`
    };
  }
  
  return { days, message: `${days} days since ${pastDateString}` };
};

// Get today's date in YYYY/MM/DD format
export const getTodayFormatted = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};