/**
 * Internationalization (i18n) Service
 * Supports English, Bahasa Malaysia, Mandarin Chinese, and Tamil
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      app_name: 'MyKencing',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',

      // Onboarding
      welcome_title: 'Welcome to MyKencing',
      welcome_subtitle: 'Your personal medication companion',
      privacy_title: 'Your Privacy Matters',
      privacy_message: 'All your health data stays on your device. We never send it to the cloud.',
      consent_checkbox: 'I understand and consent to storing my health data locally on this device',
      get_started: 'Get Started',

      // Home
      home_title: 'Home',
      today_medications: "Today's Medications",
      no_medications: 'No medications yet',
      add_first_medication: 'Add your first medication to get started',
      adherence_streak: 'Day streak',
      vitals_summary: 'Health Vitals',

      // Medications
      medications: 'Medications',
      add_medication: 'Add Medication',
      scan_prescription: 'Scan Prescription',
      manual_entry: 'Manual Entry',
      medication_name: 'Medication Name',
      dosage: 'Dosage',
      frequency: 'Frequency',
      times_per_day: 'times per day',
      medication_times: 'Medication Times',
      food_instructions: 'Food Instructions',
      with_food: 'With food',
      after_food: 'After food',
      before_food: 'Before food',
      empty_stomach: 'Empty stomach',
      no_preference: 'No preference',
      start_date: 'Start Date',
      end_date: 'End Date',
      refill_date: 'Refill Date',
      notes: 'Notes',

      // Vitals
      vitals: 'Vitals',
      blood_pressure: 'Blood Pressure',
      glucose: 'Glucose',
      weight: 'Weight',
      add_vital: 'Add Reading',
      systolic: 'Systolic',
      diastolic: 'Diastolic',
      value: 'Value',
      measured_at: 'Measured At',

      // Settings
      settings: 'Settings',
      language: 'Language',
      notifications: 'Notifications',
      reminder_sound: 'Reminder Sound',
      reminder_vibrate: 'Vibration',
      units: 'Units',
      glucose_unit: 'Glucose Unit',
      weight_unit: 'Weight Unit',
      data_privacy: 'Data & Privacy',
      export_data: 'Export Data',
      delete_all_data: 'Delete All Data',

      // Notifications
      medication_reminder: 'Time for {{medication}}',
      taken: 'Taken',
      skip: 'Skip',
      snooze: 'Snooze',

      // Traditional Medicine
      traditional_medicine: 'Traditional Medicine',
      tcm: 'Traditional Chinese Medicine',
      ayurveda: 'Ayurveda',
      jamu: 'Jamu (Malay Traditional)',
      herb_name: 'Herb Name',
      preparation: 'Preparation',
    },
  },
  ms: {
    translation: {
      // Common (Bahasa Malaysia)
      app_name: 'MyKencing',
      cancel: 'Batal',
      save: 'Simpan',
      delete: 'Padam',
      edit: 'Edit',
      add: 'Tambah',
      search: 'Cari',
      loading: 'Memuatkan...',
      error: 'Ralat',
      success: 'Berjaya',
      confirm: 'Sahkan',
      yes: 'Ya',
      no: 'Tidak',

      // Onboarding
      welcome_title: 'Selamat Datang ke MyKencing',
      welcome_subtitle: 'Pendamping ubat peribadi anda',
      privacy_title: 'Privasi Anda Penting',
      privacy_message: 'Semua data kesihatan anda disimpan di peranti anda. Kami tidak menghantar ke awan.',
      consent_checkbox: 'Saya faham dan bersetuju untuk menyimpan data kesihatan saya secara tempatan di peranti ini',
      get_started: 'Mula',

      // Home
      home_title: 'Utama',
      today_medications: 'Ubat Hari Ini',
      no_medications: 'Tiada ubat lagi',
      add_first_medication: 'Tambah ubat pertama anda untuk bermula',
      adherence_streak: 'Hari berturut-turut',
      vitals_summary: 'Tanda Vital Kesihatan',

      // Medications
      medications: 'Ubat-ubatan',
      add_medication: 'Tambah Ubat',
      scan_prescription: 'Imbas Preskripsi',
      manual_entry: 'Masukan Manual',
      medication_name: 'Nama Ubat',
      dosage: 'Dos',
      frequency: 'Kekerapan',
      times_per_day: 'kali sehari',
      medication_times: 'Masa Ubat',
      food_instructions: 'Arahan Makanan',
      with_food: 'Dengan makanan',
      after_food: 'Selepas makan',
      before_food: 'Sebelum makan',
      empty_stomach: 'Perut kosong',
      no_preference: 'Tiada keutamaan',
      start_date: 'Tarikh Mula',
      end_date: 'Tarikh Tamat',
      refill_date: 'Tarikh Isi Semula',
      notes: 'Nota',

      // Vitals
      vitals: 'Tanda Vital',
      blood_pressure: 'Tekanan Darah',
      glucose: 'Glukosa',
      weight: 'Berat Badan',
      add_vital: 'Tambah Bacaan',
      systolic: 'Sistolik',
      diastolic: 'Diastolik',
      value: 'Nilai',
      measured_at: 'Diukur Pada',

      // Settings
      settings: 'Tetapan',
      language: 'Bahasa',
      notifications: 'Pemberitahuan',
      reminder_sound: 'Bunyi Peringatan',
      reminder_vibrate: 'Getaran',
      units: 'Unit',
      glucose_unit: 'Unit Glukosa',
      weight_unit: 'Unit Berat',
      data_privacy: 'Data & Privasi',
      export_data: 'Eksport Data',
      delete_all_data: 'Padam Semua Data',

      // Notifications
      medication_reminder: 'Masa untuk {{medication}}',
      taken: 'Telah Diambil',
      skip: 'Langkau',
      snooze: 'Tunda',

      // Traditional Medicine
      traditional_medicine: 'Ubat Tradisional',
      tcm: 'Ubat Cina Tradisional',
      ayurveda: 'Ayurveda',
      jamu: 'Jamu (Tradisional Melayu)',
      herb_name: 'Nama Herba',
      preparation: 'Penyediaan',
    },
  },
  zh: {
    translation: {
      // Common (Mandarin Chinese)
      app_name: 'MyKencing',
      cancel: '取消',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      add: '添加',
      search: '搜索',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      confirm: '确认',
      yes: '是',
      no: '否',

      // Onboarding
      welcome_title: '欢迎使用 MyKencing',
      welcome_subtitle: '您的个人用药助手',
      privacy_title: '您的隐私很重要',
      privacy_message: '您的所有健康数据都保存在您的设备上。我们绝不会将其发送到云端。',
      consent_checkbox: '我理解并同意将我的健康数据本地存储在此设备上',
      get_started: '开始',

      // Home
      home_title: '首页',
      today_medications: '今日用药',
      no_medications: '还没有药物',
      add_first_medication: '添加您的第一个药物以开始',
      adherence_streak: '连续天数',
      vitals_summary: '健康体征',

      // Medications
      medications: '药物',
      add_medication: '添加药物',
      scan_prescription: '扫描处方',
      manual_entry: '手动输入',
      medication_name: '药物名称',
      dosage: '剂量',
      frequency: '频率',
      times_per_day: '次/天',
      medication_times: '用药时间',
      food_instructions: '饮食说明',
      with_food: '与食物一起',
      after_food: '饭后',
      before_food: '饭前',
      empty_stomach: '空腹',
      no_preference: '无偏好',
      start_date: '开始日期',
      end_date: '结束日期',
      refill_date: '续药日期',
      notes: '备注',

      // Vitals
      vitals: '体征',
      blood_pressure: '血压',
      glucose: '血糖',
      weight: '体重',
      add_vital: '添加读数',
      systolic: '收缩压',
      diastolic: '舒张压',
      value: '值',
      measured_at: '测量时间',

      // Settings
      settings: '设置',
      language: '语言',
      notifications: '通知',
      reminder_sound: '提醒声音',
      reminder_vibrate: '振动',
      units: '单位',
      glucose_unit: '血糖单位',
      weight_unit: '体重单位',
      data_privacy: '数据与隐私',
      export_data: '导出数据',
      delete_all_data: '删除所有数据',

      // Notifications
      medication_reminder: '{{medication}} 用药时间',
      taken: '已服用',
      skip: '跳过',
      snooze: '稍后提醒',

      // Traditional Medicine
      traditional_medicine: '传统医学',
      tcm: '中医',
      ayurveda: '阿育吠陀',
      jamu: 'Jamu（马来传统）',
      herb_name: '草药名称',
      preparation: '制备',
    },
  },
  ta: {
    translation: {
      // Common (Tamil) - Basic translations
      app_name: 'MyKencing',
      cancel: 'ரத்து செய்',
      save: 'சேமி',
      delete: 'நீக்கு',
      edit: 'திருத்து',
      add: 'சேர்',
      search: 'தேடு',
      loading: 'ஏற்றுகிறது...',
      error: 'பிழை',
      success: 'வெற்றி',
      confirm: 'உறுதிப்படுத்து',
      yes: 'ஆம்',
      no: 'இல்லை',

      // Onboarding
      welcome_title: 'MyKencing க்கு வரவேற்கிறோம்',
      welcome_subtitle: 'உங்கள் தனிப்பட்ட மருந்து துணை',
      privacy_title: 'உங்கள் தனியுரிமை முக்கியம்',
      privacy_message: 'உங்கள் அனைத்து சுகாதார தரவுகளும் உங்கள் சாதனத்தில் இருக்கும். நாங்கள் அதை கிளவுட்டுக்கு அனுப்பமாட்டோம்.',
      consent_checkbox: 'இந்த சாதனத்தில் என் சுகாதார தரவை உள்ளூரில் சேமிக்க நான் புரிந்துகொண்டு ஒப்புக்கொள்கிறேன்',
      get_started: 'தொடங்கு',

      // Home
      home_title: 'முகப்பு',
      today_medications: 'இன்றைய மருந்துகள்',
      no_medications: 'இன்னும் மருந்துகள் இல்லை',
      add_first_medication: 'தொடங்க உங்கள் முதல் மருந்தை சேர்க்கவும்',
      adherence_streak: 'நாட்கள் தொடர்ச்சி',
      vitals_summary: 'சுகாதார அறிகுறிகள்',

      // Medications
      medications: 'மருந்துகள்',
      add_medication: 'மருந்து சேர்',
      scan_prescription: 'பரிந்துரை ஸ்கேன்',
      manual_entry: 'கைமுறை நுழைவு',
      medication_name: 'மருந்து பெயர்',
      dosage: 'அளவு',
      frequency: 'அதிர்வெண்',
      times_per_day: 'முறை / நாள்',
      medication_times: 'மருந்து நேரங்கள்',
      food_instructions: 'உணவு வழிமுறைகள்',
      with_food: 'உணவுடன்',
      after_food: 'உணவுக்குப் பிறகு',
      before_food: 'உணவுக்கு முன்',
      empty_stomach: 'வெற்று வயிற்றில்',
      no_preference: 'விருப்பம் இல்லை',
      start_date: 'தொடக்க தேதி',
      end_date: 'முடிவு தேதி',
      refill_date: 'மீண்டும் நிரப்பும் தேதி',
      notes: 'குறிப்புகள்',

      // Vitals
      vitals: 'அறிகுறிகள்',
      blood_pressure: 'இரத்த அழுத்தம்',
      glucose: 'குளுக்கோஸ்',
      weight: 'எடை',
      add_vital: 'வாசிப்பு சேர்',
      systolic: 'சிஸ்டாலிக்',
      diastolic: 'டயஸ்டாலிக்',
      value: 'மதிப்பு',
      measured_at: 'அளவிடப்பட்டது',

      // Settings
      settings: 'அமைப்புகள்',
      language: 'மொழி',
      notifications: 'அறிவிப்புகள்',
      reminder_sound: 'நினைவூட்டல் ஒலி',
      reminder_vibrate: 'அதிர்வு',
      units: 'அலகுகள்',
      glucose_unit: 'குளுக்கோஸ் அலகு',
      weight_unit: 'எடை அலகு',
      data_privacy: 'தரவு & தனியுரிமை',
      export_data: 'தரவை ஏற்றுமதி செய்',
      delete_all_data: 'அனைத்து தரவையும் நீக்கு',

      // Notifications
      medication_reminder: '{{medication}} நேரம்',
      taken: 'எடுக்கப்பட்டது',
      skip: 'தவிர்',
      snooze: 'ஒத்திவை',

      // Traditional Medicine
      traditional_medicine: 'பாரம்பரிய மருத்துவம்',
      tcm: 'பாரம்பரிய சீன மருத்துவம்',
      ayurveda: 'ஆயுர்வேதம்',
      jamu: 'ஜமு (மலாய் பாரம்பரியம்)',
      herb_name: 'மூலிகை பெயர்',
      preparation: 'தயாரிப்பு',
    },
  },
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.getLocales()[0]?.languageCode || 'en',
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;

/**
 * Change app language
 */
export function changeLanguage(language: 'en' | 'ms' | 'zh' | 'ta'): void {
  i18n.changeLanguage(language);
}

/**
 * Get current language
 */
export function getCurrentLanguage(): string {
  return i18n.language;
}

/**
 * Translate a key
 */
export function t(key: string, params?: any): string {
  return i18n.t(key, params);
}
