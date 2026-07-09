# 📅 Agenda

Una aplicació móbil per gestionar el teu calendari i contactes personals. Construïda amb [Expo](https://expo.dev) i React Native.

## ✨ Característiques

- 📆 **Calendari interactiu** - Visualitza i gestiona els teus events
- 👥 **Gestió de contactes** - Manté els teus contactes personals organitzats
- 📝 **Añadir events** - Crea nous events de manera senzilla
- 👤 **Gestió de persones** - Afegeix i administra gent
- 🔔 **Notificacions** - Rebeix recordatoris pels teus events
- 📱 **Multi-plataforma** - Funciona a Android, iOS i web

## 🚀 Primeros pasos

### Instal·lació

1. Clona el repositori:

   ```bash
   git clone https://github.com/tu-usuari/agenda.git
   cd Agenda
   ```

2. Instal·la les dependències:

   ```bash
   npm install
   ```

3. Inicia l'aplicació:
   ```bash
   npx expo start
   ```

### Execució de l'aplicació

Després d'executar `npx expo start`, veuràs opcions per executar l'app en:

- [Development Build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Emulador d'Android](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Simulador d'iOS](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go) - Aplicació oficial d'Expo per provar

## 📁 Estructura del projecte

```
├── app/                 # Lògica i rutes principals
│   ├── (tabs)/         # Pestanyes principals de la navegació
│   ├── add-entry.tsx   # Pantalla per afegir events
│   └── add-person.tsx  # Pantalla per afegir contactes
├── components/         # Components reutilitzables
│   ├── calendar/       # Components del calendari
│   ├── people/         # Components de contactes
│   └── ui/             # Components generals d'interfície
├── lib/                # Utilitats i models
├── constants/          # Constants de l'aplicació (temes, etc.)
└── hooks/              # React Hooks personalitzats
```

## 🛠️ Desenvolupament

### Tecnologies utilitzades

- [Expo Router](https://docs.expo.dev/router/introduction/) - Navegació amb routing basat en fitxers
- [React Native](https://reactnative.dev/) - Framework per aplicacions móbils
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Async Storage](https://react-native-async-storage.github.io/async-storage/) - Emmagatzematge local
- [Expo Notifications](https://docs.expo.dev/notifications/overview/) - Sistema de notificacions

## 📚 Més informació

- [Documentació d'Expo](https://docs.expo.dev/) - Guies completes i tutorials
- [Tutorial pas a pas d'Expo](https://docs.expo.dev/tutorial/introduction/)
- [React Native docs](https://reactnative.dev/docs/getting-started)

## 🤝 Comunitat

- [Expo a GitHub](https://github.com/expo/expo) - Plataforma open source
- [Comunitat Discord](https://chat.expo.dev) - Xateja amb altres desenvolupadors

## 📄 Llicència

Aquest projecte es distribueix sota la llicència MIT.

---

**Versió:** 1.0.0
