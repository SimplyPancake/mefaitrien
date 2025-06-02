/*
  Warnings:

  - A unique constraint covering the columns `[year,month]` on the table `MonthRoster` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MonthRoster_year_month_key" ON "MonthRoster"("year", "month");
