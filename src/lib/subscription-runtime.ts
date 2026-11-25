export function isFreeRegistrationEnabled(): boolean {
  return process.env.METRICASUR_FREE_REGISTRATION_ENABLED !== "false";
}
