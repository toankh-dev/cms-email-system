import { Folder, FolderType, SystemFolderName } from '../../../domain/models/folder.entity';
import { FolderDocument } from '../schemas/folder.schema';

/**
 * Mapper between Folder domain entity and MongoDB document
 */
export class FolderMapper {
  /**
   * Convert domain entity to persistence document
   */
  static toPersistence(folder: Folder): Partial<FolderDocument> {
    return {
      _id: folder.id as any,
      userId: folder.getUserId(),
      emailAccountId: folder.getEmailAccountId(),
      name: folder.getName(),
      type: folder.getType(),
      systemFolderName: folder.getSystemFolderName(),
      parentId: folder.getParentId(),
      path: folder.getPath(),
      level: folder.getLevel(),
      order: folder.getOrder(),
      unreadCount: folder.getUnreadCount(),
      totalCount: folder.getTotalCount(),
      icon: folder.getIcon(),
      color: folder.getColor(),
    };
  }

  /**
   * Convert persistence document to domain entity
   */
  static toDomain(doc: FolderDocument): Folder {
    return Folder.reconstitute(doc.id, {
      userId: doc.userId,
      emailAccountId: doc.emailAccountId,
      name: doc.name,
      type: doc.type as FolderType,
      systemFolderName: doc.systemFolderName as SystemFolderName | undefined,
      parentId: doc.parentId,
      path: doc.path,
      level: doc.level,
      order: doc.order,
      unreadCount: doc.unreadCount,
      totalCount: doc.totalCount,
      icon: doc.icon,
      color: doc.color,
    });
  }
}
