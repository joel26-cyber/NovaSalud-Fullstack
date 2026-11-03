# Registro de pruebas ejecutadas

Fecha de ejecución: 1 de noviembre de 2026. Entorno: PHP 8.2.12, MariaDB 10.4.32 y Apache de XAMPP.

## Pruebas automatizadas aprobadas

Ejecutar `php tests/run.php` definiendo previamente la variable temporal `NOVA_TEST_PASSWORD` con la contraseña del administrador de pruebas.

Se ejecutó la suite dos veces consecutivas para comprobar que sus datos temporales se limpien correctamente. Cada ejecución obtuvo **16 pruebas aprobadas y 0 fallidas**:

1. Conectar con MySQL mediante PDO.
2. Comprobar las diez tablas requeridas.
3. Verificar la contraseña del administrador.
4. Rechazar una contraseña incorrecta.
5. Iniciar sesión con el rol vendedor.
6. Detectar lotes vencidos.
7. Excluir lotes vencidos del stock vendible.
8. Detectar stock bloqueado.
9. Registrar una venta real dentro de una transacción.
10. Descontar primero el lote que vence antes.
11. Completar la venta desde un segundo lote.
12. Registrar los dos lotes utilizados.
13. Registrar un movimiento por cada lote utilizado.
14. Rechazar una venta con stock insuficiente.
15. Revertir por completo la venta fallida.
16. Limpiar los datos temporales de la prueba.

## Pruebas de interfaz ejecutadas

- Obtener HTTP 200 en la pantalla de acceso.
- Iniciar sesión desde un navegador con la cuenta administradora.
- Mostrar el panel con información real de la base de datos.
- Abrir el punto de venta y mostrar solamente productos con stock vendible.
- Cargar Bootstrap, JavaScript e iconos desde archivos locales.
- Revisar la consola del navegador sin errores.
- Probar una ventana móvil de 390 × 844 píxeles sin desbordamiento horizontal.
- Ocultar el menú lateral y mostrar el botón móvil después de completar la transición.

## Regresión de stock agotado — corrección posterior

Se añadió una verificación de existencias en tiempo real antes de confirmar cada venta y se ejecutaron seis pruebas adicionales:

1. Vender exactamente las últimas unidades disponibles.
2. Dejar el lote en stock cero.
3. Bloquear una compra posterior del mismo producto.
4. No crear una cabecera de venta al rechazarla.
5. Mantener el stock en cero sin cantidades negativas.
6. Comprobar que ningún lote del sistema tenga cantidades negativas.

Resultado: **6 aprobadas y 0 fallidas**. También se probó en el navegador un carrito que mostraba una unidad mientras el stock cambiaba a cero en la base de datos. Al confirmar, el sistema actualizó el producto como `AGOTADO`, retiró el artículo del carrito, deshabilitó el botón de venta y mostró `Venta bloqueada`.

La auditoría posterior obtuvo cero diferencias entre cantidades vendidas y lotes utilizados, cero diferencias entre totales y subtotales, cero ventas sin detalle y cero ventas asignadas a lotes vencidos en la fecha de la operación.

## Comprobaciones manuales recomendadas para la exposición

Todavía deben repetirse manualmente ante el profesor las operaciones que requieren evidencia visual: registrar y editar un medicamento, subir una imagen, registrar un lote, ajustar inventario, crear un usuario, cambiar los días de alerta, filtrar cada reporte, descargar CSV e imprimir el comprobante. No se declaran estas demostraciones manuales como ejecutadas en este documento.
