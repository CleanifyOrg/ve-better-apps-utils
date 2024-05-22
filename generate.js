const fs = require("fs");
const path = require("path");

// Get the number of cycles from the command-line arguments
const args = process.argv.slice(2);
const numberOfCycles = args.length > 0 ? parseInt(args[0], 10) : 5000;
if (isNaN(numberOfCycles) || numberOfCycles <= 0) {
  console.error("Please provide a valid number of items.");
  process.exit(1);
} else {
  console.log(`Generating ${numberOfCycles} items...`);
}

// Directories
const srcDir = path.join(__dirname, "src");
const outputDir = path.join(__dirname, "output");
const imagesOutputDir = path.join(outputDir, "/images");

// Read the initial JSON file
const jsonFilePath = path.join(srcDir, "metadata.json");
const imageFilePath = path.join(srcDir, "image.jpeg");

// Reset the output directory
if (fs.existsSync(imagesOutputDir)) {
  fs.rmSync(imagesOutputDir, { recursive: true });
}
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true });
}

// Ensure the output directory exists
fs.mkdirSync(outputDir);
fs.mkdirSync(imagesOutputDir);

// Read and parse the initial JSON
const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));

// Generate {numberOfCycles} objects
const generatedData = [];
for (let i = 1; i <= numberOfCycles; i++) {
  let newItem = JSON.parse(JSON.stringify(jsonData[0]));
  newItem.tokenId = i.toString();
  generatedData.push(newItem);

  // Copy and rename the image
  const newImagePath = path.join(imagesOutputDir, `${i}.png`);
  fs.copyFileSync(imageFilePath, newImagePath);
}

// Write the generated JSON to a file
const outputJsonFilePath = path.join(outputDir, "metadata.json");
fs.writeFileSync(outputJsonFilePath, JSON.stringify(generatedData, null, 2));

console.log("JSON file and images generated successfully.");
