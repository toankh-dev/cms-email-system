import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from '@app/infrastructure/config/configuration';
import { validationSchema } from '@app/infrastructure/config/validation.schema';
import { getTypeOrmConfig } from '@app/infrastructure/database/typeorm.config';
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
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    EventBusModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
