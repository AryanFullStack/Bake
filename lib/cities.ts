export const OTHER_CITY_OPTION = "Other / Enter City";

export const PAKISTAN_CITIES = [
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Karachi",
  "Abbottabad",
  "Mansehra",
  "Haripur",
  "Peshawar",
  "Faisalabad",
  "Multan",
  "Gujranwala",
  "Sialkot",
  "Quetta",
  "Hyderabad",
  "Bahawalpur",
  "Sargodha",
  "Mardan",
  "Swat",
  "Muzaffarabad",
  "Gilgit",
  "Sukkur",
  "Jhelum",
  "Gujrat",
  "Wah Cantt",
  "Taxila",
  "Attock",
  "Nowshera",
  "Dera Ismail Khan",
  "Mingora",
  "Charsadda",
  "Okara",
  "Kasur",
  "Sheikhupura",
  "Rahim Yar Khan",
  "Sahiwal",
  "Jhang",
  "Mirpur",
  "Skardu",
  "Chitral",
  "Larkana",
  "Nawabshah",
  "Kohat",
  "Dera Ghazi Khan",
  "Khuzdar",
  "Chiniot",
  "Burewala",
  "Hafizabad",
  "Kamoke",
  "Jacobabad",
  OTHER_CITY_OPTION,
] as const;

export type PakistanCity = typeof PAKISTAN_CITIES[number];

/**
 * Given a city string, returns whether it exists in the predefined list (excluding Other)
 */
export function isPredefinedCity(city: string): boolean {
  if (!city) return false;
  return (PAKISTAN_CITIES as readonly string[]).includes(city) && city !== OTHER_CITY_OPTION;
}

/**
 * Resolves the dropdown value and custom city text for a given city string
 */
export function getCitySelectionState(savedCity: string): { selectValue: string; customCity: string } {
  if (!savedCity) {
    return { selectValue: "Lahore", customCity: "" };
  }
  if (isPredefinedCity(savedCity)) {
    return { selectValue: savedCity, customCity: "" };
  }
  return { selectValue: OTHER_CITY_OPTION, customCity: savedCity };
}
