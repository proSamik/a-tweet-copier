/**
 * Popup script for Tweet Copier extension
 * Displays saved tweets from localStorage with CRUD operations
 */

/**
 * Tweet storage and management functions
 */
const tweetStorage = {
  /**
   * Gets all saved tweets from chrome.storage
   * @param {Function} callback - Callback with tweets array
   */
  getSavedTweets: (callback) => {
    chrome.storage.local.get(['tweetCopier_savedTweets'], (result) => {
      const tweets = result.tweetCopier_savedTweets || [];
      callback(tweets);
    });
  },

  /**
   * Updates an existing tweet
   * @param {string} localId - The local ID of the tweet to update
   * @param {Object} updatedData - The data to update
   * @param {Function} callback - Optional callback after update
   */
  updateTweet: (localId, updatedData, callback) => {
    chrome.storage.local.get(['tweetCopier_savedTweets'], (result) => {
      const savedTweets = result.tweetCopier_savedTweets || [];
      const tweetIndex = savedTweets.findIndex(tweet => tweet.localId === localId);
      
      if (tweetIndex === -1) {
        console.error('Tweet not found for updating:', localId);
        if (callback) callback(false);
        return;
      }
      
      // Update the tweet
      savedTweets[tweetIndex] = {
        ...savedTweets[tweetIndex],
        ...updatedData,
        isEdited: true,
        lastEditTime: new Date().toISOString()
      };
      
      chrome.storage.local.set({ 'tweetCopier_savedTweets': savedTweets }, () => {
        console.log('Tweet updated:', savedTweets[tweetIndex]);
        if (callback) callback(true);
      });
    });
  },

  /**
   * Deletes a tweet from storage
   * @param {string} localId - The local ID of the tweet to delete
   * @param {Function} callback - Optional callback after deletion
   */
  deleteTweet: (localId, callback) => {
    chrome.storage.local.get(['tweetCopier_savedTweets'], (result) => {
      const savedTweets = result.tweetCopier_savedTweets || [];
      const filteredTweets = savedTweets.filter(tweet => tweet.localId !== localId);
      
      if (filteredTweets.length === savedTweets.length) {
        console.error('Tweet not found for deletion:', localId);
        if (callback) callback(false);
        return;
      }
      
      chrome.storage.local.set({ 'tweetCopier_savedTweets': filteredTweets }, () => {
        console.log('Tweet deleted:', localId);
        if (callback) callback(true);
      });
    });
  },
  
  /**
   * Gets statistics about saved tweets
   * @param {Function} callback - Callback with stats object
   */
  getStats: (callback) => {
    tweetStorage.getSavedTweets((tweets) => {
      // Today's date (start of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const stats = {
        totalTweets: tweets.length,
        uniqueAuthors: new Set(tweets.map(t => t.author)).size,
        copiedToday: tweets.filter(t => new Date(t.timestamp) >= today).length,
        editedTweets: tweets.filter(t => t.isEdited).length
      };
      
      callback(stats);
    });
  }
};

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
 * Copies text to clipboard
 * @param {string} text - Text to copy
 */
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

/**
 * Updates the table of tweets in the popup
 * @param {string} searchQuery - Optional search query to filter tweets
 */
const updateTweetsTable = (searchQuery = '') => {
  const tableBody = document.getElementById('tweets-table-body');
  const emptyState = document.getElementById('empty-state');
  tableBody.innerHTML = '';
  
  // Get tweets and sort by timestamp (newest first)
  tweetStorage.getSavedTweets((allTweets) => {
    let tweets = allTweets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply search filter if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tweets = tweets.filter(tweet => 
        tweet.text.toLowerCase().includes(query) || 
        tweet.author.toLowerCase().includes(query)
      );
    }
    
    if (tweets.length === 0) {
      tableBody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    
    emptyState.style.display = 'none';
    
    // Create table rows for each tweet
    tweets.forEach(tweet => {
      const row = document.createElement('tr');
      
      // Author column
      const authorCell = document.createElement('td');
      authorCell.textContent = tweet.author;
      row.appendChild(authorCell);
      
      // Tweet text column
      const textCell = document.createElement('td');
      const shortText = tweet.text.length > 30 ? `${tweet.text.substring(0, 30)}...` : tweet.text;
      textCell.textContent = shortText;
      if (tweet.isEdited) {
        const editBadge = document.createElement('span');
        editBadge.textContent = ' (edited)';
        editBadge.style.color = '#657786';
        editBadge.style.fontSize = '11px';
        textCell.appendChild(editBadge);
      }
      row.appendChild(textCell);
      
      // Date column
      const dateCell = document.createElement('td');
      dateCell.textContent = formatDate(tweet.timestamp);
      row.appendChild(dateCell);
      
      // Actions column
      const actionsCell = document.createElement('td');
      actionsCell.className = 'tweet-controls';
      
      // Copy button
      const copyBtn = document.createElement('button');
      copyBtn.className = 'btn';
      copyBtn.innerHTML = '📋';
      copyBtn.title = 'Copy Tweet';
      copyBtn.addEventListener('click', async () => {
        const success = await copyToClipboard(`${tweet.author}: ${tweet.text}`);
        if (success) {
          copyBtn.innerHTML = '✅';
          setTimeout(() => {
            copyBtn.innerHTML = '📋';
          }, 2000);
        }
      });
      actionsCell.appendChild(copyBtn);
      
      // Edit button
      const editBtn = document.createElement('button');
      editBtn.className = 'btn';
      editBtn.innerHTML = '✏️';
      editBtn.title = 'Edit Tweet';
      editBtn.addEventListener('click', () => {
        showEditForm(tweet);
      });
      actionsCell.appendChild(editBtn);
      
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-delete';
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.title = 'Delete Tweet';
      deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this tweet?')) {
          tweetStorage.deleteTweet(tweet.localId, () => {
            updateTweetsTable(searchQuery);
            updateStats();
          });
        }
      });
      actionsCell.appendChild(deleteBtn);
      
      // Open link button
      const linkBtn = document.createElement('button');
      linkBtn.className = 'btn';
      linkBtn.innerHTML = '🔗';
      linkBtn.title = 'Open Tweet';
      linkBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: tweet.url });
      });
      actionsCell.appendChild(linkBtn);
      
      row.appendChild(actionsCell);
      
      tableBody.appendChild(row);
    });
  });
};

