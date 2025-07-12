import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Pedido } from '../pedido/entities/pedido.entity';
import { Distribuidor } from '../distribuidor/entities/distribuidor.entity';
import { Repository } from 'typeorm';
import axios from 'axios';
import { PedidoRespuestaDto } from './dto/pedido-respuesta.dto';

@Injectable()
export class SimulacionService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
    @InjectRepository(Distribuidor)
    private readonly distRepo: Repository<Distribuidor>,
  ) {}

  private async obtenerDireccionDesdeCoords(lat: number, lng: number): Promise<string> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { latlng: `${lat},${lng}`, key: apiKey },
    });

    const direccion = response.data.results[0]?.formatted_address;
    if (!direccion) {
      throw new Error(`No se pudo obtener dirección desde (${lat}, ${lng})`);
    }
    return direccion;
  }

  private async generarCodigoPedido(): Promise<string> {
    const total = await this.pedidoRepo.count();
    const numero = (total + 1).toString().padStart(4, '0');
    return `PEDIDO-${numero}`;
  }

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
  private async asignarDistribuidorOptimo(lat: number, lng: number): Promise<Distribuidor | null> {
    console.log(`🔍 [SIMULACION] Buscando distribuidor óptimo para: ${lat}, ${lng}`);
    
    const distribuidores = await this.distRepo.find();
    console.log(`📋 [SIMULACION] Total distribuidores encontrados: ${distribuidores.length}`);
    
    if (distribuidores.length === 0) {
      console.warn('❌ [SIMULACION] No hay distribuidores disponibles para asignar');
      return null;
    }

    // Mostrar todos los distribuidores con sus coordenadas
    distribuidores.forEach(dist => {
      console.log(`📍 [SIMULACION] Distribuidor ${dist.nombre}: lat=${dist.latitud}, lng=${dist.longitud}, userId=${dist.userId}`);
    });

    // Filtrar distribuidores con coordenadas válidas
    const distribuidoresConCoordenadas = distribuidores.filter(dist => 
      dist.latitud != null && dist.longitud != null
    );

    console.log(`📋 [SIMULACION] Distribuidores con coordenadas válidas: ${distribuidoresConCoordenadas.length}`);

    if (distribuidoresConCoordenadas.length === 0) {
      console.warn('❌ [SIMULACION] No hay distribuidores con coordenadas válidas');
      return null;
    }

    let mejorDistribuidor: Distribuidor | null = null;
    let menorDistancia = Infinity;

    for (const dist of distribuidoresConCoordenadas) {
      const distancia = this.calcularDistancia(lat, lng, dist.latitud!, dist.longitud!);
      console.log(`📏 [SIMULACION] Distancia a ${dist.nombre}: ${distancia.toFixed(2)}km`);
      
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        mejorDistribuidor = dist;
      }
    }

    if (mejorDistribuidor) {
      console.log(`✅ [SIMULACION] Pedido asignado a distribuidor ${mejorDistribuidor.nombre} (${menorDistancia.toFixed(2)}km)`);
    } else {
      console.warn('❌ [SIMULACION] No se pudo asignar distribuidor');
    }
    
    return mejorDistribuidor;
  }

  /**
   * Alternativa: Asignar por carga de trabajo (el que menos pedidos tiene)
   */
  private async asignarDistribuidorPorCarga(): Promise<Distribuidor | null> {
    const distribuidorConMenosPedidos = await this.distRepo
      .createQueryBuilder('d')
      .leftJoin('d.pedidos', 'p', 'p.entregado = false')
      .addSelect('COUNT(p.id)', 'pedidos_pendientes')
      .groupBy('d.id')
      .orderBy('pedidos_pendientes', 'ASC')
      .limit(1)
      .getOne();

    return distribuidorConMenosPedidos;
  }

  async crearPedidoCompleto(body: {
    lat: number;
    lng: number;
    cliente: string;
    producto: string;
    cantidad: number;
    precio_unitario: number;
    descripcion: string;
  }): Promise<Pedido> {
    console.log(`🎯 [SIMULACION] Creando pedido para cliente: ${body.cliente}`);
    console.log(`📍 [SIMULACION] Coordenadas del pedido: ${body.lat}, ${body.lng}`);
    
    const direccion = await this.obtenerDireccionDesdeCoords(body.lat, body.lng);
    const codigo = await this.generarCodigoPedido();
    const total = body.precio_unitario * body.cantidad;

    //  ASIGNAR DISTRIBUIDOR AUTOMÁTICAMENTE
    const distribuidor = await this.asignarDistribuidorOptimo(body.lat, body.lng);

    // Crear el pedido
    const pedido = this.pedidoRepo.create({
      cliente: body.cliente,
      producto: body.producto,
      cantidad: body.cantidad,
      precio_unitario: body.precio_unitario,
      total,
      fecha: new Date(),
      estado: 'pendiente',
      direccionEntrega: direccion,
      latitud: body.lat,
      longitud: body.lng,
      descripcion: body.descripcion,
      codigoPedido: codigo,
      observacion: distribuidor 
        ? `Pedido asignado automáticamente a ${distribuidor.nombre}`
        : 'Pedido creado sin distribuidor asignado',
      entregado: false,
      origen: 'simulado',
    });

    // Asignar el distribuidor si existe
    if (distribuidor) {
      pedido.distribuidor = distribuidor;
      console.log(`✅ [SIMULACION] Distribuidor asignado: ${distribuidor.nombre}`);
    } else {
      console.warn(`⚠️ [SIMULACION] Pedido creado SIN distribuidor asignado`);
    }


    await this.pedidoRepo.save(pedido);

    // Log para debug
    console.log(`✅ [SIMULACION] Pedido ${codigo} creado y asignado a distribuidor: ${distribuidor?.nombre || 'NINGUNO'}`);
    const pedidoCompleto = await this.pedidoRepo.findOne({
      where: { id: pedido.id },
      relations: ['distribuidor', 'pagos']
    });

    return pedidoCompleto!;
  }

  async listarPedidos(): Promise<PedidoRespuestaDto[]> {
    const pedidos = await this.pedidoRepo.find({
      where: { origen: 'simulado' },
      relations: ['distribuidor'], 
      order: { id: 'DESC' },
    });

    return pedidos.map(p => ({
      id: p.id,
      codigoPedido: p.codigoPedido ?? '',
      descripcion: p.descripcion ?? '',
      direccionEntrega: p.direccionEntrega ?? '',
      latitud: p.latitud ?? 0,
      longitud: p.longitud ?? 0,
      estado: p.estado,
  
    }));
  }

  async eliminarPedido(id: number): Promise<boolean> {
    const result = await this.pedidoRepo.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }
    return true;
  }

  /**
   * Método de debug para verificar el estado de los distribuidores
   */
  async verificarDistribuidores(): Promise<any> {
    const distribuidores = await this.distRepo.find();
    
    console.log(`📋 [DEBUG] Total distribuidores: ${distribuidores.length}`);
    
    const resultado = distribuidores.map(dist => ({
      id: dist.id,
      nombre: dist.nombre,
      latitud: dist.latitud,
      longitud: dist.longitud,
      userId: dist.userId,
      tieneCoordenadas: dist.latitud != null && dist.longitud != null
    }));

    console.log('📊 [DEBUG] Estado de distribuidores:', resultado);
    
    return resultado;
  }
}