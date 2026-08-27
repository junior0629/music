/**
 * Platform detection helpers.
 * Centralized so service modules don't all have to import Platform.OS
 * and re-implement the same logic.
 */
import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isNative = isIOS || isAndroid;
