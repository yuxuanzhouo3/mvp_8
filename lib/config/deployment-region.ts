export type DeploymentRegion = "CN" | "INTL";

export function resolveDeploymentRegion(): DeploymentRegion {
  const rawRegion =
    process.env.DEPLOYMENT_REGION ||
    process.env.NEXT_PUBLIC_DEPLOYMENT_REGION ||
    "CN";

  const region = String(rawRegion).trim().toLowerCase();

  if (["intl", "international", "overseas", "global"].includes(region)) {
    return "INTL";
  }

  return "CN";
}
