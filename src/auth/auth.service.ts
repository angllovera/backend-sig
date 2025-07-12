import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Distribuidor } from '../distribuidor/entities/distribuidor.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Distribuidor)
    private readonly distribuidorRepo: Repository<Distribuidor>,

    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });

    const savedUser = await this.userRepo.save(user);

    // Crear distribuidor automáticamente vinculado al usuario
    const distribuidor = this.distribuidorRepo.create({
      nombre: dto.name,
      contacto: dto.email,
      vehiculo: 'Por definir',
      capacidad: 10, // Valor por defecto
      userId: savedUser.id, // ← Vincular con el usuario
    });

    await this.distribuidorRepo.save(distribuidor);
    console.log(`✅ Usuario y distribuidor creados para: ${dto.name}`);

    return { message: 'Usuario registrado correctamente' };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    // 🎯 ACTUALIZAR COORDENADAS DEL DISTRIBUIDOR si vienen en el login
    if (dto.latitud && dto.longitud) {
      await this.actualizarUbicacionDistribuidor(user.id, dto.latitud, dto.longitud);
    }

    const payload = { sub: user.id, email: user.email };
    const token = await this.jwtService.signAsync(payload);

    return { 
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    };
  }

  /**
   * Actualiza las coordenadas del distribuidor asociado al usuario
   */
  private async actualizarUbicacionDistribuidor(userId: number, lat: number, lng: number) {
    const distribuidor = await this.distribuidorRepo.findOne({ where: { userId } });
    
    if (distribuidor) {
      distribuidor.latitud = lat;
      distribuidor.longitud = lng;
      await this.distribuidorRepo.save(distribuidor);
      console.log(`📍 Coordenadas actualizadas para distribuidor: ${distribuidor.nombre} (${lat}, ${lng})`);
    } else {
      console.warn(`⚠️ No se encontró distribuidor para usuario ID: ${userId}`);
    }
  }

  async getAllUsers() {
    return this.userRepo.find();
  }

  async getUserById(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateUser(id: number, data: Partial<RegisterDto>) {
    const user = await this.getUserById(id);
    Object.assign(user, data);
    return this.userRepo.save(user);
  }

  async deleteUser(id: number) {
    const user = await this.getUserById(id);
    return this.userRepo.remove(user);
  }
}