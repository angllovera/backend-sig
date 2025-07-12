import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Distribuidor } from './entities/distribuidor.entity';
import { CreateDistribuidorDto } from './dto/create-distribuidor.dto';
import { UpdateDistribuidorDto } from './dto/update-distribuidor.dto';

@Injectable()
export class DistribuidorService {
  constructor(
    @InjectRepository(Distribuidor)
    private readonly repo: Repository<Distribuidor>,
  ) {}

  create(dto: CreateDistribuidorDto) {
    const nuevo = this.repo.create(dto);
    return this.repo.save(nuevo);
  }

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  async update(id: number, dto: UpdateDistribuidorDto) {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async updateUbicacion(id: number, lat: number, lng: number) {
    const dist = await this.repo.findOneBy({ id });
    if (!dist) throw new NotFoundException('Distribuidor no encontrado');

    dist.latitud = lat;
    dist.longitud = lng;

    return this.repo.save(dist);
  }


  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }

  buscarPorNombre(nombre: string) {
    return this.repo.find({
      where: { nombre },
    });
  }

  filtrarPorCapacidad(min: number) {
    return this.repo
      .createQueryBuilder('d')
      .where('d.capacidad >= :min', { min })
      .getMany();
  }
}
