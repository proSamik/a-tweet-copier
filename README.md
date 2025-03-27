# Tweet Copier Chrome Extension

A Chrome extension that adds copy buttons to tweets on X.com (formerly Twitter).

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