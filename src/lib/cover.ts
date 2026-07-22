export function coverGradient(seed: string) {
  const options = [
    "linear-gradient(135deg, #4285f4 0%, #34a853 100%)",
    "linear-gradient(135deg, #ea4335 0%, #fbbc04 100%)",
    "linear-gradient(135deg, #0f766e 0%, #4285f4 100%)",
    "linear-gradient(135deg, #7c2d12 0%, #ea4335 100%)",
    "linear-gradient(135deg, #14532d 0%, #34a853 100%)",
  ];

  const index =
    Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    options.length;

  return options[index];
}
