import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetUserByIdQuery } from './get-user-by-id.query';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<UserDto> {
    const { userId } = query;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.getEmail().getValue(),
      fullName: user.getFullName(),
      role: user.getRole(),
      status: user.getStatus(),
      emailVerified: user.isEmailVerified(),
      lastLoginAt: user.getLastLoginAt(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
