import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/**
 * AuthController — stub for Step 01.
 * POST /auth/login and POST /auth/refresh endpoints in Step 02.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {}
