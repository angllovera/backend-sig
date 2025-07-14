import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Pedido } from './entities/pedido.entity';
import { Repository, Not, IsNull } from 'typeorm';
import { Distribuidor } from '../distribuidor/entities/distribuidor.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

@Injectable()
export class PedidoService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
    @InjectRepository(Distribuidor)
    private readonly distRepo: Repository<Distribuidor>,
  ) {}

  /**
   * Calcula la distancia entre dos puntos usando la fórmula de Haversine
   */
  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Asigna el distribuidor más cercano al pedido
   */
  async asignarDistribuidorOptimo(lat: number, lng: number): Promise<Distribuidor | null> {
    console.log(`🔍 Buscando distribuidor óptimo para coordenadas: ${lat}, ${lng}`);
    
    const distribuidores = await this.distRepo
      .createQueryBuilder('distribuidor')
      .where('distribuidor.latitud IS NOT NULL')
      .andWhere('distribuidor.longitud IS NOT NULL')
      .getMany();
    
    console.log(`📋 Distribuidores disponibles con coordenadas: ${distribuidores.length}`);
    
    if (distribuidores.length === 0) {
      console.warn('❌ No hay distribuidores disponibles con coordenadas');
      return null;
    }

    let mejorDistribuidor: Distribuidor | null = null;
    let menorDistancia = Infinity;

    for (const dist of distribuidores) {
      if (dist.latitud != null && dist.longitud != null) {
        const distancia = this.calcularDistancia(lat, lng, dist.latitud, dist.longitud);
        console.log(`📏 Distancia a ${dist.nombre}: ${distancia.toFixed(2)}km`);
        
        if (distancia < menorDistancia) {
          menorDistancia = distancia;
          mejorDistribuidor = dist;
        }
      }
    }

    if (mejorDistribuidor) {
      console.log(`✅ Distribuidor óptimo: ${mejorDistribuidor.nombre} (${menorDistancia.toFixed(2)}km)`);
    } else {
      console.warn('❌ No se pudo encontrar distribuidor óptimo');
    }
    
    return mejorDistribuidor;
  }

  /**
   * CRON JOB: Asigna pedidos sin distribuidor cada 5 minutos
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async asignarPedidosPendientesAutomatico() {
    console.log('🔄 [CRON] Ejecutando asignación automática cada 5 minutos...');
    
    const pedidosSinAsignar = await this.pedidoRepo
      .createQueryBuilder('pedido')
      .where('pedido.distribuidorId IS NULL')
      .andWhere('pedido.entregado = false')
      .andWhere('pedido.origen = :origen', { origen: 'simulado' })
      .getMany();

    console.log(`📋 [CRON] Pedidos sin asignar: ${pedidosSinAsignar.length}`);

    if (pedidosSinAsignar.length === 0) {
      console.log('✅ [CRON] No hay pedidos pendientes de asignar');
      return;
    }

    let asignados = 0;
    for (const pedido of pedidosSinAsignar) {
      if (pedido.latitud && pedido.longitud) {
        const distribuidor = await this.asignarDistribuidorOptimo(
          pedido.latitud, 
          pedido.longitud
        );
        
        if (distribuidor) {
          pedido.distribuidor = distribuidor;
          await this.pedidoRepo.save(pedido);
          console.log(`✅ [CRON] Pedido ${pedido.id} asignado a ${distribuidor.nombre}`);
          asignados++;
        }
      } else {
        console.warn(`⚠️ [CRON] Pedido ${pedido.id} sin coordenadas`);
      }
    }

    console.log(`🎯 [CRON] Asignación completada: ${asignados}/${pedidosSinAsignar.length} pedidos asignados`);
  }

  /**
   * Método manual para asignar pedidos pendientes
   */
  async asignarPedidosPendientesManual(): Promise<{ mensaje: string; asignados: number; total: number }> {
    console.log('🔄 [MANUAL] Ejecutando asignación manual...');
    
    const pedidosSinAsignar = await this.pedidoRepo
      .createQueryBuilder('pedido')
      .where('pedido.distribuidorId IS NULL')
      .andWhere('pedido.entregado = false')
      .getMany();

    console.log(`📋 [MANUAL] Pedidos sin asignar: ${pedidosSinAsignar.length}`);

    let asignados = 0;
    for (const pedido of pedidosSinAsignar) {
      if (pedido.latitud && pedido.longitud) {
        const distribuidor = await this.asignarDistribuidorOptimo(
          pedido.latitud, 
          pedido.longitud
        );
        
        if (distribuidor) {
          pedido.distribuidor = distribuidor;
          await this.pedidoRepo.save(pedido);
          console.log(`✅ [MANUAL] Pedido ${pedido.id} asignado a ${distribuidor.nombre}`);
          asignados++;
        }
      }
    }

    return {
      mensaje: `Asignación completada: ${asignados}/${pedidosSinAsignar.length} pedidos asignados`,
      asignados,
      total: pedidosSinAsignar.length
    };
  }

  // =============== MÉTODOS BÁSICOS ===============

  async getAll(): Promise<Pedido[]> {
    return this.pedidoRepo.find({ where: { origen: 'simulado' } });
  }

  async getById(id: number): Promise<Pedido> {
    const pedido = await this.pedidoRepo.findOne({ where: { id } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    return pedido;
  }

  // =============== 🔧 NUEVOS MÉTODOS PARA POLLING ===============

  /**
   * 🔧 NUEVO: Contar pedidos pendientes (método ligero para polling)
   */
  async contarPedidosPendientes(distribuidorId: number): Promise<number> {
    console.log(`🔢 Contando pedidos pendientes para distribuidor ${distribuidorId}`);
    
    const count = await this.pedidoRepo.count({
      where: {
        distribuidor: { userId: distribuidorId },
        entregado: false,
      },
    });
    
    console.log(`📊 Pedidos pendientes: ${count}`);
    return count;
  }

  /**
   * 🔧 NUEVO: Obtener última entrega del distribuidor
   */
  async getUltimaEntrega(distribuidorId: number): Promise<Pedido | null> {
    console.log(`📍 Obteniendo última entrega para distribuidor ${distribuidorId}`);
    
    const ultimaEntrega = await this.pedidoRepo.findOne({
      where: {
        distribuidor: { userId: distribuidorId },
        entregado: true,
        latitud: Not(IsNull()),
        longitud: Not(IsNull()),
      },
      order: {
        fecha: 'DESC',
        id: 'DESC',
      },
    });

    if (ultimaEntrega) {
      console.log(`✅ Última entrega encontrada: Pedido ${ultimaEntrega.id} en ${ultimaEntrega.latitud}, ${ultimaEntrega.longitud}`);
    } else {
      console.log(`ℹ️ No se encontró última entrega para distribuidor ${distribuidorId}`);
    }

    return ultimaEntrega;
  }

  /**
   * 🔧 MEJORADO: Obtener última ubicación de entrega como coordenadas
   */
  async obtenerUltimaUbicacionEntrega(distribuidorId: number): Promise<{ lat: number; lng: number } | null> {
    console.log(`📍 Buscando última ubicación de entrega para distribuidor ${distribuidorId}`);
    
    const ultimaEntrega = await this.getUltimaEntrega(distribuidorId);

    if (ultimaEntrega && ultimaEntrega.latitud && ultimaEntrega.longitud) {
      console.log(`✅ Última entrega encontrada en: ${ultimaEntrega.latitud}, ${ultimaEntrega.longitud}`);
      return {
        lat: ultimaEntrega.latitud,
        lng: ultimaEntrega.longitud
      };
    }

    console.log(`ℹ️ No se encontró última entrega, usar ubicación del distribuidor`);
    return null;
  }

  // =============== CÁLCULO DE RUTAS ===============

// 🔧 CORREGIDO: calcularRuta - Envía coordenadas como números
async calcularRuta(distribuidorId: number, lat: number, lng: number) {
  console.log(`🗺️ Calculando rutas para distribuidor ${distribuidorId}`);

  // 🔧 NUEVO: Intentar usar última ubicación de entrega como punto de inicio
  const puntoInicio = { lat, lng }; 
  
  console.log(`📍 Usando ubicación GPS actual como inicio: ${puntoInicio.lat}, ${puntoInicio.lng}`);


  // Obtener solo pedidos NO entregados
  const pedidos = await this.pedidoRepo.find({
    where: {
      distribuidor: { userId: distribuidorId },
      entregado: false, // 🔧 IMPORTANTE: Solo pedidos pendientes
    },
    relations: ['distribuidor', 'pagos'],
    take: 23,
  });

  console.log(`📋 Pedidos pendientes encontrados: ${pedidos.length}`);

  if (pedidos.length === 0) {
    console.log(`ℹ️ No hay pedidos pendientes para este distribuidor`);
    return {
      mensaje: 'No hay pedidos pendientes asignados a este distribuidor',
      pedidos: [],
      ruta: null,
      origen: puntoInicio, // ✅ Ya son números
    };
  }

  const destinos = pedidos
    .filter(p => p.latitud != null && p.longitud != null)
    .map(p => ({
      id: p.id,
      coordenadas: `${p.latitud},${p.longitud}`,
      direccion: p.direccionEntrega,
      cliente: p.cliente,
      producto: p.producto,
      codigoPedido: p.codigoPedido,
      total: p.total,
      // 🔧 NUEVO: Verificar estado de pago
      pagado: p.pagos?.some(pago => pago.estado === 'completado') ?? false,
      latitud: p.latitud,
      longitud: p.longitud,
    }));

  console.log(`📍 Destinos válidos con coordenadas: ${destinos.length}`);

  if (destinos.length === 0) {
    return {
      mensaje: 'No hay pedidos pendientes con coordenadas válidas',
      pedidos: [],
      ruta: null,
      origen: puntoInicio, // ✅ Ya son números
    };
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('Google Maps API Key no configurada');

  try {
    const waypoints = destinos.map(d => d.coordenadas).join('|');
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${puntoInicio.lat},${puntoInicio.lng}`,
        destination: destinos[destinos.length - 1].coordenadas,
        waypoints: `optimize:true|${waypoints}`,
        mode: 'driving',
        alternatives: true, // Rutas alternativas
        language: 'es',
        region: 'bo',
        key: apiKey,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API Error: ${response.data.status}`);
    }

    const rutas = response.data.routes.map((route, idx) => {
      const legs = route.legs || [];
      const distancia = legs.reduce((acc, leg) => acc + (leg.distance?.value || 0), 0);
      const duracion = legs.reduce((acc, leg) => acc + (leg.duration?.value || 0), 0);

      return {
        polyline: route.overview_polyline?.points || null,
        distanciaKm: Math.round(distancia / 1000 * 100) / 100,
        duracionMin: Math.round(duracion / 60),
        esPrincipal: idx === 0
      };
    });

    const waypointOrder = response.data.routes[0]?.waypoint_order || [];
    const pedidosOrdenados = waypointOrder.map((index, orden) => {
      const destino = destinos[index];
      return {
        id: destino.id,
        direccion: destino.direccion,
        coordenadas: destino.coordenadas,
        cliente: destino.cliente,
        producto: destino.producto,
        codigoPedido: destino.codigoPedido,
        orden: orden + 1,
        total: destino.total,
        // 🔧 NUEVO: Incluir datos adicionales para el frontend
        pagado: destino.pagado,
        latitud: destino.latitud,
        longitud: destino.longitud,
      };
    });

    console.log(`✅ Ruta calculada exitosamente: ${rutas.length} alternativas, ${pedidosOrdenados.length} paradas`);

    return {
      origen: puntoInicio, // ✅ { lat: number, lng: number }
      destino: puntoInicio, // ✅ El distribuidor regresa al punto de inicio
      pedidos: pedidosOrdenados,
      ruta: {
        rutas: rutas,
        distanciaTotal: rutas[0]?.distanciaKm || 0,
        tiempoTotal: rutas[0]?.duracionMin || 0,
      },
      optimizacion: {
        ordenOriginal: destinos.map((_, index) => index),
        ordenOptimizado: waypointOrder,
        ahorro: waypointOrder.length > 0 ? 'Ruta optimizada automáticamente' : 'Sin optimización aplicada',
        puntoInicio: 'Ubicación GPS actual',      }
    };
  } catch (error) {
    console.error('❌ Error al calcular ruta:', error);
    throw new Error(`Error al calcular ruta: ${error.message}`);
  }
}

// 🔧 CORREGIDO: calcularRutaPersonalizada - Envía coordenadas como números
async calcularRutaPersonalizada(distribuidorId: number, lat: number, lng: number, pedidoIds: number[]) {
  console.log(`🗺️ Calculando ruta personalizada para distribuidor ${distribuidorId}`);
  console.log(`📥 Pedidos seleccionados: ${pedidoIds.join(', ')}`);

  // 🔧 NUEVO: Usar última ubicación de entrega como punto de inicio
  const puntoInicio = { lat, lng };
  
  console.log(`📍 Punto de inicio: ${puntoInicio.lat}, ${puntoInicio.lng}`);

  // Obtener solo los pedidos seleccionados que NO estén entregados
  const pedidos = await this.pedidoRepo
    .createQueryBuilder('pedido')
    .leftJoinAndSelect('pedido.pagos', 'pagos')
    .where('pedido.id IN (:...ids)', { ids: pedidoIds })
    .andWhere('pedido.entregado = false') // 🔧 Solo pedidos pendientes
    .getMany();

  console.log(`📋 Pedidos válidos encontrados: ${pedidos.length}/${pedidoIds.length}`);

  const destinos = pedidos
    .filter(p => p.latitud !== null && p.longitud !== null)
    .map(p => ({
      id: p.id,
      coordenadas: `${p.latitud},${p.longitud}`,
      direccion: p.direccionEntrega,
      cliente: p.cliente,
      producto: p.producto,
      codigoPedido: p.codigoPedido,
      total: p.total,
      pagado: p.pagos?.some(pago => pago.estado === 'completado') ?? false,
      latitud: p.latitud,
      longitud: p.longitud,
    }));

  if (destinos.length === 0) {
    return {
      mensaje: 'No hay coordenadas válidas en los pedidos seleccionados o todos están entregados',
      pedidos: [],
      ruta: null,
      origen: puntoInicio, // ✅ Ya son números
    };
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('Google Maps API Key no configurada');

  try {
    const waypoints = destinos.map(d => d.coordenadas).join('|');

    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${puntoInicio.lat},${puntoInicio.lng}`,
        destination: destinos[destinos.length - 1].coordenadas,
        waypoints: `optimize:true|${waypoints}`,
        mode: 'driving',
        alternatives: true,
        language: 'es',
        region: 'bo',
        key: apiKey,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API Error: ${response.data.status}`);
    }

    const rutas = response.data.routes.map((route, idx) => {
      const legs = route.legs || [];
      const distancia = legs.reduce((acc, leg) => acc + (leg.distance?.value || 0), 0);
      const duracion = legs.reduce((acc, leg) => acc + (leg.duration?.value || 0), 0);

      return {
        polyline: route.overview_polyline?.points || null,
        distanciaKm: Math.round(distancia / 1000 * 100) / 100,
        duracionMin: Math.round(duracion / 60),
        esPrincipal: idx === 0
      };
    });

    const waypointOrder = response.data.routes[0]?.waypoint_order || [];
    const pedidosOrdenados = waypointOrder.map((index, orden) => {
      const destino = destinos[index];
      return {
        ...destino,
        orden: orden + 1,
      };
    });

    console.log(`✅ Ruta personalizada calculada: ${rutas.length} alternativas`);

    return {
      origen: puntoInicio, // ✅ { lat: number, lng: number }
      pedidos: pedidosOrdenados,
      ruta: {
        rutas: rutas,
        distanciaTotal: rutas[0]?.distanciaKm || 0,
        tiempoTotal: rutas[0]?.duracionMin || 0,
      },
      optimizacion: {
      puntoInicio: 'Ubicación GPS actual',        pedidosSeleccionados: pedidoIds.length,
        pedidosValidos: destinos.length,
      }
    };
  } catch (error) {
    console.error('❌ Error al calcular ruta personalizada:', error);
    throw new Error(`Error al calcular ruta personalizada: ${error.message}`);
  }
}


  /**
   * Obtener pedidos por distribuidor (método mejorado)
   */
  async getPedidosPorDistribuidor(distribuidorId: number): Promise<any[]> {
    console.log(`📦 Obteniendo pedidos para distribuidor ${distribuidorId}`);
    
    const pedidos = await this.pedidoRepo.find({
      where: { 
        distribuidor: { userId: distribuidorId }, 
        entregado: false 
      },
      relations: ['distribuidor'],
      order: { fecha: 'ASC' }
    });

    console.log(`📋 Pedidos encontrados: ${pedidos.length}`);

    return pedidos.map(pedido => ({
      id: pedido.id,
      codigoPedido: pedido.codigoPedido,
      cliente: pedido.cliente,
      producto: pedido.producto,
      cantidad: pedido.cantidad,
      total: pedido.total,
      estado: pedido.estado,
      fecha: pedido.fecha,
      direccionEntrega: pedido.direccionEntrega,
      latitud: pedido.latitud,
      longitud: pedido.longitud,
      observacion: pedido.observacion,
      entregado: pedido.entregado,
      distribuidor: {
        id: pedido.distribuidor.id,
        nombre: pedido.distribuidor.nombre
      }
    }));
  }

  async registrarEntrega(id: number, datos: {
    estado: string;
    observacion?: string;
    latitud: number;
    longitud: number;
  }): Promise<Pedido> {
    const pedido = await this.pedidoRepo.findOne({ where: { id } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    console.log(`📦 Registrando entrega del pedido ${id} en: ${datos.latitud}, ${datos.longitud}`);

    pedido.estado = datos.estado;
    pedido.observacion = datos.observacion || '';
    pedido.entregado = datos.estado === 'entregado';
    
    // 🔧 IMPORTANTE: Actualizar coordenadas de entrega
    pedido.latitud = datos.latitud;
    pedido.longitud = datos.longitud;

    const pedidoGuardado = await this.pedidoRepo.save(pedido);
    
    console.log(`✅ Entrega registrada - Próximas rutas usarán esta ubicación como punto de inicio`);
    
    return pedidoGuardado;
  }


  // 🔧 FUNCIÓN SIMPLE: Agregar observación y marcar como entregado
  async agregarObservacion(id: number, datos: {
    observacion: string;
    latitud: number;
    longitud: number;
    estado?: string; // 🔧 NUEVO: parámetro opcional
  }): Promise<Pedido> {
    const pedido = await this.pedidoRepo.findOne({ where: { id } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    console.log(`📝 Agregando observación al pedido ${id}: ${datos.observacion}`);
    console.log(`📊 Estado solicitado: ${datos.estado || 'por defecto (entregado)'}`);

    // 🔧 NUEVO: Usar estado personalizado o 'entregado' por defecto
    pedido.estado = datos.estado || 'entregado';
    pedido.entregado = true; // Siempre sacar de la lista activa
    pedido.observacion = datos.observacion;
    
    // Actualizar coordenadas donde se realizó la acción
    pedido.latitud = datos.latitud;
    pedido.longitud = datos.longitud;

    const pedidoGuardado = await this.pedidoRepo.save(pedido);
    
    console.log(`✅ Observación agregada con estado: "${pedido.estado}"`);
    
    return pedidoGuardado;
  }

  /**
   * Método original (asignación circular) - mantener por compatibilidad
   */
  async asignarPedidos(): Promise<Pedido[]> {
    const pedidos = await this.pedidoRepo
      .createQueryBuilder('pedido')
      .where('pedido.distribuidorId IS NULL')
      .andWhere('pedido.entregado = false')
      .getMany();

    const distribuidores = await this.distRepo.find();

    for (let i = 0; i < pedidos.length; i++) {
      const dist = distribuidores[i % distribuidores.length];
      pedidos[i].distribuidor = dist;
      await this.pedidoRepo.save(pedidos[i]);
    }

    return pedidos;
  }

  async getEstadoPedido(id: number): Promise<{ estado: string; pagado: boolean }> {
    const pedido = await this.pedidoRepo.findOne({
      where: { id },
      relations: ['pagos'],
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido con id ${id} no encontrado`);
    }

    const pagado = pedido.pagos?.length > 0;
    return {
      estado: pedido.estado,
      pagado,
    };
  }

  async getDetalleConPagos(id: number) {
    const pedido = await this.pedidoRepo.findOne({
      where: { id },
      relations: ['pagos'],
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido con id ${id} no encontrado`);
    }

    return pedido;
  }

  // =============== ESTADÍSTICAS ===============

  /**
   * Obtener estadísticas del distribuidor
   */
  async getEstadisticasDistribuidor(distribuidorId: number) {
    console.log(`📊 Obteniendo estadísticas para distribuidor ${distribuidorId}`);
    
    const totalPedidos = await this.pedidoRepo.count({
      where: { distribuidor: { userId: distribuidorId } }
    });

    const pedidosEntregados = await this.pedidoRepo.count({
      where: { 
        distribuidor: { id: distribuidorId },
        entregado: true 
      }
    });

    const pedidosPendientes = await this.pedidoRepo.count({
      where: { 
        distribuidor: { id: distribuidorId },
        entregado: false 
      }
    });

    // Calcular ingresos totales
    const result = await this.pedidoRepo
      .createQueryBuilder('pedido')
      .select('SUM(pedido.total)', 'ingresoTotal')
      .where('pedido.distribuidorId = :distribuidorId', { distribuidorId })
      .andWhere('pedido.entregado = true')
      .getRawOne();

    const ingresoTotal = result?.ingresoTotal || 0;

    return {
      totalPedidos,
      pedidosEntregados,
      pedidosPendientes,
      ingresoTotal: parseFloat(ingresoTotal),
      tasaEntrega: totalPedidos > 0 ? Math.round((pedidosEntregados / totalPedidos) * 100) : 0
    };
  }

  /**
   * Obtener historial de entregas del distribuidor
   */
  async getHistorialEntregas(distribuidorId: number) {
    console.log(`📋 Obteniendo historial para distribuidor ${distribuidorId}`);
    
    const pedidosEntregados = await this.pedidoRepo.find({
      where: { 
        distribuidor: { userId: distribuidorId   },
        entregado: true 
      },
      order: { fecha: 'DESC' },
      take: 50 // Últimas 50 entregas
    });

    return pedidosEntregados.map(pedido => ({
      id: pedido.id,
      codigoPedido: pedido.codigoPedido,
      cliente: pedido.cliente,
      producto: pedido.producto,
      total: pedido.total,
      fecha: pedido.fecha,
      direccionEntrega: pedido.direccionEntrega,
      observacion: pedido.observacion
    }));
  }
}