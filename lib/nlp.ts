import { EntryCategory } from './models';

// Blacklist of common non-name words that could follow prepositions like "with", "con", "amb"
const BLACKLIST = new Set([
  // Catalan
  'meu', 'meva', 'meus', 'meves', 'teu', 'teva', 'teus', 'teves', 'seu', 'seva', 'seus', 'seves',
  'nostre', 'nostra', 'nostres', 'vostre', 'vostra', 'vostres',
  'pare', 'mare', 'germa', 'germà', 'germana', 'oncle', 'tia', 'avi', 'avia', 'àvia', 'cosi', 'cosí', 'cosina', 'fill', 'filla', 'net', 'nét', 'neta', 'néta',
  'amic', 'amiga', 'amics', 'amigues', 'company', 'companya', 'companys', 'companyes', 'cap', 'jefe', 'profe', 'professor', 'professora',
  'gos', 'gossa', 'gat', 'gata', 'bici', 'bicicleta', 'cotxe', 'moto', 'tren', 'bus', 'avio', 'avió', 'vaixell', 'ordinador', 'mobil', 'mòbil', 'tauleta',
  'llibre', 'llibres', 'familia', 'família', 'classe', 'esport', 'gent', 'persona', 'persones', 'ningu', 'ningú', 'algu', 'algú', 'tothom',
  'casa', 'escola', 'universitat', 'uni', 'feina', 'treball', 'grup', 'equip', 'soci', 'socis',
  'dinar', 'sopar', 'esmorzar', 'cafe', 'cafè', 'cervesa', 'birra', 'copa', 'festa', 'concert', 'cine', 'cinema', 'teatre',
  
  // Spanish
  'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro', 'vuestra', 'vuestros', 'vuestras',
  'padre', 'madre', 'hermano', 'hermana', 'tío', 'tio', 'tía', 'tia', 'abuelo', 'abuela', 'primo', 'prima', 'hijo', 'hija', 'nieto', 'nieta',
  'amigo', 'amiga', 'amigos', 'amigas', 'compañero', 'compañera', 'compañeros', 'compañeras', 'jefe', 'profe', 'profesor', 'profesora',
  'perro', 'perra', 'gato', 'gata', 'bici', 'bicicleta', 'coche', 'moto', 'tren', 'autobus', 'autobús', 'avión', 'avion', 'barco', 'ordenador', 'movil', 'móvil', 'tableta',
  'libro', 'libros', 'familia', 'clase', 'deporte', 'gente', 'persona', 'personas', 'nadie', 'alguien', 'todos', 'todas',
  'casa', 'colegio', 'escuela', 'universidad', 'uni', 'trabajo', 'grupo', 'equipo', 'socio', 'socios',
  'comida', 'cena', 'desayuno', 'cafe', 'café', 'cerveza', 'copa', 'fiesta', 'concierto', 'cine', 'teatro',
  
  // English
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'father', 'mother', 'brother', 'sister', 'uncle', 'aunt', 'grandfather', 'grandmother', 'cousin', 'son', 'daughter', 'nephew', 'niece',
  'friend', 'friends', 'colleague', 'colleagues', 'boss', 'teacher', 'instructor',
  'dog', 'cat', 'bike', 'bicycle', 'car', 'motorcycle', 'train', 'bus', 'plane', 'boat', 'computer', 'mobile', 'phone', 'tablet',
  'book', 'books', 'family', 'class', 'sport', 'sports', 'people', 'person', 'someone', 'nobody', 'everyone', 'anyone',
  'home', 'house', 'school', 'college', 'university', 'uni', 'work', 'job', 'group', 'team', 'partner', 'partners',
  'lunch', 'dinner', 'breakfast', 'coffee', 'beer', 'drink', 'drinks', 'party', 'concert', 'movie', 'movies', 'theater', 'cinema',
  
  // General pronouns & small words
  'yo', 'tu', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas', 'me', 'te', 'se', 'nos', 'os',
  'jo', 'tu', 'ell', 'ella', 'nosaltres', 'vosaltres', 'ells', 'elles', 'em', 'et', 'es',
  'i', 'y', 'and', 'or', 'o', 'u', 'a', 'de', 'para', 'per', 'per a', 'con', 'amb', 'with', 'in', 'en', 'at', 'on'
]);

