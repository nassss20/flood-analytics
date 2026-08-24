const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  console.log("Launching browser to record demo...");
  const browser = await chromium.launch({ headless: false }); 
  
  // Set up video recording
  const context = await browser.newContext({
    recordVideo: {
      dir: path.join(__dirname, 'demo_videos'),
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();
  
  try {
    // 1. Go to URL
    console.log("Navigating to FloodWise portal...");
    await page.goto('https://floodwise-portal.vercel.app/');
    await page.waitForLoadState('networkidle');

    // 2. Login as JPS Editor (Viewer first)
    console.log("Logging in as JPS Editor...");
    await page.fill('input[type="email"]', 'editor@jps.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000); 

    // Handle Welcome Modal if present
    const skipButton = page.locator('button:has-text("Skip for now")');
    if (await skipButton.count() > 0) {
      console.log("Welcome modal detected. Filling setup to ensure username exists in admin table...");
      await page.fill('input[placeholder="e.g. jkr_ahmad"]', 'editor@jps.com');
      await page.fill('input[placeholder="Minimum 6 characters"]', 'password123');
      await page.click('button[type="submit"]'); // The complete setup button
      await page.waitForTimeout(3000);
    }
    
    // Log out
    console.log("Logging out...");
    await page.click('button[title="Log Out"]');
    await page.waitForSelector('input[type="email"]');

    // 3. Login as Admin
    console.log("Logging in as Admin...");
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Admin', { timeout: 10000 });

    // 4. Go to Admin page
    console.log("Navigating to Admin Portal...");
    await page.click('text=Admin');
    await page.waitForTimeout(4000); // Give users table time to load

    // 5. Change Role
    console.log("Changing role for editor@jps.com...");
    console.log("Changing role...");
    const rows = await page.locator('tr').all();
    for (const row of rows) {
      const select = row.locator('select');
      if (await select.count() > 0) {
        const val = await select.inputValue();
        if (val === 'viewer') {
          await select.selectOption('editor_jps');
          break;
        }
      }
    }
    
    await page.waitForTimeout(3000);

    // 6. Log out
    console.log("Logging out from Admin...");
    await page.click('button[title="Log Out"]');
    await page.waitForSelector('input[type="email"]');

    // 7. Login as JPS Editor again
    console.log("Logging in as JPS Editor again...");
    await page.fill('input[type="email"]', 'editor@jps.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);

    // Skip Welcome Modal again if it somehow appears (it shouldn't if we completed it)
    const skipButton2 = page.locator('button:has-text("Skip for now")');
    if (await skipButton2.count() > 0) {
      await skipButton2.click();
      await page.waitForTimeout(1000);
    }

    // 8. Click a marker to show Update Status
    console.log("Clicking a map marker...");
    // Just click the map somewhere that might have a marker, or pick the first marker
    const marker = page.locator('.leaflet-marker-icon').first();
    if (await marker.count() > 0) {
      await marker.click();
      await page.waitForTimeout(2000);
      
      const updateButton = page.locator('button:has-text("Update Status")');
      if (await updateButton.count() > 0) {
        await updateButton.click();
        await page.waitForTimeout(3000); 
        const cancelButton = page.locator('button:has-text("Cancel")');
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
        }
      }
    }

    await page.waitForTimeout(2000);
    
    console.log("Logging out...");
    await page.click('button[title="Log Out"]');
    await page.waitForTimeout(1000);

  } catch (err) {
    console.error("An error occurred during automation:", err);
  } finally {
    console.log("Closing browser and saving video...");
    await context.close();
    await browser.close();
    console.log("Demo recorded successfully in the 'demo_videos' folder!");
  }
})();
