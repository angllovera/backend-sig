import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Pedido } from '../../pedido/entities/pedido.entity';

@Entity('entregas')
export class Entrega {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToOne(() => Pedido)
  @JoinColumn()
  pedido: Pedido;

  @Column('int')
  pedidoId: number;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  hora: Date;

  @Column('varchar', { length: 255 })
  ubicacion: string;

  @Column('varchar', { length: 50 })
  estado: string;

  @Column('timestamp', { nullable: true })
  horaEntrega: Date;

  @Column('varchar', { length: 500, nullable: true })
  observaciones: string;
}
