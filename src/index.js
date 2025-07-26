// Fetch variables from .env file
require('dotenv').config();
const { token, dbToken } = process.env;

// Import the refactored application initialization
const { initializeApplication } = require('./lib/app');

// Initialize the application
initializeApplication({ token, dbToken })
    .catch(error => {
        console.error('Application failed to start:', error);
        process.exit(1);
    });