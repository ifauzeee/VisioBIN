function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const APP_CONFIG = Object.freeze({
  apiBaseUrl: requiredEnv("NEXT_PUBLIC_API_URL"),
  cameraStreamUrl: requiredEnv("NEXT_PUBLIC_CAMERA_STREAM_URL"),
});
