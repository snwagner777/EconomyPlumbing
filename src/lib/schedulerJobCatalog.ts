/**
 * Scheduler Job Type Catalog
 * 
 * Maps ServiceTitan job types to visual presentation (icons, descriptions, categories).
 * This keeps UI concerns separate from ServiceTitan data.
 */

import { 
  Droplet, 
  Flame, 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Thermometer,
  Bath,
  ShowerHead,
  Home,
  type LucideIcon
} from 'lucide-react';

export interface JobTypeMeta {
  icon: LucideIcon;
  color: string; // Tailwind color class
  category: 'emergency' | 'installation' | 'repair' | 'maintenance' | 'inspection';
  displayName?: string; // Override ServiceTitan name if needed
  marketingCopy?: string; // Short sales pitch
  searchKeywords?: string[]; // For fuzzy matching
}

// Map job type names (from ServiceTitan) to visual metadata
export const JOB_TYPE_CATALOG: Record<string, JobTypeMeta> = {
  // Emergency Services
  'Emergency Service': {
    icon: AlertTriangle,
    color: 'text-red-500',
    category: 'emergency',
    marketingCopy: 'Urgent repairs, 24/7 availability',
    searchKeywords: ['urgent', 'emergency', 'leak', 'burst', 'flooding'],
  },
  'Emergency Plumbing': {
    icon: AlertTriangle,
    color: 'text-red-500',
    category: 'emergency',
    marketingCopy: 'Immediate assistance for plumbing emergencies',
  },
  
  // Water Heaters
  'Water Heater Repair': {
    icon: Flame,
    color: 'text-orange-500',
    category: 'repair',
    marketingCopy: 'Fast repairs for no hot water issues',
    searchKeywords: ['hot water', 'heater', 'tank', 'tankless'],
  },
  'Water Heater Installation': {
    icon: Flame,
    color: 'text-blue-500',
    category: 'installation',
    marketingCopy: 'New water heater installation and replacement',
  },
  'Water Heater Service': {
    icon: Thermometer,
    color: 'text-orange-500',
    category: 'maintenance',
    marketingCopy: 'Annual maintenance and tune-ups',
  },
  
  // Drain Services
  'Drain Cleaning': {
    icon: Droplet,
    color: 'text-blue-500',
    category: 'repair',
    marketingCopy: 'Clear clogs and restore flow',
    searchKeywords: ['clog', 'backup', 'slow drain', 'blocked'],
  },
  'Hydro Jetting': {
    icon: Droplet,
    color: 'text-cyan-500',
    category: 'repair',
    displayName: 'Hydro Jetting',
    marketingCopy: 'High-pressure drain cleaning',
  },
  
  // Leak Services
  'Leak Detection': {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    category: 'inspection',
    marketingCopy: 'Find hidden leaks before they cause damage',
    searchKeywords: ['leak', 'water damage', 'wet spot', 'high bill'],
  },
  'Leak Repair': {
    icon: Wrench,
    color: 'text-blue-500',
    category: 'repair',
    marketingCopy: 'Fix leaks fast to prevent water damage',
  },
  
  // Fixture Services
  'Faucet Repair': {
    icon: Droplet,
    color: 'text-blue-500',
    category: 'repair',
    marketingCopy: 'Stop drips and restore function',
    searchKeywords: ['faucet', 'tap', 'drip', 'handle'],
  },
  'Faucet Installation': {
    icon: Bath,
    color: 'text-blue-500',
    category: 'installation',
    marketingCopy: 'Upgrade to new faucets and fixtures',
  },
  'Toilet Repair': {
    icon: Home,
    color: 'text-blue-500',
    category: 'repair',
    marketingCopy: 'Fix running toilets and flush problems',
    searchKeywords: ['toilet', 'flush', 'running', 'leak'],
  },
  'Toilet Installation': {
    icon: Home,
    color: 'text-blue-500',
    category: 'installation',
    marketingCopy: 'New toilet installation and replacement',
  },
  
  // General Services
  'Plumbing Repair': {
    icon: Wrench,
    color: 'text-blue-500',
    category: 'repair',
    marketingCopy: 'General plumbing repairs and fixes',
  },
  'Plumbing Installation': {
    icon: Settings,
    color: 'text-blue-500',
    category: 'installation',
    marketingCopy: 'New plumbing installations',
  },
  'Plumbing Inspection': {
    icon: CheckCircle,
    color: 'text-green-500',
    category: 'inspection',
    marketingCopy: 'Comprehensive plumbing system inspection',
  },
  'Maintenance': {
    icon: Settings,
    color: 'text-purple-500',
    category: 'maintenance',
    marketingCopy: 'Preventive maintenance to avoid costly repairs',
  },
  
  // Sewer & Line Services
  'Sewer Line Repair': {
    icon: AlertTriangle,
    color: 'text-red-500',
    category: 'repair',
    marketingCopy: 'Sewer line repairs and replacements',
    searchKeywords: ['sewer', 'main line', 'backup', 'sewage'],
  },
  'Camera Inspection': {
    icon: CheckCircle,
    color: 'text-purple-500',
    category: 'inspection',
    marketingCopy: 'Video camera line inspection',
  },
  
  // Repiping
  'Repiping': {
    icon: Settings,
    color: 'text-blue-500',
    category: 'installation',
    displayName: 'Whole House Repiping',
    marketingCopy: 'Complete pipe replacement for your home',
    searchKeywords: ['repipe', 'old pipes', 'galvanized', 'polybutylene'],
  },
};

// Default fallback for unknown job types
export const DEFAULT_JOB_META: JobTypeMeta = {
  icon: Wrench,
  color: 'text-blue-500',
  category: 'repair',
  marketingCopy: 'Professional plumbing service',
};

/**
 * Get metadata for a job type by name (fuzzy matching)
 */
export function getJobTypeMeta(jobTypeName: string): JobTypeMeta {
  // Direct match
  if (JOB_TYPE_CATALOG[jobTypeName]) {
    return JOB_TYPE_CATALOG[jobTypeName];
  }
  
  // Fuzzy match by partial name
  const normalized = jobTypeName.toLowerCase();
  for (const [key, meta] of Object.entries(JOB_TYPE_CATALOG)) {
    if (key.toLowerCase().includes(normalized) || normalized.includes(key.toLowerCase())) {
      return meta;
    }
  }
  
  // Keyword search
  for (const [_, meta] of Object.entries(JOB_TYPE_CATALOG)) {
    if (meta.searchKeywords?.some(kw => normalized.includes(kw.toLowerCase()))) {
      return meta;
    }
  }
  
  return DEFAULT_JOB_META;
}

/**
 * Get all job types grouped by category
 */
export function getJobTypesByCategory() {
  return {
    emergency: Object.entries(JOB_TYPE_CATALOG)
      .filter(([_, meta]) => meta.category === 'emergency')
      .map(([name, meta]) => ({ name, ...meta })),
    repair: Object.entries(JOB_TYPE_CATALOG)
      .filter(([_, meta]) => meta.category === 'repair')
      .map(([name, meta]) => ({ name, ...meta })),
    installation: Object.entries(JOB_TYPE_CATALOG)
      .filter(([_, meta]) => meta.category === 'installation')
      .map(([name, meta]) => ({ name, ...meta })),
    maintenance: Object.entries(JOB_TYPE_CATALOG)
      .filter(([_, meta]) => meta.category === 'maintenance')
      .map(([name, meta]) => ({ name, ...meta })),
    inspection: Object.entries(JOB_TYPE_CATALOG)
      .filter(([_, meta]) => meta.category === 'inspection')
      .map(([name, meta]) => ({ name, ...meta })),
  };
}
