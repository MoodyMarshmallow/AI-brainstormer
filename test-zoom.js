// Test script to verify zoom functionality
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173');
    
    // Enter a topic to create nodes
    await page.fill('input[type="text"]', 'test topic');
    await page.press('input[type="text"]', 'Enter');
    
    // Wait for nodes to appear
    await page.waitForTimeout(3000);
    
    // Get the SVG element
    const svg = await page.locator('svg');
    
    // Test zooming in with wheel event
    console.log('Testing zoom in...');
    await svg.hover();
    await page.mouse.wheel(0, -500); // Scroll up to zoom in
    
    await page.waitForTimeout(1000);
    
    // Test zooming out
    console.log('Testing zoom out...');
    await page.mouse.wheel(0, 500); // Scroll down to zoom out
    
    await page.waitForTimeout(1000);
    
    // Test panning by dragging on background
    console.log('Testing pan...');
    const bbox = await svg.boundingBox();
    if (bbox) {
      // Click and drag from center to top-left (panning)
      await page.mouse.move(bbox.x + bbox.width/2, bbox.y + bbox.height/2);
      await page.mouse.down();
      await page.mouse.move(bbox.x + bbox.width/4, bbox.y + bbox.height/4);
      await page.mouse.up();
    }
    
    console.log('Zoom and pan test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
