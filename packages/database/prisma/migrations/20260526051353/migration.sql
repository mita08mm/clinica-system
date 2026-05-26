/*
  Warnings:

  - The values [FOTO_FACIAL,FOTO_CORPORAL,FOTO_CAPILAR,ESTUDIO_DERMATOLOGICO,CONSENTIMIENTO_INFORMADO,FORMULARIO_EVALUACION,OTRO] on the enum `TipoDocumento` will be removed. If these variants are still used in the database, this will fail.
  - The values [OTRO] on the enum `TipoDocumentoIdentidad` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `descuento` on the `cobros` table. All the data in the column will be lost.
  - You are about to drop the column `notas` on the `cobros` table. All the data in the column will be lost.
  - You are about to drop the column `categoria` on the `documentos` table. All the data in the column will be lost.
  - You are about to drop the column `descripcion` on the `documentos` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `documentos` table. All the data in the column will be lost.
  - You are about to drop the column `momento` on the `documentos` table. All the data in the column will be lost.
  - You are about to drop the column `tamaño` on the `documentos` table. All the data in the column will be lost.
  - You are about to drop the column `tratamientoId` on the `documentos` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `items_cobro` table. All the data in the column will be lost.
  - You are about to drop the column `altura` on the `pacientes` table. All the data in the column will be lost.
  - You are about to drop the column `fotoUrl` on the `pacientes` table. All the data in the column will be lost.
  - You are about to drop the column `grupoSanguineo` on the `pacientes` table. All the data in the column will be lost.
  - You are about to drop the column `peso` on the `pacientes` table. All the data in the column will be lost.
  - You are about to drop the column `duracion` on the `protocolos` table. All the data in the column will be lost.
  - You are about to drop the column `indicaciones` on the `protocolos` table. All the data in the column will be lost.
  - You are about to drop the column `medidas` on the `tratamientos` table. All the data in the column will be lost.
  - You are about to drop the column `parametros` on the `tratamientos` table. All the data in the column will be lost.
  - You are about to drop the column `productosUsados` on the `tratamientos` table. All the data in the column will be lost.
  - You are about to drop the column `reaccionesInmediatas` on the `tratamientos` table. All the data in the column will be lost.
  - You are about to drop the column `recomendacionesPostTratamiento` on the `tratamientos` table. All the data in the column will be lost.
  - You are about to drop the column `sesionNumero` on the `tratamientos` table. All the data in the column will be lost.
  - You are about to drop the column `totalSesiones` on the `tratamientos` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoDocumento_new" AS ENUM ('FOTO', 'DOCUMENTO');
ALTER TABLE "documentos" ALTER COLUMN "tipo" TYPE "TipoDocumento_new" USING ("tipo"::text::"TipoDocumento_new");
ALTER TYPE "TipoDocumento" RENAME TO "TipoDocumento_old";
ALTER TYPE "TipoDocumento_new" RENAME TO "TipoDocumento";
DROP TYPE "public"."TipoDocumento_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TipoDocumentoIdentidad_new" AS ENUM ('DNI', 'PASAPORTE');
ALTER TABLE "pacientes" ALTER COLUMN "tipoDocumento" TYPE "TipoDocumentoIdentidad_new" USING ("tipoDocumento"::text::"TipoDocumentoIdentidad_new");
ALTER TYPE "TipoDocumentoIdentidad" RENAME TO "TipoDocumentoIdentidad_old";
ALTER TYPE "TipoDocumentoIdentidad_new" RENAME TO "TipoDocumentoIdentidad";
DROP TYPE "public"."TipoDocumentoIdentidad_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "documentos" DROP CONSTRAINT "documentos_tratamientoId_fkey";

-- DropForeignKey
ALTER TABLE "items_cobro" DROP CONSTRAINT "ItemCobro_producto_fkey";

-- DropForeignKey
ALTER TABLE "items_cobro" DROP CONSTRAINT "ItemCobro_servicio_fkey";

-- DropIndex
DROP INDEX "documentos_momento_idx";

-- DropIndex
DROP INDEX "documentos_tratamientoId_idx";

-- AlterTable
ALTER TABLE "cobros" DROP COLUMN "descuento",
DROP COLUMN "notas";

-- AlterTable
ALTER TABLE "documentos" DROP COLUMN "categoria",
DROP COLUMN "descripcion",
DROP COLUMN "mimeType",
DROP COLUMN "momento",
DROP COLUMN "tamaño",
DROP COLUMN "tratamientoId",
ADD COLUMN     "publicId" TEXT;

-- AlterTable
ALTER TABLE "items_cobro" DROP COLUMN "itemId",
ADD COLUMN     "productoId" TEXT,
ADD COLUMN     "servicioId" TEXT;

-- AlterTable
ALTER TABLE "pacientes" DROP COLUMN "altura",
DROP COLUMN "fotoUrl",
DROP COLUMN "grupoSanguineo",
DROP COLUMN "peso";

-- AlterTable
ALTER TABLE "protocolos" DROP COLUMN "duracion",
DROP COLUMN "indicaciones";

-- AlterTable
ALTER TABLE "tratamientos" DROP COLUMN "medidas",
DROP COLUMN "parametros",
DROP COLUMN "productosUsados",
DROP COLUMN "reaccionesInmediatas",
DROP COLUMN "recomendacionesPostTratamiento",
DROP COLUMN "sesionNumero",
DROP COLUMN "totalSesiones";

-- DropEnum
DROP TYPE "CategoriaFoto";

-- DropEnum
DROP TYPE "MomentoFoto";

-- CreateIndex
CREATE INDEX "items_cobro_servicioId_idx" ON "items_cobro"("servicioId");

-- CreateIndex
CREATE INDEX "items_cobro_productoId_idx" ON "items_cobro"("productoId");

-- AddForeignKey
ALTER TABLE "items_cobro" ADD CONSTRAINT "items_cobro_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_cobro" ADD CONSTRAINT "items_cobro_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
