import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class PagesController {
  
  /**
   * 🎉 Página de pago exitoso para el cliente
   */
  @Get('pago-exito')
  pagoExito(
    @Query('pedidoId') pedidoId: string,
    @Query('status') status: string,
    @Res() res: Response
  ) {
    console.log(`✅ Cliente accedió a página de éxito - Pedido: ${pedidoId}, Status: ${status}`);
    
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¡Pago Exitoso!</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 100%;
            text-align: center;
            animation: slideUp 0.6s ease-out;
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .success-icon {
            font-size: 80px;
            margin-bottom: 20px;
            animation: bounce 1s ease-in-out;
          }
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-10px);
            }
            60% {
              transform: translateY(-5px);
            }
          }
          
          h1 {
            color: #28a745;
            font-size: 28px;
            margin-bottom: 15px;
            font-weight: 700;
          }
          
          .subtitle {
            color: #6c757d;
            font-size: 18px;
            margin-bottom: 30px;
          }
          
          .pedido-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #28a745;
          }
          
          .pedido-info strong {
            color: #495057;
            display: block;
            margin-bottom: 5px;
          }
          
          .pedido-numero {
            font-size: 24px;
            font-weight: bold;
            color: #28a745;
          }
          
          .mensaje {
            color: #495057;
            line-height: 1.6;
            margin: 20px 0;
          }
          
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
          }
          
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 20px;
            font-weight: 600;
            transition: background 0.3s ease;
          }
          
          .btn:hover {
            background: #218838;
          }
          
          @media (max-width: 480px) {
            .container {
              padding: 30px 20px;
            }
            
            h1 {
              font-size: 24px;
            }
            
            .subtitle {
              font-size: 16px;
            }
            
            .success-icon {
              font-size: 60px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          
          <h1>¡Pago Exitoso!</h1>
          <p class="subtitle">Tu pago ha sido procesado correctamente</p>
          
          <div class="pedido-info">
            <strong>Número de Pedido:</strong>
            <div class="pedido-numero">#${pedidoId || 'N/A'}</div>
          </div>
          
          <div class="mensaje">
            <p><strong>¡Gracias por tu compra!</strong></p>
            <p>El distribuidor ha sido notificado automáticamente y tu pedido será entregado pronto.</p>
            <p>Recibirás tu producto en la dirección indicada.</p>
          </div>
          
          <div class="footer">
            <p><strong>Distribuciones Santa Cruz</strong></p>
            <p>Fecha: ${new Date().toLocaleDateString('es-BO')}</p>
            <p>Hora: ${new Date().toLocaleTimeString('es-BO')}</p>
          </div>
        </div>
        
        <script>
          // Auto-cerrar después de 30 segundos (opcional)
          setTimeout(() => {
            document.body.style.opacity = '0.7';
          }, 30000);
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  /**
   * ❌ Página de pago cancelado para el cliente
   */
  @Get('pago-cancelado')
  pagoCancelado(
    @Query('pedidoId') pedidoId: string,
    @Query('status') status: string,
    @Res() res: Response
  ) {
    console.log(`❌ Cliente accedió a página de cancelación - Pedido: ${pedidoId}, Status: ${status}`);
    
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pago Cancelado</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 100%;
            text-align: center;
            animation: slideUp 0.6s ease-out;
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .cancel-icon {
            font-size: 80px;
            margin-bottom: 20px;
            animation: shake 0.8s ease-in-out;
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          
          h1 {
            color: #dc3545;
            font-size: 28px;
            margin-bottom: 15px;
            font-weight: 700;
          }
          
          .subtitle {
            color: #6c757d;
            font-size: 18px;
            margin-bottom: 30px;
          }
          
          .pedido-info {
            background: #fff3cd;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
          }
          
          .pedido-info strong {
            color: #495057;
            display: block;
            margin-bottom: 5px;
          }
          
          .pedido-numero {
            font-size: 24px;
            font-weight: bold;
            color: #856404;
          }
          
          .mensaje {
            color: #495057;
            line-height: 1.6;
            margin: 20px 0;
          }
          
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
          }
          
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #6c757d;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 20px;
            font-weight: 600;
            transition: background 0.3s ease;
          }
          
          .btn:hover {
            background: #5a6268;
          }
          
          .contact-info {
            background: #e9ecef;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          
          @media (max-width: 480px) {
            .container {
              padding: 30px 20px;
            }
            
            h1 {
              font-size: 24px;
            }
            
            .subtitle {
              font-size: 16px;
            }
            
            .cancel-icon {
              font-size: 60px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="cancel-icon">❌</div>
          
          <h1>Pago Cancelado</h1>
          <p class="subtitle">Tu pago ha sido cancelado</p>
          
          <div class="pedido-info">
            <strong>Número de Pedido:</strong>
            <div class="pedido-numero">#${pedidoId || 'N/A'}</div>
          </div>
          
          <div class="mensaje">
            <p><strong>No se procesó ningún cargo</strong></p>
            <p>Tu pago fue cancelado y no se realizó ningún cobro a tu tarjeta.</p>
            <p>Si deseas completar la compra, contacta al distribuidor.</p>
          </div>
          
          <div class="contact-info">
            <p><strong>¿Necesitas ayuda?</strong></p>
            <p>Contacta al distribuidor para obtener un nuevo enlace de pago o resolver cualquier duda.</p>
          </div>
          
          <div class="footer">
            <p><strong>Distribuciones Santa Cruz</strong></p>
            <p>Fecha: ${new Date().toLocaleDateString('es-BO')}</p>
            <p>Hora: ${new Date().toLocaleTimeString('es-BO')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  /**
   * 🔧 NUEVO: Endpoint de salud para verificar que el servidor está funcionando
   */
  @Get('health')
  health() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      message: 'Servidor funcionando correctamente'
    };
  }
}