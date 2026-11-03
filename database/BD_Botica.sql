SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS roles (
  id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE,
  descripcion VARCHAR(150) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rol_id TINYINT UNSIGNED NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  ultimo_acceso DATETIME NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categorias (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(200) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS medicamentos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  categoria_id INT UNSIGNED NOT NULL,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  concentracion VARCHAR(80) NULL,
  presentacion VARCHAR(80) NULL,
  laboratorio VARCHAR(120) NULL,
  precio_venta DECIMAL(10,2) NOT NULL,
  stock_minimo INT UNSIGNED NOT NULL DEFAULT 5,
  imagen VARCHAR(255) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_medicamento_nombre (nombre),
  INDEX idx_medicamento_categoria (categoria_id),
  CONSTRAINT fk_medicamento_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lotes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  medicamento_id INT UNSIGNED NOT NULL,
  numero_lote VARCHAR(60) NOT NULL,
  fecha_ingreso DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  cantidad_inicial INT UNSIGNED NOT NULL,
  cantidad_disponible INT UNSIGNED NOT NULL,
  estado ENUM('habilitado','bloqueado') NOT NULL DEFAULT 'habilitado',
  usuario_registro_id INT UNSIGNED NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_lote_medicamento (medicamento_id, numero_lote),
  INDEX idx_lote_vencimiento (fecha_vencimiento),
  INDEX idx_lote_disponible (medicamento_id, estado, fecha_vencimiento, cantidad_disponible),
  CONSTRAINT fk_lote_medicamento FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id),
  CONSTRAINT fk_lote_usuario FOREIGN KEY (usuario_registro_id) REFERENCES usuarios(id),
  CONSTRAINT chk_lote_cantidades CHECK (cantidad_disponible <= cantidad_inicial)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ventas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(25) NOT NULL UNIQUE,
  usuario_id INT UNSIGNED NOT NULL,
  cliente_nombre VARCHAR(120) NULL,
  cliente_documento VARCHAR(20) NULL,
  metodo_pago ENUM('efectivo','yape','plin','tarjeta') NOT NULL DEFAULT 'efectivo',
  total DECIMAL(12,2) NOT NULL,
  estado ENUM('completada','anulada') NOT NULL DEFAULT 'completada',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_venta_fecha (creado_en),
  CONSTRAINT fk_venta_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS detalle_ventas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venta_id BIGINT UNSIGNED NOT NULL,
  medicamento_id INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_detalle_venta FOREIGN KEY (venta_id) REFERENCES ventas(id),
  CONSTRAINT fk_detalle_medicamento FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id),
  CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS detalle_venta_lotes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  detalle_venta_id BIGINT UNSIGNED NOT NULL,
  lote_id BIGINT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  UNIQUE KEY uk_detalle_lote (detalle_venta_id, lote_id),
  CONSTRAINT fk_dvl_detalle FOREIGN KEY (detalle_venta_id) REFERENCES detalle_ventas(id),
  CONSTRAINT fk_dvl_lote FOREIGN KEY (lote_id) REFERENCES lotes(id),
  CONSTRAINT chk_dvl_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  medicamento_id INT UNSIGNED NOT NULL,
  lote_id BIGINT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  venta_id BIGINT UNSIGNED NULL,
  tipo ENUM('entrada','ajuste_entrada','ajuste_salida','venta') NOT NULL,
  cantidad INT NOT NULL,
  stock_anterior INT UNSIGNED NOT NULL,
  stock_posterior INT UNSIGNED NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_movimiento_fecha (creado_en),
  INDEX idx_movimiento_medicamento (medicamento_id, lote_id),
  CONSTRAINT fk_mov_medicamento FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id),
  CONSTRAINT fk_mov_lote FOREIGN KEY (lote_id) REFERENCES lotes(id),
  CONSTRAINT fk_mov_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT fk_mov_venta FOREIGN KEY (venta_id) REFERENCES ventas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS configuraciones (
  clave VARCHAR(80) PRIMARY KEY,
  valor VARCHAR(255) NOT NULL,
  descripcion VARCHAR(200) NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO roles (id,nombre,descripcion) VALUES
(1,'administrador','Acceso completo al sistema'),
(2,'vendedor','Consulta de productos y registro de ventas');
INSERT IGNORE INTO configuraciones (clave,valor,descripcion) VALUES
('dias_alerta_vencimiento','30','Días de anticipación para alertar vencimientos'),
('nombre_botica','Nova Salud','Nombre mostrado en el sistema');

SET FOREIGN_KEY_CHECKS = 1;
