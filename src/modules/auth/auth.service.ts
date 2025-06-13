import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAuthDto } from './dto/create-auth.dto';
import { randomInt } from 'crypto';
import { User } from '../user/entities/user.entity';
import { MailService } from 'src/common/utils/mailer.service';
import { VerifyAuthDto } from './dto/verify-auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}


  /**
   * Handles login/signup initiation by generating and emailing a one-time code (OTP).
   *
   * - If the user doesn't exist, they're created with just an email.
   * - A 6-digit OTP is generated and stored alongside an expiry timestamp.
   * - An email with the OTP is sent to the user.
   *
   * @param dto - Contains the user's email address
   * @returns Success message after sending the OTP
   */
  async requestCode(dto: CreateAuthDto): Promise<{ message: string }> {
    const email = dto.email.toLowerCase();

    let user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      user = this.userRepo.create({ email });
    }

    const otp = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 mins from now

    user.otp = otp;
    user.otpExpiresAt = expiresAt;
    await this.userRepo.save(user);

    // Send OTP via email
    await this.mailService.sendMail(email, 'OTP Delivery', {
      text: `Your OTP is ${otp}. It expires in 10 minute(s).`,
    });

    return { message: 'OTP sent to email' };
  }


  /**
   * Verifies a user's submitted OTP for authentication.
   *
   * - Checks if the user exists and if the OTP matches.
   * - Ensures the OTP has not expired.
   * - Clears the OTP and issues a signed JWT token on success.
   *
   * @param dto - Contains the user's email and OTP
   * @returns An object containing a signed JWT token
   * @throws UnauthorizedException if OTP is invalid or expired
   */
  async verifyCode(dto: VerifyAuthDto): Promise<{ accessToken: string }> {
    const email = dto.email.toLowerCase();
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user || user.otp !== dto.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('OTP expired');
    }

    user.otp = null;
    user.otpExpiresAt = null;
    await this.userRepo.save(user);

    const payload = { sub: user.id, email: user.email };
    const token = await this.jwtService.signAsync(payload);

    return { accessToken: token };
  }
}
