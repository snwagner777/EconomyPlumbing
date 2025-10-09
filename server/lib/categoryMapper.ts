// Maps machine-readable categories to human-readable display categories
export const CATEGORY_MAP: Record<string, string> = {
  water_heater: "Water Heaters",
  drain: "Drains",
  leak: "Leaks",
  faucet: "Faucets",
  gas: "Gas Services",
  general: "General Plumbing",
  toilet: "Toilets",
  backflow: "Backflow Testing",
  commercial: "Commercial",
  sewer: "Sewer Services",
  repiping: "Repiping",
};

// Convert machine category to display category
export function mapCategoryToDisplay(machineCategory: string): string {
  return CATEGORY_MAP[machineCategory.toLowerCase()] || "General Plumbing";
}

// Get all valid display categories
export function getValidDisplayCategories(): string[] {
  return [
    "Water Heaters",
    "Drains",
    "Leaks",
    "Faucets",
    "Gas Services",
    "General Plumbing",
    "Toilets",
    "Backflow Testing",
    "Commercial",
    "Sewer Services",
    "Repiping",
    "Emergency Tips",
    "Maintenance",
    "Seasonal Tips",
    "Customer Stories",
    "Promotions",
    "Blog"
  ];
}
