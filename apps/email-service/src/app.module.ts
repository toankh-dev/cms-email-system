import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from '@app/infrastructure/config/configuration';
import { validationSchema } from '@app/infrastructure/config/validation.schema';
import { getMongooseConfig } from '@app/infrastructure/database/mongoose.config';
import { EventBusModule } from '@app/infrastructure/messaging/event-bus.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
    EventBusModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
