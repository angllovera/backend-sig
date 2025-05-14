import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Pago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tipo: 'qr' | 'transferencia' | 'efectivo';

  @Column('decimal')
  monto: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @Column({ default: 'pendiente' })
  estado: 'pendiente' | 'completado' | 'rechazado';

  @Column()
  compraId: number; // Asociado al pedido
}
