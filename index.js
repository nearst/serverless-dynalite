const Dynalite = require('dynalite');
const AWS = require('aws-sdk');
const path = require('path')
const DEFAULT_PORT = 8000;
const DEFAULT_REGION = 'localhost';
const DEFAULT_DIR = undefined;

class ServerlessDynalite {

    constructor(serverless, options) {
        this.serverless = serverless;
        
        this.service = serverless.service;

        this.log = serverless.cli.log.bind(serverless.cli);
        this.config = this.service.custom && this.service.custom.dynalite || {};
        this.options = options;

        this.hooks = {
            "before:offline:start:init": this.startHandler.bind(this),
            "before:offline:start:end": this.endHandler.bind(this)
        };
    }

    get port() {
        return this.config.port || DEFAULT_PORT;
    }

    get dir() {
        return this.config.dir || DEFAULT_DIR
    }

    get region() {
        return this.config.region || DEFAULT_REGION
    }

    get dynamodb() {

        const dynamoOptions = {
            endpoint: `http://localhost:${this.port}`,
            region: this.region
        };

        this._dynamodb = {
            raw: new AWS.DynamoDB(dynamoOptions),
            doc: new AWS.DynamoDB.DocumentClient(dynamoOptions)
        };

        return this._dynamodb;
    }

    async startHandler() {
        this.dynalite = Dynalite({ createTableMs: 0, path: this.dir });
        await new Promise(
            (res, rej) => this.dynalite.listen(this.port, err => err ? rej(err) : res())
        );

        this.log(`Dynalite listening on http://localhost:${ this.port }`);

        if(this.service.resources && this.service.resources.Resources) {
            let resources = Object.values(this.service.resources.Resources);
            let tables = resources.filter(el => el.Type === 'AWS::DynamoDB::Table').map(el => ({
                TableName: el.Properties.TableName,
                AttributeDefinitions: el.Properties.AttributeDefinitions,
                KeySchema: el.Properties.KeySchema,
                BillingMode: el.Properties.BillingMode,
                GlobalSecondaryIndexes: el.Properties.GlobalSecondaryIndexes
            }));
            for(let table of tables) {
                try {
                    this.log(`Dynalite creating table ${table.TableName}`)
                    await this.dynamodb.raw.createTable(table).promise()
                } catch(e) {
                    this.log(e.message)
                }
            }

            if(this.config.seed) {
                for(let seed of this.config.seed) {
                    if(!seed.source) {
                        throw Error(`Source is 'undefined' for ${seed.table}`)
                    }
                    let items = require(path.join(process.cwd(), seed.source))
                    await Promise.all(items.map(Item => this.dynamodb.doc.put({ TableName: seed.table, Item}).promise()))
                }
            }
        }
    }

    endHandler() {
        this.dynalite.close();
    }
}

module.exports = ServerlessDynalite;
