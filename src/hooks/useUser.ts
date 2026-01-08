"use client";

import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/config/api";

interface ApiResponse {
  success: boolean;
  data?: {
    id?: string;
    user_uuid?: string;
    uuid?: string;
    email?: string;
    full_name?: string;
    name?: string;
    avatar_url?: string;
    profile_image?: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("🔍 Fetching user profile for ID:", userId);
      const res = await fetch(API_ENDPOINTS.getProfileByUUID(userId));
      console.log("📡 API Response status:", res.status);
      
      if (res.ok) {
        const json: ApiResponse = await res.json();
        console.log("📦 API Response data:", json);
        
        if (json.success && json.data) {
          const avatarUrl = json.data.avatar_url || json.data.profile_image;
          console.log("🖼️ Avatar URL from API:", avatarUrl);
          
          setUser({
            id: json.data.id || json.data.user_uuid || json.data.uuid || userId,
            email: json.data.email || "",
            full_name: json.data.full_name || json.data.name,
            avatar_url: avatarUrl,
          });
          return;
        }
      }

      // fallback: get user from localStorage
      console.log("🔄 Falling back to localStorage user data");
      const userData = localStorage.getItem('ehcf_user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const avatarUrl = parsedUser.user_metadata?.avatar_url || parsedUser.user_metadata?.picture;
        console.log("🖼️ Avatar URL from localStorage:", avatarUrl);
        console.log("👤 User metadata:", parsedUser.user_metadata);
        
        setUser({
          id: parsedUser.id,
          email: parsedUser.email || "",
          full_name: parsedUser.user_metadata?.full_name || parsedUser.user_metadata?.name,
          avatar_url: avatarUrl,
        });
      }
    } catch (err) {
      console.error("❌ Error fetching user:", err);
    }
  };

  const checkSession = () => {
    try {
      const sessionData = localStorage.getItem('ehcf_session');
      const userData = localStorage.getItem('ehcf_user');
      
      if (sessionData && userData) {
        const parsedUser = JSON.parse(userData);
        fetchUserProfile(parsedUser.id);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("❌ Error checking session:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ehcf_session' || e.key === 'ehcf_user') {
        checkSession();
      } else if (e.key === null) {
        // Storage was cleared
        setUser(null);
      }
    };

    // Listen for auth state changes from AuthCallback
    const handleAuthStateChange = () => {
      console.log('🔄 Auth state changed, rechecking session...');
      checkSession();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-state-changed', handleAuthStateChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
    };
  }, []);

  return { user, loading };
}