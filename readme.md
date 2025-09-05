# Product Page Generator

Simple product page generator with automatic theme support from globtechnic.pl.

## Installation

### 1. Install Node.js

Download and install Node.js from [nodejs.org](https://nodejs.org/) (recommended: LTS version)

### 2. Project Setup

```bash
# Clone or download the project
# Navigate to project directory
cd DESC_BUILDER

# Install dependencies
npm install
```

### 3. Run the Application

**Development mode** (with auto-restart):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

## Usage

1. Open your browser and go to `http://localhost:3000`
2. Create HTML files in the `pages/` directory
3. Use folders to organize your products (unlimited nesting supported)
4. Access your product pages through the web browser
5. Files automatically reload when changed

## Project Structure

```
DESC_BUILDER/
├── pages/                    # Your HTML product files go here
│   └── Victron-Energy/       # Example product category
│       └── public/
│           └── src/
│               └── theme-manager.js
├── src/
│   ├── config-manager.js     # Configuration management
│   ├── template.js          # HTML template generator
│   ├── theme-fetcher.js     # Theme fetching logic
│   └── config.js           # Main configuration file
├── package-lock.json
├── package.json
├── readme.md
└── server
```
