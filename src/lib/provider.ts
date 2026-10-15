/** Guess a cloud provider from a hostname. Cosmetic only. */
export function guessProvider(host: string): string | null {
  const h = host.toLowerCase();
  if (h.includes("digitalocean") || h.includes("droplet")) return "DigitalOcean";
  if (h.includes("google") || h.includes("gcp") || h.includes("gce"))
    return "Google Cloud";
  if (h.includes("oracle") || h.includes("oci")) return "Oracle Cloud";
  if (h.includes("aws") || h.includes("ec2")) return "AWS";
  if (h.includes("azure")) return "Azure";
  if (h.includes("hetzner")) return "Hetzner";
  if (h.includes("linode")) return "Linode";
  if (h.includes("vultr")) return "Vultr";
  if (h.includes("fly")) return "Fly.io";
  if (h.includes("raspberry") || h.includes("rpi") || h.includes("pi"))
    return "Raspberry Pi";
  return null;
}
