# JSON and Image File Generator

This project contains a Node.js script that generates a JSON file with 5000 objects and copies an image file 5000 times, each with a unique name based on the `tokenId`.

## Prerequisites

- Node.js installed on your machine. You can download it from [nodejs.org](https://nodejs.org/).

## Setup

1. **Create the `src` folder**: Ensure you have a `src` directory in the project root.
2. **Add `metadata.json` and `image.jpeg`**: Place your initial JSON file and image file inside the `src` directory.

### Example `metadata.json` Content

```json
[
  {
    "tokenId": "1",
    "data": {
      "description": "Solarwise panels in Paraná, Brazil.",
      "external_url": "https://openseacreatures.io/3",
      "name": "Dave Starbelly",
      "attributes": [
        {
          "trait_type": "Country",
          "value": "Brazil"
        },
        {
          "trait_type": "State",
          "value": "Paraná"
        },
        {
          "trait_type": "Construction Year",
          "value": "2024"
        },
        {
          "trait_type": "Total Panels",
          "value": "200"
        },
        {
          "trait_type": "System Output",
          "value": "110 kwp"
        },
        {
          "trait_type": "Average Output per NFT",
          "value": "4.44 kWh/m"
        }
      ]
    }
  }
]
```

## Usage

Navigate to the project directory:

    ```bash
    cd metadata-generator
    ```

Run the script:

    ```bash
    yarn generate
    ```

This will generate 5000 items. If you want to generate a different number of items, you can pass the desired
number as an argument:

    ```bash
    yarn generate 100
    ```

## Output

After running the script, an `output` folder will be created in the project root containing:

metadata.json: A JSON file with 5000 objects, each with a unique tokenId.
images folder with 5000 image files: Named from 1.png to 5000.png, each a copy of the original image.png.
