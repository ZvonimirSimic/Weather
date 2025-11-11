export function capitalizeCity(city) {
  if (!city) return "";
  return city
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}