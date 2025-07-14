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
    // 🔧 NUEVO: Logs para seguimiento
    console.log('📝 === PROCESO DE REGISTRO ===');
    console.log(`👤 Registrando usuario: ${dto.name}`);
    console.log(`📧 Email: ${dto.email}`);

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

    // Crear distribuidor automáticamente vinculado al usuario (SIN coordenadas)
    const distribuidor = this.distribuidorRepo.create({
      nombre: dto.name,
      contacto: dto.email,
      vehiculo: 'Por definir',
      capacidad: 10, // Valor por defecto
      userId: savedUser.id, // ← Vincular con el usuario
      // 🔧 NO incluir coordenadas aquí - se establecerán en el login
    });

    await this.distribuidorRepo.save(distribuidor);
    
    console.log(`✅ Usuario y distribuidor creados para: ${dto.name}`);
    console.log(`🗺️ Distribuidor creado sin coordenadas - se establecerán en el primer login`);
    console.log('📝 === FIN PROCESO DE REGISTRO ===');

    return { message: 'Usuario registrado correctamente' };
  }

  async login(dto: LoginDto) {
    // 🔧 NUEVO: Logs para seguimiento
    console.log('🔐 === PROCESO DE LOGIN ===');
    console.log(`📧 Email: ${dto.email}`);
    console.log(`📍 Coordenadas recibidas: ${dto.latitud ? 'SÍ' : 'NO'}`);
    if (dto.latitud && dto.longitud) {
      console.log(`📍 Lat: ${dto.latitud}, Lng: ${dto.longitud}`);
    }

    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    // ACTUALIZAR COORDENADAS DEL DISTRIBUIDOR si vienen en el login
    if (dto.latitud && dto.longitud) {
      console.log(`🔄 Actualizando coordenadas del distribuidor...`);
      await this.actualizarUbicacionDistribuidor(user.id, dto.latitud, dto.longitud);
    } else {
      console.log(`⚠️ Login sin coordenadas - no se actualizará ubicación`);
    }

    // 🔧 NUEVO: Obtener información del distribuidor para incluir en la respuesta
    const distribuidor = await this.distribuidorRepo.findOne({ where: { userId: user.id } });

    const payload = { sub: user.id, email: user.email };
    const token = await this.jwtService.signAsync(payload);

    console.log('✅ Login exitoso');
    console.log('🔐 === FIN PROCESO DE LOGIN ===');

    return { 
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        // 🔧 NUEVO: Incluir información del distribuidor
        distribuidor: distribuidor ? {
          id: distribuidor.id,
          nombre: distribuidor.nombre,
          latitud: distribuidor.latitud,
          longitud: distribuidor.longitud,
          vehiculo: distribuidor.vehiculo,
          capacidad: distribuidor.capacidad,
        } : null
      }
    };
  }

  /**
   * 🔧 MEJORADO: Actualiza las coordenadas del distribuidor con mejor validación y logs
   */
  private async actualizarUbicacionDistribuidor(userId: number, lat: number, lng: number) {
    console.log(`📍 === ACTUALIZANDO COORDENADAS ===`);
    console.log(`👤 Usuario ID: ${userId}`);
    console.log(`🗺️ Nuevas coordenadas: (${lat}, ${lng})`);

    const distribuidor = await this.distribuidorRepo.findOne({ where: { userId } });
    
    if (distribuidor) {
      console.log(`📋 Distribuidor encontrado: ${distribuidor.nombre}`);
      console.log(`📍 Coordenadas anteriores: (${distribuidor.latitud || 'null'}, ${distribuidor.longitud || 'null'})`);

      distribuidor.latitud = lat;
      distribuidor.longitud = lng;
      
      const updatedDistribuidor = await this.distribuidorRepo.save(distribuidor);
      
      console.log(`✅ Coordenadas actualizadas exitosamente para: ${distribuidor.nombre}`);
      console.log(`📍 Nuevas coordenadas guardadas: (${updatedDistribuidor.latitud}, ${updatedDistribuidor.longitud})`);
      console.log(`📍 === FIN ACTUALIZACIÓN COORDENADAS ===`);
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