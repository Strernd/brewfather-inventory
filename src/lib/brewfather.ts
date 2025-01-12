export async function getHops(userId: string, apiKey: string) {
  const baseAuth = btoa(`${userId}:${apiKey}`);
  const res = await fetch(
    "https://api.brewfather.app/v2/inventory/hops?inventory_exists=True&limit=50&include=origin,year,userNotes",
    { 
      headers: {
        Authorization: `Basic ${baseAuth}`,
      }
    }
  );
  const data = (await res.json()) as any[];
  return data.map((x) => ({
    id: x._id,
    name: x.name,
    inventory: x.inventory,
    origin: x.origin,
    alpha: x.alpha,
    fullName: `${x.name}${x.type === "Cryo" ? " (Cryo)" : ""} ${x.alpha}% ${
      x.year ? x.year : ""
    } ${x.userNotes ? `(${x.userNotes})` : ""}`,
    year: x.year,
  }));
}

export async function getFermentables(userId: string, apiKey: string) {
  const baseAuth = btoa(`${userId}:${apiKey}`);
  const res = await fetch(
    "https://api.brewfather.app/v2/inventory/fermentables?inventory_exists=True&limit=50",
    { 
      headers: {
        Authorization: `Basic ${baseAuth}`,
      }
    }
  );
  const data = (await res.json()) as any[];
  return data.map((x) => ({
    id: x._id,
    name: x.name,
    supplier: x.supplier,
    inventory: x.inventory,
  }));
}

export async function getBatches(userId: string, apiKey: string) {
  const baseAuth = btoa(`${userId}:${apiKey}`);
  const res = await fetch(
    "https://api.brewfather.app/v2/batches?limit=50&order_by=brewDate&order_by_direction=desc&status=Planning&include=recipe,measuredOg,measuredFg,measuredAbv,estimatedIbu,bottlingDate,notes",
    { 
      headers: {
        Authorization: `Basic ${baseAuth}`,
      }
    }
  );
  const data = (await res.json()) as any[];

  return data
    .filter((x) => x.batchNo < 1000)
    .sort((a, b) => a.batchNo - b.batchNo);
}

export async function getBatchesWithFermentables(userId: string, apiKey: string) {
  const batches = await getBatches(userId, apiKey);
  return batches.map((x) => ({
    batchNo: x.batchNo,
    name: x.recipe.name,
    status: x.status,
    fermentables: x.recipe.fermentables.map((y: any) => ({
      name: y.name,
      supplier: y.supplier,
      amount: y.amount,
      id: y._id,
    })),
    hops: x.recipe.hops.map((y: any) => ({
      id: y._id,
      year: y.year,
      name: y.name,
      origin: y.origin,
      amount: y.amount,
      alpha: y.alpha,
      fullName: `${y.name}${y.type === "Cryo" ? " (Cryo)" : ""} ${y.alpha}% ${
        y.year ? y.year : ""
      } ${!!y.userNotes ? `(${y.userNotes})` : ""}`,
    })),
  }));
}

export async function getBatch(id: string, userId: string, apiKey: string) {
  const baseAuth = btoa(`${userId}:${apiKey}`);
  const res = await fetch(`https://api.brewfather.app/v2/batches/${id}`, {
    headers: {
      Authorization: `Basic ${baseAuth}`,
    },
  });
  const data = await res.json();
  return {
    name: data.recipe.name,
    style: data.recipe.style.type,
    originalGravity: plato(data.measuredOg),
    finalGravity: plato(data.measuredFg),
    abv: data.measuredAbv,
    ibu: data.estimatedIbu,
  };
}

const plato = (sg: number) => Math.round((260.4 - 260.4 / sg) * 10) / 10;

