const Data = {
  template: `
  <div>
    <b-button v-b-toggle.data-module size="sm" block variant="outline-info">Data</b-button>
    <b-collapse id="data-module" visible class="my-2">
      <b-card no-body class="border-0">
        <b-row>
          <b-col cols="5" class="small px-1 text-right">Addresses:</b-col>
          <b-col class="small px-1 truncate" cols="7">{{ Object.keys(addresses).length }}</b-col>
        </b-row>
        <b-row>
          <b-col cols="5" class="small px-1 text-right">ERC-20 Contracts:</b-col>
          <b-col class="small px-1 truncate" cols="7">{{ totalERC20Contracts }}</b-col>
        </b-row>
        <b-row>
          <b-col cols="5" class="small px-1 text-right">ERC-721 Tokens:</b-col>
          <b-col class="small px-1 truncate" cols="7">{{ totalERC721Tokens }}</b-col>
        </b-row>
        <b-row>
          <b-col cols="5" class="small px-1 text-right">Registry:</b-col>
          <b-col class="small px-1 truncate" cols="7">{{ Object.keys(registry[chainId] || {}).length }}</b-col>
        </b-row>
        <b-row>
          <b-col cols="5" class="small px-1 text-right">Stealth Transfers:</b-col>
          <b-col class="small px-1 truncate" cols="7">{{ totalStealthTransfers }}</b-col>
        </b-row>
        <!-- <b-row>
          <b-col cols="5" class="small px-1">ENS Map</b-col>
          <b-col class="small px-1 truncate" cols="7">{{ Object.keys(ensMap).length }}</b-col>
        </b-row> -->
      </b-card>
    </b-collapse>
  </div>
  `,
  data: function () {
    return {
      count: 0,
      reschedule: true,
    }
  },
  computed: {
    powerOn() {
      return store.getters['connection/powerOn'];
    },
    coinbase() {
      return store.getters['connection/coinbase'];
    },
    chainId() {
      return store.getters['connection/chainId'];
    },
    addresses() {
      return store.getters['data/addresses'];
    },
    registry() {
      return store.getters['data/registry'];
    },
    stealthTransfers() {
      return store.getters['data/stealthTransfers'];
    },
    tokenContracts() {
      return store.getters['data/tokenContracts'];
    },
    totalStealthTransfers() {
      let result = (store.getters['data/forceRefresh'] % 2) == 0 ? 0 : 0;
      for (const [blockNumber, logIndexes] of Object.entries(this.stealthTransfers[this.chainId] || {})) {
        for (const [logIndex, item] of Object.entries(logIndexes)) {
          result++;
        }
      }
      return result;
    },
    totalERC20Contracts() {
      let result = (store.getters['data/forceRefresh'] % 2) == 0 ? 0 : 0;
      for (const [address, data] of Object.entries(this.tokenContracts[this.chainId] || {})) {
        if (data.type == "erc20") {
          result++;
        }
      }
      return result;
    },
    totalERC721Tokens() {
      let result = (store.getters['data/forceRefresh'] % 2) == 0 ? 0 : 0;
      for (const [address, data] of Object.entries(this.tokenContracts[this.chainId] || {})) {
        if (data.type == "erc721") {
          result += Object.keys(data.tokenIds).length;
        }
      }
      return result;
    },
    // mappings() {
    //   return store.getters['data/mappings'];
    // },
    // txs() {
    //   return store.getters['data/txs'];
    // },
    // assets() {
    //   return store.getters['data/assets'];
    // },
    // ensMap() {
    //   return store.getters['data/ensMap'];
    // },
  },
  methods: {
    async timeoutCallback() {
      logDebug("Data", "timeoutCallback() count: " + this.count);
      this.count++;
      var t = this;
      if (this.reschedule) {
        setTimeout(function() {
          t.timeoutCallback();
        }, 15000);
      }
    },
  },
  beforeDestroy() {
    logDebug("Data", "beforeDestroy()");
  },
  mounted() {
    logDebug("Data", "mounted() $route: " + JSON.stringify(this.$route.params));
    store.dispatch('config/restoreState');
    this.reschedule = true;
    logDebug("Data", "Calling timeoutCallback()");
    this.timeoutCallback();
  },
  destroyed() {
    this.reschedule = false;
  },
};

