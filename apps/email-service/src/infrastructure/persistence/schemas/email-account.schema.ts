import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailAccountDocument = EmailAccountSchema & Document;

@Schema({
  collection: 'email_accounts',
  timestamps: true,
})
export class EmailAccountSchema {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({
    type: {
      username: { type: String, required: true },
      password: { type: String, required: true },
    },
    required: true,
  })
  credentials: {
    username: string;
    password: string;
  };

  @Prop({
    type: {
      host: { type: String, required: true },
      port: { type: Number, required: true },
      secure: { type: Boolean, required: true },
    },
    required: true,
  })
  smtpConfig: {
    host: string;
    port: number;
    secure: boolean;
  };

  @Prop({
    type: {
      host: { type: String, required: true },
      port: { type: Number, required: true },
      tls: { type: Boolean, required: true },
    },
    required: true,
  })
  imapConfig: {
    host: string;
    port: number;
    tls: boolean;
  };

  @Prop({
    required: true,
    enum: ['ACTIVE', 'INACTIVE', 'ERROR'],
    default: 'INACTIVE',
  })
  status: string;

  @Prop({ type: Date })
  lastSyncAt?: Date;

  @Prop({ type: String })
  errorMessage?: string;
}

export const EmailAccountSchemaDefinition =
  SchemaFactory.createForClass(EmailAccountSchema);

// Create compound index for userId + email (unique)
EmailAccountSchemaDefinition.index({ userId: 1, email: 1 }, { unique: true });

// Index for finding active accounts
EmailAccountSchemaDefinition.index({ status: 1 });
