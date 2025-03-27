# Tweet Copier Chrome Extension

A Chrome extension that adds copy buttons to tweets on X.com (formerly Twitter).

## Demo

### Copy Single Tweet
![CopyTweet](https://github.com/user-attachments/assets/cf83354b-bcba-4d99-976f-f10830837703)

### Copy Thread of the Tweet
![CopyThread](https://github.com/user-attachments/assets/5c259818-1173-45d9-8eb7-929630caa54c)

### Popup View with CRUD operations for the copied tweets
![Popup](https://github.com/user-attachments/assets/8ef2afe4-870a-46a8-8fea-fa2af10e8c58)

### Dashboard view of the copied tweets
![Dashboard](https://github.com/user-attachments/assets/917c8a86-9161-4334-be18-435cf017925d)

## Features

- Adds a copy button to each tweet
- Click to copy tweet text with author name
- For tweet threads, provides options to copy multiple tweets at once
- Stores copied tweets in localStorage
- View your copied tweet history in the extension popup

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the folder containing this extension
5. The extension will be installed and ready to use

## Usage

1. Visit [X.com](https://x.com)
2. Each tweet will now have a 📋 button in its action bar
3. Click the button to copy the tweet
4. For threads, the first tweet will have a "Copy Thread" dropdown menu
5. Click the extension icon in your browser toolbar to view your copied tweet history

## Development

- `manifest.json`: Extension configuration
- `content.js`: Injects copy buttons into the X.com interface
- `popup.html` & `popup.js`: Extension popup UI
- `styles.css`: Styling for the injected buttons

## Future Plans

- Dashboard for managing copied tweets
- Cloud sync functionality
- Options for custom tweet formatting
- Additional UI enhancements

## License

MIT 

Also view this in- https://githubme.com/proSamik/a-tweet-copier for better view
