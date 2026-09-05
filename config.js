// src/config.js
// Centralized configuration and environment validation

require('dotenv').config();

const PROJECT_ID_REGEX = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_MESSAGE_LENGTH = 10000; // safeguard against huge prompts

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT || '4000', 10);
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : null;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || null;

function validateEnv() {
  const errors = [];
  if (!GEMINI_API_KEY && NODE_ENV === 'production') {
    errors.push('GEMINI_API_KEY is required in production');
  }
  return errors;
}

module.exports = {
  NODE_ENV,
  PORT,
  ALLOWED_ORIGINS,
  GEMINI_API_KEY,
  validateEnv,
  PROJECT_ID_REGEX,
  MAX_MESSAGE_LENGTH,
};
