import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { RefreshSession } from '../sessions/refresh-session.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessStrategy } from './strategies/access.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';

@Module({
  imports: [UsersModule, JwtModule.register({}), TypeOrmModule.forFeature([RefreshSession])],
  providers: [AuthService, AccessStrategy, RefreshStrategy],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
