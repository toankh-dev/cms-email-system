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
import {
  EmailAccountSchema,
  EmailAccountSchemaDefinition,
} from './infrastructure/persistence/schemas/email-account.schema';
import { EmailAccountRepository } from './infrastructure/persistence/repositories/email-account.repository';

// Folder Module imports
import { FolderController } from './presentation/controllers/folder.controller';
import {
  FolderSchema,
  FolderSchemaDefinition,
} from './infrastructure/persistence/schemas/folder.schema';
import { FolderRepository } from './infrastructure/persistence/repositories/folder.repository';

// Email Module imports
import { EmailController } from './presentation/controllers/email.controller';
import {
  EmailSchema,
  EmailSchemaDefinition,
} from './infrastructure/persistence/schemas/email.schema';
import { EmailRepository } from './infrastructure/persistence/repositories/email.repository';

// Mail Services
import { SmtpService } from './infrastructure/mail/smtp.service';
import { ImapService } from './infrastructure/mail/imap.service';

// CQRS imports
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
    MongooseModule.forFeature([
      { name: EmailAccountSchema.name, schema: EmailAccountSchemaDefinition },
      { name: FolderSchema.name, schema: FolderSchemaDefinition },
      { name: EmailSchema.name, schema: EmailSchemaDefinition },
    ]),
    CqrsModule,
    EventBusModule,
  ],
  controllers: [AppController, EmailAccountController, FolderController, EmailController],
  providers: [
    AppService,
    // Repositories
    {
      provide: 'IEmailAccountRepository',
      useClass: EmailAccountRepository,
    },
    {
      provide: 'IFolderRepository',
      useClass: FolderRepository,
    },
    {
      provide: 'IEmailRepository',
      useClass: EmailRepository,
    },
    // Mail Services
    SmtpService,
    ImapService,
    // CQRS Handlers
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class AppModule {}
