import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import configuration from '@app/infrastructure/config/configuration';
import { validationSchema } from '@app/infrastructure/config/validation.schema';
import { getTypeOrmConfig } from '@app/infrastructure/database/typeorm.config';
import { EventBusModule } from '@app/infrastructure/messaging/event-bus.module';

// Domain & Infrastructure
import { UserEntity, RefreshTokenEntity } from './infrastructure/persistence/entities';
import { UserRepository } from './infrastructure/persistence/repositories';
import { JwtStrategy, JwtAuthGuard } from './infrastructure/auth';

// Application Layer
import { CommandHandlers } from './application/commands';
import { QueryHandlers } from './application/queries';

// Presentation Layer
import { AuthController } from './presentation/controllers';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessTokenExpiresIn'),
        },
      }),
    }),
    CqrsModule,
    EventBusModule,
  ],
  controllers: [AuthController],
  providers: [
    // Repository
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    // JWT Strategy
    JwtStrategy,
    // Global Guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // CQRS Handlers
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class AppModule {}
