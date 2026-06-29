import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { Response } from 'express';
import type { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';

import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { RefreshSession } from '../sessions/refresh-session.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshSession)
    private readonly sessions: Repository<RefreshSession>,
  ) { }

  async register(
    email: string,
    password: string,
    userAgent?: string,
    res?: Response,
  ) {
    const user = await this.users.create(email.toLowerCase(), password);
    return this.createTokensAndSession(user, userAgent, res);
  }

  async login(
    email: string,
    password: string,
    userAgent?: string,
    res?: Response,
  ) {
    const user = await this.users.findByEmail(email.toLowerCase());

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordOk = await argon2.verify(user.password, password);

    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.createTokensAndSession(user, userAgent, res);
  }

  private async createTokensAndSession(
    user: User,
    userAgent?: string,
    res?: Response,
  ) {
    const session = this.sessions.create({
      userId: user.id,
      userAgent: userAgent,
      expiresAt: this.addDays(7),
      revoked: false,
      hashedToken: 'pending',
    });

    const saved = await this.sessions.save(session);

    const tokens = await this.signTokens(user, saved.id);

    saved.hashedToken = await argon2.hash(tokens.refreshToken);
    await this.sessions.save(saved);

    if (res) {
      this.setRefreshCookie(res, tokens.refreshToken);
    }

    return {
      accessToken: tokens.accessToken,
      user: this.users.safeUser(user),
    };
  }
  private async signTokens(user: User, sessionId: string) {
    const accessPayload = {
      sub: user.id,
      email: user.email,
    };

    const refreshPayload = {
      sub: user.id,
      email: user.email,
      sid: sessionId,
      jti: randomUUID(),
    };

    const accessExpires =
      (this.config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m') as SignOptions['expiresIn'];

    const refreshExpires =
      (this.config.get<string>('JWT_REFRESH_EXPIRES') ?? '7d') as SignOptions['expiresIn'];

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpires,
    });

    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpires,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(
    userId: string,
    email: string,
    sessionId: string,
    refreshToken: string,
    res: Response,
  ) {
    const session = await this.sessions.findOne({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session || session.revoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const matches = await argon2.verify(session.hashedToken, refreshToken);

    if (!matches) {
      await this.sessions.update(
        { userId },
        { revoked: true },
      );

      throw new UnauthorizedException(
        'Refresh token reutilizado. Sesiones revocadas',
      );
    }

    const fakeUser = {
      id: userId,
      email,
    } as User;

    const tokens = await this.signTokens(fakeUser, sessionId);

    session.hashedToken = await argon2.hash(tokens.refreshToken);
    session.expiresAt = this.addDays(7);

    await this.sessions.save(session);

    this.setRefreshCookie(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
    };
  }

  async logout(userId: string, sessionId: string, res: Response) {
    await this.sessions.update(
      {
        id: sessionId,
        userId,
      },
      {
        revoked: true,
      },
    );

    this.clearRefreshCookie(res);

    return {
      message: 'Sesión cerrada correctamente',
    };
  }

  async listSessions(userId: string) {
    const rows = await this.sessions.find({
      where: {
        userId,
        revoked: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return rows.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
    }));
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(
      this.config.get<string>('REFRESH_COOKIE_NAME') ?? 'refresh_token',
      token,
      {
        httpOnly: true,
        secure: this.config.get<string>('NODE_ENV') === 'production',
        sameSite: 'strict',
        path: '/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    );
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(
      this.config.get<string>('REFRESH_COOKIE_NAME') ?? 'refresh_token',
      {
        path: '/auth',
      },
    );
  }

  private addDays(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}