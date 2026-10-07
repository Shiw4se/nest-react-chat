-- AlterTable: existing rows are numbered in physical order
ALTER TABLE "Message" ADD COLUMN "seq" SERIAL NOT NULL;
