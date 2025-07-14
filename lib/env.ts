/**
 * This module provides access to environment variables
 * with type checking and default values
 */

/**
 * API backend URL
 * Default value is only used for local development
 */
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

/**
 * Checks if the application is running in production mode
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Cache revalidation interval in seconds
 */
export const REVALIDATE_INTERVAL = parseInt(process.env.REVALIDATE_INTERVAL || '60', 10);
