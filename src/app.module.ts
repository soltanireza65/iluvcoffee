import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoffeesModule } from './coffees/coffees.module';

@Module({
  imports: [CoffeesModule, TypeOrmModule.forRoot({
    type: 'postgres',
    host: '0.0.0.0',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'postgres',
    // entities: [__dirname + '/**/*.entity.ts'],
    autoLoadEntities: true,
    synchronize: true,
    // synchronize: process.env.NODE_ENV === "development",
  }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
