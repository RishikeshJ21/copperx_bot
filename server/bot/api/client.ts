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
  headers?: Record<string, string>;
  accessToken?: string;
  baseURL?: string;
  timeout?: number;
}): Promise<T> => {
  try {
    // Set up headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers || {},
    };

    // Add authorization header if access token is provided
    if (options.accessToken) {
      headers['Authorization'] = `Bearer ${options.accessToken}`;
    }

    // Create request config
    const requestConfig: AxiosRequestConfig = {
      method: options.method,
      url: options.url,
      baseURL: options.baseURL || config.api.baseURL,
      timeout: options.timeout || config.api.timeout,
      headers,
    };

    // Add data or params if provided
    if (options.data) {
      requestConfig.data = options.data;
    }
    if (options.params) {
      requestConfig.params = options.params;
    }

    // Make the request
    const response = await axios(requestConfig);
    
    // Return the data
    return response.data;
  } catch (error: any) {
    // Check if this is an Axios error with a response
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`API Error (${error.response.status}):`, error.response.data);
      throw new Error(error.response.data?.message || `API Error ${error.response.status}: ${error.response.statusText}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error:', error.request);
      throw new Error('No response received from API. Please check your connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Config Error:', error.message);
      throw new Error(`API request failed: ${error.message}`);
    }
  }
};