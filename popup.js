/**
 * Popup script for Tweet Copier extension
 * Displays saved tweets from localStorage
 */

/**
 * Formats a date string to a readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Creates an HTML element for a saved tweet
 * @param {Object} tweet - The tweet object
 * @returns {HTMLElement} The tweet element
 */
const createTweetElement = (tweet) => {
  const tweetElement = document.createElement('div');
  tweetElement.className = 'tweet-item';
  
  const authorElement = document.createElement('div');
  authorElement.className = 'tweet-author';
  authorElement.textContent = tweet.author;
  
  const textElement = document.createElement('div');
  textElement.className = 'tweet-text';
  textElement.textContent = tweet.text;
  
  const dateElement = document.createElement('div');
  dateElement.className = 'tweet-date';
  dateElement.textContent = `Copied on ${formatDate(tweet.timestamp)}`;
  
  const copyButton = document.createElement('button');
  copyButton.className = 'copy-again';
  copyButton.textContent = 'Copy';
  copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(`${tweet.author}: ${tweet.text}`);
    copyButton.textContent = 'Copied!';
    setTimeout(() => {
      copyButton.textContent = 'Copy';
    }, 2000);
  });
  
  tweetElement.appendChild(authorElement);
  tweetElement.appendChild(textElement);
  tweetElement.appendChild(dateElement);
  tweetElement.appendChild(copyButton);
  
  return tweetElement;
};

/**
 * Displays saved tweets in the popup
 */
const displaySavedTweets = () => {
  const savedTweetsContainer = document.getElementById('savedTweets');
  savedTweetsContainer.innerHTML = '';
  
  // Get saved tweets from localStorage
  const savedTweets = localStorage.getItem('tweetCopier_savedTweets');
  const tweets = savedTweets ? JSON.parse(savedTweets) : [];
  
  if (tweets.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No tweets copied yet. Visit X.com and start copying tweets!';
    savedTweetsContainer.appendChild(emptyState);
    return;
  }
  
  // Sort tweets by timestamp, most recent first
  tweets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Create elements for each tweet
  tweets.forEach(tweet => {
    const tweetElement = createTweetElement(tweet);
    savedTweetsContainer.appendChild(tweetElement);
  });
};

// Initialize popup
document.addEventListener('DOMContentLoaded', displaySavedTweets); 