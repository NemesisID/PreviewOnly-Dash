"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/file-utils";

function extractLatLong(link: string) {
  if (!link) return null;
  const atMatch = link.match(/@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  if (atMatch) {
    return { latitude: Number(atMatch[1]), longitude: Number(atMatch[2]) };
  }

  const dataMatch = link.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (dataMatch) {
    return { latitude: Number(dataMatch[1]), longitude: Number(dataMatch[2]) };
  }

  const llMatch = link.match(/\/\?ll=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  if (llMatch) {
    return { latitude: Number(llMatch[1]), longitude: Number(llMatch[2]) };
  }

  const queryMatch = link.match(/(?:q|query|ll)=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  if (queryMatch) {
    return { latitude: Number(queryMatch[1]), longitude: Number(queryMatch[2]) };
  }

  const shortMatch = link.match(/\/maps\/place\/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  if (shortMatch) {
    return { latitude: Number(shortMatch[1]), longitude: Number(shortMatch[2]) };
  }

  const placeMatch = link.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  if (placeMatch) {
    return { latitude: Number(placeMatch[1]), longitude: Number(placeMatch[2]) };
  }

  return null;
}

async function resolveMapsLink(link: string) {
  try {
    const response = await fetch(link, { redirect: "follow" });
    return response.url || link;
  } catch {
    return link;
  }
}

export async function createOutlet(formData: FormData) {
  const name = String(formData.get("name") || "");
  const type = String(formData.get("type") || "");
  const address = String(formData.get("address") || "");
  const google_maps_link = String(formData.get("google_maps_link") || "");
  const image = formData.get("image") as File | null;

  if (!image || image.size === 0) {
    throw new Error("Image is required.");
  }

  const resolvedLink = await resolveMapsLink(google_maps_link);
  const coords = extractLatLong(resolvedLink) || extractLatLong(google_maps_link);
  if (!coords) {
    throw new Error(
      "Unable to parse latitude/longitude from Maps link. Please paste a Google Maps share link that includes coordinates."
    );
  }

  const image_path = await saveFile(image, "uploads/outlets");

  await prisma.outlet.create({
    data: {
      name,
      type,
      address,
      google_maps_link,
      latitude: coords.latitude,
      longitude: coords.longitude,
      image_path,
    },
  });

  revalidatePath("/dashboard/outlets");
}

export async function updateOutlet(id: number, formData: FormData) {
  const name = String(formData.get("name") || "");
  const type = String(formData.get("type") || "");
  const address = String(formData.get("address") || "");
  const google_maps_link = String(formData.get("google_maps_link") || "");
  const image = formData.get("image") as File | null;

  const resolvedLink = await resolveMapsLink(google_maps_link);
  const coords = extractLatLong(resolvedLink) || extractLatLong(google_maps_link);
  if (!coords) {
    throw new Error(
      "Unable to parse latitude/longitude from Maps link. Please paste a Google Maps share link that includes coordinates."
    );
  }

  const data: {
    name: string;
    type: string;
    address: string;
    google_maps_link: string;
    latitude: number;
    longitude: number;
    image_path?: string;
  } = {
    name,
    type,
    address,
    google_maps_link,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };

  if (image && image.size > 0) {
    data.image_path = await saveFile(image, "uploads/outlets");
  }

  await prisma.outlet.update({ where: { id }, data });
  revalidatePath("/dashboard/outlets");
}

export async function deleteOutlet(id: number) {
  await prisma.outlet.delete({ where: { id } });
  revalidatePath("/dashboard/outlets");
}
