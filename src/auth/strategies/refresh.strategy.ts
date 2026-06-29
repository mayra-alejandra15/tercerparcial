import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

type RefreshJwtPayload = {
  sub: string;
  email: string;
  sid: string;
  jti?: string;
};

function cookieExtractor(req: Request): string | null {
  const name = process.env.REFRESH_COOKIE_NAME || 'refresh_token';

  if (!req || !req.cookies) {
    return null;
  }

  return req.cookies[name] ?? null;
}

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: cookieExtractor,
      passReqToCallback: true,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }

  validate(req: Request, payload: RefreshJwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      sessionId: payload.sid,
      refreshToken: cookieExtractor(req),
    };
  }
}