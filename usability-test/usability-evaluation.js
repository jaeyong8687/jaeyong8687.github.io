const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://localhost:8000';
const bugs = [];
let testResults = {
  totalLinks: 0,
  brokenLinks: 0,
  workingLinks: 0,
  usabilityIssues: []
};

function logBug(severity, category, issue, screenshot = null) {
  bugs.push({
    severity,
    category,
    issue,
    screenshot,
    timestamp: new Date().toISOString()
  });
  console.log(`🐛 [${severity}] ${category}: ${issue}`);
}

async function screenshot(page, name) {
  const path = `screenshots/${name}`;
  await page.screenshot({ path, fullPage: true });
  console.log(`📸 Screenshot: ${name}`);
  return path;
}

async function checkLink(page, url, linkText, context) {
  testResults.totalLinks++;
  try {
    const response = await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    if (response.status() >= 400) {
      testResults.brokenLinks++;
      logBug('HIGH', 'Broken Link', 
        `Link "${linkText}" (${url}) returns ${response.status()} - Found in: ${context}`);
      return false;
    } else {
      testResults.workingLinks++;
      console.log(`✅ Link OK: ${linkText} -> ${url}`);
      return true;
    }
  } catch (error) {
    testResults.brokenLinks++;
    logBug('HIGH', 'Broken Link', 
      `Link "${linkText}" (${url}) failed to load - Error: ${error.message} - Found in: ${context}`);
    return false;
  }
}

async function evaluateUsability(page, pageName) {
  console.log(`\n🔍 Evaluating: ${pageName}`);
  
  // Check page title
  const title = await page.title();
  if (!title || title.length < 3) {
    logBug('MEDIUM', 'SEO/Usability', `Page "${pageName}" has missing or too short title`);
  }
  
  // Check for alt text on images
  const imagesWithoutAlt = await page.$$eval('img', imgs => 
    imgs.filter(img => !img.alt || img.alt.trim() === '').length
  );
  if (imagesWithoutAlt > 0) {
    logBug('MEDIUM', 'Accessibility', 
      `Page "${pageName}" has ${imagesWithoutAlt} images without alt text`);
  }
  
  // Check for broken images
  const brokenImages = await page.$$eval('img', imgs =>
    imgs.filter(img => !img.complete || img.naturalHeight === 0).map(img => img.src)
  );
  if (brokenImages.length > 0) {
    logBug('HIGH', 'Broken Resource', 
      `Page "${pageName}" has ${brokenImages.length} broken images: ${brokenImages.join(', ')}`);
  }
  
  // Check viewport/mobile responsiveness meta tag
  const viewportMeta = await page.$('meta[name="viewport"]');
  if (!viewportMeta) {
    logBug('LOW', 'Mobile Usability', 
      `Page "${pageName}" missing viewport meta tag for mobile responsiveness`);
  }
  
  // Check for console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Check contrast and readability
  const bodyText = await page.$eval('body', el => {
    const style = window.getComputedStyle(el);
    return {
      fontSize: style.fontSize,
      color: style.color,
      backgroundColor: style.backgroundColor
    };
  }).catch(() => null);
  
  console.log(`✓ Evaluated ${pageName}`);
}

