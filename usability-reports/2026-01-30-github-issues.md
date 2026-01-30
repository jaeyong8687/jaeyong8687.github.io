# GitHub Issues - Bug Reports

## Issue #1: 🔴 HIGH - Broken Images on Visualizing Air Quality Page

**Category:** Broken Resources  
**Priority:** HIGH  
**Page:** visualizingAirQuality.html

**Description:**
Three images fail to load on the "Visualizing Air Quality" project page, resulting in broken image icons.

**Broken Image URLs:**
1. `imgs/works/visualizingAirQuality/filter.jpg`
2. `svgs/arrow_prev.svg`
3. `svgs/arrow_next.svg`

**Steps to Reproduce:**
1. Navigate to https://jaeyong8687.github.io/visualizingAirQuality.html
2. Scroll through the page
3. Observe broken image placeholders

**Impact:**
- Poor user experience
- Incomplete project presentation
- Negative impression on portfolio quality

**Recommendation:**
- Check if image files exist in the repository
- Verify file paths are correct
- Add missing images or remove references

**Screenshot:** `screenshots/page-visualizingAirQuality.png`

---

## Issue #2: 🔴 HIGH - LinkedIn Links Return 999 Error

**Category:** Broken Links  
**Priority:** HIGH  
**Page:** about.html

**Description:**
LinkedIn profile links return HTTP 999 status code, which LinkedIn uses to block automated scrapers. While the links may work for human users, they fail automated testing.

**Broken Links:**
1. https://www.linkedin.com/in/jaeyonglee05/ (Your profile - appears twice)
2. https://www.linkedin.com/in/peter-lee-ba4004b8/
3. https://www.linkedin.com/in/lievensbjorn/

**Steps to Reproduce:**
1. Navigate to https://jaeyong8687.github.io/about.html
2. Click on LinkedIn recommendation links
3. Some may work manually, but fail automated checks

**Impact:**
- SEO tools and link checkers will flag these as broken
- Accessibility validators may report errors
- Automated monitoring tools will fail

**Recommendation:**
- This is expected behavior from LinkedIn (anti-scraping protection)
- Consider adding `rel="nofollow"` to LinkedIn links
- Document that these links work for human users
- Consider alternative reference format (screenshots, text testimonials)

**Note:** This is a known LinkedIn limitation, not necessarily your site's fault.

---

## Issue #3: 🟡 MEDIUM - Missing Alt Text on Images (Site-wide)

**Category:** Accessibility  
**Priority:** MEDIUM  
**Pages:** ALL pages

**Description:**
Significant accessibility issue - images throughout the portfolio lack alternative text (alt attributes), making the site inaccessible to screen reader users and harming SEO.

**Affected Pages & Image Counts:**
- visualizingAirQuality.html: 46 images
- interactCity.html: 28 images
- chinadigitalinnovationplatform.html: 22 images
- embodiedUI.html: 19 images
- Homepage (index.html): 16 images
- travelersPaperKit.html: 14 images
- interventionalCT.html: 11 images
- pickysJourney.html: 10 images
- primaryCare.html: 9 images
- KalasatamaHospital.html: 8 images
- WeldingTrainingApp.html: 8 images
- 0100design.html: 8 images
- 81project.html: 7 images
- Verohallinto.html: 7 images
- lifeLight.html: 6 images
- about.html: 3 images
- experienceDrivenDesign.html: 2 images

**Total Missing Alt Text:** ~250+ images

**Example:**
```html
<!-- Current (Bad) -->
<img src="imgs/works/iaCity.png" id="small"/>

<!-- Should be (Good) -->
<img src="imgs/works/iaCity.png" id="small" alt="Interactive City connected lighting system dashboard"/>
```

**Impact:**
- **Accessibility:** Screen reader users cannot understand image content
- **SEO:** Search engines can't index image content properly
- **Legal:** May violate WCAG 2.1 Level A compliance (required in many jurisdictions)
- **UX:** Images don't display descriptions when they fail to load

**Recommendation:**
1. Add descriptive alt text to all portfolio images
2. For decorative images, use `alt=""` (empty but present)
3. For complex diagrams, consider adding longer descriptions
4. Use meaningful descriptions that explain the image content

**Priority Justification:**
While not breaking functionality, this affects:
- ~15-20% of users with disabilities
- Search engine rankings
- Professional standards for web development

---

## Issue #4: 🟢 LOW - Mobile Navigation Not Hidden on Small Screens

**Category:** Mobile Usability  
**Priority:** LOW  
**Pages:** All pages

**Description:**
Desktop navigation menu remains visible on mobile viewports (375px width), overlapping with content and creating a poor mobile user experience.

**Steps to Reproduce:**
1. Open site on mobile device or resize browser to 375px width
2. Observe navigation menu
3. Desktop menu items are still visible

**Impact:**
- Cluttered mobile interface
- Navigation elements may overlap content
- Not following mobile-first design patterns

**Recommendation:**
Add CSS media query to hide desktop menu on mobile:
```css
@media (max-width: 768px) {
  .menu-desktop {
    display: none;
  }
}
```

**Screenshot:** `screenshots/02-mobile-view.png`

---

## Issue #5: ⚡ ENHANCEMENT - Performance & SEO Improvements

**Category:** Enhancement  
**Priority:** LOW  
**Pages:** All pages

**Description:**
General recommendations to improve site performance, SEO, and user experience.

**Recommendations:**

### 1. Add Meta Descriptions
```html
<meta name="description" content="Portfolio of Jaeyong Lee - UX/UI Designer specializing in healthcare and smart city solutions">
```

### 2. Implement Image Lazy Loading
```html
<img src="image.jpg" alt="Description" loading="lazy">
```

### 3. Add 404 Error Page
Create custom 404.html for better UX when users encounter broken links

### 4. Optimize Images
- Compress images (use tools like TinyPNG, ImageOptim)
- Convert to WebP format for better compression
- Current page load: 92ms (excellent!) but can be improved further

### 5. Add Structured Data (Schema.org)
Help search engines understand your portfolio:
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Jaeyong Lee",
  "jobTitle": "UX/UI Designer",
  "url": "https://jaeyong8687.github.io"
}
```

### 6. Add Open Graph Tags
For better social media sharing:
```html
<meta property="og:title" content="Jaeyong Lee - Portfolio">
<meta property="og:description" content="UX/UI Designer Portfolio">
<meta property="og:image" content="https://jaeyong8687.github.io/imgs/og-image.jpg">
```

---

## Summary Statistics

**Total Issues Found:** 26
- 🔴 **Critical:** 0
- 🔴 **High:** 5 (1 broken images, 4 LinkedIn links)
- 🟡 **Medium:** 20 (all accessibility - missing alt text)
- 🟢 **Low:** 1 (mobile menu visibility)

**Link Testing Results:**
- Total Links Tested: 27
- ✅ Working: 23 (85.2%)
- ❌ Broken: 4 (14.8%)

**Performance:**
- Page Load Time: 92ms ⚡ (Excellent!)

**Overall Assessment:**
The portfolio site is well-built with excellent performance. Main issues are:
1. Missing image files (quick fix)
2. Accessibility improvements needed (alt text)
3. LinkedIn link issues (external, not critical)
4. Minor mobile responsiveness tweaks

**Estimated Fix Time:**
- High priority bugs: 1-2 hours
- Medium priority (alt text): 4-6 hours
- Low priority: 30 minutes

