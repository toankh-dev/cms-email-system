import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IFolderRepository } from '../../../domain/repositories/folder.repository.interface';
import { Folder } from '../../../domain/models/folder.entity';
import { FolderSchema, FolderDocument } from '../schemas/folder.schema';
import { FolderMapper } from '../mappers/folder.mapper';

@Injectable()
export class FolderRepository implements IFolderRepository {
  constructor(
    @InjectModel(FolderSchema.name)
    private readonly folderModel: Model<FolderDocument>,
  ) {}

  async save(folder: Folder): Promise<Folder> {
    const doc = FolderMapper.toPersistence(folder);

    const saved = await this.folderModel.findByIdAndUpdate(folder.id, doc, {
      upsert: true,
      new: true,
    });

    return FolderMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Folder | null> {
    const doc = await this.folderModel.findById(id).exec();
    return doc ? FolderMapper.toDomain(doc) : null;
  }

  async findByEmailAccountId(emailAccountId: string): Promise<Folder[]> {
    const docs = await this.folderModel.find({ emailAccountId }).sort({ order: 1 }).exec();
    return docs.map(doc => FolderMapper.toDomain(doc));
  }

  async findByUserId(userId: string): Promise<Folder[]> {
    const docs = await this.folderModel.find({ userId }).sort({ emailAccountId: 1, order: 1 }).exec();
    return docs.map(doc => FolderMapper.toDomain(doc));
  }

  async findSystemFolder(emailAccountId: string, systemFolderName: string): Promise<Folder | null> {
    const doc = await this.folderModel.findOne({ emailAccountId, systemFolderName, type: 'SYSTEM' }).exec();
    return doc ? FolderMapper.toDomain(doc) : null;
  }

  async findChildren(parentId: string): Promise<Folder[]> {
    const docs = await this.folderModel.find({ parentId }).sort({ order: 1 }).exec();
    return docs.map(doc => FolderMapper.toDomain(doc));
  }

  async delete(id: string): Promise<void> {
    await this.folderModel.findByIdAndDelete(id).exec();
  }

  async deleteByEmailAccountId(emailAccountId: string): Promise<void> {
    await this.folderModel.deleteMany({ emailAccountId }).exec();
  }
}
