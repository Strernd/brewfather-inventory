"use client";

import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Fermentable {
  id: string;
  name: string;
  supplier: string;
  inventory?: number;
}

interface Batch {
  batchNo: string;
  name: string;
  status: string;
  fermentables: {
    id: string;
    name: string;
    supplier: string;
    amount: number;
  }[];
}

interface FermentablesTableProps {
  fermentablesInventory: Fermentable[];
  batches: Batch[];
}

function roundToSigFigs(num: number, sigFigs: number): number {
  if (num > -0.0001 && num < 0.0001) return 0;
  const magnitude = Math.floor(Math.log10(Math.abs(num))) + 1;
  const scale = Math.pow(10, sigFigs - magnitude);
  return Math.round(num * scale) / scale;
}

export default function FermentablesTable({
  fermentablesInventory: inventory,
  batches,
}: FermentablesTableProps) {
  const { groupedFermentables, remainingInventory } = useMemo(() => {
    const fermentablesMap = new Map<string, Fermentable>();

    // Add inventory fermentables
    inventory.forEach((item) => {
      fermentablesMap.set(item.id, { ...item, inventory: item.inventory || 0 });
    });

    // Add batch fermentables
    batches
      .flatMap((batch) => batch.fermentables)
      .forEach((item) => {
        if (!fermentablesMap.has(item.id)) {
          fermentablesMap.set(item.id, { ...item, inventory: 0 });
        }
      });

    const combinedFermentables = Array.from(fermentablesMap.values());

    // Group fermentables by supplier
    const groupedFermentables = combinedFermentables.reduce((acc, item) => {
      if (!acc[item.supplier]) {
        acc[item.supplier] = [];
      }
      acc[item.supplier].push(item);
      return acc;
    }, {} as Record<string, Fermentable[]>);

    // Calculate remaining inventory
    const remainingInventory = combinedFermentables.map((item) => {
      const used = batches.reduce((total, batch) => {
        const batchItem = batch.fermentables.find((f) => f.id === item.id);
        return total + (batchItem ? batchItem.amount : 0);
      }, 0);
      return {
        ...item,
        remaining: (item.inventory || 0) - used,
      };
    });

    return { groupedFermentables, remainingInventory };
  }, [inventory, batches]);

  const suppliers = Object.keys(groupedFermentables);

  return (
    <div className="overflow-x-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead
              rowSpan={2}
              className="sticky w-64 left-0 z-20 bg-background"
            >
              Batch
            </TableHead>
            {suppliers.map((supplier) => (
              <TableHead
                key={supplier}
                colSpan={groupedFermentables[supplier].length}
                className="text-center border"
              >
                {supplier}
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            {suppliers.flatMap((supplier) =>
              groupedFermentables[supplier].map((item) => (
                <TableHead
                  key={item.id}
                  className="p-0 w-16 h-48 align-bottom relative"
                >
                  <div className="absolute transform -rotate-90 bottom-16 left-[-20px] w-32 text-left font-bold">
                    {item.name}
                  </div>
                </TableHead>
              ))
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-bold sticky w-32 left-0 z-10 bg-background">
              Current Inventory
            </TableCell>
            {suppliers.flatMap((supplier) =>
              groupedFermentables[supplier].map((item) => (
                <TableCell
                  key={item.id}
                  className="text-center font-mono font-bold"
                >
                  {roundToSigFigs(item.inventory || 0, 3)}
                </TableCell>
              ))
            )}
          </TableRow>
          {batches.map((batch) => (
            <TableRow key={batch.batchNo}>
              <TableCell className="font-bold sticky left-0 z-10 bg-background">
                {batch.batchNo} - {batch.name}
              </TableCell>
              {suppliers.flatMap((supplier) =>
                groupedFermentables[supplier].map((item) => {
                  const batchItem = batch.fermentables.find(
                    (f) => f.id === item.id
                  );
                  return (
                    <TableCell
                      key={item.id}
                      className="text-center font-mono w-16"
                    >
                      {batchItem ? roundToSigFigs(batchItem.amount, 3) : 0}
                    </TableCell>
                  );
                })
              )}
            </TableRow>
          ))}
          <TableRow className="font-bold">
            <TableCell className="sticky left-0 z-10 bg-background">
              Remaining Inventory
            </TableCell>
            {suppliers.flatMap((supplier) =>
              groupedFermentables[supplier].map((item) => {
                const remainingItem = remainingInventory.find(
                  (ri) => ri.id === item.id
                );
                return (
                  <TableCell
                    key={item.id}
                    className={cn(
                      "text-center font-mono",
                      (remainingItem?.remaining || 0) < 0 && "text-red-600",
                      (remainingItem?.remaining || 0) === 0 && "text-green-600"
                    )}
                  >
                    {remainingItem
                      ? roundToSigFigs(remainingItem.remaining, 3)
                      : 0}
                  </TableCell>
                );
              })
            )}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

