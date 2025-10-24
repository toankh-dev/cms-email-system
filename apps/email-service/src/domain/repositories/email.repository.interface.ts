import { Email } from '../models/email.aggregate';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface EmailFilters {
  userId: string;
  emailAccountId?: string;
  folderId?: string;
  isRead?: boolean;
  isStarred?: boolean;
  isSpam?: boolean;
  status?: string;
  searchQuery?: string; // For subject/body search
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IEmailRepository {
  save(email: Email): Promise<void>;
  findById(id: string): Promise<Email | null>;
  findByMessageId(messageId: string): Promise<Email | null>;
  findByThreadId(threadId: string): Promise<Email[]>;
  findWithFilters(
    filters: EmailFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Email>>;
  countUnread(userId: string, folderId: string): Promise<number>;
  delete(id: string): Promise<void>;
}
