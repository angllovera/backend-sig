import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { Pedido } from './entities/pedido.entity';

@Injectable()
export class PedidoService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
  ) {}

  async create(createPedidoDto: CreatePedidoDto): Promise<Pedido> {
    const { cantidad, precio_unitario, ...restPedidoData } = createPedidoDto;
    
    // Calcular el total
    const total = cantidad * precio_unitario;
    
    const pedido = this.pedidoRepository.create({
      ...restPedidoData,
      cantidad,
      precio_unitario,
      total,
    });
    
    return await this.pedidoRepository.save(pedido);
  }

  async findAll(): Promise<Pedido[]> {
    return await this.pedidoRepository.find({
      order: {
        fecha: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOneBy({ id });
    
    if (!pedido)
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    
    return pedido;
  }

  async update(id: number, updatePedidoDto: UpdatePedidoDto): Promise<Pedido> {
    const pedido = await this.findOne(id);
    
    const { cantidad, precio_unitario, ...restUpdateData } = updatePedidoDto;
    
    // Actualizar los datos del pedido
    Object.assign(pedido, restUpdateData);
    
    // Actualizar cantidad y precio unitario si se proporcionan
    if (cantidad !== undefined) {
      pedido.cantidad = cantidad;
    }
    
    if (precio_unitario !== undefined) {
      pedido.precio_unitario = precio_unitario;
    }
    
    // Recalcular el total
    pedido.total = pedido.cantidad * pedido.precio_unitario;
    
    return await this.pedidoRepository.save(pedido);
  }

  async remove(id: number): Promise<Pedido> {
    const pedido = await this.findOne(id);
    return await this.pedidoRepository.remove(pedido);
  }

  async findByCliente(cliente: string): Promise<Pedido[]> {
    return await this.pedidoRepository.find({
      where: {
        cliente: cliente,
      },
      order: {
        fecha: 'DESC',
      },
    });
  }

  async findByEstado(estado: string): Promise<Pedido[]> {
    return await this.pedidoRepository.find({
      where: {
        estado: estado,
      },
      order: {
        fecha: 'DESC',
      },
    });
  }
}