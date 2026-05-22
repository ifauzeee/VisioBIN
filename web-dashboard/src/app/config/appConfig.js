function requiredEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const APP_CONFIG = Object.freeze({
  apiBaseUrl: requiredEnv(
    "NEXT_PUBLIC_API_URL",
    process.env.NEXT_PUBLIC_API_URL
  ),
  cameraStreamUrl: requiredEnv(
    "NEXT_PUBLIC_CAMERA_STREAM_URL",
    process.env.NEXT_PUBLIC_CAMERA_STREAM_URL
  ),
});
