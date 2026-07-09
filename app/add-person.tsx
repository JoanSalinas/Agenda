import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Person } from "@/lib/models";
import {
  deletePhoto,
  pickPhoto,
  savePhotoLocally,
  takePhoto,
} from "@/lib/photos";
import { getPersonById, savePerson, updatePerson } from "@/lib/storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddPersonScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { personId } = useLocalSearchParams<{ personId: string }>();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null);

  // Load person if editing
  useEffect(() => {
    const loadPerson = async () => {
      if (personId) {
        const person = await getPersonById(personId);
        if (person) {
          setIsEditMode(true);
          setCurrentPerson(person);
          setName(person.name);
          setPhone(person.phone);
          setEmail(person.email);
          setNotes(person.notes);
          if (person.photo) {
            setPhoto(person.photo);
          }
        }
      }
    };
    loadPerson();
  }, [personId]);

  const handleAddPhotoFromGallery = async () => {
    const uri = await pickPhoto();
    if (uri) {
      if (photo) {
        await deletePhoto(photo);
      }
      const savedUri = await savePhotoLocally(uri);
      setPhoto(savedUri);
    }
    setShowPhotoMenu(false);
  };

  const handleAddPhotoFromCamera = async () => {
    const uri = await takePhoto();
    if (uri) {
      if (photo) {
        await deletePhoto(photo);
      }
      const savedUri = await savePhotoLocally(uri);
      setPhoto(savedUri);
    }
    setShowPhotoMenu(false);
  };

  const handleRemovePhoto = async () => {
    if (photo) {
      await deletePhoto(photo);
      setPhoto(null);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const personData = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      notes: notes.trim(),
      ...(photo && { photo }),
    };

    if (isEditMode && currentPerson) {
      await updatePerson(currentPerson.id, personData);
    } else {
      await savePerson(personData);
    }

    setSaving(false);
    router.back();
  };

  const avatarColor = currentPerson?.avatarColor || colors.tint;
  const initials = name.trim()
    ? name
        .trim()
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.topBarBtn}
        >
          <MaterialIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>
          {isEditMode ? "Edit Contact" : "New Contact"}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!name.trim() || saving}
          style={[
            styles.saveBtn,
            {
              backgroundColor: name.trim()
                ? colors.tint
                : colors.surfaceElevated,
            },
          ]}
        >
          <Text
            style={[
              styles.saveBtnText,
              { color: name.trim() ? "#FFFFFF" : colors.placeholder },
            ]}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Avatar/Photo area */}
        <View style={styles.avatarPreview}>
          <TouchableOpacity
            style={styles.photoAreaContainer}
            onPress={() => setShowPhotoMenu(!showPhotoMenu)}
          >
            {photo ? (
              <View style={styles.photoArea}>
                <Image source={{ uri: photo }} style={styles.photoImage} />
                <TouchableOpacity
                  style={[
                    styles.photoRemoveBtn,
                    { backgroundColor: colors.tint },
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemovePhoto();
                  }}
                >
                  <MaterialIcons name="close" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>

          {showPhotoMenu && (
            <View
              style={[
                styles.photoMenu,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.photoMenuBtn}
                onPress={handleAddPhotoFromGallery}
              >
                <MaterialIcons name="image" size={20} color={colors.tint} />
                <Text style={[styles.photoMenuBtnText, { color: colors.text }]}>
                  Gallery
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoMenuBtn}
                onPress={handleAddPhotoFromCamera}
              >
                <MaterialIcons
                  name="photo-camera"
                  size={20}
                  color={colors.tint}
                />
                <Text style={[styles.photoMenuBtnText, { color: colors.text }]}>
                  Camera
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Name */}
        <View style={[styles.inputGroup, { borderColor: colors.border }]}>
          <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
            <MaterialIcons
              name="person"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Name *"
              placeholderTextColor={colors.placeholder}
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={50}
            />
          </View>
          <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
            <MaterialIcons
              name="phone"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Phone"
              placeholderTextColor={colors.placeholder}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={20}
            />
          </View>
          <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
            <MaterialIcons
              name="email"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={80}
            />
          </View>
          <View style={styles.inputRow}>
            <MaterialIcons
              name="notes"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, styles.notesInput, { color: colors.text }]}
              placeholder="Notes"
              placeholderTextColor={colors.placeholder}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={300}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topBarBtn: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarPreview: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 24,
  },
  photoAreaContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  photoArea: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  photoMenu: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 12,
  },
  photoMenuBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  photoMenuBtnText: {
    fontSize: 14,
    fontWeight: "500",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  inputGroup: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 40,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderBottomWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  notesInput: {
    minHeight: 80,
  },
});