const KEYWORD_MAP: { category: EntryCategory; words: string[] }[] = [
  {
    category: 'sports',
    words: [
      // English
      'climbing', 'climb', 'run', 'running', 'gym', 'sport', 'sports', 'football', 'soccer', 'bike', 'bicycle', 'walk', 'walking',
      'tennis', 'basket', 'basketball', 'swimming', 'swim', 'cycling', 'training', 'workout', 'yoga', 'pilates', 'match',
      // Catalan
      'escalar', 'escalada', 'córrer', 'correr', 'gimnàs', 'gimnas', 'futbol', 'esport', 'esports', 'bici', 'bicicleta', 'caminar',
      'tenis', 'bàsquet', 'basquet', 'natació', 'natacio', 'ciclisme', 'entrenar', 'entrenament', 'entreno', 'ioga', 'partit', 'jugar',
      // Spanish
      'gimnasio', 'deporte', 'deportes', 'baloncesto', 'natación', 'natacion', 'ciclismo', 'entreno', 'entrenamiento', 'partido', 'juego'
    ]
  },
  {
    category: 'health',
    words: [
      // English
      'doctor', 'dentist', 'health', 'medicine', 'hospital', 'clinic', 'pharmacy', 'sick', 'therapy', 'therapist', 'physio',
      // Catalan
      'metge', 'metgessa', 'dentista', 'salut', 'medicament', 'pastilla', 'pastilles', 'hospital', 'clínica', 'clinica', 'farmàcia', 'farmacia',
      'malalt', 'malalta', 'teràpia', 'terapia', 'psicòleg', 'psicòloga', 'psicoleg', 'psicologa', 'fisioterapeuta', 'fisio',
      // Spanish
      'médico', 'medico', 'salud', 'medicina', 'medicamento', 'pastilla', 'pastillas', 'enfermo', 'enferma', 'psicólogo', 'psicóloga', 'psicologo', 'psicologa'
    ]
  },
  {
    category: 'work',
    words: [
      // English
      'work', 'meeting', 'job', 'office', 'study', 'studying', 'class', 'exam', 'course', 'interview', 'project', 'call', 'presentation',
      // Catalan
      'feina', 'treball', 'treballar', 'reunió', 'reunio', 'oficina', 'estudiar', 'estudi', 'classe', 'examen', 'curs', 'curset', 'entrevista',
      'projecte', 'trucada', 'presentació', 'presentacio', 'laboratori', 'lab', 'deures',
      // Spanish
      'trabajo', 'trabajar', 'reunión', 'reunion', 'estudio', 'clase', 'curso', 'proyecto', 'llamada', 'presentación', 'presentacion'
    ]
  },
  {
    category: 'social',
    words: [
      // English
      'party', 'dinner', 'lunch', 'coffee', 'friends', 'birthday', 'beer', 'drink', 'drinks', 'hangout', 'concert', 'theater', 'cinema', 'bar',
      // Catalan
      'festa', 'sopar', 'dinar', 'cafè', 'cafe', 'amics', 'amigues', 'aniversari', 'cumple', 'cervesa', 'birra', 'copa', 'copes', 'quedar',
      'concert', 'teatre', 'cinema', 'bar', 'vermut', 'sopar-dinar',
      // Spanish
      'fiesta', 'cena', 'comida', 'amigos', 'amigas', 'cumpleaños', 'cerveza', 'quedar', 'concierto', 'cine', 'teatro'
    ]
  },
  {
    category: 'personal',
    words: [
      // English
      'shopping', 'clean', 'cleaning', 'laundry', 'home', 'read', 'reading', 'book', 'books', 'relax', 'relaxing', 'cook', 'cooking',
      'garden', 'sleep', 'sleeping', 'nap',
      // Catalan
      'comprar', 'compra', 'supermercat', 'super', 'netejar', 'neteja', 'bugada', 'rentar', 'casa', 'llegir', 'llibre', 'llibres',
      'relax', 'relaxar-me', 'relaxar', 'cuinar', 'dormir', 'migdiada', 'jardí', 'jardi',
      // Spanish
      'compra', 'supermercado', 'limpiar', 'limpieza', 'colada', 'lavar', 'leer', 'libro', 'libros', 'relajar', 'relajarme', 'cocinar'
    ]
  }
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // removes accents
}

