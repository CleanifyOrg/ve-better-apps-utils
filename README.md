# Vorj NFT Metadata Generator

[Vorj](https://vorj.app/dashboard) needs a unique image for each ERC721 NFT and a custom metadata json file. 

This generator will avoid you to copy/paste 5000 times the same file and prepare for you the correct metadata for each of them by doing it for you.

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
    yarn generate 100
    ```
where 100 is the number of nfts you want to mint.

## Output

After running the script, an `output` folder will be created in the project root containing:

- images
- metadata.json

## Mint

Go to [Vorj](https://vorj.app/dashboard), create smart contract, upload all the images and the json file.