async function crawlAndTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║       USABILITY EVALUATION & LINK CHECKER STARTED            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  try {
    // 1. Test Homepage
    console.log('📄 Testing Homepage...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await screenshot(page, '01-homepage.png');
    await evaluateUsability(page, 'Homepage');
    
    // Extract all links from homepage
    const links = await page.$$eval('a', anchors => 
      anchors.map(a => ({
        href: a.href,
        text: a.textContent.trim(),
        hasHref: !!a.href
      }))
    );
    
    console.log(`\n🔗 Found ${links.length} links on homepage\n`);
    
    // 2. Check navigation links
    const navLinks = await page.$$eval('.masthead-nav a, nav a', anchors =>
      anchors.map(a => ({ href: a.href, text: a.textContent.trim() }))
    );
    
    console.log('🧭 Testing Navigation Links:');
    for (const link of navLinks) {
      if (link.href && !link.href.includes('javascript:')) {
        await checkLink(page, link.href, link.text, 'Main Navigation');
      }
    }
    
    // 3. Check all project/portfolio links
    const projectLinks = links.filter(link => 
      link.href && 
      !link.href.includes('javascript:') &&
      !link.href.includes('#') &&
      link.href.includes(BASE_URL)
    );
    
    console.log('\n📁 Testing Project Links:');
    for (const link of projectLinks) {
      const isWorking = await checkLink(page, link.href, link.text, 'Homepage');
      
      if (isWorking) {
        // Visit the page and check it
        await page.goto(link.href, { waitUntil: 'domcontentloaded' });
        const pageName = link.href.split('/').pop();
        await screenshot(page, `page-${pageName.replace('.html', '')}.png`);
        await evaluateUsability(page, pageName);
        
        // Check back button works
        await page.goBack();
      }
    }
    
    // 4. Test responsive design
    console.log('\n📱 Testing Mobile Responsiveness:');
    await page.goto(BASE_URL);
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await screenshot(page, '02-mobile-view.png');
    
    const mobileNav = await page.$('.menu-desktop');
    if (mobileNav) {
      const isVisible = await mobileNav.isVisible();
      if (isVisible) {
        logBug('LOW', 'Mobile Usability', 
          'Desktop navigation still visible on mobile viewport');
      }
    }
    
    // 5. Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await screenshot(page, '03-tablet-view.png');
    
    // 6. Check external links
    console.log('\n🌐 Testing External Links:');
    await page.goto(BASE_URL);
    const externalLinks = await page.$$eval('a[href^="http"]', anchors =>
      anchors.filter(a => !a.href.includes('jaeyong8687.github.io'))
        .map(a => ({ href: a.href, text: a.textContent.trim() }))
    );
    
    for (const link of externalLinks.slice(0, 10)) { // Test first 10 external links
      if (link.href && !link.href.includes('javascript:')) {
        await checkLink(page, link.href, link.text, 'External Link');
      }
    }
    
    // 7. Test About page specifically
    console.log('\n👤 Testing About Page:');
    const aboutUrl = `${BASE_URL}/about.html`;
    const aboutWorking = await checkLink(page, aboutUrl, 'About', 'Navigation');
    if (aboutWorking) {
      await page.goto(aboutUrl);
      await screenshot(page, '04-about-page.png');
      await evaluateUsability(page, 'About Page');
      
      // Check social media links
      const socialLinks = await page.$$eval('a', anchors =>
        anchors.filter(a => 
          a.href.includes('linkedin') || 
          a.href.includes('twitter') ||
          a.href.includes('github') ||
          a.href.includes('mailto')
        ).map(a => ({ href: a.href, text: a.textContent.trim() }))
      );
      
      console.log('\n📧 Testing Contact/Social Links:');
      for (const link of socialLinks) {
        if (!link.href.includes('mailto:')) {
          await checkLink(page, link.href, link.text, 'Social Media');
        } else {
          console.log(`✅ Email link OK: ${link.href}`);
          testResults.workingLinks++;
          testResults.totalLinks++;
        }
      }
    }
    
    // 8. Performance check
    console.log('\n⚡ Checking Performance:');
    await page.goto(BASE_URL);
    const loadTime = await page.evaluate(() => {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    });
    
    console.log(`Page load time: ${loadTime}ms`);
    if (loadTime > 5000) {
      logBug('MEDIUM', 'Performance', 
        `Homepage load time (${loadTime}ms) exceeds recommended 3000ms`);
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
    logBug('CRITICAL', 'Test Execution', `Test failed: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Generate report
  generateReport();
}

function generateReport() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST RESULTS SUMMARY                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📊 Link Testing Results:`);
  console.log(`   Total Links Tested: ${testResults.totalLinks}`);
  console.log(`   ✅ Working Links: ${testResults.workingLinks}`);
  console.log(`   ❌ Broken Links: ${testResults.brokenLinks}`);
  console.log(`   Success Rate: ${((testResults.workingLinks/testResults.totalLinks)*100).toFixed(1)}%\n`);
  
  console.log(`🐛 Bugs Found: ${bugs.length}\n`);
  
  if (bugs.length > 0) {
    console.log('Bug Details:\n');
    
    const critical = bugs.filter(b => b.severity === 'CRITICAL');
    const high = bugs.filter(b => b.severity === 'HIGH');
    const medium = bugs.filter(b => b.severity === 'MEDIUM');
    const low = bugs.filter(b => b.severity === 'LOW');
    
    if (critical.length > 0) {
      console.log('🔴 CRITICAL BUGS:');
      critical.forEach((bug, i) => console.log(`   ${i+1}. [${bug.category}] ${bug.issue}`));
      console.log('');
    }
    
    if (high.length > 0) {
      console.log('🟠 HIGH PRIORITY BUGS:');
      high.forEach((bug, i) => console.log(`   ${i+1}. [${bug.category}] ${bug.issue}`));
      console.log('');
    }
    
    if (medium.length > 0) {
      console.log('🟡 MEDIUM PRIORITY BUGS:');
      medium.forEach((bug, i) => console.log(`   ${i+1}. [${bug.category}] ${bug.issue}`));
      console.log('');
    }
    
    if (low.length > 0) {
      console.log('🟢 LOW PRIORITY BUGS:');
      low.forEach((bug, i) => console.log(`   ${i+1}. [${bug.category}] ${bug.issue}`));
      console.log('');
    }
  } else {
    console.log('✨ No bugs found! Site is in excellent condition.\n');
  }
  
  // Write bug report to file
  const bugReport = {
    timestamp: new Date().toISOString(),
    summary: testResults,
    bugs: bugs,
    recommendations: generateRecommendations()
  };
  
  fs.writeFileSync('bugs/bug-report.json', JSON.stringify(bugReport, null, 2));
  
  // Create markdown report
  let markdown = `# Usability Evaluation Report - jaeyong8687.github.io\n\n`;
  markdown += `**Test Date:** ${new Date().toISOString()}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- **Total Links Tested:** ${testResults.totalLinks}\n`;
  markdown += `- **Working Links:** ✅ ${testResults.workingLinks}\n`;
  markdown += `- **Broken Links:** ❌ ${testResults.brokenLinks}\n`;
  markdown += `- **Total Bugs Found:** ${bugs.length}\n\n`;
  
  markdown += `## Bug Reports\n\n`;
  
  ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
    const severityBugs = bugs.filter(b => b.severity === severity);
    if (severityBugs.length > 0) {
      markdown += `### ${severity} Priority (${severityBugs.length})\n\n`;
      severityBugs.forEach((bug, i) => {
        markdown += `${i+1}. **[${bug.category}]** ${bug.issue}\n`;
        if (bug.screenshot) {
          markdown += `   - Screenshot: ${bug.screenshot}\n`;
        }
        markdown += `\n`;
      });
    }
  });
  
  markdown += `\n## Recommendations\n\n`;
  generateRecommendations().forEach((rec, i) => {
    markdown += `${i+1}. ${rec}\n`;
  });
  
  markdown += `\n## Screenshots\n\n`;
  markdown += `All screenshots saved in: \`screenshots/\` directory\n`;
  
  fs.writeFileSync('bugs/USABILITY_REPORT.md', markdown);
  
  console.log('📄 Reports Generated:');
  console.log('   - bugs/bug-report.json');
  console.log('   - bugs/USABILITY_REPORT.md\n');
}

function generateRecommendations() {
  const recommendations = [];
  
  if (testResults.brokenLinks > 0) {
    recommendations.push('Fix all broken links to improve user experience and SEO');
  }
  
  if (bugs.some(b => b.category === 'Accessibility')) {
    recommendations.push('Add alt text to all images for better accessibility');
  }
  
  if (bugs.some(b => b.category === 'Mobile Usability')) {
    recommendations.push('Improve mobile responsive design');
  }
  
  if (bugs.some(b => b.category === 'Performance')) {
    recommendations.push('Optimize page load times by compressing images and minifying CSS/JS');
  }
  
  recommendations.push('Consider adding a 404 error page');
  recommendations.push('Add meta descriptions for better SEO');
  recommendations.push('Implement lazy loading for images');
  
  return recommendations;
}

// Run the evaluation
crawlAndTest();
