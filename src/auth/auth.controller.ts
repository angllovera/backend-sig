import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Get, Param, Put, Delete } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Endpoint para registrar un nuevo usuario
  @Post('register')
  register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  // Endpoint para actualizar un usuario
  @Get('users')
  @UseGuards(JwtAuthGuard)
  getAllUsers() {
    return this.authService.getAllUsers();
  }

  // Obtener usuario por ID
  @Get('users/:id')
  @UseGuards(JwtAuthGuard) // Protegido por JWT
  getUserById(@Param('id') id: string) {
    return this.authService.getUserById(+id);
  }

  // Actualizar usuario
  @Put('users/:id')
  @UseGuards(JwtAuthGuard)
  updateUser(@Param('id') id: string, @Body() data: Partial<RegisterDto>) {
    return this.authService.updateUser(+id, data);
  }

  // Eliminar usuario
  @Delete('users/:id')
  @UseGuards(JwtAuthGuard)
  deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(+id);
  }

  // Endpoint para iniciar sesión
  // Este método devuelve un token JWT al usuario
  @Post('login')
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }
}
