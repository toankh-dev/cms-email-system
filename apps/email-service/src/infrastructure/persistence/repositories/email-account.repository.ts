import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IEmailAccountRepository } from '../../../domain/repositories/email-account.repository.interface';
import { EmailAccount } from '../../../domain/models/email-account.aggregate';
import { EmailAccountSchema, EmailAccountDocument } from '../schemas/email-account.schema';
import { EmailAccountMapper } from '../mappers/email-account.mapper';

@Injectable()
export class EmailAccountRepository implements IEmailAccountRepository {
  constructor(
    @InjectModel(EmailAccountSchema.name)
    private readonly emailAccountModel: Model<EmailAccountDocument>,
  ) {}

  async save(account: EmailAccount): Promise<EmailAccount> {
    const doc = EmailAccountMapper.toPersistence(account);

    const saved = await this.emailAccountModel.findByIdAndUpdate(account.id, doc, {
      upsert: true,
      new: true,
    });

    return EmailAccountMapper.toDomain(saved);
  }

  async findById(id: string): Promise<EmailAccount | null> {
    const doc = await this.emailAccountModel.findById(id).exec();
    return doc ? EmailAccountMapper.toDomain(doc) : null;
  }

  async findByUserId(userId: string): Promise<EmailAccount[]> {
    const docs = await this.emailAccountModel.find({ userId }).exec();
    return docs.map(doc => EmailAccountMapper.toDomain(doc));
  }

  async findByEmail(userId: string, email: string): Promise<EmailAccount | null> {
    const doc = await this.emailAccountModel.findOne({ userId, email }).exec();
    return doc ? EmailAccountMapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.emailAccountModel.findByIdAndDelete(id).exec();
  }

  async findAllActive(): Promise<EmailAccount[]> {
    const docs = await this.emailAccountModel.find({ status: 'ACTIVE' }).exec();
    return docs.map(doc => EmailAccountMapper.toDomain(doc));
  }
}
