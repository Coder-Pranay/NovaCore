"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants";
import { sharingService } from "@/features/sharing/api/sharing-service";
import type {
  CreatePublicLinkPayload,
  ShareInvitePayload,
  ShareResource,
  SharedListParams,
  UpdatePermissionPayload,
} from "@/features/sharing/types";
import { getErrorMessage } from "@/utils";

function invalidateSharing(
  queryClient: ReturnType<typeof useQueryClient>,
  resource?: ShareResource,
) {
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sharing.all });
  void queryClient.invalidateQueries({ queryKey: ["sharing", "items"] });
  void queryClient.invalidateQueries({ queryKey: ["sharing", "public-links"] });
  if (resource) {
    void queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.sharing.users(resource.resourceType, resource.resourceId),
    });
    void queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.sharing.permissions(
        resource.resourceType,
        resource.resourceId,
      ),
    });
  }
}

export function useSharedItems(params: SharedListParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.sharing.sharedItems(params as Record<string, unknown>),
    queryFn: () => sharingService.getSharedItems(params),
    staleTime: 15_000,
  });
}

export function useSharedUsers(resource: ShareResource | null) {
  return useQuery({
    queryKey: QUERY_KEYS.sharing.users(
      resource?.resourceType ?? "none",
      resource?.resourceId ?? "none",
    ),
    queryFn: () => sharingService.getSharedUsers(resource!),
    enabled: Boolean(resource),
    staleTime: 15_000,
  });
}

export function usePublicLink(resource: ShareResource | null) {
  return useQuery({
    queryKey: QUERY_KEYS.sharing.publicLinks(
      resource?.resourceType,
      resource?.resourceId,
    ),
    queryFn: () => sharingService.getPublicLink(resource!),
    enabled: Boolean(resource),
    staleTime: 15_000,
  });
}

export function useShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      resource,
      payload,
      invitedBy,
    }: {
      resource: ShareResource;
      payload: ShareInvitePayload;
      invitedBy: string;
    }) => {
      if (resource.resourceType === "SPACE") {
        return sharingService.shareSpace(resource, payload, invitedBy);
      }
      return sharingService.shareAsset(resource, payload, invitedBy);
    },
    onSuccess: (_data, variables) => {
      invalidateSharing(queryClient, variables.resource);
      toast.success("Invitation sent");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to share"));
    },
  });
}

export function useUpdateSharePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      shareId,
      payload,
    }: {
      shareId: string;
      payload: UpdatePermissionPayload;
      resource?: ShareResource;
    }) => sharingService.updatePermission(shareId, payload),
    onSuccess: (_data, variables) => {
      invalidateSharing(queryClient, variables.resource);
      toast.success("Permission updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update permission"));
    },
  });
}

export function useRemoveAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      shareId,
    }: {
      shareId: string;
      resource?: ShareResource;
    }) => sharingService.removeAccess(shareId),
    onSuccess: (_data, variables) => {
      invalidateSharing(queryClient, variables.resource);
      toast.success("Access revoked");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to revoke access"));
    },
  });
}

export function useCreatePublicLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      resource,
      payload,
    }: {
      resource: ShareResource;
      payload?: CreatePublicLinkPayload;
    }) => sharingService.createPublicLink(resource, payload),
    onSuccess: (_data, variables) => {
      invalidateSharing(queryClient, variables.resource);
      toast.success("Public link created");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to create public link"));
    },
  });
}

export function useDisablePublicLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ linkId }: { linkId: string; resource?: ShareResource }) =>
      sharingService.disablePublicLink(linkId),
    onSuccess: (_data, variables) => {
      invalidateSharing(queryClient, variables.resource);
      toast.success("Public link disabled");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to disable public link"));
    },
  });
}

export function useCopyShareLink() {
  return useMutation({
    mutationFn: (url: string) => sharingService.copyLink(url),
    onSuccess: () => {
      toast.success("Link copied to clipboard");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to copy link"));
    },
  });
}
