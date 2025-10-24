import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  IEmailRepository,
  PaginationOptions,
  EmailFilters,
  PaginatedResult,
} from '../../../domain/repositories/email.repository.interface';
import { Email } from '../../../domain/models/email.aggregate';
import { EmailSchema } from '../schemas/email.schema';
import { EmailMapper } from '../mappers/email.mapper';

@Injectable()
export class EmailRepository implements IEmailRepository {
  constructor(
    @InjectModel(EmailSchema.name)
    private readonly emailModel: Model<EmailSchema>,
  ) {}

  async save(email: Email): Promise<void> {
    const persistence = EmailMapper.toPersistence(email);
    await this.emailModel.findByIdAndUpdate(persistence._id, persistence, {
      upsert: true,
      new: true,
    });
  }

  async findById(id: string): Promise<Email | null> {
    const schema = await this.emailModel.findById(id);
    return schema ? EmailMapper.toDomain(schema) : null;
  }

  async findByMessageId(messageId: string): Promise<Email | null> {
    const schema = await this.emailModel.findOne({ messageId });
    return schema ? EmailMapper.toDomain(schema) : null;
  }

  async findByThreadId(threadId: string): Promise<Email[]> {
    const schemas = await this.emailModel
      .find({ threadId })
      .sort({ receivedAt: 1 });
    return schemas.map((schema) => EmailMapper.toDomain(schema));
  }

  async findWithFilters(
    filters: EmailFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Email>> {
    const query: any = {
      userId: filters.userId,
    };

    if (filters.emailAccountId) {
      query.emailAccountId = filters.emailAccountId;
    }

    if (filters.folderId) {
      query.folderId = filters.folderId;
    }

    if (filters.isRead !== undefined) {
      query.isRead = filters.isRead;
    }

    if (filters.isStarred !== undefined) {
      query.isStarred = filters.isStarred;
    }

    if (filters.isSpam !== undefined) {
      query.isSpam = filters.isSpam;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.searchQuery) {
      query.$text = { $search: filters.searchQuery };
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [schemas, total] = await Promise.all([
      this.emailModel
        .find(query)
        .sort({ receivedAt: -1, sentAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .exec(),
      this.emailModel.countDocuments(query),
    ]);

    const items = schemas.map((schema) => EmailMapper.toDomain(schema));
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
    };
  }

  async countUnread(userId: string, folderId: string): Promise<number> {
    return this.emailModel.countDocuments({
      userId,
      folderId,
      isRead: false,
    });
  }

  async delete(id: string): Promise<void> {
    await this.emailModel.findByIdAndDelete(id);
  }
}
