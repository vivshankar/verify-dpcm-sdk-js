// load contents of .env into process.env
const dotEnvPath = __dirname + '/../.env';
require('dotenv').config({path: dotEnvPath});

const Config = {
  tenantUrl: process.env.TENANT_URL,
};

const Auth = {
  accessToken: process.env.ACCESS_TOKEN,
};

const Context = {
  ipAddress: (process.env.IP_ADDRESS ? process.env.IP_ADDRESS : null),
  subjectId: (process.env.SUBJECT_ID ? process.env.SUBJECT_ID : null),
  isExternalSubject: (process.env.isExternalSubject &&
      process.env.isExternalSubject == 'true' ? true : false),
};

module.exports = {
  Config,
  Auth,
  Context,
};
