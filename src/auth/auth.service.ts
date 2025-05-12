import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService, // ← Añadir esto
  ) {}

  // Este método registra un nuevo usuario
  async register(data: RegisterDto): Promise<Omit<User, 'password'>> {
    const existing = await this.userRepo.findOne({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('Este correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = this.userRepo.create({ ...data, password: hashedPassword });
    const saved = await this.userRepo.save(user);

    const { password, ...userWithoutPassword } = saved;
    return userWithoutPassword;
  }

  // Este método devuelve todos los usuarios sin la contraseña
  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepo.find();
    return users.map(({ password, ...rest }) => rest); // ocultamos contraseña
  }

  // Actualizar usuario
  async updateUser(
    id: number,
    data: Partial<User>,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return null;

    const updated = Object.assign(user, data);
    const saved = await this.userRepo.save(updated);
    const { password, ...userData } = saved;
    return userData;
  }

  // Eliminar usuario
  async deleteUser(id: number): Promise<boolean> {
    const result = await this.userRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // Obtener usuario por ID
  async getUserById(id: number): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return null;
    const { password, ...userData } = user;
    return userData;
  }

  // Método para iniciar sesión
  async login(data: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.userRepo.findOne({ where: { email: data.email } });

    if (!user) {
      throw new UnauthorizedException('Correo o contraseña inválidos');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Correo o contraseña inválidos');
    }

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    return { accessToken: token };
  }
}
