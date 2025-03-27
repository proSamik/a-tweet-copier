/**
 * TweetCopier - Adds copy buttons to tweets on X.com
 */

// Store for copied tweets
const tweetStorage = {
  /**
   * Saves a tweet to localStorage
   * @param {string} tweetText - The text content of the tweet
   * @param {string} tweetId - The ID of the tweet
   * @param {string} authorName - The author of the tweet
   */
  saveTweet: (tweetText, tweetId, authorName) => {
    const savedTweets = tweetStorage.getSavedTweets();
    const timestamp = new Date().toISOString();
    
    savedTweets.push({
      id: tweetId,
      text: tweetText,
      author: authorName,
      timestamp
    });
    
    localStorage.setItem('tweetCopier_savedTweets', JSON.stringify(savedTweets));
  },
  
  /**
   * Gets all saved tweets from localStorage
   * @returns {Array} Array of saved tweets
   */
  getSavedTweets: () => {
    const savedTweets = localStorage.getItem('tweetCopier_savedTweets');
    return savedTweets ? JSON.parse(savedTweets) : [];
  }
};

/**
 * Copies text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise} Promise resolved when copy is complete
 */
const copyToClipboard = (text) => {
  return navigator.clipboard.writeText(text).then(() => {
    console.log('Text copied to clipboard');
    return true;
  }).catch(err => {
    console.error('Failed to copy text: ', err);
    return false;
  });
};

/**
 * Creates a copy button element
 * @returns {HTMLElement} The created button
 */
const createCopyButton = () => {
  const button = document.createElement('button');
  button.className = 'tweet-copy-button';
  button.innerHTML = '📋';
  button.title = 'Copy Tweet';
  return button;
};

/**
 * Extracts text content from a tweet element
 * @param {HTMLElement} tweetElement - The tweet DOM element
 * @returns {string} The tweet text content
 */
const extractTweetText = (tweetElement) => {
  // The main text container in tweets
  const textContainer = tweetElement.querySelector('[data-testid="tweetText"]');
  return textContainer ? textContainer.textContent.trim() : '';
};

/**
 * Extracts the author name from a tweet element
 * @param {HTMLElement} tweetElement - The tweet DOM element
 * @returns {string} The tweet author name
 */
const extractAuthorName = (tweetElement) => {
  // Try to find the author name - might need adjustment as X.com's structure changes
  const authorElement = tweetElement.querySelector('a[role="link"] span:not([data-testid])');
  return authorElement ? authorElement.textContent.trim() : 'Unknown Author';
};

/**
 * Extracts the tweet ID from its URL
 * @param {HTMLElement} tweetElement - The tweet DOM element
 * @returns {string} The tweet ID
 */
const extractTweetId = (tweetElement) => {
  const linkElement = tweetElement.querySelector('a[href*="/status/"]');
  if (!linkElement) return 'unknown-id';
  
  const href = linkElement.getAttribute('href');
  const match = href.match(/\/status\/(\d+)/);
  return match ? match[1] : 'unknown-id';
};

/**
 * Extracts the conversation ID (root tweet ID) from a tweet
 * @param {HTMLElement} tweetElement - The tweet DOM element
 * @returns {string} The conversation ID or null if not found
 */
const extractConversationId = (tweetElement) => {
  // First try to get the conversation ID from the URL
  if (isIndividualTweetPage()) {
    const urlMatch = window.location.pathname.match(/\/status\/(\d+)/);
    if (urlMatch) return urlMatch[1];
  }
  
  // If that fails, try to find it from aria-labelledby attribute which often contains the conversation info
  const article = tweetElement.closest('article');
  if (article) {
    const labelledBy = article.getAttribute('aria-labelledby');
    if (labelledBy && labelledBy.includes('conversation')) {
      const idMatch = labelledBy.match(/conversation-(\d+)/);
      if (idMatch) return idMatch[1];
    }
  }
  
  // As a fallback, use the tweet's own ID (this is not ideal but better than nothing)
  return extractTweetId(tweetElement);
};

/**
 * Check if current page is an individual tweet view page
 * @returns {boolean} True if on a single tweet page
 */
const isIndividualTweetPage = () => {
  return window.location.pathname.includes('/status/');
};

/**
 * Checks if the tweet is part of a thread
 * @param {HTMLElement} tweetElement - The tweet DOM element
 * @returns {boolean} True if tweet is part of a thread
 */
