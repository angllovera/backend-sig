import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('varchar', { length: 100 })
  cliente: string;

  @Column('date', { default: () => 'CURRENT_DATE' })
  fecha: Date;

  @Column('varchar', { length: 50 })
  estado: string;

  @Column('varchar', { length: 100 })
  producto: string;

  @Column('integer')
  cantidad: number;

  @Column('decimal', { precision: 10, scale: 2 })
  precio_unitario: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;
}