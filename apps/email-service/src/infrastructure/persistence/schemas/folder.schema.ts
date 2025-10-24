import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FolderDocument = FolderSchema & Omit<Document, 'id'>;

@Schema({
  collection: 'folders',
  timestamps: true,
})
export class FolderSchema {
  id: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  emailAccountId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['SYSTEM', 'CUSTOM'] })
  type: string;

  @Prop({
    type: String,
    enum: ['INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM', 'ARCHIVE'],
  })
  systemFolderName?: string;

  @Prop({ type: String, index: true })
  parentId?: string;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  level: number;

  @Prop({ required: true })
  order: number;

  @Prop({ required: true, default: 0 })
  unreadCount: number;

  @Prop({ required: true, default: 0 })
  totalCount: number;

  @Prop({ type: String })
  icon?: string;

  @Prop({ type: String })
  color?: string;
}

export const FolderSchemaDefinition = SchemaFactory.createForClass(FolderSchema);

FolderSchemaDefinition.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});
// Indexes
FolderSchemaDefinition.index({ emailAccountId: 1, type: 1 });
FolderSchemaDefinition.index({ emailAccountId: 1, systemFolderName: 1 });
FolderSchemaDefinition.index({ parentId: 1 });
FolderSchemaDefinition.index({ path: 1 });
FolderSchemaDefinition.index({ emailAccountId: 1, order: 1 });