const isTweetInThread = (tweetElement) => {
  // If we're on an individual tweet page, check for conversation structure
  if (isIndividualTweetPage()) {
    // Look for timeline with multiple tweets - try different selectors that X.com might use
    const conversationTweets = document.querySelectorAll('[data-testid="tweet"]');
    return conversationTweets.length > 1;
  }
  
  // For timeline view, check if this tweet is part of a connected thread
  const threadContainer = tweetElement.closest('[data-testid="cellInnerDiv"]')
                                       ?.parentElement?.parentElement;
  if (!threadContainer) return false;
  
  // Count tweet elements in the potential thread container
  const potentialThreadTweets = threadContainer.querySelectorAll('[data-testid="tweet"]');
  return potentialThreadTweets.length > 1;
};

/**
 * Sorts tweets by their natural thread order (top to bottom)
 * @param {Array} tweets - Array of tweet elements
 * @returns {Array} Sorted array of tweets
 */
const sortTweetsByThreadOrder = (tweets) => {
  // Create a mapping of each tweet element to its position in the page
  const positions = new Map();
  
  tweets.forEach(tweet => {
    const rect = tweet.getBoundingClientRect();
    positions.set(tweet, rect.top);
  });
  
  // Sort by vertical position (top to bottom)
  return [...tweets].sort((a, b) => positions.get(a) - positions.get(b));
};

/**
 * Gets all tweets in the current thread
 * @param {HTMLElement} tweetElement - The tweet DOM element
 * @returns {Array} Array of tweet elements in the thread
 */
const getAllThreadTweets = (tweetElement) => {
  let tweets = [];
  
  if (isIndividualTweetPage()) {
    // On individual tweet pages, get all tweets in the conversation timeline
    tweets = Array.from(document.querySelectorAll('[data-testid="tweet"]'));
  } else {
    // For timeline view, get tweets in the same container
    const threadContainer = tweetElement.closest('[data-testid="cellInnerDiv"]')
                                        ?.parentElement?.parentElement;
    if (!threadContainer) return [tweetElement];
    
    tweets = Array.from(threadContainer.querySelectorAll('[data-testid="tweet"]'));
  }
  
  // Filter tweets to ensure they're from the same conversation/thread
  const mainConversationId = extractConversationId(tweetElement);
  
  // Make sure the tweets are properly sorted in thread order (top to bottom)
  return sortTweetsByThreadOrder(tweets);
};

/**
 * Copies multiple tweets from a thread
 * @param {Array} tweets - Array of tweet elements
 * @param {number} count - Number of tweets to copy
 * @param {HTMLElement} button - Button element to update with success indicator
 */
const copyTweets = async (tweets, count, button) => {
  // Ensure count is a valid number
  const requestedCount = parseInt(count, 10) || 1;
  
  // Limit count to available tweets
  const limitedCount = Math.min(requestedCount, tweets.length);
  console.log(`Copying ${limitedCount} tweets out of ${tweets.length} available`);
  
  const selectedTweets = tweets.slice(0, limitedCount);
  
  // Generate text for copied tweets
  const tweetTexts = selectedTweets.map(tweet => {
    const author = extractAuthorName(tweet);
    const text = extractTweetText(tweet);
    return `${author}: ${text}`;
  }).join('\n\n');
  
  // Copy to clipboard
  const success = await copyToClipboard(tweetTexts);
  
  // Change button to show success
  if (success) {
    const originalContent = button.innerHTML;
    button.innerHTML = '✅';
    
    setTimeout(() => {
      button.innerHTML = originalContent;
    }, 2000);
  }
  
  // Save first tweet to storage
  if (selectedTweets.length > 0) {
    const firstTweet = selectedTweets[0];
    tweetStorage.saveTweet(
      extractTweetText(firstTweet),
      extractTweetId(firstTweet),
      extractAuthorName(firstTweet)
    );
  }
};

/**
 * Creates a multi-copy dropdown for threads
 * @param {HTMLElement} tweetElement - The tweet element
 * @returns {HTMLElement} The dropdown element
 */
