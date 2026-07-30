import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { shouldUseCloud } from "./AuthContext";
import { supabase } from "./supabase";

// Use cache directory for local photo fallback
const PHOTOS_DIR = `${(FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory}photos/`;

/**
 * Ensure the local photos directory exists
 */
async function ensurePhotosDir(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error("Error ensuring photos directory:", error);
  }
}

/**
 * Pick a photo from the gallery
 */
export async function pickPhoto(): Promise<string | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error("Error picking photo:", error);
    return null;
  }
}

/**
 * Take a photo with the camera
 */
export async function takePhoto(): Promise<string | null> {
  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error("Error taking photo:", error);
    return null;
  }
}

/**
 * Upload a photo to Supabase Storage, or save locally if cloud is not active
 */
export async function savePhoto(uri: string): Promise<string> {
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri; // Already uploaded
  }

  try {
    if (shouldUseCloud()) {
      const response = await fetch(uri);
      const blob = await response.blob();

      const fileExt = uri.split(".").pop()?.split("?")[0] || "jpg";
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await supabase.storage
        .from("photos")
        .upload(filePath, blob, {
          contentType: `image/${fileExt === "png" ? "png" : "jpeg"}`,
          upsert: true,
        });

      if (!error && data?.path) {
        const { data: publicUrlData } = supabase.storage
          .from("photos")
          .getPublicUrl(data.path);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } else if (error) {
        console.warn("Supabase photo upload failed, falling back locally:", error.message);
      }
    }
  } catch (err) {
    console.warn("Error uploading to Supabase storage, using local storage:", err);
  }

  return savePhotoLocally(uri);
}

/**
 * Save a photo to local persistent storage (Fallback)
 */
export async function savePhotoLocally(uri: string): Promise<string> {
  try {
    await ensurePhotosDir();

    const filename = `${Date.now()}.jpg`;
    const destinationUri = `${PHOTOS_DIR}${filename}`;

    await FileSystem.copyAsync({
      from: uri,
      to: destinationUri,
    });

    return destinationUri;
  } catch (error) {
    console.error("Error saving photo locally:", error);
    throw error;
  }
}

/**
 * Delete a photo from Supabase Storage or local persistent storage
 */
export async function deletePhoto(uri: string): Promise<void> {
  try {
    if (uri.includes("supabase.co/storage")) {
      const parts = uri.split("/photos/");
      if (parts[1]) {
        await supabase.storage.from("photos").remove([parts[1]]);
      }
      return;
    }
    if (uri.includes(PHOTOS_DIR)) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (error) {
    console.error("Error deleting photo:", error);
  }
}

/**
 * Get all stored local photos
 */
export async function getAllPhotos(): Promise<string[]> {
  try {
    await ensurePhotosDir();
    const files = await FileSystem.readDirectoryAsync(PHOTOS_DIR);
    return files.map((file) => `${PHOTOS_DIR}${file}`);
  } catch (error) {
    console.error("Error getting all photos:", error);
    return [];
  }
}

/**
 * Clear all stored local photos
 */
export async function clearAllPhotos(): Promise<void> {
  try {
    const files = await getAllPhotos();
    for (const file of files) {
      await deletePhoto(file);
    }
  } catch (error) {
    console.error("Error clearing all photos:", error);
  }
}
