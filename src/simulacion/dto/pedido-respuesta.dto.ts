export class PedidoRespuestaDto {
  id: number;
  codigoPedido?: string;
  descripcion: string;
  direccionEntrega: string;
  latitud: number;
  longitud: number;
  estado: string;
}
