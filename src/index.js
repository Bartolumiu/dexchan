// Fetch variables from .env file
require('dotenv').config();
const { BOT_TOKEN, DB_URI } = process.env;

// Import the refactored application initialization
const { initializeApplication } = require('./lib/app');

// Initialize the application
initializeApplication({ token: BOT_TOKEN, dbToken: DB_URI })
    .catch(error => {
        console.error('Application failed to start:', error);
        process.exit(1);
    });