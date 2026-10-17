import type { LucideIcon } from "lucide-react";
import {
  BookOpenIcon,
  BriefcaseIcon,
  CameraIcon,
  CarIcon,
  FileTextIcon,
  FolderIcon,
  HeartIcon,
  HomeIcon,
  ImageIcon,
  PlaneIcon,
  StarIcon,
  WalletIcon,
} from "lucide-react";

/** Curated palette for space appearance (hex strings for the API). */
export const SPACE_COLOR_OPTIONS = [
  { value: "#EF4444", label: "Red" },
  { value: "#F97316", label: "Orange" },
  { value: "#EAB308", label: "Yellow" },
  { value: "#22C55E", label: "Green" },
  { value: "#14B8A6", label: "Teal" },
  { value: "#0EA5E9", label: "Sky" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#8B5CF6", label: "Violet" },
  { value: "#A855F7", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#F43F5E", label: "Rose" },
  { value: "#64748B", label: "Slate" },
] as const;

export type SpaceIconOption = {
  value: string;
  label: string;
  Icon: LucideIcon;
};

/** Curated icons stored as string keys on the space record. */
export const SPACE_ICON_OPTIONS: SpaceIconOption[] = [
  { value: "folder", label: "Folder", Icon: FolderIcon },
  { value: "home", label: "Home", Icon: HomeIcon },
  { value: "heart", label: "Heart", Icon: HeartIcon },
  { value: "briefcase", label: "Briefcase", Icon: BriefcaseIcon },
  { value: "image", label: "Image", Icon: ImageIcon },
  { value: "camera", label: "Camera", Icon: CameraIcon },
  { value: "star", label: "Star", Icon: StarIcon },
  { value: "document", label: "Document", Icon: FileTextIcon },
  { value: "book", label: "Book", Icon: BookOpenIcon },
  { value: "plane", label: "Travel", Icon: PlaneIcon },
  { value: "wallet", label: "Finance", Icon: WalletIcon },
  { value: "car", label: "Vehicle", Icon: CarIcon },
];

export function normalizeHexColor(value?: string | null): string {
  if (!value) {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.startsWith("#") ? trimmed.toUpperCase() : `#${trimmed.toUpperCase()}`;
}

export function getSpaceIconOption(value?: string | null): SpaceIconOption | undefined {
  if (!value) {
    return undefined;
  }
  return SPACE_ICON_OPTIONS.find((option) => option.value === value);
}
