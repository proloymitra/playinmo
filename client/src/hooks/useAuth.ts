import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest } from "../lib/queryClient";

interface LoginCredentials {
  username: string;
  password: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  
  const {
    data: user,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const response = await apiRequest("/api/auth/user");
        return response as User;
      } catch (error) {
        // If unauthorized or any other error, return null
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  });

  const isAuthenticated = !!user;

  // Local login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return await response.json() as User;
    },
    onSuccess: (userData) => {
      // Update the user data in the cache
      queryClient.setQueryData(["/api/auth/user"], userData);
    }
  });

  const login = async (username: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ username, password });
      return true;
    } catch (error) {
      return false;
    }
  };

  const loginWithGoogle = () => {
    // Redirect to Google login if available
    window.location.href = "/api/auth/google";
  };

  const logout = () => {
    // Redirect to logout endpoint
    window.location.href = "/api/auth/logout";
  };

  return {
    user,
    isLoading,
    isError: !!error,
    isAuthenticated,
    login,
    loginWithGoogle,
    logout,
    loginMutation,
    refetch
  };
}