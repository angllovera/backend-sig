import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Distribuidor } from '../../distribuidor/entities/distribuidor.entity';
import { Pago } from '../../pago/entities/pago.entity';
import { Expose } from 'class-transformer';

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn()
  id: number;

  // === Datos comunes (reales o simulados) ===
  @Column('varchar', { length: 100 })
  cliente: string;

  @Column('varchar', { length: 100 })
  producto: string;

  @Column('int')
  cantidad: number;

  @Column('decimal', { precision: 10, scale: 2 })
  precio_unitario: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column('varchar', { length: 50 })
  estado: string;

  @Column('date', { default: () => 'CURRENT_DATE' })
  fecha: Date;

  // === Información de entrega ===
  @Column({ nullable: true })
  direccionEntrega?: string;

  @Column('decimal', { precision: 9, scale: 6, nullable: true })
  latitud?: number;

  @Column('decimal', { precision: 9, scale: 6, nullable: true })
  longitud?: number;

  @Column({ nullable: true })
  observacion?: string;

  @Column({ default: false })
  entregado: boolean;

  // === Para simulación u organización ===
  @Column({ nullable: true, unique: true })
  codigoPedido?: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Column({ default: 'web' }) // o 'simulado'
  origen: string;

  // === Relación con distribuidor ===
  @ManyToOne(() => Distribuidor, distribuidor => distribuidor.pedidos, {
    nullable: true,
    eager: true,
  })
  distribuidor: Distribuidor;

  @OneToMany(() => Pago, pago => pago.pedido, { eager: true })
  pagos: Pago[];

  // === Campo calculado ===
  @Expose()
  get estaPagado(): boolean {
    return this.pagos?.some(p => p.estado === 'completado') ?? false;
  }
}
