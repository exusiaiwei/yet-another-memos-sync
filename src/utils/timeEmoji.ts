/**
 * Get emoji based on time of day
 * @param hour Hour in 24-hour format (0-23)
 * @returns Emoji representing the time period
 */
export function getTimeEmoji(hour: number): string {
  if (hour >= 5 && hour < 12) return "🌅"; // Morning
  if (hour >= 12 && hour < 17) return "☀️"; // Afternoon
  if (hour >= 17 && hour < 21) return "🌆"; // Evening
  if (hour >= 21 || hour < 5) return "🌙"; // Night
  return "⏰"; // Default
}

/**
 * Get period name in Chinese
 * @param hour Hour in 24-hour format (0-23)
 * @returns Chinese period name
 */
export function getTimePeriod(hour: number): string {
  if (hour >= 5 && hour < 12) return "早晨";
  if (hour >= 12 && hour < 17) return "下午";
  if (hour >= 17 && hour < 21) return "傍晚";
  if (hour >= 21 || hour < 5) return "夜晚";
  return "时间";
}
