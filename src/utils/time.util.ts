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
