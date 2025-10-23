import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CqrsModule } from '@nestjs/cqrs';
import configuration from '@app/infrastructure/config/configuration';
import { validationSchema } from '@app/infrastructure/config/validation.schema';
import { getMongooseConfig } from '@app/infrastructure/database/mongoose.config';
import { EventBusModule } from '@app/infrastructure/messaging/event-bus.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Email Account Module imports
import { EmailAccountController } from './presentation/controllers/email-account.controller';
import { EmailAccountSchema, EmailAccountSchemaDefinition } from './infrastructure/persistence/schemas/email-account.schema';
import { EmailAccountRepository } from './infrastructure/persistence/repositories/email-account.repository';
import { CommandHandlers } from './application/commands';
import { QueryHandlers } from './application/queries';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getMongooseConfig,
    }),
    MongooseModule.forFeature([{ name: EmailAccountSchema.name, schema: EmailAccountSchemaDefinition }]),
    CqrsModule,
    EventBusModule,
  ],
  controllers: [AppController, EmailAccountController],
  providers: [
    AppService,
    // Repository
    {
      provide: 'IEmailAccountRepository',
      useClass: EmailAccountRepository,
    },
    // CQRS Handlers
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class AppModule {}
