/**
 * Background script for Tweet Copier extension
 * Handles events like opening the dashboard
 */

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle opening the dashboard
  if (message.action === "openDashboard") {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  }
  
  // Always return true if using sendResponse asynchronously
  return true;
}); 