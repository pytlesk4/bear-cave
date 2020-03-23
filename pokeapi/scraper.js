const rax = require('retry-axios');
const axios = require('axios');
const https = require('https');
const myAxiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),
});
myAxiosInstance.defaults.raxConfig = {
  instance: myAxiosInstance
};
rax.attach(myAxiosInstance);

async function scrapeRoot(rootUri) {
  let rootResponse;
  try {
    rootResponse = await get(rootUri);
  } catch (err) {
    console.error(err);
  }

  const collectionUris = Object.values(rootResponse.data);
  return Promise.all(
    collectionUris.map(uri => scrapeCollection(uri))
  );
}

async function scrapeCollection(collectionUri) {
  let collectionResponse;
  try {
    collectionResponse = await get(collectionUri);
  } catch (err) {
    console.error(err);
  }
  const resourceUris = collectionResponse.data.results;
  
  try {
    Promise.all(resourceUris.map(result => get(result.url)));
  } catch (err) {
    console.error(err);
  }

  // Treat the "next" URL as another collection to fetch
  if (collectionResponse.data.next) {
    await scrapeCollection(collectionResponse.data.next);
  }
}

function get(uri) {
  const remappedUri = uri.replace(/^https:\/\/pokeapi.co/g, 'http://localhost:30333')
  console.log(`get ${uri} -> ${remappedUri}`)
  return myAxiosInstance(remappedUri);
}

console.log(Promise.resolve(scrapeRoot(`http://localhost:30333/api/v2/`)));
