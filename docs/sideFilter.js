const SideFilter = {
  template: `
    <div>

      <b-card no-header no-body class="m-0 p-0 border-0">
        <!-- <b-card-body class="m-0 p-1" style="flex-grow: 1; max-height: 3000px; overflow-y: auto;"> -->
        <b-card-body class="m-0 mt-0 pl-0 pr-2 py-1" style="flex-grow: 1; max-height: 3000px; overflow-y: auto;">
          <div v-for="attribute of attributes">
            <b-card header-class="m-0 px-2 pt-2 pb-0" body-class="p-0" class="m-0 p-0 border-0">
              <template #header>
                <span variant="secondary" class="small truncate">
                  {{ attribute.attributeType }}
                </span>
              </template>
              <font size="-2">
                <b-table small fixed striped :fields="attributesFields" :items="attribute.attributeList" head-variant="light" thead-class="d-none">
                  <!-- <template #cell(select)="data">
                    <b-form-checkbox size="sm" :checked="(settings.filters[attribute.attributeType] && settings.filters[attribute.attributeType][data.item.attribute]) ? 1 : 0" value="1" @change="filterChanged(attribute.attributeType, data.item.attribute)"></b-form-checkbox>
                  </template> -->
                  <template #cell(attributeOption)="data">
                    {{ data.item.attribute }}
                  </template>
                  <template #cell(attributeTotal)="data">
                    {{ data.item.tokenIds.length }}
                  </template>
                </b-table>
              </font>
            </b-card>
          </div>
        </b-card-body>
      </b-card>
    </div>
  `,
  data: function () {
    return {
      stealthPrivateKey: null,
      addressTypeInfo: {
        "address": { variant: "warning", name: "My Address" },
        "stealthAddress": { variant: "dark", name: "My Stealth Address" },
        "stealthMetaAddress": { variant: "success", name: "My Stealth Meta-Address" },
      },
      attributesFields: [
        { key: 'select', label: '', thStyle: 'width: 10%;' },
        { key: 'attributeOption', label: 'Attribute' /*, sortable: true*/ },
        { key: 'attributeTotal', label: 'Count', /*sortable: true,*/ thStyle: 'width: 30%;', thClass: 'text-right', tdClass: 'text-right' },
      ],
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
    chainInfo() {
      return store.getters['config/chainInfo'];
    },
    attributes() {
      console.log("sideFilter.attributes");
      return store.getters['data/attributes'];
    },

    addresses() {
      return store.getters['data/addresses'];
    },
    address() {
      return store.getters['viewToken/address'];
    },
    tokenId() {
      return store.getters['viewToken/tokenId'];
    },
    tokenContracts() {
      return store.getters['data/tokenContracts'];
    },
    tokenMetadata() {
      return store.getters['data/tokenMetadata'];
    },
    collectionSymbol() {
      if (this.address) {
        return this.tokenContracts[this.chainId] && this.tokenContracts[this.chainId][this.address] && this.tokenContracts[this.chainId][this.address].symbol || null;
      }
      return null;
    },
    collectionName() {
      if (this.address) {
        return this.tokenContracts[this.chainId] && this.tokenContracts[this.chainId][this.address] && this.tokenContracts[this.chainId][this.address].name || null;
      }
      return null;
    },
    // metadata() {
    //   return this.address && this.tokenMetadata[this.chainId] && this.tokenMetadata[this.chainId][this.address] && this.tokenMetadata[this.chainId][this.address][this.tokenId] || {};
    // },
    // name() {
    //   return this.metadata && this.metadata.name || null;
    // },
    // description() {
    //   return this.metadata && this.metadata.description || null;
    // },
    // image() {
    //   return this.metadata && this.metadata.image || null;
    // },
    // attributes() {
    //   return this.metadata && this.metadata.attributes || [];
    // },

    linkedTo() {
      return store.getters['viewToken/linkedTo'];
    },
    type() {
      return store.getters['viewToken/type'];
    },
    mine: {
      get: function () {
        return store.getters['viewToken/mine'];
      },
      set: function (mine) {
        store.dispatch('data/setAddressField', { account: store.getters['viewToken/address'], field: 'mine', value: mine });
        store.dispatch('viewToken/setMine', mine);
      },
    },
    favourite: {
      get: function () {
        return store.getters['viewToken/favourite'];
      },
      set: function (favourite) {
        store.dispatch('data/setAddressField', { account: store.getters['viewToken/address'], field: 'favourite', value: favourite });
        store.dispatch('viewToken/setFavourite', favourite);
      },
    },
    notes: {
      get: function () {
        return store.getters['viewToken/notes'];
      },
      set: function (notes) {
        store.dispatch('data/setAddressField', { account: store.getters['viewToken/address'], field: 'notes', value: notes });
        store.dispatch('viewToken/setNotes', notes);
      },
    },
    source() {
      return store.getters['viewToken/source'];
    },
    stealthTransfers() {
      return store.getters['viewToken/stealthTransfers'];
    },
    show: {
      get: function () {
        return store.getters['viewToken/show'];
      },
      set: function (show) {
        store.dispatch('viewToken/setShow', show);
      },
    },
  },
  methods: {
    copyToClipboard(str) {
      navigator.clipboard.writeText(str);
    },
    async revealSpendingPrivateKey() {
      function computeStealthKey(ephemeralPublicKey, viewingPrivateKey, spendingPrivateKey) {
        const result = {};
        result.sharedSecret = nobleCurves.secp256k1.getSharedSecret(viewingPrivateKey.substring(2), ephemeralPublicKey.substring(2), false);
        result.hashedSharedSecret = ethers.utils.keccak256(result.sharedSecret.slice(1));
        const stealthPrivateKeyNumber = (BigInt(spendingPrivateKey) + BigInt(result.hashedSharedSecret)) % BigInt(SECP256K1_N);
        const stealthPrivateKeyString = stealthPrivateKeyNumber.toString(16);
        result.stealthPrivateKey = "0x" + stealthPrivateKeyString.padStart(64, '0');
        result.stealthPublicKey = "0x" +  nobleCurves.secp256k1.ProjectivePoint.fromPrivateKey(stealthPrivateKeyNumber).toHex(false);
        result.stealthAddress = ethers.utils.computeAddress(result.stealthPublicKey);
        return result;
      }

      logInfo("SideFilter", "methods.revealSpendingPrivateKey BEGIN");
      const stealthTransfer = this.stealthTransfers && this.stealthTransfers.length > 0 && this.stealthTransfers[0] || {};
      const linkedToStealthMetaAddress = this.linkedTo && this.linkedTo.stealthMetaAddress || null;
      const stealthMetaAddressData = linkedToStealthMetaAddress && this.addresses[linkedToStealthMetaAddress] || {};
      const phraseInHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(stealthMetaAddressData.phrase));
      const signature = await ethereum.request({
        method: 'personal_sign',
        params: [phraseInHex, this.coinbase],
      });
      const signature1 = signature.slice(2, 66);
      const signature2 = signature.slice(66, 130);
      // Hash "v" and "r" values using SHA-256
      const hashedV = ethers.utils.sha256("0x" + signature1);
      const hashedR = ethers.utils.sha256("0x" + signature2);
      const n = ethers.BigNumber.from(SECP256K1_N);
      // Calculate the private keys by taking the hash values modulo the curve order
      const privateKey1 = ethers.BigNumber.from(hashedV).mod(n);
      const privateKey2 = ethers.BigNumber.from(hashedR).mod(n);
      const keyPair1 = new ethers.Wallet(privateKey1.toHexString());
      const keyPair2 = new ethers.Wallet(privateKey2.toHexString());
      const spendingPrivateKey = keyPair1.privateKey;
      const viewingPrivateKey = keyPair2.privateKey;
      const spendingPublicKey = ethers.utils.computePublicKey(keyPair1.privateKey, true);
      const viewingPublicKey = ethers.utils.computePublicKey(keyPair2.privateKey, true);
      const computedStealthKey = computeStealthKey(stealthTransfer.ephemeralPublicKey, viewingPrivateKey, spendingPrivateKey);
      const stealthPrivateKey = computedStealthKey.stealthPrivateKey;
      Vue.set(this, 'stealthPrivateKey', stealthPrivateKey);
    },
    getTokenType(address) {
      if (address == ADDRESS_ETHEREUMS) {
        return "eth";
      } else {
        // TODO: ERC-20 & ERC-721
        return address.substring(0, 10) + '...' + address.slice(-8);
      }
    },
    formatETH(e, precision = 0) {
      try {
        if (precision == 0) {
          return e ? ethers.utils.formatEther(e).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") : null;
        } else {
          return e ? parseFloat(parseFloat(ethers.utils.formatEther(e)).toFixed(precision)) : null;
        }
      } catch (err) {
      }
      return e.toFixed(precision);
    },
    formatTimestamp(ts) {
      if (ts != null) {
        if (ts > 1000000000000n) {
          ts = ts / 1000;
        }
        if (store.getters['config/settings'].reportingDateTime) {
          return moment.unix(ts).utc().format("YYYY-MM-DD HH:mm:ss");
        } else {
          return moment.unix(ts).format("YYYY-MM-DD HH:mm:ss");
        }
      }
      return null;
    },
    saveSettings() {
      logInfo("SideFilter", "methods.saveSettings - transfersSettings: " + JSON.stringify(this.settings, null, 2));
      localStorage.transfersSettings = JSON.stringify(this.settings);
    },
    setShow(show) {
      store.dispatch('viewToken/setShow', show);
    },

    async refreshTokenMetadata() {

      const imageUrlToBase64 = async url => {
        const response = await fetch(url /*, { mode: 'cors' }*/);
        const blob = await response.blob();
        return new Promise((onSuccess, onError) => {
          try {
            const reader = new FileReader() ;
            reader.onload = function(){ onSuccess(this.result) } ;
            reader.readAsDataURL(blob) ;
          } catch(e) {
            onError(e);
          }
        });
      };

      logInfo("SideFilter", "refreshTokenMetadata()");

      const url = "https://api.reservoir.tools/tokens/v7?tokens=" + this.address + "%3A" + this.tokenId + "&includeAttributes=true";
      console.log("url: " + url);
      const data = await fetch(url).then(response => response.json());
      // console.log("data: " + JSON.stringify(data, null, 2));
      if (data.tokens.length > 0) {
        const tokenData = data.tokens[0].token;
        // console.log("tokenData: " + JSON.stringify(tokenData, null, 2));
        const base64 = await imageUrlToBase64(tokenData.image);
        const attributes = tokenData.attributes.map(e => ({ trait_type: e.key, value: e.value }));
        attributes.sort((a, b) => {
          return ('' + a.trait_type).localeCompare(b.trait_type);
        });
        const address = ethers.utils.getAddress(tokenData.contract);
        let expiry = undefined;
        if (address == ENS_ERC721_ADDRESS) {
          const expiryRecord = attributes.filter(e => e.trait_type == "Expiration Date");
          console.log("expiryRecord: " + JSON.stringify(expiryRecord, null, 2));
          expiry = expiryRecord.length == 1 && expiryRecord[0].value || null;
        }
        const metadata = {
          chainId: tokenData.chainId,
          address,
          tokenId: tokenData.tokenId,
          name: tokenData.name,
          description: tokenData.description,
          expiry,
          attributes,
          imageSource: tokenData.image,
          image: base64,
        };
        console.log("metadata: " + JSON.stringify(metadata, null, 2));
        store.dispatch('data/setTokenMetadata', metadata);
        store.dispatch('data/saveData', ['tokenMetadata']);
      }
    },

    async deleteAddress(account) {
      this.$bvModal.msgBoxConfirm('Are you sure?')
        .then(value => {
          if (value) {
            store.dispatch('data/deleteAddress', account);
            this.$refs['viewtoken'].hide();
          }
        })
        .catch(err => {
          // An error occurred
        })
    },
  },
  beforeDestroy() {
    logDebug("SideFilter", "beforeDestroy()");
  },
  mounted() {
    logDebug("SideFilter", "mounted() $route: " + JSON.stringify(this.$route.params));
    if ('transfersSettings' in localStorage) {
      const tempSettings = JSON.parse(localStorage.transfersSettings);
      if ('version' in tempSettings && tempSettings.version == 0) {
        this.settings = tempSettings;
      }
    }
  },
};