export function detectCategories(title: string, description: string): EntryCategory[] {
  const combined = normalizeText((title || '') + ' ' + (description || ''));
  const detected: EntryCategory[] = [];
  
  for (const group of KEYWORD_MAP) {
    for (const word of group.words) {
      const normalizedWord = normalizeText(word);
      const regex = new RegExp(`\\b${normalizedWord}\\b`, 'i');
      if (regex.test(combined)) {
        detected.push(group.category);
        break; // Stop scanning this group once we match it, move to the next category
      }
    }
  }
  
  return detected;
}

export function extractPotentialPeople(text: string): string[] {
  if (!text) return [];
  
  const results: string[] = [];
  
  // Match a preposition "amb" (Catalan), "con" (Spanish), or "with" (English) followed by optional articles/possessives
  const prepRegex = /\b(amb|con|with)\s+(?:l'|la\s+|en\s+|na\s+|el\s+|els\s+|les\s+|un\s+|una\s+|los\s+|las\s+|the\s+|my\s+|mi\s+|mis\s+|meu\s+|meva\s+|meus\s+|meves\s+)?([a-zA-ZÀ-ÖØ-öø-ÿ]+)/gi;
  
  let match;
  while ((match = prepRegex.exec(text)) !== null) {
    const candidate = match[2];
    if (candidate) {
      addCandidate(candidate, results);
      
      // Lookahead for additional names linked with commas or "i", "y", "and"
      let searchStartIndex = prepRegex.lastIndex;
      // Allow optional spaces after the separator (, / i / y / and)
      const lookaheadRegex = /^\s*(?:,|i|y|and)\s*(?:l'|la\s+|en\s+|na\s+|el\s+|els\s+|les\s+|un\s+|una\s+|los\s+|las\s+|the\s+|my\s+|mi\s+|mis\s+|meu\s+|meva\s+|meus\s+|meves\s+)?([a-zA-ZÀ-ÖØ-öø-ÿ]+)/i;
      
      let lookaheadMatch;
      while (true) {
        const remainingText = text.slice(searchStartIndex);
        lookaheadMatch = lookaheadRegex.exec(remainingText);
        if (lookaheadMatch) {
          const nextCandidate = lookaheadMatch[1];
          // If the next candidate is actually another preposition, stop lookahead to let main loop parse it
          if (['amb', 'con', 'with'].includes(nextCandidate.toLowerCase())) {
            break;
          }
          addCandidate(nextCandidate, results);
          searchStartIndex += lookaheadMatch[0].length;
          // Synchronize prepRegex index
          prepRegex.lastIndex = searchStartIndex;
        } else {
          break;
        }
      }
    }
  }
  
  return Array.from(new Set(results));
}

function addCandidate(word: string, results: string[]) {
  const cleaned = word.trim();
  if (cleaned.length < 2) return;
  
  // Capitalize first letter to normalize (e.g. "hector" -> "Hector")
  const normalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  
  if (!BLACKLIST.has(normalized.toLowerCase())) {
    results.push(normalized);
  }
}
