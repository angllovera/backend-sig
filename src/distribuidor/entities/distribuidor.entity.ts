// src/distribuidor/entities/distribuidor.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Distribuidor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  contacto: string;

  @Column()
  vehiculo: string;

  @Column('int')
  capacidad: number;
}
