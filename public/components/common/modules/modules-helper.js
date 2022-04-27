import { getAngularModule, getDataPlugin } from '../../../kibana-services';

export class ModulesHelper {
  static async getDiscoverScope() {
    const $injector = getAngularModule().$injector;
    const location = $injector.get('$location');
    const initialTab = location.search().tab;
    return new Promise(resolve => {
      const checkExist = setInterval(() => {
        const app = getAngularModule();
        if (app.discoverScope) {
          clearInterval(checkExist);
          resolve(app.discoverScope);
        }
        const currentTab = location.search().tab;
        if (initialTab !== currentTab) {
          clearInterval(checkExist);
        }
      }, 250);
    });
  }

  static async cleanAvailableFields() {
    const fields = document.querySelectorAll(
      `.dscFieldChooser .dscFieldList--unpopular li`
    );
    if (fields.length) {
      fields.forEach(field => {
        const attr = field.getAttribute('data-attr-field');
        if (attr.startsWith('_')) {
          field.style.display = 'none';
        }
      });
    }
  }

  static hideCloseButtons = () => {
    this.activeNoImplicitsFilters()
  };

  static activeNoImplicitsFilters() {
    const { filterManager } = getDataPlugin().query;
    const implicitFilters = filterManager.getFilters().filter((x) => {
      return x.$state.isImplicit
    }
    );
    if (!(implicitFilters || []).length) {
      setTimeout(() => {
        this.activeNoImplicitsFilters();
      }, 100);
    }
    const filters = $(`.globalFilterItem .euiBadge__childButton`);
    for (let i = 0; i < filters.length; i++) {
      const data = filters[i].attributes[3];
      let found = false;
      (implicitFilters || []).forEach(x => {
        if(!x.used){
          const objKey = x.query && x.query.match ? Object.keys(x.query.match)[0] : x.meta.key;
          const objValue = x.query && x.query.match ? x.query.match[objKey].query : x.meta.value;
          const key = `filter-key-${objKey}`;
          const value = `filter-value-${objValue}`;
          if (data.value.includes(key) && data.value.includes(value) && !data.value.includes('filter-pinned')) {
            found = true;
            x.used = true;
          }
        }
      });
      if (!found) {
        $(filters[i]).siblings('.euiBadge__iconButton').removeClass('hide-close-button');       
        $(filters[i]).off('click'); 
      } else {
        $(filters[i]).siblings('.euiBadge__iconButton').addClass('hide-close-button');
        $(filters[i]).on('click', ev => {
          ev.stopPropagation();
        });
      }
    }
  }
}
