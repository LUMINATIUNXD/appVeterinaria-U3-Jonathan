CREATE DATABASE IF NOT EXISTS veterinaria_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE veterinaria_db;

CREATE TABLE IF NOT EXISTS citas (
  id INT NOT NULL AUTO_INCREMENT,
  mascota VARCHAR(80) NOT NULL,
  cliente VARCHAR(120) NOT NULL,
  servicio VARCHAR(120) NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado ENUM('solicitada', 'confirmada', 'atendida', 'rechazada', 'cancelada')
    NOT NULL DEFAULT 'solicitada',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_citas_fecha_hora (fecha, hora),
  INDEX idx_citas_estado (estado)
);
