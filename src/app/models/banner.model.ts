export interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
}

export interface BannerRequest {
  Title: string;
  Subtitle?: string;
  Image?: File;
  LinkUrl?: string;
  Order: number;
  IsActive: boolean;
}

export interface PagedResponse<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
