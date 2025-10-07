# Design Guidelines: Economy Plumbing Services Website

## Design Approach

**Reference-Based Approach**: Drawing inspiration from successful local service businesses (HomeAdvisor, Angi, Thumbtack) combined with the aesthetic of your current plumbersthatcare.com website. The design prioritizes trust-building, clear service information, and conversion-focused layouts typical of service industry leaders.

**Core Principle**: Professional, trustworthy, and water-themed with emphasis on accessibility and quick information access for customers in plumbing emergencies.

---

## Color Palette

### Light Mode
- **Primary Brand**: 186 85% 45% (Teal/Turquoise - water theme)
- **Primary Hover**: 186 85% 38%
- **Secondary**: 210 15% 25% (Dark Blue-Gray for text)
- **Background**: 0 0% 100% (White)
- **Surface**: 210 20% 98% (Light Gray)
- **Border**: 210 15% 85%
- **Success**: 142 71% 45% (Green for positive actions)
- **Warning**: 38 92% 50% (Amber for urgency indicators)
- **Emergency Red**: 0 84% 60% (For emergency service CTAs)

### Dark Mode
- **Primary Brand**: 186 75% 55%
- **Primary Hover**: 186 75% 65%
- **Secondary**: 210 15% 85%
- **Background**: 222 15% 10%
- **Surface**: 222 15% 15%
- **Border**: 210 10% 25%

---

## Typography

### Font Families
- **Headings**: 'Inter' (700, 600 weights) - Clean, professional, excellent readability
- **Body**: 'Inter' (400, 500 weights)
- **Accent/Numbers**: 'Poppins' (600, 700 weights) - For phone numbers and CTAs

### Type Scale
- **Hero Headline**: text-5xl lg:text-7xl font-bold
- **Section Headers**: text-3xl lg:text-4xl font-bold
- **Service Titles**: text-2xl font-semibold
- **Body Large**: text-lg
- **Body**: text-base
- **Small/Meta**: text-sm
- **Phone Numbers**: text-2xl lg:text-3xl font-bold (Poppins)

---

## Layout System

**Spacing Primitives**: Tailwind units of 4, 6, 8, 12, 16, 20, 24 (p-4, mt-8, py-12, mb-16, py-20, py-24)

**Container Structure**:
- Max width: max-w-7xl mx-auto
- Horizontal padding: px-4 sm:px-6 lg:px-8
- Section vertical spacing: py-16 lg:py-24

**Grid Patterns**:
- Service cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8
- Service areas: grid-cols-1 md:grid-cols-2 gap-12
- Testimonials: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6

---

## Component Library

### Navigation
- Fixed header with logo left, navigation center, phone + CTA right
- Mobile: Hamburger menu with full-screen overlay
- Sticky on scroll with subtle shadow
- Two prominent phone numbers (Austin/Marble Falls) with icons
- Service dropdown mega-menu showing all services

### Hero Section
- Full-width background image (plumber working or happy customer) with dark overlay (opacity-60)
- Centered headline + subheadline + dual CTAs (Schedule Service + Call Now)
- Trust badges row (Licensed, Insured, Free Estimates) below CTAs
- Height: min-h-[600px] lg:min-h-[700px]
- Buttons on image: variant="outline" with backdrop-blur-sm bg-white/10

### Service Cards
- White cards with hover lift effect (hover:shadow-xl transition)
- Teal icon circle at top (bg-primary text-white rounded-full p-4)
- Service title, 2-3 bullet points, "Learn More" link
- Border: border border-gray-200 rounded-lg p-6

### CTAs & Buttons
- Primary CTA: Teal background, white text, rounded-lg px-8 py-4
- Secondary CTA: White with teal border
- Phone buttons: Emergency red background for urgent services
- All buttons: font-semibold with smooth transitions

### Forms
- Contact form: Two-column on desktop (form left, contact info right)
- Input fields: Rounded borders, focus:ring-2 focus:ring-primary
- Dropdowns for service type, location, urgency level
- Character counter for textarea
- Success/error states with colored borders

### Testimonial Cards
- Customer photo (circular), name, location, service type
- Star rating (5.0 display)
- Quote in quotation marks
- Light gray background, subtle border

### Service Area Cards
- Two-column layout (Austin Metro | Marble Falls Area)
- Address at top with map pin icon
- Grid of cities served (2 columns within card)
- Prominent phone number at bottom
- Background: subtle teal tint (bg-primary/5)

### Footer
- Three-column layout: Services, Service Areas, Company Info
- Newsletter signup form
- Social media icons
- License numbers and badges
- Copyright and legal links
- Background: Dark gray (bg-gray-900 text-gray-300)

---

## Page-Specific Guidelines

### Home Page
1. Hero with scheduler CTA
2. Service grid (6 main services)
3. Why Choose Us (6 value props in grid)
4. Service areas (two locations)
5. Testimonials (6 reviews)
6. Final CTA section with dual phone numbers

### Water Heater Landing Page
- Dedicated hero emphasizing water heater expertise
- Before/after comparison section
- Water heater types showcase (traditional, tankless, hybrid)
- Emergency water heater service CTA
- FAQ accordion
- Trust section with warranty info

### Service Pages
- Service-specific hero image
- Overview paragraph
- Benefits/features grid
- Process timeline (step-by-step)
- Related services
- Service area coverage
- CTA section

### Blog
- Three-column post grid with featured image thumbnails
- Category filters (Water Heaters, Drains, Emergency Tips, etc.)
- Author info and publish date
- Share buttons
- Related posts section

### Store
- Product grid with images
- Membership tiers comparison table
- Add to cart buttons
- Product detail modals
- Trust badges (secure checkout, satisfaction guarantee)

---

## Images

### Required Images with Alt-Text Strategy

**Hero Images** (1920x1080):
- Home: Professional plumber working on water heater in modern home
- Water Heater Page: Close-up of tankless water heater installation
- Emergency Services: Plumber arriving in service truck
Alt-text format: "Economy Plumbing [service] in [location] - professional plumber [action]"

**Service Cards** (400x300):
- Each service with relevant equipment/scenario imagery
- Water heater, drain cleaning, leak repair, toilet/faucet, commercial, emergency
Alt-text: "Economy Plumbing [specific service] - [equipment/scenario]"

**Testimonial Photos** (150x150 circular):
- Customer headshots (stock photos showing diverse Central Texas demographics)
Alt-text: "Economy Plumbing customer testimonial - [name] from [city]"

**Trust Badges/Icons**:
- Licensed badge, insured badge, satisfaction guarantee, free estimates
- Icon set for services (consistent style, teal color)
Alt-text: "[Badge/certification name] - Economy Plumbing Services"

**Logo Usage**:
- Header: Full color logo (provided) at h-12 to h-16
- Footer: White version of logo

---

## Mobile Optimization

- All grids collapse to single column on mobile
- Phone numbers extra prominent (sticky bottom bar option)
- Tap-to-call functionality
- Hamburger menu with service categories
- Simplified forms with larger touch targets
- Hero height: min-h-[500px] on mobile

---

## Performance & SEO

- Lazy loading for all images below fold
- WebP format with fallbacks
- Preload hero images
- Minimal animations (subtle hover states only)
- Schema markup for LocalBusiness, Service, FAQPage
- Canonical URLs matching original site structure
- Meta descriptions 150-160 characters

---

## Trust & Conversion Elements

- License number in footer and about section
- Years in business badge (Since 2012)
- Google review star rating display
- Service area maps
- Emergency service highlight (red accents)
- Upfront pricing messaging
- Same-day service badges
- Before/after photos where applicable