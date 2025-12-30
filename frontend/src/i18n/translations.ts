/**
 * UI Translations for FinLit
 * 
 * This file contains ALL UI strings (buttons, labels, navigation, etc.)
 * Content (questions, lessons) stays in English and is translated via LLM on-demand
 */

import { LanguageCode } from './config'

export const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Navigation
    'nav.learn': 'Learn',
    'nav.practice': 'Practice',
    'nav.leaderboard': 'Leaderboard',
    'nav.quests': 'Quests',
    'nav.shop': 'Shop',
    'nav.profile': 'Profile',
    'nav.coach': 'FinAI Coach',
    
    // Common
    'common.back': 'Back',
    'common.continue': 'Continue',
    'common.start': 'Start',
    'common.check': 'Check',
    'common.skip': 'Skip',
    'common.next': 'Next',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
    'common.close': 'Close',
    
    // Learn Page
    'learn.title': 'Courses',
    'learn.section': 'Section',
    'learn.lessons': 'Lessons',
    'learn.locked': 'Locked',
    'learn.complete_previous': 'Complete Previous',
    'learn.lets_go': "Let's go!",
    
    // Lesson Page
    'lesson.select_answer': 'Select the correct answer',
    'lesson.read_learn': 'Read and learn',
    'lesson.speak_answer': 'Or speak your answer',
    'lesson.record': 'Record',
    'lesson.stop': 'Stop',
    'lesson.listening': 'Listening... Speak now!',
    'lesson.your_answer': 'Your spoken answer:',
    'lesson.click_check': 'Click CHECK to submit your voice answer',
    'lesson.correct': 'Nice!',
    'lesson.wrong': 'Correct solution:',
    'lesson.report': 'Report',
    'lesson.in_a_row': 'in a row!',
    'lesson.on_fire': "You're on fire! Keep going!",
    
    // Celebration
    'celebration.lesson_complete': 'Lesson Complete!',
    'celebration.total_xp': 'Total XP',
    'celebration.gems': 'Gems',
    'celebration.review': 'Review Lesson',
    
    // Quests
    'quests.title': 'Quests',
    'quests.subtitle': 'Complete quests to earn bonus XP',
    'quests.daily': 'Daily Quests',
    'quests.weekly': 'Weekly Quests',
    'quests.special': 'Special Quests',
    'quests.resets_in': 'Resets in',
    'quests.claim': 'Claim Reward',
    'quests.claiming': 'Claiming...',
    'quests.completed': 'Completed',
    
    // Leaderboard
    'leaderboard.title': 'Leaderboard',
    'leaderboard.league': 'League',
    'leaderboard.top_advance': 'Top 10 advance to the next league',
    'leaderboard.promotion_zone': 'Promotion Zone',
    'leaderboard.you': 'You',
    'leaderboard.days_left': 'days left',
    
    // Profile
    'profile.title': 'Profile',
    'profile.statistics': 'Statistics',
    'profile.achievements': 'Achievements',
    'profile.total_xp': 'Total XP',
    'profile.current_streak': 'Current Streak',
    'profile.lessons_completed': 'Lessons Completed',
    
    // Shop
    'shop.title': 'Shop',
    'shop.gems': 'Gems',
    'shop.buy': 'Buy',
    'shop.equipped': 'Equipped',
    'shop.purchase': 'Purchase',
    
    // Coach
    'coach.title': 'FinAI Coach',
    'coach.subtitle': 'Your personal financial advisor',
    'coach.ask_question': 'Ask a question...',
    'coach.send': 'Send',
    'coach.examples': 'Example questions:',
    
    // Errors
    'error.load_courses': 'Failed to load courses',
    'error.load_lessons': 'Failed to load lessons',
    'error.load_questions': 'Failed to load questions',
    'error.no_questions': 'No questions available for this lesson',
    'error.login_required': 'Please log in to continue',
  },
  
  es: {
    // Navigation
    'nav.learn': 'Aprender',
    'nav.practice': 'Practicar',
    'nav.leaderboard': 'Clasificación',
    'nav.quests': 'Misiones',
    'nav.shop': 'Tienda',
    'nav.profile': 'Perfil',
    'nav.coach': 'Coach FinAI',
    
    // Common
    'common.back': 'Atrás',
    'common.continue': 'Continuar',
    'common.start': 'Comenzar',
    'common.check': 'Verificar',
    'common.skip': 'Saltar',
    'common.next': 'Siguiente',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.retry': 'Reintentar',
    'common.close': 'Cerrar',
    
    // Learn Page
    'learn.title': 'Cursos',
    'learn.section': 'Sección',
    'learn.lessons': 'Lecciones',
    'learn.locked': 'Bloqueado',
    'learn.complete_previous': 'Completar Anterior',
    'learn.lets_go': '¡Vamos!',
    
    // Lesson Page
    'lesson.select_answer': 'Selecciona la respuesta correcta',
    'lesson.read_learn': 'Lee y aprende',
    'lesson.speak_answer': 'O habla tu respuesta',
    'lesson.record': 'Grabar',
    'lesson.stop': 'Detener',
    'lesson.listening': '¡Escuchando... Habla ahora!',
    'lesson.your_answer': 'Tu respuesta hablada:',
    'lesson.click_check': 'Haz clic en VERIFICAR para enviar tu respuesta de voz',
    'lesson.correct': '¡Bien!',
    'lesson.wrong': 'Solución correcta:',
    'lesson.report': 'Reportar',
    'lesson.in_a_row': 'seguidas!',
    'lesson.on_fire': '¡Estás en llamas! ¡Sigue así!',
    
    // Celebration
    'celebration.lesson_complete': '¡Lección Completada!',
    'celebration.total_xp': 'XP Total',
    'celebration.gems': 'Gemas',
    'celebration.review': 'Revisar Lección',
    
    // Quests
    'quests.title': 'Misiones',
    'quests.subtitle': 'Completa misiones para ganar XP adicional',
    'quests.daily': 'Misiones Diarias',
    'quests.weekly': 'Misiones Semanales',
    'quests.special': 'Misiones Especiales',
    'quests.resets_in': 'Se reinicia en',
    'quests.claim': 'Reclamar Recompensa',
    'quests.claiming': 'Reclamando...',
    'quests.completed': 'Completado',
    
    // Leaderboard
    'leaderboard.title': 'Clasificación',
    'leaderboard.league': 'Liga',
    'leaderboard.top_advance': 'Los 10 mejores avanzan a la siguiente liga',
    'leaderboard.promotion_zone': 'Zona de Promoción',
    'leaderboard.you': 'Tú',
    'leaderboard.days_left': 'días restantes',
    
    // Profile
    'profile.title': 'Perfil',
    'profile.statistics': 'Estadísticas',
    'profile.achievements': 'Logros',
    'profile.total_xp': 'XP Total',
    'profile.current_streak': 'Racha Actual',
    'profile.lessons_completed': 'Lecciones Completadas',
    
    // Shop
    'shop.title': 'Tienda',
    'shop.gems': 'Gemas',
    'shop.buy': 'Comprar',
    'shop.equipped': 'Equipado',
    'shop.purchase': 'Comprar',
    
    // Coach
    'coach.title': 'Coach FinAI',
    'coach.subtitle': 'Tu asesor financiero personal',
    'coach.ask_question': 'Haz una pregunta...',
    'coach.send': 'Enviar',
    'coach.examples': 'Preguntas de ejemplo:',
    
    // Errors
    'error.load_courses': 'Error al cargar cursos',
    'error.load_lessons': 'Error al cargar lecciones',
    'error.load_questions': 'Error al cargar preguntas',
    'error.no_questions': 'No hay preguntas disponibles para esta lección',
    'error.login_required': 'Por favor inicia sesión para continuar',
  },
  
  ne: {
    // Navigation
    'nav.learn': 'सिक्नुहोस्',
    'nav.practice': 'अभ्यास',
    'nav.leaderboard': 'लिडरबोर्ड',
    'nav.quests': 'क्वेस्ट',
    'nav.shop': 'पसल',
    'nav.profile': 'प्रोफाइल',
    'nav.coach': 'FinAI कोच',
    
    // Common
    'common.back': 'पछाडि',
    'common.continue': 'जारी राख्नुहोस्',
    'common.start': 'सुरु गर्नुहोस्',
    'common.check': 'जाँच गर्नुहोस्',
    'common.skip': 'छोड्नुहोस्',
    'common.next': 'अर्को',
    'common.loading': 'लोड हुँदैछ...',
    'common.error': 'त्रुटि',
    'common.retry': 'पुन: प्रयास',
    'common.close': 'बन्द गर्नुहोस्',
    
    // Learn Page
    'learn.title': 'पाठ्यक्रमहरू',
    'learn.section': 'खण्ड',
    'learn.lessons': 'पाठहरू',
    'learn.locked': 'लक गरिएको',
    'learn.complete_previous': 'अघिल्लो पूरा गर्नुहोस्',
    'learn.lets_go': 'जाऔं!',
    
    // Lesson Page
    'lesson.select_answer': 'सही उत्तर चयन गर्नुहोस्',
    'lesson.read_learn': 'पढ्नुहोस् र सिक्नुहोस्',
    'lesson.speak_answer': 'वा आफ्नो उत्तर बोल्नुहोस्',
    'lesson.record': 'रेकर्ड',
    'lesson.stop': 'रोक्नुहोस्',
    'lesson.listening': 'सुन्दै... अहिले बोल्नुहोस्!',
    'lesson.your_answer': 'तपाईंको बोलेको उत्तर:',
    'lesson.click_check': 'आफ्नो आवाज उत्तर पेश गर्न जाँच क्लिक गर्नुहोस्',
    'lesson.correct': 'राम्रो!',
    'lesson.wrong': 'सही समाधान:',
    'lesson.report': 'रिपोर्ट',
    'lesson.in_a_row': 'लगातार!',
    'lesson.on_fire': 'तपाईं आगोमा हुनुहुन्छ! जारी राख्नुहोस्!',
    
    // Celebration
    'celebration.lesson_complete': 'पाठ पूरा भयो!',
    'celebration.total_xp': 'कुल XP',
    'celebration.gems': 'रत्नहरू',
    'celebration.review': 'पाठ समीक्षा',
    
    // Quests
    'quests.title': 'क्वेस्टहरू',
    'quests.subtitle': 'बोनस XP कमाउन क्वेस्टहरू पूरा गर्नुहोस्',
    'quests.daily': 'दैनिक क्वेस्टहरू',
    'quests.weekly': 'साप्ताहिक क्वेस्टहरू',
    'quests.special': 'विशेष क्वेस्टहरू',
    'quests.resets_in': 'रिसेट हुन्छ',
    'quests.claim': 'पुरस्कार दावी',
    'quests.claiming': 'दावी गर्दै...',
    'quests.completed': 'पूरा भयो',
    
    // Leaderboard
    'leaderboard.title': 'लिडरबोर्ड',
    'leaderboard.league': 'लिग',
    'leaderboard.top_advance': 'शीर्ष 10 अर्को लिगमा अगाडि बढ्छन्',
    'leaderboard.promotion_zone': 'प्रमोशन जोन',
    'leaderboard.you': 'तपाईं',
    'leaderboard.days_left': 'दिन बाँकी',
    
    // Profile
    'profile.title': 'प्रोफाइल',
    'profile.statistics': 'तथ्याङ्क',
    'profile.achievements': 'उपलब्धिहरू',
    'profile.total_xp': 'कुल XP',
    'profile.current_streak': 'हालको स्ट्रीक',
    'profile.lessons_completed': 'पूरा भएका पाठहरू',
    
    // Shop
    'shop.title': 'पसल',
    'shop.gems': 'रत्नहरू',
    'shop.buy': 'किन्नुहोस्',
    'shop.equipped': 'सुसज्जित',
    'shop.purchase': 'खरिद',
    
    // Coach
    'coach.title': 'FinAI कोच',
    'coach.subtitle': 'तपाईंको व्यक्तिगत वित्तीय सल्लाहकार',
    'coach.ask_question': 'प्रश्न सोध्नुहोस्...',
    'coach.send': 'पठाउनुहोस्',
    'coach.examples': 'उदाहरण प्रश्नहरू:',
    
    // Errors
    'error.load_courses': 'पाठ्यक्रमहरू लोड गर्न असफल',
    'error.load_lessons': 'पाठहरू लोड गर्न असफल',
    'error.load_questions': 'प्रश्नहरू लोड गर्न असफल',
    'error.no_questions': 'यो पाठको लागि कुनै प्रश्नहरू उपलब्ध छैनन्',
    'error.login_required': 'जारी राख्न कृपया लग इन गर्नुहोस्',
  }
}

// Helper function to get translation
export const t = (key: string, lang: LanguageCode): string => {
  return translations[lang][key] || translations['en'][key] || key
}

