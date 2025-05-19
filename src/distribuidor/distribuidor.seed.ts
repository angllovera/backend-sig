// src/distribuidor/distribuidor.seed.ts
import { Distribuidor } from './entities/distribuidor.entity';
import { Repository } from 'typeorm';

export async function seedDistribuidores(repo: Repository<Distribuidor>) {
  const existe = await repo.count();
  if (existe > 0) return;

  const datos: Partial<Distribuidor>[] = [
    {
      nombre: 'Transportes Andina',
      contacto: '611234567',
      vehiculo: 'Camión',
      capacidad: 1000,
    },
    {
      nombre: 'Distribuciones Norte',
      contacto: '612345678',
      vehiculo: 'Furgoneta',
      capacidad: 600,
    },
    {
      nombre: 'Express Oriente',
      contacto: '613456789',
      vehiculo: 'Motocarga',
      capacidad: 300,
    },
  ];

  await repo.save(datos);
  console.log('[✔] Distribuidores precargados correctamente');
}
