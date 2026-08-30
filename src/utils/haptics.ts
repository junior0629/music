/**
 * Centralised haptics helpers.
 *
 * Tap targets call these instead of importing expo-haptics directly,
 * which keeps the `isNative` guard in one place and makes the
 * surface easy to swap (or mute) in one place — e.g. for an
 * "haptics off" Settings toggle, or to downscale feedback per
 * platform.
 *
 * Why every call is wrapped in a `void .catch(() => undefined)`:
 * expo-haptics can throw when the device doesn't support a
 * feedback type (e.g. older emulators), and we never want a
 * failed vibration to surface as a user-visible error.
 */
import * as Haptics from 'expo-haptics';
import { isNative } from '@/theme';

/** Light tap, e.g. tab switch, list item, transport button. */
export function selection(): void {
  if (!isNative) return;
  Haptics.selectionAsync().catch(() => undefined);
}

/** A more deliberate impact, e.g. opening the player or play/pause. */
export function impact(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light): void {
  if (!isNative) return;
  Haptics.impactAsync(style).catch(() => undefined);
}

/** Confirmation of a state change, e.g. toggling shuffle or repeat. */
export function toggle(): void {
  if (!isNative) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
}

/** Failure/error feedback, e.g. a retry-after-failure tap. */
export function notifyError(): void {
  if (!isNative) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
}
