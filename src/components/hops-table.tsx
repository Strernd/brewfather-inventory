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

interface Hop {
  id: string;
  name: string;
  origin: string;
  inventory?: number;
  alpha: number;
  year: number;
  fullName: string;
}

interface Batch {
  batchNo: string;
  name: string;
  status: string;
  hops: {
    id: string;
    name: string;
    origin: string;
    amount: number;
    alpha: number;
    year: number;
    fullName: string;
  }[];
}

interface HopsTableProps {
  hopsInventory: Hop[];
  batches: Batch[];
}

function roundToSigFigs(num: number, sigFigs: number): number {
  if (num === 0) return 0;
  const magnitude = Math.floor(Math.log10(Math.abs(num))) + 1;
  const scale = Math.pow(10, sigFigs - magnitude);
  return Math.round(num * scale) / scale;
}

export default function HopsTable({
  hopsInventory: inventory,
  batches,
}: HopsTableProps) {
  const { groupedHops, remainingInventory } = useMemo(() => {
    const hopsMap = new Map<string, Hop>();

    // Add inventory hops
    inventory.forEach((item) => {
      hopsMap.set(item.id, { ...item, inventory: item.inventory || 0 });
    });

    // Add batch hops
    batches
      .flatMap((batch) => batch.hops)
      .forEach((item) => {
        if (!hopsMap.has(item.id)) {
          hopsMap.set(item.id, { ...item, inventory: 0 });
        }
      });

    const combinedHops = Array.from(hopsMap.values());

    // Group hops by origin
    const groupedHops = combinedHops.reduce((acc, item) => {
      if (!acc[item.origin]) {
        acc[item.origin] = [];
      }
      acc[item.origin].push(item);
      return acc;
    }, {} as Record<string, Hop[]>);

    // Calculate remaining inventory
    const remainingInventory = combinedHops.map((item) => {
      const used = batches.reduce((total, batch) => {
        const batchItems = batch.hops.filter((h) => h.id === item.id);
        return total + batchItems.reduce((sum, h) => sum + h.amount, 0);
      }, 0);
      return {
        ...item,
        remaining: (item.inventory || 0) - used,
      };
    });

    return { groupedHops, remainingInventory };
  }, [inventory, batches]);

  const origins = Object.keys(groupedHops);

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
            {origins.map((origin) => (
              <TableHead
                key={origin}
                colSpan={groupedHops[origin].length}
                className="text-center border"
              >
                {origin}
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            {origins.flatMap((origin) =>
              groupedHops[origin].map((item) => (
                <TableHead
                  key={item.id}
                  className="p-0 w-16 h-48 align-bottom relative"
                >
                  <div className="absolute transform -rotate-90 bottom-16 left-[-20px] w-32 text-left font-bold">
                    {item.fullName}
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
            {origins.flatMap((origin) =>
              groupedHops[origin].map((item) => (
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
              {origins.flatMap((origin) =>
                groupedHops[origin].map((item) => {
                  const batchItems = batch.hops.filter((h) => h.id === item.id);
                  const totalAmount = batchItems.reduce(
                    (sum, h) => sum + h.amount,
                    0
                  );
                  return (
                    <TableCell
                      key={item.id}
                      className="text-center font-mono w-16"
                    >
                      {totalAmount > 0 ? roundToSigFigs(totalAmount, 3) : 0}
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
            {origins.flatMap((origin) =>
              groupedHops[origin].map((item) => {
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

