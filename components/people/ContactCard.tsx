import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Person } from "@/lib/models";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ContactCardProps {
  person: Person;
  onDelete: (id: string) => void;
}

export function ContactCard({ person, onDelete }: ContactCardProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const initials = person.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const confirmDelete = () => {
    Alert.alert("Delete Contact", `Remove "${person.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete(person.id),
      },
    ]);
  };

  const handleEditContact = () => {
    router.push({
      pathname: "/add-person",
      params: { personId: person.id },
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        {person.photo ? (
          <Image source={{ uri: person.photo }} style={styles.photoAvatar} />
        ) : (
          <View
            style={[styles.avatar, { backgroundColor: person.avatarColor }]}
          >
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>
            {person.name}
          </Text>
          {person.phone ? (
            <View style={styles.detailRow}>
              <MaterialIcons
                name="phone"
                size={13}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.detailText, { color: colors.textSecondary }]}
              >
                {person.phone}
              </Text>
            </View>
          ) : null}
          {person.email ? (
            <View style={styles.detailRow}>
              <MaterialIcons
                name="email"
                size={13}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.detailText, { color: colors.textSecondary }]}
              >
                {person.email}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={handleEditContact}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="edit" size={20} color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={confirmDelete}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ marginLeft: 12 }}
          >
            <MaterialIcons
              name="delete-outline"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {expanded && person.notes ? (
        <View
          style={[styles.notesContainer, { borderTopColor: colors.border }]}
        >
          <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>
            Notes
          </Text>
          <Text style={[styles.notesText, { color: colors.text }]}>
            {person.notes}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  photoAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 14,
  },
  initials: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  detailText: {
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  notesContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    marginTop: 0,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
