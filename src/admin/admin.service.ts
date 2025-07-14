import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '../pedido/entities/pedido.entity';
import { Distribuidor } from '../distribuidor/entities/distribuidor.entity';
import { User } from '../auth/entities/user.entity';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
    @InjectRepository(Distribuidor)
    private readonly distribuidorRepo: Repository<Distribuidor>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly authService: AuthService,
  ) {}

  /**
   * 🔧 Login automático con cuenta por defecto para crear pedidos
   */
  async loginAsDefault(): Promise<string> {
    try {
      const defaultCredentials = {
        email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@distribuidores.com',
        password: process.env.ADMIN_DEFAULT_PASSWORD || 'admin123456',
      };
      
      console.log(`🔐 Haciendo login automático como: ${defaultCredentials.email}`);
      
      const loginResult = await this.authService.login(defaultCredentials);
      return loginResult.token;
    } catch (error) {
      console.error('❌ Error en login automático:', error);
      throw new Error('No se pudo hacer login automático. Verifica que existe el usuario admin.');
    }
  }

  /**
   * 📊 Obtener estadísticas generales del sistema
   */
  async getGeneralStats() {
    console.log('📊 Obteniendo estadísticas generales del sistema...');
    
    const totalPedidos = await this.pedidoRepo.count();
    const pedidosEntregados = await this.pedidoRepo.count({ where: { entregado: true } });
    const pedidosPendientes = await this.pedidoRepo.count({ where: { entregado: false } });
    const totalDistribuidores = await this.distribuidorRepo.count();
    const totalUsuarios = await this.userRepo.count();

    // Calcular ingresos totales
    const result = await this.pedidoRepo
      .createQueryBuilder('pedido')
      .select('SUM(pedido.total)', 'ingresoTotal')
      .where('pedido.entregado = true')
      .getRawOne();

    const ingresoTotal = parseFloat(result?.ingresoTotal || '0');

    // Estadísticas por estado
    const estadisticasEstado = await this.pedidoRepo
      .createQueryBuilder('pedido')
      .select('pedido.estado, COUNT(*) as cantidad')
      .groupBy('pedido.estado')
      .getRawMany();

    const stats = {
      totalPedidos,
      pedidosEntregados,
      pedidosPendientes,
      totalDistribuidores,
      totalUsuarios,
      ingresoTotal,
      tasaEntrega: totalPedidos > 0 ? Math.round((pedidosEntregados / totalPedidos) * 100) : 0,
      estadisticasEstado,
    };

    console.log('✅ Estadísticas obtenidas:', stats);
    return stats;
  }

  /**
   * 🚚 Obtener todos los distribuidores con información adicional
   */
  async getAllDistribuidoresWithStats() {
    console.log('🚚 Obteniendo distribuidores con estadísticas...');
    
    const distribuidores = await this.distribuidorRepo
      .createQueryBuilder('distribuidor')
      .leftJoinAndSelect('distribuidor.user', 'user')
      .leftJoinAndSelect('distribuidor.pedidos', 'pedidos')
      .getMany();

    const distribuidoresConStats = await Promise.all(
      distribuidores.map(async (dist) => {
        const pedidosAsignados = await this.pedidoRepo.count({
          where: { distribuidor: { id: dist.id } }
        });
        
        const pedidosEntregados = await this.pedidoRepo.count({
          where: { distribuidor: { id: dist.id }, entregado: true }
        });

        return {
          ...dist,
          pedidosAsignados,
          pedidosEntregados,
          tasaEntrega: pedidosAsignados > 0 ? Math.round((pedidosEntregados / pedidosAsignados) * 100) : 0,
        };
      })
    );

    console.log(`✅ ${distribuidoresConStats.length} distribuidores obtenidos con estadísticas`);
    return distribuidoresConStats;
  }

  /**
   * 📦 Obtener todos los pedidos con información completa
   */
  async getAllPedidosCompletos() {
    console.log('📦 Obteniendo todos los pedidos con información completa...');
    
    const pedidos = await this.pedidoRepo
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.distribuidor', 'distribuidor')
      .leftJoinAndSelect('pedido.pagos', 'pagos')
      .orderBy('pedido.fecha', 'DESC')
      .addOrderBy('pedido.id', 'DESC')
      .getMany();

    const pedidosCompletos = pedidos.map(pedido => ({
      ...pedido,
      distribuidorNombre: pedido.distribuidor?.nombre || 'Sin asignar',
      pagado: pedido.pagos?.some(p => p.estado === 'completado') || false,
      ultimoPago: pedido.pagos?.length > 0 ? pedido.pagos[pedido.pagos.length - 1] : null,
    }));

    console.log(`✅ ${pedidosCompletos.length} pedidos obtenidos`);
    return pedidosCompletos;
  }

  /**
   * 📝 Crear nuevo pedido y asignarlo automáticamente
   */
  async crearPedidoYAsignar(datosPedido: {
    cliente: string;
    producto: string;
    cantidad: number;
    precio_unitario: number;
    direccionEntrega: string;
    latitud: number;
    longitud: number;
    distribuidorId?: number;
  }) {
    console.log('📝 Creando nuevo pedido:', datosPedido);
    
    // Calcular total
    const total = datosPedido.cantidad * datosPedido.precio_unitario;
    
    // Crear código de pedido único
    const timestamp = Date.now().toString().slice(-6);
    const codigoPedido = `ADM-${timestamp}`;

    // Crear el pedido
    const nuevoPedido = this.pedidoRepo.create({
      ...datosPedido,
      total,
      codigoPedido,
      estado: 'pendiente',
      entregado: false,
      origen: 'admin',
    });

    // Si se especificó un distribuidor, asignarlo
    if (datosPedido.distribuidorId) {
      const distribuidor = await this.distribuidorRepo.findOne({
        where: { id: datosPedido.distribuidorId }
      });
      if (distribuidor) {
        nuevoPedido.distribuidor = distribuidor;
        console.log(`📋 Pedido asignado manualmente a: ${distribuidor.nombre}`);
      }
    } else {
      // Buscar distribuidor automáticamente
      const distribuidores = await this.distribuidorRepo
        .createQueryBuilder('distribuidor')
        .where('distribuidor.latitud IS NOT NULL')
        .andWhere('distribuidor.longitud IS NOT NULL')
        .getMany();

      if (distribuidores.length > 0) {
        // Asignar al más cercano (lógica simplificada - tomar el primero disponible)
        nuevoPedido.distribuidor = distribuidores[0];
        console.log(`📋 Pedido asignado automáticamente a: ${distribuidores[0].nombre}`);
      }
    }

    const pedidoGuardado = await this.pedidoRepo.save(nuevoPedido);
    console.log(`✅ Pedido creado exitosamente: ${codigoPedido}`);
    
    return pedidoGuardado;
  }

  /**
   * 🔧 Cambiar estado de un pedido
   */
  async cambiarEstadoPedido(pedidoId: number, nuevoEstado: string, observacion?: string) {
    console.log(`🔧 Cambiando estado del pedido ${pedidoId} a: ${nuevoEstado}`);
    
    const pedido = await this.pedidoRepo.findOne({ where: { id: pedidoId } });
    if (!pedido) {
      throw new Error(`Pedido ${pedidoId} no encontrado`);
    }

    pedido.estado = nuevoEstado;
    if (observacion) {
      pedido.observacion = observacion;
    }
    
    // Si se marca como entregado, actualizar flag
    if (nuevoEstado === 'entregado') {
      pedido.entregado = true;
    }

    const pedidoActualizado = await this.pedidoRepo.save(pedido);
    console.log(`✅ Estado actualizado para pedido ${pedidoId}`);
    
    return pedidoActualizado;
  }
}