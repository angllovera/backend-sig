import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Pedido } from '../../pedido/entities/pedido.entity';

@Entity()
export class Pago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['efectivo', 'transferencia', 'qr', 'stripe'] })
  metodo: 'efectivo' | 'transferencia' | 'qr' | 'stripe';

  @Column('decimal')
  monto: number;

  @Column({ nullable: true, type: 'text' }) 
  qrUrl?: string | null;

  @Column({ default: 'pendiente' })
  estado: 'pendiente' | 'completado' | 'rechazado';

  @CreateDateColumn()
  fecha: Date;

  @ManyToOne(() => Pedido, pedido => pedido.pagos)
  pedido: Pedido;
}
