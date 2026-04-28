const translations = {
  en: {
    navbar: {
      home: 'Home',
      register: 'Register Your Details',
      balancing: 'Daily Balancing',
      report: 'Report',
      account: 'Account',
      profile: 'Profile',
      settings: 'Setting',
      preferences: 'Preferences',
      signOut: 'Sign out'
    },
    preferences: {
      title: 'Preferences',
      language: 'Language',
      themeMode: 'Theme Mode',
      notifications: 'Notifications',
      smsAlerts: 'SMS Alerts',
      emailNotifications: 'Email Notifications',
      saveSuccess: 'Language updated successfully.'
    },
    profile: {
      title: 'Profile',
      manage: 'Manage your profile details',
      accountStatus: 'Account Status',
      name: 'Name',
      about: 'About',
      phone: 'Phone',
      enableEdit: 'Enable Edit',
      saveProfile: 'Save Profile',
      active: 'Active',
      suspended: 'Suspended'
    }
  },
  sw: {
    navbar: {
      home: 'Nyumbani',
      register: 'Sajili Maelezo Yako',
      balancing: 'Uwiano wa Kila Siku',
      report: 'Ripoti',
      account: 'Akaunti',
      profile: 'Profaili',
      settings: 'Mipangilio',
      preferences: 'Mapendeleo',
      signOut: 'Toka'
    },
    preferences: {
      title: 'Mapendeleo',
      language: 'Lugha',
      themeMode: 'Njia ya Mandhari',
      notifications: 'Arifa',
      smsAlerts: 'Arifa za SMS',
      emailNotifications: 'Arifa za Barua pepe',
      saveSuccess: 'Lugha imesasishwa kwa mafanikio.'
    },
    profile: {
      title: 'Profaili',
      manage: 'Dhibiti maelezo ya profaili yako',
      accountStatus: 'Hali ya Akaunti',
      name: 'Jina',
      about: 'Kuhusu',
      phone: 'Simu',
      enableEdit: 'Washa Uhariri',
      saveProfile: 'Hifadhi Profaili',
      active: 'Hai',
      suspended: 'Imesimamishwa'
    }
  }
} as const;

export type Lang = keyof typeof translations;
export default translations;
