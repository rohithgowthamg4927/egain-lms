import { toast } from "@/hooks/use-toast";

export const API_URL = "http://13.203.91.192:3001/api";

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

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      console.error(`API Error (${response.status}):`, {
        endpoint,
        data,
        status: response.status
      });
      
      if (response.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
        window.location.href = "/login";
        return { success: false, error: "Authentication failed", status: response.status };
      }
      
      if (data && typeof data === 'object' && 'success' in data && 'error' in data) {
        return {
          success: false,
          error: data.error,
          status: response.status,
        };
      }
      
      return {
        success: false,
        error: data.message || "An error occurred",
        status: response.status,
      };
    }

    if (data && typeof data === 'object' && 'success' in data) {
      return data;
    }

    return {
      success: true,
      data: data as T,
      status: response.status,
    };
  } catch (error) {
    console.error("API Request Error:", {
      endpoint,
      error,
      options
    });
    toast({
      title: "Network Error",
      description: "Failed to connect to the server. Please check your connection.",
      variant: "destructive",
    });
    throw error;
  }
}
