export const findStartOfWeek = (): Date => {
  const date = new Date();
  const day = date.getDay() || 7; // Get current day number, converting Sun. to 7
  if (day !== 1) {
    // Only manipulate the date if it isn't Mon.
    date.setHours(-24 * (day - 1));
  } // Set the hours to day number minus 1
  date.setHours(0, 0, 0, 0);
  return date;
};

export const findEndOfWeek = (): Date => {
  const startOfWeek = findStartOfWeek();
  const endOfWeek = new Date();
  endOfWeek.setDate(startOfWeek.getDate() + 6); // This will bring us to Sunday
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
};

export const findStartOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  // TODO: Do a better conversion in terms of timezone
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

export const findEndOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  // TODO: Do a better conversion in terms of timezone
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};
