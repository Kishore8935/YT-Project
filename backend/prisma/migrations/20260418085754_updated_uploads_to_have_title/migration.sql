/*
  Warnings:

  - Added the required column `title` to the `Uploads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Uploads" ADD COLUMN     "title" TEXT NOT NULL;
