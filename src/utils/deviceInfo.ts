/**
 * deviceInfo — returns a real device name via `expo-device` (spec §14.8).
 *
 * Never fabricate a device name. If Expo can't read `modelName` or
 * `deviceName`, return `null` and let the UI hide the section entirely
 * rather than guess.
 */

import * as Device from 'expo-device';

export const getDeviceDisplayName = (): string | null => {
  const modelName = Device.modelName?.trim();
  if (modelName) return modelName;
  const deviceName = Device.deviceName?.trim();
  if (deviceName) return deviceName;
  return null;
};

export const getDeviceOs = (): string | null => {
  const osName = Device.osName?.trim();
  const osVersion = Device.osVersion?.trim();
  if (osName && osVersion) return `${osName} ${osVersion}`;
  return osName ?? null;
};
