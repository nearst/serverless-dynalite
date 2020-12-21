# serverless-dynalite

A Serverless plugin to run Dynalite locally to handle DynamoDB development. This is heavily inspired by the [serverless-dynalite](https://github.com/sdd/serverless-dynalite) plugin by Scott Donnelly. 

Features:

* Integrates with `serverless-offline`.
* Seeds Tables from a js file
* Creates Tables from your Resources

## Getting Started

Install the node package with npm or yarn

```bash
npm install @nearst/serverless-dynalite --save-dev
```

```bash
yarn add -D @nearst/serverless-dynalite
```

Once the package is installed add it to the plugins section of your `serverless.yml`. The serverless offline plugin also needs to be installed

```yaml
plugins:
  - '@nearst/serverless-dynalite'
  - serverless-offline
custom:
  # This is optional
  dynalite:
    region: localhost
    port: 8000
    dir: ./
    seed: 
    - table: table-1
      source: ./seed/table1.js
```
