SET NAMES utf8mb4;
INSERT IGNORE INTO categorias(nombre,descripcion) VALUES
('Analgésicos','Datos demostrativos'),('Antibióticos','Datos demostrativos'),('Antigripales','Datos demostrativos'),('Vitaminas','Datos demostrativos'),('Cuidado digestivo','Datos demostrativos');

INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-001','Paracetamol','500 mg','Caja x 20 tabletas','Laboratorio Demo',5.50,20 FROM categorias WHERE nombre='Analgésicos';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-002','Ibuprofeno','400 mg','Caja x 10 tabletas','Salud Demo',8.90,15 FROM categorias WHERE nombre='Analgésicos';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-003','Amoxicilina','500 mg','Caja x 21 cápsulas','Farma Demo',18.50,10 FROM categorias WHERE nombre='Antibióticos';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-004','Vitamina C','1 g','Tubo x 10 efervescentes','Vita Demo',12.00,12 FROM categorias WHERE nombre='Vitaminas';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-005','Omeprazol','20 mg','Caja x 14 cápsulas','Farma Demo',10.50,8 FROM categorias WHERE nombre='Cuidado digestivo';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-006','Antigripal compuesto',NULL,'Caja x 10 tabletas','Salud Demo',9.50,10 FROM categorias WHERE nombre='Antigripales';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-007','Diclofenaco','50 mg','Caja x 20 tabletas','Genfar',8.50,10 FROM categorias WHERE nombre='Analgésicos';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-008','Naproxeno','550 mg','Caja x 10 tabletas','Medifarma',12.50,8 FROM categorias WHERE nombre='Analgésicos';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-009','Azitromicina','500 mg','Caja x 3 tabletas','Portugal',18.90,5 FROM categorias WHERE nombre='Antibióticos';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-010','Ciprofloxacino','500 mg','Caja x 10 tabletas','Genfar',16.00,5 FROM categorias WHERE nombre='Antibióticos';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-011','Loratadina','10 mg','Caja x 10 tabletas','IQ Farma',6.50,8 FROM categorias WHERE nombre='Antigripales';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-012','Cetirizina','10 mg','Caja x 10 tabletas','Medifarma',7.00,8 FROM categorias WHERE nombre='Antigripales';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-013','Complejo B','B1 + B6 + B12','Caja x 30 tabletas','Naturgen',14.90,10 FROM categorias WHERE nombre='Vitaminas';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-014','Vitamina D3','1000 UI','Frasco x 30 cápsulas','Mason Natural',19.50,8 FROM categorias WHERE nombre='Vitaminas';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-015','Magaldrato','800 mg','Frasco x 180 ml','Portugal',13.80,6 FROM categorias WHERE nombre='Cuidado digestivo';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-016','Subsalicilato de bismuto','262 mg','Frasco x 150 ml','Medifarma',15.20,6 FROM categorias WHERE nombre='Cuidado digestivo';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-017','Simeticona','80 mg','Caja x 20 tabletas','Genfar',9.90,8 FROM categorias WHERE nombre='Cuidado digestivo';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-018','Ácido acetilsalicílico','100 mg','Caja x 20 tabletas','Bayer',7.80,8 FROM categorias WHERE nombre='Analgésicos';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-019','Clorfenamina','4 mg','Caja x 20 tabletas','IQ Farma',5.90,10 FROM categorias WHERE nombre='Antigripales';
INSERT IGNORE INTO medicamentos(categoria_id,codigo,nombre,concentracion,presentacion,laboratorio,precio_venta,stock_minimo)
SELECT id,'MED-020','Sales de rehidratación oral','20.5 g','Caja x 5 sobres','Medifarma',8.20,10 FROM categorias WHERE nombre='Cuidado digestivo';

INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'PAR-A01',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 20 DAY),20,20,'habilitado',1 FROM medicamentos WHERE codigo='MED-001';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'PAR-B02',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 180 DAY),50,50,'habilitado',1 FROM medicamentos WHERE codigo='MED-001';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'IBU-C01',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 90 DAY),12,12,'habilitado',1 FROM medicamentos WHERE codigo='MED-002';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'AMO-X01',DATE_SUB(CURDATE(),INTERVAL 120 DAY),DATE_SUB(CURDATE(),INTERVAL 2 DAY),18,18,'habilitado',1 FROM medicamentos WHERE codigo='MED-003';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'VIT-V01',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 300 DAY),40,40,'habilitado',1 FROM medicamentos WHERE codigo='MED-004';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'OME-O01',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 120 DAY),5,5,'habilitado',1 FROM medicamentos WHERE codigo='MED-005';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'ANT-B01',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 150 DAY),25,25,'bloqueado',1 FROM medicamentos WHERE codigo='MED-006';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'NOVA-007',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 420 DAY),45,45,'habilitado',1 FROM medicamentos WHERE codigo='MED-007';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'NOVA-008',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 420 DAY),35,35,'habilitado',1 FROM medicamentos WHERE codigo='MED-008';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'NOVA-009',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 300 DAY),24,24,'habilitado',1 FROM medicamentos WHERE codigo='MED-009';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'NOVA-010',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 300 DAY),30,30,'habilitado',1 FROM medicamentos WHERE codigo='MED-010';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'NOVA-011',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 420 DAY),50,50,'habilitado',1 FROM medicamentos WHERE codigo='MED-011';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'NOVA-012',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 420 DAY),40,40,'habilitado',1 FROM medicamentos WHERE codigo='MED-012';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'NOVA-013',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 450 DAY),32,32,'habilitado',1 FROM medicamentos WHERE codigo='MED-013';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'NOVA-014',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 450 DAY),28,28,'habilitado',1 FROM medicamentos WHERE codigo='MED-014';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'NOVA-015',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 420 DAY),25,25,'habilitado',1 FROM medicamentos WHERE codigo='MED-015';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'NOVA-016',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 420 DAY),22,22,'habilitado',1 FROM medicamentos WHERE codigo='MED-016';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'NOVA-017',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 420 DAY),38,38,'habilitado',1 FROM medicamentos WHERE codigo='MED-017';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'NOVA-018',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 420 DAY),42,42,'habilitado',1 FROM medicamentos WHERE codigo='MED-018';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'NOVA-019',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 420 DAY),36,36,'habilitado',1 FROM medicamentos WHERE codigo='MED-019';
INSERT IGNORE INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,estado,usuario_registro_id)
SELECT id,'NOVA-020',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 420 DAY),30,30,'habilitado',1 FROM medicamentos WHERE codigo='MED-020';

INSERT INTO movimientos_inventario(medicamento_id,lote_id,usuario_id,tipo,cantidad,stock_anterior,stock_posterior,motivo)
SELECT l.medicamento_id,l.id,1,'entrada',l.cantidad_inicial,0,l.cantidad_inicial,'Carga de datos demostrativos' FROM lotes l
WHERE NOT EXISTS (SELECT 1 FROM movimientos_inventario mi WHERE mi.lote_id=l.id AND mi.tipo='entrada');
