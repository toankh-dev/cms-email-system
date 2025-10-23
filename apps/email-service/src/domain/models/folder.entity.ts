import { Entity } from '@app/domain/base/entity.base';

export enum FolderType {
  SYSTEM = 'SYSTEM',
  CUSTOM = 'CUSTOM',
}

export enum SystemFolderName {
  INBOX = 'INBOX',
  SENT = 'SENT',
  DRAFTS = 'DRAFTS',
  TRASH = 'TRASH',
  SPAM = 'SPAM',
  ARCHIVE = 'ARCHIVE',
}

export interface FolderProps {
  userId: string;
  emailAccountId: string;
  name: string;
  type: FolderType;
  systemFolderName?: SystemFolderName;
  parentId?: string;
  path: string; // For hierarchy: "/" for root, "/parent/child" for nested
  level: number; // 0 for root, 1 for first level, etc.
  order: number; // Display order
  unreadCount: number;
  totalCount: number;
  icon?: string;
  color?: string;
}

/**
 * Folder Entity
 * Represents email folders with hierarchy support
 */
export class Folder extends Entity<string> {
  private userId: string;
  private emailAccountId: string;
  private name: string;
  private type: FolderType;
  private systemFolderName?: SystemFolderName;
  private parentId?: string;
  private path: string;
  private level: number;
  private order: number;
  private unreadCount: number;
  private totalCount: number;
  private icon?: string;
  private color?: string;

  private constructor(id: string, props: FolderProps) {
    super(id);
    this.userId = props.userId;
    this.emailAccountId = props.emailAccountId;
    this.name = props.name;
    this.type = props.type;
    this.systemFolderName = props.systemFolderName;
    this.parentId = props.parentId;
    this.path = props.path;
    this.level = props.level;
    this.order = props.order;
    this.unreadCount = props.unreadCount;
    this.totalCount = props.totalCount;
    this.icon = props.icon;
    this.color = props.color;
  }

  /**
   * Factory method to create a system folder
   */
  static createSystemFolder(id: string, userId: string, emailAccountId: string, systemFolderName: SystemFolderName, order: number): Folder {
    const props: FolderProps = {
      userId,
      emailAccountId,
      name: systemFolderName,
      type: FolderType.SYSTEM,
      systemFolderName,
      path: `/${systemFolderName}`,
      level: 0,
      order,
      unreadCount: 0,
      totalCount: 0,
    };

    return new Folder(id, props);
  }

  /**
   * Factory method to create a custom folder
   */
  static createCustomFolder(
    id: string,
    userId: string,
    emailAccountId: string,
    name: string,
    parentId: string | undefined,
    parentPath: string,
    parentLevel: number,
    order: number,
    icon?: string,
    color?: string,
  ): Folder {
    const level = parentId ? parentLevel + 1 : 0;
    const path = parentId ? `${parentPath}/${name}` : `/${name}`;

    const props: FolderProps = {
      userId,
      emailAccountId,
      name,
      type: FolderType.CUSTOM,
      parentId,
      path,
      level,
      order,
      unreadCount: 0,
      totalCount: 0,
      icon,
      color,
    };

    return new Folder(id, props);
  }

  /**
   * Factory method to reconstitute from persistence
   */
  static reconstitute(id: string, props: FolderProps): Folder {
    return new Folder(id, props);
  }

  /**
   * Update folder name and path
   */
  rename(newName: string): void {
    if (this.type === FolderType.SYSTEM) {
      throw new Error('Cannot rename system folders');
    }

    this.name = newName;

    // Update path
    const pathParts = this.path.split('/');
    pathParts[pathParts.length - 1] = newName;
    this.path = pathParts.join('/');

    this.touch();
  }

  /**
   * Move folder to new parent
   */
  moveTo(newParentId: string | undefined, newParentPath: string, newParentLevel: number): void {
    if (this.type === FolderType.SYSTEM) {
      throw new Error('Cannot move system folders');
    }

    this.parentId = newParentId;
    this.level = newParentId ? newParentLevel + 1 : 0;
    this.path = newParentId ? `${newParentPath}/${this.name}` : `/${this.name}`;

    this.touch();
  }

  /**
   * Update display order
   */
  updateOrder(newOrder: number): void {
    this.order = newOrder;
    this.touch();
  }

  /**
   * Increment unread count
   */
  incrementUnread(): void {
    this.unreadCount++;
    this.touch();
  }

  /**
   * Decrement unread count
   */
  decrementUnread(): void {
    if (this.unreadCount > 0) {
      this.unreadCount--;
      this.touch();
    }
  }

  /**
   * Increment total count
   */
  incrementTotal(): void {
    this.totalCount++;
    this.touch();
  }

  /**
   * Decrement total count
   */
  decrementTotal(): void {
    if (this.totalCount > 0) {
      this.totalCount--;
      this.touch();
    }
  }

  /**
   * Update folder appearance
   */
  updateAppearance(icon?: string, color?: string): void {
    if (this.type === FolderType.SYSTEM) {
      throw new Error('Cannot update appearance of system folders');
    }

    this.icon = icon;
    this.color = color;
    this.touch();
  }

  // Getters
  getUserId(): string {
    return this.userId;
  }

  getEmailAccountId(): string {
    return this.emailAccountId;
  }

  getName(): string {
    return this.name;
  }

  getType(): FolderType {
    return this.type;
  }

  getSystemFolderName(): SystemFolderName | undefined {
    return this.systemFolderName;
  }

  getParentId(): string | undefined {
    return this.parentId;
  }

  getPath(): string {
    return this.path;
  }

  getLevel(): number {
    return this.level;
  }

  getOrder(): number {
    return this.order;
  }

  getUnreadCount(): number {
    return this.unreadCount;
  }

  getTotalCount(): number {
    return this.totalCount;
  }

  getIcon(): string | undefined {
    return this.icon;
  }

  getColor(): string | undefined {
    return this.color;
  }

  isSystemFolder(): boolean {
    return this.type === FolderType.SYSTEM;
  }

  isCustomFolder(): boolean {
    return this.type === FolderType.CUSTOM;
  }
}
