# How to Set Up GameVault Backend for Local Development

## What You Need

- [Git](https://git-scm.com/)
- [Node.js LTS](https://nodejs.org/)
- [pnpm](https://pnpm.io)
- [Visual Studio Code (\*)](https://code.visualstudio.com/)
- [Docker (\*)](https://www.docker.com/)

`Items with an asterisk (*) are optional, but recommended.`

## Steps to Get Started

1. **Clone the Repository**

   Open your terminal and run:

   ```bash
   git clone https://github.com/Phalcode/gamevault-backend
   ```

2. **Go to the Project Folder**

   Navigate to the directory you just downloaded:

   ```bash
   cd gamevault-backend
   ```

3. **Install the Required Dependencies**

   Install all necessary packages:

   ```bash
   pnpm install
   ```

4. **Set Up Your Environment**

   Copy the sample environment file:

   ```bash
   cp .dev.env .env
   ```

5. **Start the App or Run Tests**

   To start the app:

   ```bash
   pnpm start
   ```

   To run tests:

   ```bash
   pnpm test
   ```

## Contributing

Before contributing, please review and agree to the [Contributors License Agreement](CONTRIBUTING.md) and the [License](LICENSE.md).
