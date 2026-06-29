import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AccessGuard } from './guards/access.guard';
import { RefreshGuard } from './guards/refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.register(dto.email, dto.password, req.headers['user-agent'], res);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.login(dto.email, dto.password, req.headers['user-agent'], res);
  }

  @UseGuards(AccessGuard)
  @Get('me')
  me(@Req() req: any) { return req.user; }

  @UseGuards(RefreshGuard)
  @Post('refresh')
  refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    return this.auth.refresh(req.user.id, req.user.email, req.user.sessionId, req.user.refreshToken, res);
  }

  @UseGuards(RefreshGuard)
  @Post('logout')
  logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    return this.auth.logout(req.user.id, req.user.sessionId, res);
  }

  @UseGuards(AccessGuard)
  @Get('sessions')
  sessions(@Req() req: any) { return this.auth.listSessions(req.user.id); }
}
