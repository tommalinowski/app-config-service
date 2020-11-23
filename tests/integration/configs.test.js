const request = require('supertest');
const Config = require('./../../models/configModel');

let server;

describe('/config', () => {
  beforeEach(() => {
    server = require('../../server');
  });
  afterEach(async () => {
    server.close();
    await Config.remove({});
  });

  const getTestsTestData = [
    {
      client: 'ios',
      version: 108,
      clientConfigs: {
        configA: 'valueA',
        configB: 'valueB',
      },
    },
    {
      client: 'ios',
      version: 109,
      clientConfigs: {
        configC: 'valueC',
        configD: 'valueD',
        configE: 'valueE',
      },
    },
    {
      client: 'ios',
      version: 105,
      clientConfigs: {
        configF: 'valueF',
        configG: 'valueG',
      },
    },
    {
      client: 'android',
      version: 200,
      clientConfigs: {
        configX: 'valueX',
      },
    },
    {
      client: 'android',
      version: 105,
      clientConfigs: {
        configX: 'valueX',
      },
    },
  ];

  const existingConfig = {
    client: 'ios',
    version: 500,
    clientConfigs: {
      configX: 'valueX',
      configZ: 'valueZ',
    },
  };

  describe('GET /:client', () => {
    let client;
    it('should get config for the highest version based on client type', async () => {
      client = 'ios';
      await Config.collection.insertMany(getTestsTestData);
      const res = await request(server).get(`/config/${client}`);
      expect(res.status).toBe(200);
      expect(Object.keys(res.body).length).toBe(3);
      expect(res.body).toHaveProperty('configC', 'valueC');
      expect(res.body).toHaveProperty('configD', 'valueD');
      expect(res.body).toHaveProperty('configE', 'valueE');
    });

    it('should return 404 when config for requested client is not found', async () => {
      client = 'ios2';
      await Config.collection.insertMany(getTestsTestData);
      const res = await request(server).get(`/config/${client}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /:client/:version', () => {
    const client = 'ios';
    let version;
    it('should get config for the specific client and version', async () => {
      version = 105;
      await Config.collection.insertMany(getTestsTestData);
      const res = await request(server).get(`/config/${client}/${version}`);
      expect(res.status).toBe(200);
      expect(Object.keys(res.body).length).toBe(2);
      expect(res.body).toHaveProperty('configF', 'valueF');
      expect(res.body).toHaveProperty('configG', 'valueG');
    });

    it('should return 404 when config for requested client and version is not found', async () => {
      version = 200;
      await Config.collection.insertMany(getTestsTestData);
      const res = await request(server).get(`/config/${client}/${version}`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /', () => {
    const newConfig = {
      client: 'ios',
      version: 308,
      key: 'configA',
      value: 'valueA',
    };

    it('should create new config', async () => {
      const res = await request(server).post('/config').send(newConfig);
      expect(res.status).toBe(201);
      expect(Object.keys(res.body).length).toBe(3);
      expect(res.body).toHaveProperty('client', newConfig.client);
      expect(res.body).toHaveProperty('version', newConfig.version);
      expect(res.body).toHaveProperty('configA', 'valueA');
    });

    it('should fail to create new config - config for given client and version already exists', async () => {
      // insert config for given client / version combination
      await Config.collection.insertOne(newConfig);
      // try to create
      const res = await request(server).post('/config').send(newConfig);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'Duplicate value for fields: client, version. Please use another value!'
      );
    });

    it('should fail to create new config - forbidden key value', async () => {
      const config = {
        ...newConfig,
        key: 'version',
      };

      const res = await request(server).post('/config').send(config);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'Invalid input data. Proper key parameter for config change has to be provided - type: string'
      );
    });

    it('should fail to create new config - missing client property', async () => {
      const config = {
        ...newConfig,
      };
      delete config.client;

      const res = await request(server).post('/config').send(config);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'Invalid input data. Client name has to be provided - type: string'
      );
    });

    it('should fail to create new config - wrong version property format', async () => {
      const config = {
        ...newConfig,
        version: '123z',
      };

      const res = await request(server).post('/config').send(config);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'Invalid input data. Proper version has to be provided - type: number'
      );
    });

    it('should fail to create new config - missing value property', async () => {
      const config = {
        ...newConfig,
      };

      delete config.value;

      const res = await request(server).post('/config').send(config);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'Invalid input data. Proper value parameter for config change has to be provided - type: string'
      );
    });
  });

  describe('PUT /:client/:version', () => {
    const updateBody = {
      key: 'configA',
      value: 'valueA',
    };

    it('should replace client configs for given client and version', async () => {
      await Config.collection.insertOne(existingConfig);
      const res = await request(server)
        .put(`/config/${existingConfig.client}/${existingConfig.version}`)
        .send(updateBody);

      expect(res.status).toBe(200);
      expect(Object.keys(res.body).length).toBe(1);
      expect(res.body).toHaveProperty(updateBody.key, updateBody.value);

      // validate result in db
      const configInDb = await Config.findOne({
        client: existingConfig.client,
        version: existingConfig.version,
      });
      expect(configInDb).toHaveProperty('clientConfigs');
      const clientConfigsEntries = configInDb.clientConfigs;
      expect(clientConfigsEntries.size).toBe(1);
      expect(clientConfigsEntries.get(updateBody.key)).toEqual(
        updateBody.value
      );
    });

    it('should fail to replace client configs for given client and version - wrong value property format', async () => {
      const config = {
        ...updateBody,
        value: ['ww'],
      };
      await Config.collection.insertOne(existingConfig);
      const res = await request(server)
        .put(`/config/${existingConfig.client}/${existingConfig.version}`)
        .send(config);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'Invalid input data. Proper value parameter for config change has to be provided - type: string'
      );
    });

    it('should fail to replace client configs for given client and version - existing config not found', async () => {
      await Config.collection.insertOne(existingConfig);
      const res = await request(server)
        .put(`/config/${existingConfig.client}/${existingConfig.version + 1}`)
        .send(updateBody);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /', () => {
    const patchBody = {
      key: 'configA',
      value: 'valueA',
      client: existingConfig.client,
      version: existingConfig.version,
    };

    it('should update client configs', async () => {
      await Config.collection.insertOne(existingConfig);
      const res = await request(server).patch('/config').send(patchBody);
      expect(res.status).toBe(200);
      expect(Object.keys(res.body).length).toBe(5);
      expect(res.body).toHaveProperty(patchBody.key, patchBody.value);
      expect(res.body).toHaveProperty(
        'configX',
        existingConfig.clientConfigs.configX
      );
      expect(res.body).toHaveProperty(
        'configY',
        existingConfig.clientConfigs.configY
      );

      // validate result in db
      const configInDb = await Config.findOne({
        client: existingConfig.client,
        version: existingConfig.version,
      });
      expect(configInDb).toHaveProperty('clientConfigs');
      const clientConfigsEntries = configInDb.clientConfigs;
      expect(clientConfigsEntries.size).toBe(3);
    });

    it('should fail to update client configs - wrong key property value', async () => {
      const config = {
        ...patchBody,
        key: 'version',
      };
      await Config.collection.insertOne(existingConfig);
      const res = await request(server).patch('/config').send(config);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'Invalid input data. Proper key parameter for config change has to be provided - type: string'
      );
    });

    it('should fail to update client configs - missing version', async () => {
      const config = {
        ...patchBody,
      };
      delete config.version;
      await Config.collection.insertOne(existingConfig);
      const res = await request(server).patch('/config').send(config);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'Invalid input data. Proper version has to be provided - type: number'
      );
    });

    it('should fail to update client configs - config not found', async () => {
      const config = {
        ...patchBody,
        version: 300,
      };

      await Config.collection.insertOne(existingConfig);
      const res = await request(server).patch('/config').send(config);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /:client/:version', () => {
    const patchBody = {
      key: 'configA',
      value: 'valueA',
    };

    it('should update client configs for proper version and client', async () => {
      await Config.collection.insertOne(existingConfig);
      const res = await request(server)
        .patch(`/config/${existingConfig.client}/${existingConfig.version}`)
        .send(patchBody);
      expect(res.status).toBe(200);
      expect(Object.keys(res.body).length).toBe(3);
      expect(res.body).toHaveProperty(patchBody.key, patchBody.value);
      expect(res.body).toHaveProperty(
        'configX',
        existingConfig.clientConfigs.configX
      );
      expect(res.body).toHaveProperty(
        'configY',
        existingConfig.clientConfigs.configY
      );

      // validate result in db
      const configInDb = await Config.findOne({
        client: existingConfig.client,
        version: existingConfig.version,
      });
      expect(configInDb).toHaveProperty('clientConfigs');
      const clientConfigsEntries = configInDb.clientConfigs;
      expect(clientConfigsEntries.size).toBe(3);
    });

    it('should fail to update client configs - wrong key property value', async () => {
      const config = {
        ...patchBody,
        key: 'version',
      };
      await Config.collection.insertOne(existingConfig);
      const res = await request(server)
        .patch(`/config/${existingConfig.client}/${existingConfig.version}`)
        .send(config);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'Invalid input data. Proper key parameter for config change has to be provided - type: string'
      );
    });

    it('should fail to update client configs - wrong version format', async () => {
      const config = {
        ...patchBody,
        value: { id: '12kk' },
      };
      await Config.collection.insertOne(existingConfig);
      const res = await request(server)
        .patch(`/config/${existingConfig.client}/${existingConfig.version}`)
        .send(config);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'Invalid input data. Proper value parameter for config change has to be provided - type: string'
      );
    });

    it('should fail to update client configs - config not found', async () => {
      await Config.collection.insertOne(existingConfig);
      const res = await request(server)
        .patch(`/config/${existingConfig.client}/${existingConfig.version + 1}`)
        .send(patchBody);
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /:client/:version', () => {
    it('should delete config', async () => {
      await Config.collection.insertOne(existingConfig);
      const res = await request(server).delete(
        `/config/${existingConfig.client}/${existingConfig.version}`
      );
      expect(res.status).toBe(204);
      // check in db that entity was indeed removed
      const configInDb = await Config.findOne({
        client: existingConfig.client,
        version: existingConfig.version,
      });
      expect(configInDb).toBeNull();
    });

    it('should fail to delete non-existing config', async () => {
      await Config.collection.insertOne(existingConfig);
      const res = await request(server).delete(
        `/config/${existingConfig.client}/${existingConfig.version + 1}`
      );
      expect(res.status).toBe(404);
    });
  });

  describe('Non-existing routes', () => {
    it('should return proper error when unhandled route was hit', async () => {
      const res = await request(server).delete(
        `/config/${existingConfig.client}`
      );
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty(
        'message',
        "Can't find /config/ios on this server for given request type!"
      );
    });
  });
});
