import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { VerifyAuthDto } from './dto/verify-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-code')
  requestCode(@Body() dto: CreateAuthDto) {
    return this.authService.requestCode(dto);
  }

  @Post('verify-code')
  verifyCode(@Body() dto: VerifyAuthDto) {
    return this.authService.verifyCode(dto);
  }
}
