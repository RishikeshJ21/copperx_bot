import axios, { AxiosRequestConfig, Method } from 'axios';
import { config } from '../config';

/**
 * API client wrapper
 * Provides a consistent interface for making API requests
 */
export const apiRequest = async <T>(options: {
  method: Method;
  url: string;
  data?: any;
  params?: any;
  accessToken?: string;
  headers?: Record<string, string>;
}): Promise<T> => {
  try {
    const { method, url, data, params, accessToken, headers = {} } = options;
    
    // Configure request headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };
    
    // Add authorization header if access token is provided
    if (accessToken) {
      requestHeaders['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // Build the request configuration
    const requestConfig: AxiosRequestConfig = {
      method,
      url: `${config.api.baseUrl}${url}`,
      headers: requestHeaders,
      params
    };
    
    // Add data for non-GET requests
    if (method !== 'GET' && data) {
      requestConfig.data = data;
    }
    
    // Make the API request
    const response = await axios(requestConfig);
    
    // Return the data from the response
    return response.data;
  } catch (error: any) {
    // Handle errors
    console.error(`API Error: ${options.method} ${options.url}`, error.message);
    
    // If there's a response, log it
    if (error.response) {
      console.error('Error response:', error.response.data);
      
      // Throw the response data if it exists
      throw error.response.data || error;
    }
    
    // If there's no response, throw the original error
    throw error;
  }
};