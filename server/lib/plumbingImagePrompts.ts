/**
 * Structured Prompt Engine for AI-Generated Plumbing Animal Images
 * 
 * Features:
 * - Configurable prompt templates
 * - Austin landmark integration
 * - Seasonal context
 * - Scenario-based generation
 * - Metadata for SEO/social
 */

interface PromptMetadata {
  breed: string;
  scenario: string;
  location?: string;
  season?: string;
  hashtags: string[];
  alt: string;
  caption: string;
}

interface PromptTemplate {
  template: string;
  metadata: PromptMetadata;
}

// Austin-specific locations
const austinLocations = [
  { name: 'Downtown Austin loft', context: 'modern urban loft with exposed brick' },
  { name: 'South Congress bungalow', context: 'charming vintage bungalow with retro tiles' },
  { name: 'Zilker neighborhood home', context: 'craftsman-style home with oak hardwood floors' },
  { name: 'Barton Hills residence', context: 'hillside home with scenic window views' },
  { name: 'Mueller community house', context: 'contemporary green-certified home' },
  { name: 'East Austin cottage', context: 'renovated historic cottage with original features' },
  { name: 'Westlake luxury home', context: 'upscale mansion with marble bathrooms' },
  { name: 'Hyde Park Victorian', context: 'classic Victorian home with vintage plumbing' },
];

// Seasonal scenarios
const seasonalContexts = {
  winter: {
    scenarios: ['preventing frozen pipes', 'water heater maintenance', 'indoor leak repair'],
    atmosphere: 'cozy indoor warmth, soft winter light through windows',
  },
  spring: {
    scenarios: ['spring plumbing check-up', 'outdoor spigot repair', 'garden hose connection'],
    atmosphere: 'fresh springtime light, open windows, blooming plants visible',
  },
  summer: {
    scenarios: ['AC drain line clearing', 'pool plumbing', 'outdoor shower installation'],
    atmosphere: 'bright Texas summer light, cooling system work',
  },
  fall: {
    scenarios: ['pre-winter pipe insulation', 'water heater prep', 'gutter drainage'],
    atmosphere: 'golden autumn light, preparing for cold weather',
  },
};