const dataModule = {
  namespaced: true,
  state: {
    DB_PROCESSING_BATCH_SIZE: 1234,
    collections: {
      "1": {
        "0x0Ee24c748445Fb48028a74b0ccb6b46d7D3e3b33": {
          symbol: "NFB",
          name: "NAH FUNGIBLE BONES",
          type: "erc721",
        },
        "0x8FA600364B93C53e0c71C7A33d2adE21f4351da3": {
          symbol: "LChads",
          name: "Larva Chads",
          type: "erc721",
        },
        "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D": {
          symbol: "BAYC",
          name: "BoredApeYachtClub",
          type: "erc721",
        },
        "0xc92cedDfb8dd984A89fb494c376f9A48b999aAFc": {
          symbol: "CREATURE",
          name: "Creature World",
          type: "erc721",
        },
      },
    },
    selectedCollection: null,
    collection: {}, // contract, id, symbol, name, image, slug, creator, tokenCount
    tokens: {}, // TokenId => { chainId, contract, tokenId, name, description, image, kind, isFlagged, isSpam, isNsfw, metadataDisabled, rarity, rarityRank, attributes
    sales: [], //

    addresses: {}, // Address => Info
    registry: {}, // Address => StealthMetaAddress
    stealthTransfers: {}, // ChainId, blockNumber, logIndex => data
    tokenContracts: {}, // ChainId, tokenContractAddress, tokenId => data
    tokenMetadata: {}, // ChainId, tokenContractAddress, tokenId => metadata
    ensMap: {},
    exchangeRates: {},
    forceRefresh: 0,
    sync: {
      section: null,
      total: null,
      completed: null,
      halt: false,
    },
    db: {
      name: "nftspreadsdata080c",
      version: 1,
      schemaDefinition: {
        // announcements: '[chainId+blockNumber+logIndex],[blockNumber+contract],contract,confirmations,stealthAddress',
        // registrations: '[chainId+blockNumber+logIndex],[blockNumber+contract],contract,confirmations',
        // tokenEvents: '[chainId+blockNumber+logIndex],[blockNumber+contract],contract,confirmations',
        tokens: '[chainId+contract+tokenId]',
        sales: '[chainId+blockNumber+logIndex],contract,confirmations',
        listings: '[chainId+contract+id],contract,maker,taker',
        offers: '[chainId+contract+id],contract,maker,taker',
        cache: '&objectName',
      },
      updated: null,
    },
  },
  getters: {
    collections: state => state.collections,
    selectedCollection: state => state.selectedCollection,
    collection: state => state.collection,
    tokens: state => state.tokens,
    sales: state => state.sales,

    addresses: state => state.addresses,
    registry: state => state.registry,
    stealthTransfers: state => state.stealthTransfers,
    tokenContracts: state => state.tokenContracts,
    tokenMetadata: state => state.tokenMetadata,
    ensMap: state => state.ensMap,
    exchangeRates: state => state.exchangeRates,
    forceRefresh: state => state.forceRefresh,
    sync: state => state.sync,
    db: state => state.db,
  },
  mutations: {
    setState(state, info) {
      // logInfo("dataModule", "mutations.setState - info: " + JSON.stringify(info, null, 2));
      Vue.set(state, info.name, info.data);
    },
    setSelectedCollection(state, selectedCollection) {
      Vue.set(state, 'selectedCollection', selectedCollection);
      // logInfo("dataModule", "mutations.setSelectedCollection: " + selectedCollection);
    },
    setCollection(state, collection) {
      Vue.set(state, 'collection', collection);
      // logInfo("dataModule", "mutations.setCollection - collection: " + JSON.stringify(collection, null, 2));
    },
    setTokens(state, tokens) {
      Vue.set(state, 'tokens', tokens);
      // logInfo("dataModule", "mutations.setTokens tokens: " + JSON.stringify(tokens, null, 2));
    },
    setSales(state, sales) {
      Vue.set(state, 'sales', sales);
      logInfo("dataModule", "mutations.setSales sales: " + JSON.stringify(sales, null, 2));
    },

    toggleAddressField(state, info) {
      Vue.set(state.addresses[info.account], info.field, !state.addresses[info.account][info.field]);
      logInfo("dataModule", "mutations.toggleAddressField - accounts[" + info.account + "]." + info.field + " = " + state.addresses[info.account][info.field]);
    },
    setAddressField(state, info) {
      Vue.set(state.addresses[info.account], info.field, info.value);
      logInfo("dataModule", "mutations.setAddressField - accounts[" + info.account + "]." + info.field + " = " + state.addresses[info.account][info.field]);
    },
    toggleTokenContractFavourite(state, tokenContract) {
      const chainId = store.getters['connection/chainId'];
      Vue.set(state.tokenContracts[chainId][tokenContract.address], 'favourite', !state.tokenContracts[chainId][tokenContract.address].favourite);
      logInfo("dataModule", "mutations.toggleTokenContractFavourite - tokenContract: " + JSON.stringify(state.tokenContracts[chainId][tokenContract.address]));
    },
    toggleTokenContractJunk(state, tokenContract) {
      const chainId = store.getters['connection/chainId'];
      Vue.set(state.tokenContracts[chainId][tokenContract.address], 'junk', !state.tokenContracts[chainId][tokenContract.address].junk);
      logInfo("dataModule", "mutations.toggleTokenContractJunk - tokenContract: " + JSON.stringify(state.tokenContracts[chainId][tokenContract.address]));
    },

    addNewAddress(state, newAccount) {
      logInfo("dataModule", "mutations.addNewAddress(" + JSON.stringify(newAccount, null, 2) + ")");
      let address = null;
      let linkedToAddress = null;
      let type = null;
      let mine = false;
      let source = null;
      if (newAccount.action == "addCoinbase") {
        address = store.getters['connection/coinbase'];
        type = "address";
        mine = true;
        source = "attached";
      } else if (newAccount.action == "addAddress") {
        address = ethers.utils.getAddress(newAccount.address);
        type = "address";
        mine = newAccount.mine;
        source = "manual";
      } else if (newAccount.action == "addStealthMetaAddress") {
        address = newAccount.address;
        linkedToAddress = newAccount.linkedToAddress;
        type = "stealthMetaAddress";
        mine = newAccount.mine;
        source = "manual";
      } else {
        address = newAccount.address;
        linkedToAddress = newAccount.linkedToAddress;
        type = "stealthMetaAddress";
        mine = true;
        source = "attached";
      }
      console.log("address: " + address);
      console.log("linkedToAddress: " + linkedToAddress);
      console.log("type: " + type);
      if (address in state.addresses) {
        Vue.set(state.addresses[address], 'type', type);
        if (type == "stealthMetaAddress") {
          Vue.set(state.addresses[address], 'linkedToAddress', linkedToAddress);
          Vue.set(state.addresses[address], 'phrase', newAccount.action == "generateStealthMetaAddress" ? newAccount.phrase : undefined);
          Vue.set(state.addresses[address], 'viewingPrivateKey', newAccount.action == "generateStealthMetaAddress" ? newAccount.viewingPrivateKey : undefined);
          Vue.set(state.addresses[address], 'spendingPublicKey', newAccount.action == "generateStealthMetaAddress" ? newAccount.spendingPublicKey : undefined);
          Vue.set(state.addresses[address], 'viewingPublicKey', newAccount.action == "generateStealthMetaAddress" ? newAccount.viewingPublicKey : undefined);
        }
        Vue.set(state.addresses[address], 'mine', mine);
        Vue.set(state.addresses[address], 'favourite', newAccount.favourite);
        Vue.set(state.addresses[address], 'name', newAccount.name);
      } else {
        if (type == "address") {
          Vue.set(state.addresses, address, {
            type,
            source,
            mine,
            junk: false,
            favourite: newAccount.favourite,
            name: newAccount.name,
            notes: null,
          });
        } else {
          Vue.set(state.addresses, address, {
            type,
            linkedToAddress,
            phrase: newAccount.action == "generateStealthMetaAddress" ? newAccount.phrase : undefined,
            viewingPrivateKey: newAccount.action == "generateStealthMetaAddress" ? newAccount.viewingPrivateKey : undefined,
            spendingPublicKey: newAccount.action == "generateStealthMetaAddress" ? newAccount.spendingPublicKey : undefined,
            viewingPublicKey: newAccount.action == "generateStealthMetaAddress" ? newAccount.viewingPublicKey : undefined,
            source,
            mine,
            junk: false,
            favourite: newAccount.favourite,
            name: newAccount.name,
            notes: null,
          });
        }
      }
      logInfo("dataModule", "mutations.addNewAddress AFTER - state.accounts: " + JSON.stringify(state.accounts, null, 2));
    },
    addNewStealthAddress(state, info) {
      logInfo("dataModule", "mutations.addNewStealthAddress: " + JSON.stringify(info, null, 2));
      Vue.set(state.addresses, info.stealthAddress, {
        type: info.type,
        linkedTo: info.linkedTo,
        source: info.source,
        mine: info.mine,
        junk: info.junk,
        favourite: info.favourite,
        name: info.name,
        notes: info.notes,
      });
    },
    updateToStealthAddress(state, info) {
      // logInfo("dataModule", "mutations.updateToStealthAddress: " + JSON.stringify(info, null, 2));
      Vue.set(state.addresses[info.stealthAddress], 'type', info.type);
      Vue.set(state.addresses[info.stealthAddress], 'linkedTo', info.linkedTo);
      Vue.set(state.addresses[info.stealthAddress], 'mine', info.mine);
    },
    deleteAddress(state, address) {
      Vue.delete(state.addresses, address);
    },
    setTokenMetadata(state, info) {
      // logInfo("dataModule", "mutations.setTokenMetadata info: " + JSON.stringify(info, null, 2));
      if (!(info.chainId in state.tokenMetadata)) {
        Vue.set(state.tokenMetadata, info.chainId, {});
      }
      if (!(info.address in state.tokenMetadata[info.chainId])) {
        Vue.set(state.tokenMetadata[info.chainId], info.address, {});
      }
      if (!(info.tokenId in state.tokenMetadata[info.chainId][info.address])) {
        Vue.set(state.tokenMetadata[info.chainId][info.address], info.tokenId, {
          name: info.name,
          description: info.description,
          expiry: info.expiry || undefined,
          attributes: info.attributes,
          imageSource: info.imageSource,
          image: info.image,
        });
      }
    },
    addStealthTransfer(state, info) {
      // logInfo("dataModule", "mutations.addStealthTransfer: " + JSON.stringify(info, null, 2));
      if (!(info.chainId in state.stealthTransfers)) {
        Vue.set(state.stealthTransfers, info.chainId, {});
      }
      if (!(info.blockNumber in state.stealthTransfers[info.chainId])) {
        Vue.set(state.stealthTransfers[info.chainId], info.blockNumber, {});
      }
      if (!(info.logIndex in state.stealthTransfers[info.chainId][info.blockNumber])) {
        Vue.set(state.stealthTransfers[info.chainId][info.blockNumber], info.logIndex, info);
      }
    },

    setExchangeRates(state, exchangeRates) {
      // const dates = Object.keys(exchangeRates);
      // dates.sort();
      // for (let date of dates) {
      //   console.log(date + "\t" + exchangeRates[date]);
      // }
      Vue.set(state, 'exchangeRates', exchangeRates);
    },
    forceRefresh(state) {
      Vue.set(state, 'forceRefresh', parseInt(state.forceRefresh) + 1);
      logInfo("dataModule", "mutations.forceRefresh: " + state.forceRefresh);
    },
    saveTxTags(state, info) {
      if (!(info.txHash in state.txsInfo)) {
        Vue.set(state.txsInfo, info.txHash, {
          tags: info.tags,
        });
      } else {
        Vue.set(state.txsInfo[info.txHash], 'tags', info.tags);
      }
    },
    addTagToTxs(state, info) {
      for (const txHash of Object.keys(info.txHashes)) {
        if (!(txHash in state.txsInfo)) {
          Vue.set(state.txsInfo, txHash, {
            tags: [info.tag],
          });
        } else {
          const currentTags = state.txsInfo[txHash].tags || [];
          if (!currentTags.includes(info.tag)) {
            currentTags.push(info.tag);
            Vue.set(state.txsInfo[txHash], 'tags', currentTags);
          }
        }
      }
    },
    removeTagFromTxs(state, info) {
      for (const txHash of Object.keys(info.txHashes)) {
        if (txHash in state.txsInfo) {
          const currentTags = state.txsInfo[txHash].tags || [];
          if (currentTags.includes(info.tag)) {
            const newTags = currentTags.filter(e => e != info.tag);
            if (newTags.length == 0 && Object.keys(state.txsInfo[txHash]).length == 1) {
              Vue.delete(state.txsInfo, txHash);
            } else {
              Vue.set(state.txsInfo[txHash], 'tags', newTags);
            }
          }
        }
      }
    },
    setSyncSection(state, info) {
      logInfo("dataModule", "mutations.setSyncSection info: " + JSON.stringify(info));
      state.sync.section = info.section;
      state.sync.total = info.total;
    },
    setSyncCompleted(state, completed) {
      logInfo("dataModule", "mutations.setSyncCompleted completed: " + completed);
      state.sync.completed = completed;
    },
    setSyncHalt(state, halt) {
      state.sync.halt = halt;
    },
  },
  actions: {
    async restoreState(context) {
      logInfo("dataModule", "actions.restoreState");
      if (Object.keys(context.state.stealthTransfers).length == 0) {
        const db0 = new Dexie(context.state.db.name);
        db0.version(context.state.db.version).stores(context.state.db.schemaDefinition);
        for (let type of ['collections', 'selectedCollection', 'collection', 'tokens', 'sales']) {
          const data = await db0.cache.where("objectName").equals(type).toArray();
          if (data.length == 1) {
            // logInfo("dataModule", "actions.restoreState " + type + " => " + JSON.stringify(data[0].object));
            context.commit('setState', { name: type, data: data[0].object });
          }
        }
      }
    },
    async saveData(context, types) {
      // logInfo("dataModule", "actions.saveData - types: " + JSON.stringify(types));
      const db0 = new Dexie(context.state.db.name);
      db0.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      for (let type of types) {
        await db0.cache.put({ objectName: type, object: context.state[type] }).then (function() {
        }).catch(function(error) {
          console.log("error: " + error);
        });
      }
      db0.close();
    },

    async setSelectedCollection(context, selectedCollection) {
      // logInfo("dataModule", "actions.setSelectedCollection: " + selectedCollection);
      await context.commit('setSelectedCollection', selectedCollection);
      await context.dispatch('saveData', ['selectedCollection']);
    },

    async toggleAddressField(context, info) {
      // logInfo("dataModule", "actions.toggleAddressField - info: " + JSON.stringify(info));
      await context.commit('toggleAddressField', info);
      await context.dispatch('saveData', ['addresses']);
    },
    async setAddressField(context, info) {
      // logInfo("dataModule", "actions.setAddressField - info: " + JSON.stringify(info));
      await context.commit('setAddressField', info);
      await context.dispatch('saveData', ['addresses']);
    },
    async toggleTokenContractFavourite(context, tokenContract) {
      // logInfo("dataModule", "actions.toggleTokenContractFavourite - info: " + JSON.stringify(info));
      await context.commit('toggleTokenContractFavourite', tokenContract);
      await context.dispatch('saveData', ['tokenContracts']);
    },
    async toggleTokenContractJunk(context, tokenContract) {
      logInfo("dataModule", "actions.toggleTokenContractJunk - tokenContract: " + JSON.stringify(tokenContract));
      await context.commit('toggleTokenContractJunk', tokenContract);
      await context.dispatch('saveData', ['tokenContracts']);
    },
    async setTokenMetadata(context, info) {
      logInfo("dataModule", "actions.addNewAddress - info: " + JSON.stringify(info, null, 2));
      context.commit('setTokenMetadata', info);
      await context.dispatch('saveData', ['tokenContracts']);
    },

    async deleteAddress(context, account) {
      await context.commit('deleteAddress', account);
      await context.dispatch('saveData', ['addresses']);
    },
    async saveTxTags(context, info) {
      await context.commit('saveTxTags', info);
      await context.dispatch('saveData', ['txsInfo']);
    },
    async addTagToTxs(context, info) {
      await context.commit('addTagToTxs', info);
      await context.dispatch('saveData', ['txsInfo']);
    },
    async removeTagFromTxs(context, info) {
      await context.commit('removeTagFromTxs', info);
      await context.dispatch('saveData', ['txsInfo']);
    },
    async refreshTokenMetadata(context, token) {
      console.log("actions.refreshTokenMetadata - token: " + JSON.stringify(token));
      const url = "https://api.reservoir.tools/tokens/v5?tokens=" + token.contract + ":" + token.tokenId;
      console.log(url);
      const data = await fetch(url).then(response => response.json());
      if (data.tokens) {
        for (let record of data.tokens) {
          context.commit('updateAccountToken', record.token);
        }
      }
      await context.dispatch('saveData', ['accounts']);
    },
    async setSyncHalt(context, halt) {
      context.commit('setSyncHalt', halt);
    },
    async resetTokens(context) {
      await context.commit('resetTokens');
      await context.dispatch('saveData', ['accounts']);
    },
    async resetData(context) {
      logInfo("dataModule", "actions.resetData");
      const db = new Dexie(context.state.db.name);
      db.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      await db.announcements.clear();
      await db.cache.clear();
      await db.registrations.clear();
      await db.tokenEvents.clear();
      db.close();
    },
    async addNewAddress(context, newAddress) {
      logInfo("dataModule", "actions.addNewAddress - newAddress: " + JSON.stringify(newAddress, null, 2) + ")");
      context.commit('addNewAddress', newAddress);
      await context.dispatch('saveData', ['addresses']);
    },
    // async restoreAccount(context, addressData) {
    //   logInfo("dataModule", "actions.restoreAccount - addressData: " + JSON.stringify(addressData));
    //   const provider = new ethers.providers.Web3Provider(window.ethereum);
    //   const ensReverseRecordsContract = new ethers.Contract(ENSREVERSERECORDSADDRESS, ENSREVERSERECORDSABI, provider);
    //   const accountInfo = await getAccountInfo(addressData.account, provider)
    //   if (accountInfo.account) {
    //     context.commit('addNewAddress', accountInfo);
    //     context.commit('addNewAccountInfo', addressData);
    //   }
    //   const names = await ensReverseRecordsContract.getNames([addressData.account]);
    //   const name = names.length == 1 ? names[0] : addressData.account;
    //   if (!(addressData.account in context.state.ensMap)) {
    //     context.commit('addENSName', { account: addressData.account, name });
    //   }
    // },
    // async restoreIntermediateData(context, info) {
    //   if (info.blocks && info.txs) {
    //     await context.commit('setState', { name: 'blocks', data: info.blocks });
    //     await context.commit('setState', { name: 'txs', data: info.txs });
    //   }
    // },
    async syncIt(context, options) {
      logInfo("dataModule", "actions.syncIt - options: " + JSON.stringify(options));
      // const db = new Dexie(context.state.db.name);
      // db.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const block = await provider.getBlock();
      const confirmations = store.getters['config/settings'].confirmations && parseInt(store.getters['config/settings'].confirmations) || 10;
      const blockNumber = block && block.number || null;
      const cryptoCompareAPIKey = store.getters['config/settings'].cryptoCompareAPIKey && store.getters['config/settings'].cryptoCompareAPIKey.length > 0 && store.getters['config/settings'].cryptoCompareAPIKey || null;
      const processFilters = store.getters['config/processFilters'];

      const accountsToSync = [];
      // for (const [account, addressData] of Object.entries(context.state.accounts)) {
      //   const accountsInfo = context.state.accountsInfo[account] || {};
      //   if ((info.parameters.length == 0 && accountsInfo.sync) || info.parameters.includes(account)) {
      //       accountsToSync.push(account);
      //   }
      // }
      const chainId = store.getters['connection/chainId'];
      const coinbase = store.getters['connection/coinbase'];
      if (!(coinbase in context.state.addresses)) {
        context.commit('addNewAddress', { action: "addCoinbase" });
      }

      const parameter = { chainId, coinbase, blockNumber, confirmations, cryptoCompareAPIKey, ...options };

      if (options.collection) {
        await context.dispatch('syncCollection', parameter);
      }

      if (options.collectionSales) {
        await context.dispatch('syncCollectionSales', parameter);
      }

      if (options.collectionListings) {
        await context.dispatch('syncCollectionListings', parameter);
      }

      if (options.collectionOffers) {
        await context.dispatch('syncCollectionOffers', parameter);
      }

      await context.dispatch('collateTokens', parameter);

      // if (options.devThing) {
      //   console.log("Dev Thing");
      // }

      // context.dispatch('saveData', ['addresses', 'registry' /*, 'blocks', 'txs', 'ensMap'*/]);
      context.commit('setSyncSection', { section: null, total: null });
      context.commit('setSyncHalt', false);
      context.commit('forceRefresh');
    },

    async syncCollection(context, parameter) {
      logInfo("dataModule", "actions.syncCollection BEGIN: " + JSON.stringify(parameter));
      const db = new Dexie(context.state.db.name);
      db.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      context.commit('setSyncSection', { section: "Collection", total: null });
      let total = 0;
      let continuation = null;
      do {
        let url = "https://api.reservoir.tools/tokens/v7?contract=" + context.state.selectedCollection + "&sortBy=updatedAt&limit=1000&includeAttributes=true" +
          (continuation != null ? "&continuation=" + continuation : '');
        console.log("url: " + url);
        const data = await fetch(url)
          .then(handleErrors)
          .then(response => response.json())
          .catch(function(error) {
             console.log("ERROR - updateCollection: " + error);
             // state.sync.error = true;
             return [];
          });
        if (!parameter.devThing) {
          continuation = data.continuation;
        }
        if (data && data.tokens) {
          const records = [];
          for (const tokenData of data.tokens) {
            const token = tokenData.token;
            console.log("token: " + JSON.stringify(token, null, 2));
            const owner = token.owner;
            const attributes = token.attributes.map(e => ({ trait_type: e.key, value: e.value }));
            attributes.sort((a, b) => {
              return ('' + a.trait_type).localeCompare(b.trait_type);
            });
            records.push({
              chainId: parameter.chainId,
              contract: ethers.utils.getAddress(token.contract),
              tokenId: token.tokenId,
              name: token.name,
              description: token.description,
              image: token.image,
              kind: token.kind,
              isFlagged: token.isFlagged,
              isSpam: token.isSpam,
              isNsfw: token.isNsfw,
              metadataDisabled: token.metadataDisabled,
              rarity: token.rarity,
              rarityRank: token.rarityRank,
              collection: {
                id: token.collection.id,
                name: token.collection.name,
                image: token.collection.image,
                slug: token.collection.slug,
                creator: ethers.utils.getAddress(token.collection.creator),
                tokenCount: token.collection.tokenCount,
              },
              attributes,
              owner: ethers.utils.getAddress(token.owner),
            });
          }
          if (records.length) {
            await db.tokens.bulkPut(records).then (function(lastKey) {
              console.log("syncCollection.bulkPut - items: " + records.length + ", lastKey: " + JSON.stringify(lastKey));
            }).catch(Dexie.BulkError, function(e) {
              console.log("syncCollection.bulkPut e: " + JSON.stringify(e.failures, null, 2));
            });
          }
          total = parseInt(total) + records.length;
          context.commit('setSyncCompleted', total);
        }
        await delay(2500); // TODO: Adjust to avoid error 429 Too Many Requests. Fails at 200ms
      } while (continuation != null /*&& !state.halt && !state.sync.error */);
    },

    async syncCollectionSales(context, parameter) {
      logInfo("dataModule", "actions.syncCollectionSales BEGIN: " + JSON.stringify(parameter));
      const db = new Dexie(context.state.db.name);
      db.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      context.commit('setSyncSection', { section: "Sales", total: null });

      let total = 0;
      let continuation = null;
      do {
        let url = "https://api.reservoir.tools/sales/v6?collection=" + context.state.selectedCollection + "&limit=1000" +
          (continuation != null ? "&continuation=" + continuation : '');
        console.log("url: " + url);
        const data = await fetch(url)
          .then(handleErrors)
          .then(response => response.json())
          .catch(function(error) {
             console.log("ERROR - updateCollection: " + error);
             // state.sync.error = true;
             return [];
          });
        if (!parameter.devThing) {
          continuation = data.continuation;
        }
        if (data && data.sales) {
          const records = [];
          for (const sale of data.sales) {
            const feeBreakdown = [];
            for (const d of (sale.feeBreakdown || [])) {
              feeBreakdown.push({
                kind: d.kind,
                bps: d.bps,
                rawAmount: d.rawAmount,
                recipient: ethers.utils.getAddress(d.recipient),
                source: d.source,

              });
            }
            const price = sale.price;
            if (price && price.currency && price.currency.contract) {
              price.currency.contract = ethers.utils.getAddress(price.currency.contract);
            }
            records.push({
              chainId: parameter.chainId,
              contract: ethers.utils.getAddress(sale.token.contract),
              tokenId: sale.token.tokenId,
              blockNumber: sale.block,
              confirmations: parameter.blockNumber - sale.block,
              logIndex: sale.logIndex,
              timestamp: sale.timestamp,
              txHash: sale.txHash,
              amount: sale.amount,
              batchIndex: sale.batchIndex,
              createdAt: sale.createdAt,
              feeBreakdown,
              fillSource: sale.fillSource,
              from: ethers.utils.getAddress(sale.from),
              id: sale.id,
              isDeleted: sale.isDeleted,
              amount: sale.amount,
              to: ethers.utils.getAddress(sale.to),
              marketplaceFeeBps: sale.marketplaceFeeBps,
              orderId: sale.orderId,
              orderKind: sale.orderKind,
              orderSide: sale.orderSide,
              orderSource: sale.orderSource,
              paidFullRoyalty: sale.paidFullRoyalty,
              price,
              saleId: sale.saleId,
              updatedAt: sale.updatedAt,
              washTradingScore: sale.washTradingScore,
            });
          }
          if (records.length) {
            await db.sales.bulkPut(records).then (function(lastKey) {
              console.log("syncCollectionSales.bulkPut - items: " + records.length + ", lastKey: " + JSON.stringify(lastKey));
            }).catch(Dexie.BulkError, function(e) {
              console.log("syncCollectionSales.bulkPut e: " + JSON.stringify(e.failures, null, 2));
            });
          }
          total = parseInt(total) + records.length;
          context.commit('setSyncCompleted', total);
        }
        await delay(2500); // TODO: Adjust to avoid error 429 Too Many Requests. Fails at 200ms
      } while (continuation != null /*&& !state.halt && !state.sync.error */);
    },

    async syncCollectionListings(context, parameter) {
      logInfo("dataModule", "actions.syncCollectionListings BEGIN: " + JSON.stringify(parameter));
      const db = new Dexie(context.state.db.name);
      db.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      context.commit('setSyncSection', { section: "Listings", total: null });

      let total = 0;
      let continuation = null;
      do {
        let url = "https://api.reservoir.tools/orders/asks/v5?contracts=" + context.state.selectedCollection + "&limit=1000" +
          (continuation != null ? "&continuation=" + continuation : '');
        console.log("url: " + url);
        const data = await fetch(url)
          .then(handleErrors)
          .then(response => response.json())
          .catch(function(error) {
             console.log("ERROR - updateCollection: " + error);
             // state.sync.error = true;
             return [];
          });
        if (!parameter.devThing) {
          continuation = data.continuation;
        }
        if (data && data.orders) {
          const records = [];
          for (const order of data.orders) {
            console.log("order: " + JSON.stringify(order, null, 2));
            const feeBreakdown = [];
            for (const d of (order.feeBreakdown || [])) {
              feeBreakdown.push({
                kind: d.kind,
                bps: d.bps,
                recipient: ethers.utils.getAddress(d.recipient),
              });
            }
            const price = order.price;
            if (price && price.currency && price.currency.contract) {
              price.currency.contract = ethers.utils.getAddress(price.currency.contract);
            }
            records.push({
              chainId: parameter.chainId,

              id: order.id,
              kind: order.kind,
              side: order.side,
              status: order.status,
              tokenSetId: order.tokenSetId,
              tokenSetSchemaHash: order.tokenSetSchemaHash,
              contract: ethers.utils.getAddress(order.contract),
              contractKind: order.contractKind,
              maker: ethers.utils.getAddress(order.maker),
              taker: ethers.utils.getAddress(order.taker),
              price,
              validFrom: order.validFrom,
              validUntil: order.validUntil,
              quantityFilled: order.quantityFilled,
              quantityRemaining: order.quantityRemaining,
              dynamicPricing: order.dynamicPricing,
              criteria: order.criteria,
              source: order.source,
              feeBps: order.feeBps,
              feeBreakdown,
              expiration: order.expiration,
              isReservoir: order.isReservoir,
              isDynamic: order.isDynamic,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
              originatedAt: order.originatedAt,
            });
          }
          if (records.length) {
            await db.listings.bulkPut(records).then (function(lastKey) {
              console.log("syncCollectionListings.bulkPut - items: " + records.length + ", lastKey: " + JSON.stringify(lastKey));
            }).catch(Dexie.BulkError, function(e) {
              console.log("syncCollectionListings.bulkPut e: " + JSON.stringify(e.failures, null, 2));
            });
          }
          total = parseInt(total) + records.length;
          context.commit('setSyncCompleted', total);
        }
        await delay(2500); // TODO: Adjust to avoid error 429 Too Many Requests. Fails at 200ms
      } while (continuation != null /*&& !state.halt && !state.sync.error */);
    },

    async syncCollectionOffers(context, parameter) {
      logInfo("dataModule", "actions.syncCollectionOffers BEGIN: " + JSON.stringify(parameter));
      const db = new Dexie(context.state.db.name);
      db.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      context.commit('setSyncSection', { section: "Listings", total: null });

      let total = 0;
      let continuation = null;
      do {
        let url = "https://api.reservoir.tools/orders/bids/v6?collection=" + context.state.selectedCollection + "&limit=1000" +
          (continuation != null ? "&continuation=" + continuation : '');
        console.log("url: " + url);
        const data = await fetch(url)
          .then(handleErrors)
          .then(response => response.json())
          .catch(function(error) {
             console.log("ERROR - updateCollection: " + error);
             // state.sync.error = true;
             return [];
          });
        if (!parameter.devThing) {
          continuation = data.continuation;
        }
        // console.log("data: " + JSON.stringify(data, null, 2));
        if (data && data.orders) {
          const records = [];
          for (const order of data.orders) {
            console.log("order: " + JSON.stringify(order, null, 2));
            const feeBreakdown = [];
            for (const d of (order.feeBreakdown || [])) {
              feeBreakdown.push({
                kind: d.kind,
                bps: d.bps,
                recipient: ethers.utils.getAddress(d.recipient),
              });
            }
            const price = order.price;
            if (price && price.currency && price.currency.contract) {
              price.currency.contract = ethers.utils.getAddress(price.currency.contract);
            }
            // TODO: Fix up fields
            records.push({
              chainId: parameter.chainId,
              id: order.id,
              kind: order.kind,
              side: order.side,
              status: order.status,
              tokenSetId: order.tokenSetId,
              tokenSetSchemaHash: order.tokenSetSchemaHash,
              contract: ethers.utils.getAddress(order.contract),
              contractKind: order.contractKind,
              maker: ethers.utils.getAddress(order.maker),
              taker: ethers.utils.getAddress(order.taker),
              price,
              validFrom: order.validFrom,
              validUntil: order.validUntil,
              quantityFilled: order.quantityFilled,
              quantityRemaining: order.quantityRemaining,
              dynamicPricing: order.dynamicPricing,
              criteria: order.criteria,
              source: order.source,
              feeBps: order.feeBps,
              feeBreakdown,
              expiration: order.expiration,
              isReservoir: order.isReservoir,
              isDynamic: order.isDynamic,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
              originatedAt: order.originatedAt,
            });
          }
          if (records.length) {
            await db.offers.bulkPut(records).then (function(lastKey) {
              console.log("syncCollectionOffers.bulkPut - items: " + records.length + ", lastKey: " + JSON.stringify(lastKey));
            }).catch(Dexie.BulkError, function(e) {
              console.log("syncCollectionOffers.bulkPut e: " + JSON.stringify(e.failures, null, 2));
            });
          }
          total = parseInt(total) + records.length;
          context.commit('setSyncCompleted', total);
        }
        await delay(2500); // TODO: Adjust to avoid error 429 Too Many Requests. Fails at 200ms
      } while (continuation != null /*&& !state.halt && !state.sync.error */);
    },

    async collateTokens(context, parameter) {
      logInfo("dataModule", "actions.collateTokens: " + JSON.stringify(parameter));
      const db = new Dexie(context.state.db.name);
      db.version(context.state.db.version).stores(context.state.db.schemaDefinition);
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      let rows = 0;
      let done = false;

      let collection = null;
      const tokens = {};
      do {
        let data = await db.tokens.where('[chainId+contract+tokenId]').between([parameter.chainId, context.state.selectedCollection, Dexie.minKey],[parameter.chainId, context.state.selectedCollection, Dexie.maxKey]).offset(rows).limit(context.state.DB_PROCESSING_BATCH_SIZE).toArray();
        logInfo("dataModule", "actions.collateTokens - tokens - data.length: " + data.length + ", first[0..1]: " + JSON.stringify(data.slice(0, 2).map(e => e.contract + '/' + e.tokenId )));
        for (const item of data) {
          if (collection == null) {
            collection = {
              contract: item.contract,
              id: item.collection.id,
              name: item.collection.name,
              image: item.collection.image,
              slug: item.collection.slug,
              creator: item.collection.creator,
              tokenCount: item.collection.tokenCount,
            };
          }
          tokens[item.tokenId] = {
            chainId: item.chainId,
            contract: item.contract,
            tokenId: item.tokenId,
            name: item.name,
            description: item.description,
            image: item.image,
            kind: item.kind,
            isFlagged: item.isFlagged,
            isSpam: item.isSpam,
            isNsfw: item.isNsfw,
            metadataDisabled: item.metadataDisabled,
            rarity: item.rarity,
            rarityRank: item.rarityRank,
            attributes: item.attributes,
            owner: item.owner,
          };
        }
        rows = parseInt(rows) + data.length;
        done = data.length < context.state.DB_PROCESSING_BATCH_SIZE;
      } while (!done);
      context.commit('setCollection', collection);
      context.commit('setTokens', tokens);

      rows = 0;
      done = false;
      const sales = [];
      do {
        let data = await db.sales.where('[chainId+blockNumber+logIndex]').between([parameter.chainId, Dexie.minKey, Dexie.minKey],[parameter.chainId, Dexie.maxKey, Dexie.maxKey]).offset(rows).limit(context.state.DB_PROCESSING_BATCH_SIZE).toArray();
        logInfo("dataModule", "actions.collateTokens - sales - data.length: " + data.length + ", first[0..1]: " + JSON.stringify(data.slice(0, 2).map(e => e.blockNumber + '.' + e.logIndex )));
        for (const item of data) {
          if (item.contract == context.state.selectedCollection) {
            sales.push(item);
          }
        }
        rows = parseInt(rows) + data.length;
        done = data.length < context.state.DB_PROCESSING_BATCH_SIZE;
      } while (!done);
      context.commit('setSales', sales);

      await context.dispatch('saveData', ['collection', 'tokens', 'sales']);
      logInfo("dataModule", "actions.collateTokens END");
    },


    async syncImportExchangeRates(context, parameter) {
      const reportingCurrency = store.getters['config/settings'].reportingCurrency;
      logInfo("dataModule", "actions.syncImportExchangeRates - reportingCurrency: " + reportingCurrency);
      const MAXDAYS = 2000;
      const MINDATE = moment("2015-07-30");
      let toTs = moment();
      const results = {};
      while (toTs.year() >= 2015) {
        let days = toTs.diff(MINDATE, 'days');
        if (days > MAXDAYS) {
          days = MAXDAYS;
        }
        let url = "https://min-api.cryptocompare.com/data/v2/histoday?fsym=ETH&tsym=" + reportingCurrency + "&toTs=" + toTs.unix() + "&limit=" + days;
        if (parameter.cryptoCompareAPIKey) {
          url = url + "&api_key=" + parameter.cryptoCompareAPIKey;
        }
        console.log(url);
        const data = await fetch(url)
          .then(response => response.json())
          .catch(function(e) {
            console.log("error: " + e);
          });
        for (day of data.Data.Data) {
          results[moment.unix(day.time).format("YYYYMMDD")] = day.close;
        }
        toTs = moment(toTs).subtract(MAXDAYS, 'days');
      }
      context.commit('setExchangeRates', results);
      context.dispatch('saveData', ['exchangeRates']);
    },
    async syncRefreshENS(context, parameter) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const ensReverseRecordsContract = new ethers.Contract(ENSREVERSERECORDSADDRESS, ENSREVERSERECORDSABI, provider);
      const addresses = Object.keys(context.state.accounts);
      const ENSOWNERBATCHSIZE = 200; // Can do 200, but incorrectly misconfigured reverse ENS causes the whole call to fail
      for (let i = 0; i < addresses.length; i += ENSOWNERBATCHSIZE) {
        const batch = addresses.slice(i, parseInt(i) + ENSOWNERBATCHSIZE);
        const allnames = await ensReverseRecordsContract.getNames(batch);
        for (let j = 0; j < batch.length; j++) {
          const account = batch[j];
          const name = allnames[j];
          // const normalized = normalize(account);
          // console.log(account + " => " + name);
          context.commit('addENSName', { account, name });
        }
      }
      context.dispatch('saveData', ['ensMap']);
    },
    // Called by Connection.execWeb3()
    async execWeb3({ state, commit, rootState }, { count, listenersInstalled }) {
      logInfo("dataModule", "execWeb3() start[" + count + ", " + listenersInstalled + ", " + JSON.stringify(rootState.route.params) + "]");
    },
  },
};
