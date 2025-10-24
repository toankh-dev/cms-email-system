import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class EmailRecipientSchema {
  @Prop({ required: true })
  email: string;

  @Prop()
  name?: string;
}

@Schema({ _id: false })
export class EmailAttachmentSchema {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  contentType: string;

  @Prop({ required: true })
  size: number;

  @Prop()
  path?: string;

  @Prop()
  cid?: string;
}

@Schema({ collection: 'emails', timestamps: true })
export class EmailSchema extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  emailAccountId: string;

  @Prop({ required: true, index: true })
  folderId: string;

  // Email headers
  @Prop({ index: true, sparse: true })
  messageId?: string;

  @Prop()
  inReplyTo?: string;

  @Prop({ type: [String], default: [] })
  references: string[];

  @Prop({ index: true, sparse: true })
  threadId?: string;

  // Sender and recipients
  @Prop({ type: EmailRecipientSchema, required: true })
  from: EmailRecipientSchema;

  @Prop({ type: [EmailRecipientSchema], required: true })
  to: EmailRecipientSchema[];

  @Prop({ type: [EmailRecipientSchema], default: [] })
  cc: EmailRecipientSchema[];

  @Prop({ type: [EmailRecipientSchema], default: [] })
  bcc: EmailRecipientSchema[];

  @Prop({ type: EmailRecipientSchema })
  replyTo?: EmailRecipientSchema;

  // Content
  @Prop({ required: true, index: 'text' }) // Full-text search index
  subject: string;

  @Prop({ type: String, index: 'text' }) // Full-text search index
  textBody?: string;

  @Prop({ type: String })
  htmlBody?: string;

  // Metadata
  @Prop({
    required: true,
    enum: ['DRAFT', 'SENT', 'RECEIVED', 'FAILED'],
    index: true,
  })
  status: string;

  @Prop({
    required: true,
    enum: ['LOW', 'NORMAL', 'HIGH'],
    default: 'NORMAL',
  })
  priority: string;

  @Prop({ required: true, default: false, index: true })
  isRead: boolean;

  @Prop({ required: true, default: false, index: true })
  isStarred: boolean;

  @Prop({ required: true, default: false, index: true })
  isSpam: boolean;

  // Attachments
  @Prop({ type: [EmailAttachmentSchema], default: [] })
  attachments: EmailAttachmentSchema[];

  @Prop({ required: true, default: false })
  hasAttachments: boolean;

  // Timestamps
  @Prop({ type: Date, index: true })
  sentAt?: Date;

  @Prop({ type: Date, index: true })
  receivedAt?: Date;

  @Prop({ type: Date })
  scheduledAt?: Date;
}

export const EmailSchemaDefinition = SchemaFactory.createForClass(EmailSchema);

// Compound indexes for common queries
EmailSchemaDefinition.index({ userId: 1, folderId: 1, receivedAt: -1 });
EmailSchemaDefinition.index({ userId: 1, folderId: 1, sentAt: -1 });
EmailSchemaDefinition.index({ userId: 1, isRead: 1 });
EmailSchemaDefinition.index({ userId: 1, isStarred: 1 });
EmailSchemaDefinition.index({ emailAccountId: 1, status: 1 });
EmailSchemaDefinition.index({ threadId: 1, receivedAt: 1 });

// Full-text search index
EmailSchemaDefinition.index({ subject: 'text', textBody: 'text' });
