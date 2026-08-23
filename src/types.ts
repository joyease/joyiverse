export type LogType = '旅行' | '運動' | '美食' | '閱讀' | '創作' | '視聽' | '寫字' | '影片';

export type CategoryGroup = 'outdoor' | 'life';

export interface LogEntry {
  id: string;
  userId: string; // User email (e.g. hermanntalk@gmail.com)
  userDisplayName?: string;
  userPhotoURL?: string;
  type: LogType;
  categoryGroup: CategoryGroup;
  note: string;
  lat?: number | null;
  lng?: number | null;
  locationName?: string | null;
  isPublic: boolean;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
}

export type NavigationTab = 'home' | 'checkin' | 'map' | 'input' | 'logs';

export type TimeRangeFilter = 'all' | 'day' | 'week' | 'month' | 'year';

export interface CategoryMeta {
  type: LogType;
  group: CategoryGroup;
  name: string;
  subtitle: string;
  iconName: string;
  themeColor: string; // Tailwind color class / hex
  bgGradient: string;
  textColor: string;
  borderHover: string;
  description: string;
  sampleNote: string;
}
