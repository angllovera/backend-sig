import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() data: RegisterDto) {
    console.log('✅ Entró al controller');
    console.log('📥 Datos:', data);
    return this.authService.register(data);
  }

  @Post('login')
  login(@Body() data: LoginDto) {
    this.logger.log('🔐 Intento de login:');
    this.logger.log(`📧 Email: ${data.email}`);
    
    // Log de coordenadas si están presentes
    if (data.latitud && data.longitud) {
      this.logger.log(`📍 Coordenadas recibidas: ${data.latitud}, ${data.longitud}`);
    } else {
      this.logger.log('📍 Sin coordenadas en el login');
    }
    
    return this.authService.login(data);
  }

  @Get('ping')
  getPing() {
    return { status: 'ok' };
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard)
  getUserById(@Param('id') id: string) {
    return this.authService.getUserById(+id);
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard)
  updateUser(@Param('id') id: string, @Body() data: Partial<RegisterDto>) {
    return this.authService.updateUser(+id, data);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard)
  deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(+id);
  }
}