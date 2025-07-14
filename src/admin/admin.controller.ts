import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Render, 
  Redirect, 
  Res, 
  Query 
} from '@nestjs/common';
import { Response } from 'express';
import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';
import { DistribuidorService } from '../distribuidor/distribuidor.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly distribuidorService: DistribuidorService,
  ) {}

  /**
   * 📊 Dashboard principal - Sin autenticación
   */
  @Get()
  @Render('dashboard')
  async dashboard() {
    try {
      console.log('📊 === ACCESO AL DASHBOARD ADMIN ===');
      
      const stats = await this.adminService.getGeneralStats();
      
      return {
        title: 'Dashboard - Administración',
        stats,
        timestamp: new Date().toLocaleString('es-BO'),
      };
    } catch (error) {
      console.error('❌ Error en dashboard:', error);
      return {
        title: 'Dashboard - Administración',
        error: 'Error cargando estadísticas',
        stats: null,
      };
    }
  }

  /**
   * 🚚 Página de distribuidores - Sin autenticación
   */
  @Get('distribuidores')
  @Render('distribuidores')
  async distribuidores() {
    try {
      console.log('🚚 === ACCESO A PÁGINA DE DISTRIBUIDORES ===');
      
      const distribuidores = await this.adminService.getAllDistribuidoresWithStats();
      
      return {
        title: 'Gestión de Distribuidores',
        distribuidores,
        timestamp: new Date().toLocaleString('es-BO'),
      };
    } catch (error) {
      console.error('❌ Error obteniendo distribuidores:', error);
      return {
        title: 'Gestión de Distribuidores',
        error: 'Error cargando distribuidores',
        distribuidores: [],
      };
    }
  }

  /**
   * ➕ Registrar nuevo distribuidor - Usa endpoint existente
   */
  @Post('distribuidores/registrar')
  async registrarDistribuidor(
    @Body() datos: {
      name: string;
      email: string;
      password: string;
    },
    @Res() res: Response
  ) {
    try {
      console.log('➕ === REGISTRANDO NUEVO DISTRIBUIDOR ===');
      console.log('📝 Datos:', datos);
      
      // Usar el AuthService existente para registrar
      await this.authService.register(datos);
      
      console.log('✅ Distribuidor registrado exitosamente');
      
      // Redirigir con mensaje de éxito
      res.redirect('/admin/distribuidores?success=Distribuidor registrado exitosamente');
    } catch (error) {
      console.error('❌ Error registrando distribuidor:', error);
      res.redirect(`/admin/distribuidores?error=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * 📦 Página crear pedido - Con autenticación automática
   */
  @Get('crear-pedido')
  @Render('crear-pedido')
  async crearPedidoPage() {
    try {
      console.log('📦 === ACCESO A CREAR PEDIDO ===');
      
      // Login automático con cuenta por defecto
      const defaultToken = await this.adminService.loginAsDefault();
      const distribuidores = await this.distribuidorService.findAll();
      
      return {
        title: 'Crear Nuevo Pedido',
        token: defaultToken,
        distribuidores,
        timestamp: new Date().toLocaleString('es-BO'),
      };
    } catch (error) {
      console.error('❌ Error en página crear pedido:', error);
      return {
        title: 'Crear Nuevo Pedido',
        error: 'Error preparando página de creación. Verifica que existe el usuario admin.',
        distribuidores: [],
      };
    }
  }

  /**
   * ✅ Procesar creación de pedido
   */
  @Post('crear-pedido')
  async procesarCrearPedido(
    @Body() datosPedido: {
      cliente: string;
      producto: string;
      cantidad: number;
      precio_unitario: number;
      direccionEntrega: string;
      latitud: number;
      longitud: number;
      distribuidorId?: number;
    },
    @Res() res: Response
  ) {
    try {
      console.log('✅ === PROCESANDO CREACIÓN DE PEDIDO ===');
      console.log('📝 Datos del pedido:', datosPedido);
      
      // Validar datos básicos
      if (!datosPedido.cliente || !datosPedido.producto || !datosPedido.cantidad) {
        throw new Error('Faltan campos obligatorios');
      }

      // Convertir campos numéricos
      datosPedido.cantidad = Number(datosPedido.cantidad);
      datosPedido.precio_unitario = Number(datosPedido.precio_unitario);
      datosPedido.latitud = Number(datosPedido.latitud);
      datosPedido.longitud = Number(datosPedido.longitud);

      if (datosPedido.distribuidorId) {
        datosPedido.distribuidorId = Number(datosPedido.distribuidorId);
      }

      const nuevoPedido = await this.adminService.crearPedidoYAsignar(datosPedido);
      
      console.log('✅ Pedido creado exitosamente:', nuevoPedido.codigoPedido);
      
      res.redirect(`/admin/pedidos?success=Pedido ${nuevoPedido.codigoPedido} creado exitosamente`);
    } catch (error) {
      console.error('❌ Error creando pedido:', error);
      res.redirect(`/admin/crear-pedido?error=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * 📋 Página ver pedidos - Sin autenticación
   */
  @Get('pedidos')
  @Render('ver-pedidos')
  async verPedidos(@Query('estado') filtroEstado?: string) {
    try {
      console.log('📋 === ACCESO A VER PEDIDOS ===');
      console.log('🔍 Filtro estado:', filtroEstado);
      
      const pedidos = await this.adminService.getAllPedidosCompletos();
      
      // Aplicar filtro si se especifica
      const pedidosFiltrados = filtroEstado 
        ? pedidos.filter(p => p.estado === filtroEstado)
        : pedidos;

      // Contar por estados para el resumen
      const resumenEstados = {
        pendiente: pedidos.filter(p => p.estado === 'pendiente').length,
        entregado: pedidos.filter(p => p.estado === 'entregado').length,
        cancelado: pedidos.filter(p => p.estado === 'cancelado').length,
        equivocado: pedidos.filter(p => p.estado === 'equivocado').length,
      };
      
      return {
        title: 'Gestión de Pedidos',
        pedidos: pedidosFiltrados,
        resumenEstados,
        filtroActual: filtroEstado || 'todos',
        timestamp: new Date().toLocaleString('es-BO'),
      };
    } catch (error) {
      console.error('❌ Error obteniendo pedidos:', error);
      return {
        title: 'Gestión de Pedidos',
        error: 'Error cargando pedidos',
        pedidos: [],
        resumenEstados: {},
      };
    }
  }

  /**
   * 🔧 Cambiar estado de pedido
   */
  @Post('pedidos/:id/estado')
  async cambiarEstadoPedido(
    @Param('id') id: string,
    @Body() datos: {
      estado: string;
      observacion?: string;
    },
    @Res() res: Response
  ) {
    try {
      console.log(`🔧 === CAMBIANDO ESTADO PEDIDO ${id} ===`);
      console.log('📝 Nuevo estado:', datos.estado);
      
      await this.adminService.cambiarEstadoPedido(
        Number(id), 
        datos.estado, 
        datos.observacion
      );
      
      console.log('✅ Estado cambiado exitosamente');
      
      res.redirect(`/admin/pedidos?success=Estado del pedido ${id} actualizado a: ${datos.estado}`);
    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      res.redirect(`/admin/pedidos?error=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * 📊 API endpoints para AJAX (opcional)
   */
  @Get('api/stats')
  async getStatsApi() {
    return this.adminService.getGeneralStats();
  }

  @Get('api/distribuidores')
  async getDistribuidoresApi() {
    return this.adminService.getAllDistribuidoresWithStats();
  }

  @Get('api/pedidos')
  async getPedidosApi() {
    return this.adminService.getAllPedidosCompletos();
  }
}