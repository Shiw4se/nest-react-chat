import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthDto } from './dto/auth.dto';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: AuthDto) {
    return this.authService.register(body.username, body.password);
  }

  @Post('login')
  async login(@Body() body: AuthDto) {
    return this.authService.login(body.username, body.password);
  }

  @Get('me')
    @UseGuards(JwtAuthGuard) 
    getMe(@Request() req) {
  return req.user; 
}
}
