import { PrivyClient, User } from "@privy-io/server-auth";
import fs from "fs";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";

async function main() {
  const privy = new PrivyClient("clz41gcg00e4ay75dmq3uzzgr", "secret");
  const users = await privy.getUsers();

  // Filter users who signed up between 15 and 25 October
  const usersFromCleanify = users.filter((user) => {
    const signupDate = new Date(user.createdAt);
    return (
      signupDate >= new Date("2024-10-15") &&
      signupDate <= new Date("2024-10-25")
    );
  });

  // Filter only users with Google email
  const usersFromCleanifyWithGoogleEmail = usersFromCleanify.filter(
    (user) => user.google?.email
  );

  // Extract only the email and createdAt date
  const usersFromCleanifyExtracted = usersFromCleanifyWithGoogleEmail.map(
    (user) => ({
      email: user.google?.email,
      createdAt: user.createdAt.toISOString(),
    })
  );

  console.log(usersFromCleanifyExtracted);

  // Ensure the output folder exists
  const outputFolder = path.join(__dirname, "output");
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
  }

  // Define CSV writer and specify the path and headers
  const csvWriter = createObjectCsvWriter({
    path: path.join(outputFolder, "users_from_cleanify.csv"),
    header: [
      { id: "email", title: "Email" },
      { id: "createdAt", title: "Created At" },
    ],
  });

  // Write data to CSV
  await csvWriter.writeRecords(usersFromCleanifyExtracted);
  console.log("CSV file created successfully in the output folder!");
}

main();
