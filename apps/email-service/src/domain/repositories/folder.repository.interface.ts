import { Folder } from '../models/folder.entity';

/**
 * Repository interface for Folder entity
 */
export interface IFolderRepository {
  /**
   * Save folder (create or update)
   */
  save(folder: Folder): Promise<Folder>;

  /**
   * Find folder by ID
   */
  findById(id: string): Promise<Folder | null>;

  /**
   * Find all folders for an email account
   */
  findByEmailAccountId(emailAccountId: string): Promise<Folder[]>;

  /**
   * Find all folders for a user
   */
  findByUserId(userId: string): Promise<Folder[]>;

  /**
   * Find system folder by name
   */
  findSystemFolder(emailAccountId: string, systemFolderName: string): Promise<Folder | null>;

  /**
   * Find child folders
   */
  findChildren(parentId: string): Promise<Folder[]>;

  /**
   * Delete folder
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all folders for an email account
   */
  deleteByEmailAccountId(emailAccountId: string): Promise<void>;
}
