import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { tags } from "@/db/schema";

export async function listTags() {
  return db.query.tags.findMany({ orderBy: [asc(tags.name)] });
}
