'use strict';
import Web3 from 'web3';
import ENS, { getEnsAddress } from '@ensdomains/ensjs';

const provider = new Web3.providers.HttpProvider("https://data-seed-prebsc-1-s1.binance.org:8545");
const ens = new ENS({ provider, ensAddress: getEnsAddress("1") });
const web3 = new Web3(provider);

const BNSAbi = require('./abi/BNS.json');
const MirrorAbi = require('./abi/Mirror.json');
const BNSAddress = '0x83B172f2abE358F3b1CE6496c2e226e79cb454Cb'; // BSC Testnet
const bns = new web3.eth.Contract(BNSAbi, BNSAddress);

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages
chrome.webRequest.onBeforeRequest.addListener(
  async function(details) {
    const reg =/^http[s]?:\/\/([0-9A-Za-z-]+\.web3){1}\/([A-Za-z-]+){1}\/([&A-za-z0-9]*)?$/;
    if (reg.test(details.url)) { //https://[dapp].web3/[function]/[param0&param1&...]
      const matches = details.url.match(reg);
      const dapp = await bns.methods.getAddress(matches[1]).call();
      const func = matches[2];
      const params = matches[3];
      console.log(`Dapp Contract: ${dapp}`);
      console.log(`Function: ${func}`);
      console.log(`Params: ${params}`);

      const mirror = new web3.eth.Contract(MirrorAbi, dapp);
      let articles;
      let article;
      let uri;
      if (func === "getArticles") {
        articles = await mirror.methods.getArticles(params).call();
        console.log('Articles:');
        console.log(articles);
      }
      if (func === "getArticle") {
        article = await mirror.methods.getArticle(params).call();
        console.log('Article:');
        console.log(article);
        return { redirectUrl: article };
      }
      if (func === "getLatestArticle") {
        uri = await mirror.methods.getLatestArticle(params).call();
        return { redirectUrl: uri };
      }
    }
  },
  {
    urls: ["<all_urls>"],
    types: ['main_frame', 'sub_frame'],
  },
  ["blocking"]
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GREETINGS') {
    const message = `Hi ${
      sender.tab ? 'Con' : 'Pop'
    }, my name is Bac. I am from Background. It's great to hear from you.`;

    // Log message coming from the `request` parameter
    // console.log(request.payload.message);
    // Send a response message
    sendResponse({
      message,
    });
  }
});
