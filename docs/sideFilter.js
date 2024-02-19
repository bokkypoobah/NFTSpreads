const SideFilter = {
  template: `
    <div>
      <b-card no-header no-body class="m-0 p-0 border-0">
        <b-card-body class="m-0 mt-0 pl-0 pr-2 py-1" style="flex-grow: 1; max-height: 3000px; overflow-y: auto;">
          <div v-for="attribute of attributes">
            <b-card header-class="m-0 px-2 pt-2 pb-0" body-class="p-0" class="m-0 p-0 border-0">
              <template #header>
                <span variant="secondary" class="small truncate">
                  {{ attribute.attributeType }}
                </span>
              </template>
              <div v-for="(value, i) of attribute.attributeList" v-bind:key="i">
                <div class="d-flex flex-wrap m-0 p-0">
                  <div class="ml-1 mt-1 pr-1">
                    <b-form-checkbox size="sm" :checked="(attributeFilter[selectedCollection] && attributeFilter[selectedCollection][attribute.attributeType] && attributeFilter[selectedCollection][attribute.attributeType][value.attribute])" @change="filterChanged({ type: attribute.attributeType, value: value.attribute })"><font size="-2">{{ value.attribute }}</font></b-form-checkbox>
                  </div>
                  <div class="mt-0 flex-grow-1">
                  </div>
                  <div class="mr-1 mt-0 pl-1">
                    <font size="-2">{{ value.tokenIds.length }}</font>
                  </div>
                </div>
              </div>
            </b-card>
          </div>
        </b-card-body>
      </b-card>
    </div>
  `,
  data: function () {
    return {
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
    selectedCollection() {
      return store.getters['data/selectedCollection'];
    },
    attributes() {
      return store.getters['data/attributes'];
    },
    attributeFilter() {
      return store.getters['data/attributeFilter'];
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
    saveSettings() {
      logInfo("SideFilter", "methods.saveSettings - transfersSettings: " + JSON.stringify(this.settings, null, 2));
      localStorage.transfersSettings = JSON.stringify(this.settings);
    },
    filterChanged(info) {
      logInfo("SideFilter", "methods.filterChanged - info: " + JSON.stringify(info));
      store.dispatch('data/attributeFilterChanged', info);
    },
    setShow(show) {
      store.dispatch('viewToken/setShow', show);
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
    show: true,
  },
  getters: {
    show: state => state.show,
  },
  mutations: {
    setShow(state, show) {
      state.show = show;
    },
  },
  actions: {
    async setShow(context, show) {
      await context.commit('setShow', show);
    },
  },
};