/**
 * Shows the edit form for a tweet
 * @param {Object} tweet - The tweet to edit
 */
const showEditForm = (tweet) => {
  const form = document.getElementById('edit-form');
  const idInput = document.getElementById('edit-tweet-id');
  const authorInput = document.getElementById('edit-author');
  const textInput = document.getElementById('edit-text');
  
  form.classList.add('active');
  idInput.value = tweet.localId;
  authorInput.value = tweet.author;
  textInput.value = tweet.text;
  
  // Scroll to the edit form
  form.scrollIntoView({ behavior: 'smooth' });
};

/**
 * Updates the statistics display
 */
const updateStats = () => {
  tweetStorage.getStats((stats) => {
    document.getElementById('total-tweets').textContent = stats.totalTweets;
    document.getElementById('total-authors').textContent = stats.uniqueAuthors;
    document.getElementById('today-count').textContent = stats.copiedToday;
    document.getElementById('edited-count').textContent = stats.editedTweets;
    
    // Update recent activity
    updateRecentActivity();
  });
};

/**
 * Updates the recent activity section in the stats tab
 */
const updateRecentActivity = () => {
  const container = document.getElementById('recent-activity');
  container.innerHTML = '';
  
  tweetStorage.getSavedTweets((allTweets) => {
    const tweets = allTweets
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5); // Show only 5 most recent
    
    if (tweets.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.textContent = 'No activity yet. Copy some tweets to see activity here.';
      container.appendChild(emptyState);
      return;
    }
    
    tweets.forEach(tweet => {
      const tweetItem = document.createElement('div');
      tweetItem.className = 'tweet-item';
      
      const author = document.createElement('div');
      author.className = 'tweet-author';
      author.textContent = tweet.author;
      
      const text = document.createElement('div');
      text.className = 'tweet-text';
      text.textContent = tweet.text;
      
      const footer = document.createElement('div');
      footer.className = 'tweet-date';
      
      const date = document.createElement('span');
      date.textContent = formatDate(tweet.timestamp);
      footer.appendChild(date);
      
      if (tweet.url) {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = 'View on X';
        link.addEventListener('click', (e) => {
          e.preventDefault();
          chrome.tabs.create({ url: tweet.url });
        });
        footer.appendChild(link);
      }
      
      tweetItem.appendChild(author);
      tweetItem.appendChild(text);
      tweetItem.appendChild(footer);
      container.appendChild(tweetItem);
    });
  });
};

/**
 * Initialize the popup
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initial display of tweets and stats
  updateTweetsTable();
  updateStats();
  
  // Set up tab switching
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and tab contents
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const tabName = tab.getAttribute('data-tab');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
  
  // Set up search functionality
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', () => {
    updateTweetsTable(searchInput.value);
  });
  
  // Set up edit form submit and cancel
  const saveEditBtn = document.getElementById('save-edit');
  saveEditBtn.addEventListener('click', () => {
    const idInput = document.getElementById('edit-tweet-id');
    const authorInput = document.getElementById('edit-author');
    const textInput = document.getElementById('edit-text');
    
    tweetStorage.updateTweet(idInput.value, {
      author: authorInput.value,
      text: textInput.value
    }, () => {
      document.getElementById('edit-form').classList.remove('active');
      updateTweetsTable(searchInput.value);
      updateStats();
    });
  });
  
  const cancelEditBtn = document.getElementById('cancel-edit');
  cancelEditBtn.addEventListener('click', () => {
    document.getElementById('edit-form').classList.remove('active');
  });
}); 