import { MongoClient } from "mongodb";
import { randomUUID } from "crypto";

const url = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || "veyra_ai";

if (!url) throw new Error("MONGO_URL missing");

const client = new MongoClient(url);
await client.connect();

const db = client.db(dbName);

const userId = "f629d2ae-205b-4840-8a60-739f3c516dac";

const company = {
  id: randomUUID(),
  name: "Veyra Test Company",
  type: "company",
  ownerUserId: userId,
  createdAt: new Date(),
  updatedAt: new Date(),
};

await db.collection("organizations").insertOne(company);

await db.collection("users").updateOne(
  { id: userId },
  {
    $set: {
      role: "company_admin",
      organizationId: company.id,
      organizationType: "company",
      updatedAt: new Date(),
    },
  }
);

console.log("COMPANY ORGANIZATION CREATED:");
console.log(company);

await client.close();