const createThreadCopyDropdown = (tweetElement) => {
  const tweets = getAllThreadTweets(tweetElement);
  console.log(`Found ${tweets.length} tweets in thread`);
  
  const dropdown = document.createElement('div');
  dropdown.className = 'thread-copy-dropdown';
  
  const button = document.createElement('button');
  button.className = 'thread-copy-button';
  button.innerHTML = '🧵'; // Thread icon
  button.title = 'Copy Thread Tweets';
  
  const dropdownContent = document.createElement('div');
  dropdownContent.className = 'thread-copy-dropdown-content';
  
  // Quick options for copying different numbers of tweets (up to 3)
  const quickOptionCount = Math.min(tweets.length, 3);
  
  for (let i = 1; i <= quickOptionCount; i++) {
    const option = document.createElement('div');
    option.textContent = `Copy ${i} Tweet${i > 1 ? 's' : ''}`;
    option.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      copyTweets(tweets, i, button);
    };
    dropdownContent.appendChild(option);
  }
  
  // Always add a custom input option
  const customOption = document.createElement('div');
  customOption.className = 'thread-copy-custom';
  
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '1';
  input.max = tweets.length.toString();
  input.value = Math.min(tweets.length, 5).toString();
  input.placeholder = 'Count';
  
  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy';
  copyBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const count = parseInt(input.value, 10) || 1;
    copyTweets(tweets, count, button);
  };
  
  customOption.appendChild(input);
  customOption.appendChild(copyBtn);
  dropdownContent.appendChild(customOption);
  
  dropdown.appendChild(button);
  dropdown.appendChild(dropdownContent);
  
  return dropdown;
};

/**
 * Processes a tweet element and adds a copy button
 * @param {HTMLElement} tweetElement - The tweet DOM element
 */
const processTweet = (tweetElement) => {
  // Skip if already processed
  if (tweetElement.querySelector('.tweet-copy-button')) return;
  
  const actionsBar = tweetElement.querySelector('[role="group"]');
  if (!actionsBar) return;
  
  const copyButton = createCopyButton();
  
  copyButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const tweetText = extractTweetText(tweetElement);
    const authorName = extractAuthorName(tweetElement);
    const tweetId = extractTweetId(tweetElement);
    
    const success = await copyToClipboard(`${authorName}: ${tweetText}`);
    
    // Change button to show success
    if (success) {
      copyButton.innerHTML = '✅';
      setTimeout(() => {
        copyButton.innerHTML = '📋';
      }, 2000);
    }
    
    tweetStorage.saveTweet(tweetText, tweetId, authorName);
  });
  
  // Create a wrapper to match Twitter's action button style
  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'tweet-copy-button-wrapper';
  buttonWrapper.appendChild(copyButton);
  
  actionsBar.appendChild(buttonWrapper);
  
  // Check if this is part of a thread and add thread copy button if needed
  if (isTweetInThread(tweetElement)) {
    // Add thread button to all tweets in individual view, or first tweet in timeline view
    const shouldAddThreadButton = isIndividualTweetPage() || 
                                 (getAllThreadTweets(tweetElement)[0] === tweetElement);
    
    if (shouldAddThreadButton && !tweetElement.querySelector('.thread-copy-dropdown')) {
      const threadCopyDropdown = createThreadCopyDropdown(tweetElement);
      actionsBar.appendChild(threadCopyDropdown);
    }
  }
};

/**
 * Main observer callback that processes new tweets as they appear in the DOM
 * @param {Array} mutations - MutationObserver mutations
 */
const observerCallback = (mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      // Look for tweets in added nodes
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Find tweets inside the added elements
          const tweets = node.querySelectorAll ? 
            node.querySelectorAll('[data-testid="tweet"]') : [];
          
          tweets.forEach(tweet => processTweet(tweet));
          
          // Check if the node itself is a tweet
          if (node.matches && node.matches('[data-testid="tweet"]')) {
            processTweet(node);
          }
        }
      });
    }
  }
};

/**
 * Process all tweets on the page
 */
const processAllTweets = () => {
  document.querySelectorAll('[data-testid="tweet"]').forEach(tweet => {
    processTweet(tweet);
  });
};

/**
 * Initialize the extension
 */
const init = () => {
  // Process any tweets already on the page
  processAllTweets();
  
  // Set up observer to detect new tweets as they're loaded
  const observer = new MutationObserver(observerCallback);
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Re-check periodically for tweets that might have been missed
  setInterval(processAllTweets, 1000);
  
  // Also handle page navigation events in SPA
  window.addEventListener('popstate', () => {
    // Allow time for the new content to load
    setTimeout(processAllTweets, 1000);
  });
  
  // Also handle URL changes without popstate (X.com uses history.pushState)
  let lastUrl = location.href; 
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(processAllTweets, 1000);
    }
  }).observe(document, {subtree: true, childList: true});
};

// Start the extension when the page is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
} 