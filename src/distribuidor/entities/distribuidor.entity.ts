// distribuidor/entities/distribuidor.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Pedido } from '../../pedido/entities/pedido.entity';
import { User } from '../../auth/entities/user.entity';
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

  @Column({ type: 'float', nullable: true })
  latitud?: number;

  @Column({ type: 'float', nullable: true })
  longitud?: number;

  @Column('int')
  capacidad: number;

  // ← AGREGAR ESTA COLUMNA
  @Column({ nullable: true })
  userId?: number;

  @OneToMany(() => Pedido, pedido => pedido.distribuidor)
  pedidos: Pedido[];

  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}