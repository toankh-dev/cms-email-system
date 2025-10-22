import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/models/user.aggregate';
import { Email } from '@app/domain/value-objects/email.vo';
import { UserEntity } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userEntityRepository: Repository<UserEntity>,
  ) {}

  async save(user: User): Promise<User> {
    const userEntity = UserMapper.toPersistence(user);
    const savedEntity = await this.userEntityRepository.save(userEntity);
    return UserMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.userEntityRepository.findOne({
      where: { id },
      relations: ['refreshTokens'],
    });

    if (!userEntity) {
      return null;
    }

    return UserMapper.toDomain(userEntity);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userEntity = await this.userEntityRepository.findOne({
      where: { email: email.getValue() },
      relations: ['refreshTokens'],
    });

    if (!userEntity) {
      return null;
    }

    return UserMapper.toDomain(userEntity);
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    const userEntity = await this.userEntityRepository.findOne({
      where: { emailVerificationToken: token },
      relations: ['refreshTokens'],
    });

    if (!userEntity) {
      return null;
    }

    return UserMapper.toDomain(userEntity);
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    const userEntity = await this.userEntityRepository.findOne({
      where: { passwordResetToken: token },
      relations: ['refreshTokens'],
    });

    if (!userEntity) {
      return null;
    }

    return UserMapper.toDomain(userEntity);
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.userEntityRepository.count({
      where: { email: email.getValue() },
    });

    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.userEntityRepository.delete(id);
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<User[]> {
    const userEntities = await this.userEntityRepository.find({
      relations: ['refreshTokens'],
      take: limit,
      skip: offset,
    });

    return userEntities.map((entity) => UserMapper.toDomain(entity));
  }

  async count(): Promise<number> {
    return this.userEntityRepository.count();
  }
}