// Get current season
function getCurrentSeason(): keyof typeof seasonalContexts {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

// Dog breed templates with personas
const dogBreedTemplates: PromptTemplate[] = [
  {
    template: "Professional product photography of an intelligent {breed} wearing {attire}, {action} in {location}. {expression}, {setting}, {lighting}, highly detailed, photorealistic, {atmosphere}",
    metadata: {
      breed: 'Border Collie',
      scenario: 'precision pipe fitting',
      hashtags: ['#BorderCollie', '#PlumberDog', '#AustinPlumbing', '#SmartDog'],
      alt: 'AI-generated Border Collie dog in plumber uniform working on pipes in Austin home',
      caption: "This Border Collie's intelligence makes them perfect for precision plumbing work!",
    },
  },
  {
    template: "Professional product photography of a sturdy {breed} wearing {attire}, {action} in {location}. {expression}, {setting}, {lighting}, highly detailed, photorealistic, {atmosphere}",
    metadata: {
      breed: 'English Bulldog',
      scenario: 'heavy-duty installation',
      hashtags: ['#Bulldog', '#PlumberDog', '#AustinTX', '#StrongDog'],
      alt: 'AI-generated Bulldog in work clothes installing plumbing fixtures',
      caption: "Bulldogs bring the muscle to tough plumbing jobs!",
    },
  },
  {
    template: "Professional product photography of an athletic {breed} wearing {attire}, {action} in {location}. {expression}, {setting}, {lighting}, highly detailed, photorealistic, {atmosphere}",
    metadata: {
      breed: 'Australian Shepherd',
      scenario: 'multi-tasking plumbing repair',
      hashtags: ['#AussieShepherd', '#PlumberDog', '#ATX', '#WorkingDog'],
      alt: 'AI-generated Australian Shepherd dog performing plumbing repairs',
      caption: "Australian Shepherds excel at juggling multiple plumbing tasks at once!",
    },
  },
  {
    template: "Professional product photography of a determined {breed} wearing {attire}, {action} in {location}. {expression}, {setting}, {lighting}, highly detailed, photorealistic, {atmosphere}",
    metadata: {
      breed: 'Jack Russell Terrier',
      scenario: 'tight space repair',
      hashtags: ['#JackRussell', '#PlumberDog', '#AustinPlumber', '#SmallButMighty'],
      alt: 'AI-generated Jack Russell Terrier fixing pipes in tight spaces',
      caption: "Jack Russells are perfect for those hard-to-reach plumbing spots!",
    },
  },
];

// Cat breed templates with personas
const catBreedTemplates: PromptTemplate[] = [
  {
    template: "Professional product photography of an elegant {breed} wearing {attire}, {action} in {location}. {expression}, {setting}, {lighting}, highly detailed, photorealistic, {atmosphere}",
    metadata: {
      breed: 'Russian Blue',
      scenario: 'blueprint review',
      hashtags: ['#RussianBlue', '#PlumberCat', '#AustinCat', '#SmartCat'],
      alt: 'AI-generated Russian Blue cat studying plumbing blueprints',
      caption: "Russian Blues bring elegance and precision to every plumbing project!",
    },
  },
  {
    template: "Professional product photography of a fluffy {breed} wearing {attire}, {action} in {location}. {expression}, {setting}, {lighting}, highly detailed, photorealistic, {atmosphere}",
    metadata: {
      breed: 'Ragdoll',
      scenario: 'luxury bathroom work',
      hashtags: ['#Ragdoll', '#PlumberCat', '#LuxuryPlumbing', '#FluffyCat'],
      alt: 'AI-generated Ragdoll cat working on luxury bathroom plumbing',
      caption: "Ragdolls specialize in high-end bathroom installations!",
    },
  },
  {
    template: "Professional product photography of an athletic {breed} wearing {attire}, {action} in {location}. {expression}, {setting}, {lighting}, highly detailed, photorealistic, {atmosphere}",
    metadata: {
      breed: 'Bengal',
      scenario: 'climbing pipe access',
      hashtags: ['#Bengal', '#PlumberCat', '#AthleticCat', '#ATXCat'],
      alt: 'AI-generated Bengal cat climbing pipes to access ceiling plumbing',
      caption: "Bengal cats use their climbing skills to reach those high pipes!",
    },
  },
  {
    template: "Professional product photography of a curious {breed} wearing {attire}, {action} in {location}. {expression}, {setting}, {lighting}, highly detailed, photorealistic, {atmosphere}",
    metadata: {
      breed: 'Scottish Fold',
      scenario: 'under-sink inspection',
      hashtags: ['#ScottishFold', '#PlumberCat', '#CuriousCat', '#AustinPets'],
      alt: 'AI-generated Scottish Fold cat inspecting under-sink plumbing',
      caption: "Scottish Folds love investigating those mysterious under-sink pipes!",
    },
  },
];

// Plumbing attire options
const attireOptions = [
  'red plumber overalls and yellow hard hat',
  'navy blue work coveralls with tool belt',
  'orange safety vest over work shirt',
  'classic denim overalls with name patch',
  'green work shirt with company logo',
];

// Plumbing actions
const plumbingActions = [
  'using pipe wrench to tighten copper fitting',
  'installing new faucet fixture',
  'checking water pressure gauge',
  'threading pipe with precision',
  'soldering copper pipes with blowtorch and safety goggles',
  'inspecting pipes with flashlight',
  'reading plumbing blueprint carefully',
  'using plunger on drain',
];

// Expressions
const expressions = [
  'focused intelligent expression',
  'confident professional demeanor',
  'determined concentrated look',
  'satisfied expert smile',
  'serious craftsman focus',
];

// Lighting setups
const lightingSetups = [
  'dramatic side lighting from workshop window',
  'soft natural daylight',
  'professional contractor lighting',
  'warm overhead task lighting',
  'bright industrial fluorescents',
  'golden afternoon sunlight',
];

/**
 * Generate contextual prompt with Austin flavor and seasonal elements
 */
export function generateContextualPrompt(animal: 'dog' | 'cat'): { prompt: string; metadata: PromptMetadata } {
  const templates = animal === 'dog' ? dogBreedTemplates : catBreedTemplates;
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const location = austinLocations[Math.floor(Math.random() * austinLocations.length)];
  const season = getCurrentSeason();
  const seasonalContext = seasonalContexts[season];
  const scenario = seasonalContext.scenarios[Math.floor(Math.random() * seasonalContext.scenarios.length)];
  
  const attire = attireOptions[Math.floor(Math.random() * attireOptions.length)];
  const action = plumbingActions[Math.floor(Math.random() * plumbingActions.length)];
  const expression = expressions[Math.floor(Math.random() * expressions.length)];
  const lighting = lightingSetups[Math.floor(Math.random() * lightingSetups.length)];
  
  // Fill in template
  const prompt = template.template
    .replace('{breed}', template.metadata.breed)
    .replace('{attire}', attire)
    .replace('{action}', action)
    .replace('{location}', location.context)
    .replace('{expression}', expression)
    .replace('{setting}', location.name)
    .replace('{lighting}', lighting)
    .replace('{atmosphere}', seasonalContext.atmosphere);
  
  // Enhance metadata with context
  const metadata: PromptMetadata = {
    ...template.metadata,
    location: location.name,
    season,
    alt: `${template.metadata.alt} - ${scenario} in ${location.name} - ${season} season`,
    caption: `${template.metadata.caption} Spotted in ${location.name} ${scenario}!`,
  };
  
  return { prompt, metadata };
}

/**
 * Generate FAQ schema for SEO
 */
export function generateFAQSchema(animal: 'dog' | 'cat') {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Are these real ${animal}s doing plumbing?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `No! These are AI-generated images created for fun and entertainment. Economy Plumbing Services uses professional human plumbers for all real plumbing work in Austin, TX.`
        }
      },
      {
        "@type": "Question",
        "name": "How are these images created?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We use advanced AI image generation technology (OpenAI's DALL-E) with carefully crafted prompts featuring different breeds, plumbing scenarios, and Austin locations."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use these images?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "All images are watermarked with Economy Plumbing Services branding. You're welcome to share them on social media using our share buttons!"
        }
      },
      {
        "@type": "Question",
        "name": "Do you offer real plumbing services in Austin?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Economy Plumbing Services provides professional plumbing services throughout the greater Austin area. Call us for expert residential and commercial plumbing work."
        }
      }
    ]
  };
}

/**
 * Generate platform-specific share text
 */
export function generateShareText(animal: 'dog' | 'cat', metadata: PromptMetadata, platform: 'facebook' | 'twitter' | 'sms' | 'instagram'): string {
  const hashtagString = metadata.hashtags.join(' ');
  
  const templates = {
    facebook: `${metadata.caption}\n\nAI-generated by Economy Plumbing Services 🔧\n${hashtagString}`,
    twitter: `${metadata.caption}\n\n${hashtagString}`,
    sms: `Check out this adorable AI-generated ${animal} plumber! ${metadata.caption}`,
    instagram: `${metadata.caption}\n\nAI-generated ${metadata.breed} plumber spotted in ${metadata.location}!\n\n${hashtagString}\n\n#AustinPlumbing #EconomyPlumbing #AIArt #PetsOfAustin`,
  };
  
  return templates[platform];
}
