/** ISO 3166-1 alpha-2 country codes shown in the signup country picker. */
export const COUNTRIES: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "TR", name: "Türkiye" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "GR", name: "Greece" },
  { code: "CZ", name: "Czechia" },
  { code: "AT", name: "Austria" },
  { code: "CH", name: "Switzerland" },
  { code: "BE", name: "Belgium" },
  { code: "IE", name: "Ireland" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
  { code: "IN", name: "India" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "RU", name: "Russia" },
  { code: "UA", name: "Ukraine" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "EG", name: "Egypt" },
  { code: "ZA", name: "South Africa" },
];

export function countryName(code: string | null | undefined): string {
  if (!code) return "";
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

/** Best-guess country from the browser locale, e.g. "tr-TR" -> "TR". */
export function guessCountry(): string {
  if (typeof navigator === "undefined") return "US";
  const lang = navigator.language || "";
  const region = lang.split("-")[1]?.toUpperCase();
  return region && region.length === 2 ? region : "US";
}
