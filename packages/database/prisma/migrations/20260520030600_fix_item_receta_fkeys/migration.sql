-- DropForeignKey
ALTER TABLE "items_receta" DROP CONSTRAINT "ItemReceta_insumo_fkey";

-- DropForeignKey
ALTER TABLE "items_receta" DROP CONSTRAINT "ItemReceta_medicamento_fkey";

-- AlterTable
ALTER TABLE "items_receta" ADD COLUMN     "insumoId" TEXT,
ADD COLUMN     "medicamentoId" TEXT;

-- AddForeignKey
ALTER TABLE "items_receta" ADD CONSTRAINT "items_receta_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_receta" ADD CONSTRAINT "items_receta_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "insumos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