const sideFilterModule = {
  namespaced: true,
  state: {
    address: null,
    tokenId: null,

    linkedTo: {
      address: null,
      stealthMetaAddress: null,
    },
    type: null,
    mine: null,
    favourite: null,
    name: null,
    notes: null,
    source: null,
    show: true,
  },
  getters: {
    address: state => state.address,
    tokenId: state => state.tokenId,

    linkedTo: state => state.linkedTo,
    type: state => state.type,
    mine: state => state.mine,
    favourite: state => state.favourite,
    name: state => state.name,
    notes: state => state.notes,
    source: state => state.source,
    stealthTransfers: state => state.stealthTransfers,
    show: state => state.show,
  },
  mutations: {
    viewToken(state, info) {
      logInfo("sideFilterModule", "mutations.viewToken - info: " + JSON.stringify(info));

      // const data = store.getters['data/addresses'][address] || {};
      state.address = info.address;
      state.tokenId = info.tokenId;
      // state.linkedTo = data.linkedTo || { address: null, stealthMetaAddress: null };
      // state.type = data.type;
      // state.mine = data.mine;
      // state.favourite = data.favourite;
      // state.name = data.name;
      // state.notes = data.notes;
      // state.source = data.source;
      // const stealthTransfers = [];
      // if (data.type == "stealthAddress") {
      //   const transfers = store.getters['data/transfers'][store.getters['connection/chainId']] || {};
      //   for (const [blockNumber, logIndexes] of Object.entries(transfers)) {
      //     for (const [logIndex, item] of Object.entries(logIndexes)) {
      //       if (item.schemeId == 0 && item.stealthAddress == address) {
      //         stealthTransfers.push(item);
      //       }
      //     }
      //   }
      // }
      // Vue.set(state, 'stealthTransfers', stealthTransfers);
      state.show = true;
    },
    setMine(state, mine) {
      logInfo("sideFilterModule", "mutations.setMine - mine: " + mine);
      state.mine = mine;
    },
    setFavourite(state, favourite) {
      logInfo("sideFilterModule", "mutations.setFavourite - favourite: " + favourite);
      state.favourite = favourite;
    },
    setName(state, name) {
      logInfo("sideFilterModule", "mutations.setName - name: " + name);
      state.name = name;
    },
    setNotes(state, notes) {
      logInfo("sideFilterModule", "mutations.setNotes - notes: " + notes);
      state.notes = notes;
    },
    setShow(state, show) {
      state.show = show;
    },
  },
  actions: {
    async viewToken(context, info) {
      logInfo("sideFilterModule", "actions.viewToken - info: " + JSON.stringify(info));
      await context.commit('viewToken', info);
    },
    async setMine(context, mine) {
      logInfo("sideFilterModule", "actions.setMine - mine: " + mine);
      await context.commit('setMine', mine);
    },
    async setFavourite(context, favourite) {
      logInfo("sideFilterModule", "actions.setFavourite - favourite: " + favourite);
      await context.commit('setFavourite', favourite);
    },
    async setName(context, name) {
      logInfo("sideFilterModule", "actions.setName - name: " + name);
      await context.commit('setName', name);
    },
    async setNotes(context, notes) {
      logInfo("sideFilterModule", "actions.setNotes - notes: " + notes);
      await context.commit('setNotes', notes);
    },
    async setSource(context, source) {
      logInfo("sideFilterModule", "actions.setSource - source: " + source);
      await context.commit('setSource', source);
    },
    async setShow(context, show) {
      await context.commit('setShow', show);
    },
  },
};
