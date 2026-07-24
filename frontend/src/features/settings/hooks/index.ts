"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants";
import { profileService } from "@/features/settings/api/profile-service";
import { settingsService } from "@/features/settings/api/settings-service";
import type {
  UpdateProfilePayload,
  UserPreferences,
} from "@/features/settings/types";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/utils";

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.profile.detail,
    queryFn: () => profileService.getProfile(),
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      profileService.updateProfile(payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(QUERY_KEYS.profile.detail, profile);
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.auth.currentUser,
      });
      setUser(profileService.toAuthenticatedUser(profile));
      toast.success("Profile updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update profile"));
    },
  });
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onError: (error) => {
      toast.error(getErrorMessage(error, "Avatar upload is not available yet"));
    },
  });
}

export function usePreferences() {
  return useQuery({
    queryKey: QUERY_KEYS.preferences.all,
    queryFn: () => settingsService.getPreferences(),
    staleTime: 60_000,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: UserPreferences) =>
      settingsService.updatePreferences(preferences),
    onSuccess: (preferences) => {
      queryClient.setQueryData(QUERY_KEYS.preferences.all, preferences);
      toast.success("Preferences saved");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to save preferences"));
    },
  });
}
