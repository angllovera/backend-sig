import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEntregaDto } from './dto/create-entrega.dto';
import { UpdateEntregaDto } from './dto/update-entrega.dto';
import { Entrega } from './entities/entrega.entity';
import { PedidoService } from '../pedido/pedido.service';

@Injectable()
export class EntregaService {
  constructor(
    @InjectRepository(Entrega)
    private readonly entregaRepository: Repository<Entrega>,
    private readonly pedidoService: PedidoService,
  ) {}

  async create(createEntregaDto: CreateEntregaDto): Promise<Entrega> {
    //const pedido = await this.pedidoService.findOne(createEntregaDto.pedidoId);

    const entregaExistente = await this.entregaRepository.findOne({
      where: { pedidoId: createEntregaDto.pedidoId },
    });

    if (entregaExistente) {
      throw new BadRequestException(
        `Ya existe una entrega para el pedido ${createEntregaDto.pedidoId}`,
      );
    }

    const nuevaEntrega = this.entregaRepository.create({
      ...createEntregaDto,
      hora: createEntregaDto.hora || new Date(),
    });

    return await this.entregaRepository.save(nuevaEntrega);
  }

  async findAll(): Promise<Entrega[]> {
    return await this.entregaRepository.find({
      order: {
        hora: 'DESC',
      },
      relations: ['pedido'],
    });
  }

  async findOne(id: number): Promise<Entrega> {
    const entrega = await this.entregaRepository.findOne({
      where: { id },
      relations: ['pedido'],
    });

    if (!entrega) {
      throw new NotFoundException(`Entrega con ID ${id} no encontrada`);
    }

    return entrega;
  }

  async update(
    id: number,
    updateEntregaDto: UpdateEntregaDto,
  ): Promise<Entrega> {
    const entrega = await this.findOne(id);

    if (
      updateEntregaDto.pedidoId &&
      updateEntregaDto.pedidoId !== entrega.pedidoId
    ) {
      await this.pedidoService.findOne(updateEntregaDto.pedidoId);

      const entregaExistente = await this.entregaRepository.findOne({
        where: { pedidoId: updateEntregaDto.pedidoId },
      });

      if (entregaExistente && entregaExistente.id !== id) {
        throw new BadRequestException(
          `Ya existe una entrega para el pedido ${updateEntregaDto.pedidoId}`,
        );
      }
    }

    Object.assign(entrega, updateEntregaDto);
    return await this.entregaRepository.save(entrega);
  }

  async remove(id: number): Promise<Entrega> {
    const entrega = await this.findOne(id);
    return await this.entregaRepository.remove(entrega);
  }

  async findByEstado(estado: string): Promise<Entrega[]> {
    return await this.entregaRepository.find({
      where: {
        estado: estado,
      },
      order: {
        hora: 'DESC',
      },
      relations: ['pedido'],
    });
  }

  async findByPedido(pedidoId: number): Promise<Entrega> {
    const entrega = await this.entregaRepository.findOne({
      where: {
        pedidoId: pedidoId,
      },
      relations: ['pedido'],
    });

    if (!entrega) {
      throw new NotFoundException(
        `No se encontró entrega para el pedido ${pedidoId}`,
      );
    }

    return entrega;
  }
}
