/**
 * API endpoints
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
export const USER_ENDPOINT = `${API_BASE_URL}/users/`;

/**
 * HTTP methods
 */
export const GET = 'GET';
export const POST = 'POST';
export const PUT = 'PUT';
export const DELETE = 'DELETE';
export const PATCH = 'PATCH'; 