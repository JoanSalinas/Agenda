import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

// Use cache directory for photos
const PHOTOS_DIR = `${(FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory}photos/`;

/**
 * Ensure the photos directory exists
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
 * Save a photo to persistent storage
 * @param uri - The temporary URI from ImagePicker or camera
 * @returns The permanent URI for the saved photo
 */
export async function savePhotoLocally(uri: string): Promise<string> {
  try {
    await ensurePhotosDir();

    const filename = `${Date.now()}.jpg`;
    const destinationUri = `${PHOTOS_DIR}${filename}`;

    // Copy the file to persistent storage
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
 * Delete a photo from persistent storage
 */
export async function deletePhoto(uri: string): Promise<void> {
  try {
    // Only delete if it's in our photos directory
    if (uri.includes(PHOTOS_DIR)) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (error) {
    console.error("Error deleting photo:", error);
  }
}

/**
 * Get all stored photos
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
 * Clear all stored photos
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
