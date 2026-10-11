export function vibrate(ms: number): void {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {
    // Vibration non prise en charge.
  }
}
