
import { toast } from "@/hooks/use-toast";

// Your API base URL - set to port 3001 to match backend
export const API_URL = "http://localhost:3001/api";

/**
 * Core API fetch function with authentication and error handling
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}> {
  try {
    console.log(`API Request: ${API_URL}${endpoint}`);
    
    // Get auth token from local storage
    const token = localStorage.getItem("authToken");
    
    // Set default headers
    const headers = new Headers(options.headers);
    
    // Add content type if not already set
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.append("Content-Type", "application/json");
    }
    
    // Add auth token if available
    if (token) {
      headers.append("Authorization", `Bearer ${token}`);
    }

    // Make the API request
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Get response data
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle errors
    if (!response.ok) {
      console.error(`API Error (${response.status}):`, data);
      
      // For authentication errors, clear token and reload
      if (response.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
        window.location.href = "/";
        return { success: false, error: "Authentication failed", status: 401 };
      }
      
      return {
        success: false,
        error: data.message || "An error occurred",
        status: response.status,
      };
    }

    // Return successful response
    return {
      success: true,
      data: data as T,
      status: response.status,
    };
  } catch (error) {
    console.error("API Request Error:", error);
    toast({
      title: "Network Error",
      description: "Failed to connect to the server. Please check your connection.",
      variant: "destructive",
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
