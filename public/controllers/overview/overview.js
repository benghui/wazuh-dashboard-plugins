/*
 * Wazuh app - Overview controller
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { FilterHandler } from '../../utils/filter-handler';
import { generateMetric } from '../../utils/generate-metric';
import { TabNames } from '../../utils/tab-names';
import { TabDescription } from '../../../server/reporting/tab-description';

import {
  metricsGeneral,
  metricsVulnerability,
  metricsScap,
  metricsCiscat,
  metricsVirustotal,
  metricsOsquery,
  metricsMitre
} from '../../utils/overview-metrics';

import { timefilter } from 'ui/timefilter';
import { AppState } from '../../react-services/app-state';
import { WazuhConfig } from '../../react-services/wazuh-config';

export class OverviewController {
  /**
   * Class constructor
   * @param {*} $scope
   * @param {*} $location
   * @param {*} $rootScope
   * @param {*} appState
   * @param {*} errorHandler
   * @param {*} apiReq
   * @param {*} tabVisualizations
   * @param {*} commonData
   * @param {*} reportingService
   * @param {*} visFactoryService
   */
  constructor(
    $scope,
    $location,
    $rootScope,
    appState,
    errorHandler,
    apiReq,
    tabVisualizations,
    commonData,
    reportingService,
    visFactoryService,
  ) {
    this.$scope = $scope;
    this.$location = $location;
    this.$rootScope = $rootScope;
    this.appState = appState;
    this.errorHandler = errorHandler;
    this.apiReq = apiReq;
    this.tabVisualizations = tabVisualizations;
    this.commonData = commonData;
    this.reportingService = reportingService;
    this.visFactoryService = visFactoryService;
    this.wazuhConfig = new WazuhConfig();
    this.showingMitreTable = false
    this.expandArray = [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false
    ];
    
  }

  /**
   * On controller loads
   */
  $onInit() {
    this.wodlesConfiguration = false;
    this.TabDescription = TabDescription;
    this.$rootScope.reportStatus = false;

    this.$location.search('_a', null);
    this.filterHandler = new FilterHandler(AppState.getCurrentPattern());
    this.visFactoryService.clearAll();

    const currentApi = JSON.parse(AppState.getCurrentAPI()).id;
    const extensions = AppState.getExtensions(currentApi);
    this.extensions = extensions;

    this.wzMonitoringEnabled = false;

    // Tab names
    this.tabNames = TabNames;

    this.tabView = this.commonData.checkTabViewLocation();
    this.tab = this.commonData.checkTabLocation();

    this.tabHistory = [];
    if (this.tab !== 'welcome') this.tabHistory.push(this.tab);

    // This object represents the number of visualizations per tab; used to show a progress bar
    this.tabVisualizations.assign('overview');

    this.wodlesConfiguration = null;

    this.init();

    this.welcomeCardsProps = {
      api: AppState.getCurrentAPI(),
      switchTab: tab => this.switchTab(tab),
      extensions: this.extensions,
      setExtensions: (api, extensions) =>
        AppState.setExtensions(api, extensions)
    };

    this.setTabs();

    this.$scope.$on('$destroy', () => {
      this.visFactoryService.clearAll();
    });
  }

  /**
   * This check if given array of items contais a single given item
   * @param {Object} item
   * @param {Array<Object>} array
   */
  inArray(item, array) {
    return item && Array.isArray(array) && array.includes(item);
  }

  /**
   * Create metric for given object
   * @param {*} metricsObject
   */
  createMetrics(metricsObject) {
    for (const key in metricsObject) {
      this[key] = () => {
        const metric = generateMetric(metricsObject[key]);
        return !!metric ? metric : '-';
      };
    }
  }

  /**
   * Classify metrics for create the suitable one
   * @param {*} tab
   * @param {*} subtab
   */
  checkMetrics(tab, subtab) {
    if (subtab === 'panels') {
      switch (tab) {
        case 'general':
          this.createMetrics(metricsGeneral);
          break;
        case 'vuls':
          this.createMetrics(metricsVulnerability);
          break;
        case 'oscap':
          this.createMetrics(metricsScap);
          break;
        case 'ciscat':
          this.createMetrics(metricsCiscat);
          break;
        case 'virustotal':
          this.createMetrics(metricsVirustotal);
          break;
        case 'osquery':
          this.createMetrics(metricsOsquery);
          break;
        case 'mitre':
          this.createMetrics(metricsMitre);
          break;
      }
    }
  }

  /**
   * Show/hide MITRE table
   */
  switchMitreTab() {
    this.showingMitreTable = !this.showingMitreTable
  }

  /**
   * Build the current section tabs
   */
  setTabs() {
    this.overviewTabsProps = false;
    this.currentPanel = this.commonData.getCurrentPanel(this.tab, false);

    if (!this.currentPanel) return;

    const tabs = this.commonData.getTabsFromCurrentPanel(
      this.currentPanel,
      this.extensions,
      this.tabNames
    );

    this.overviewTabsProps = {
      clickAction: tab => {
        this.switchTab(tab, true);
      },
      selectedTab:
        this.tab ||
        (this.currentPanel && this.currentPanel.length
          ? this.currentPanel[0]
          : ''),
      tabs
    };
    this.$scope.$applyAsync();
  }

  // Switch subtab
  async switchSubtab(
    subtab,
    force = false,
    sameTab = true,
    preserveDiscover = false
  ) {
    try {
      if (this.tabView === subtab && !force) return;
      this.tabVisualizations.clearDeadVis();
      this.visFactoryService.clear();
      this.$location.search('tabView', subtab);
      const localChange =
        subtab === 'panels' && this.tabView === 'discover' && sameTab;
      this.tabView = subtab;

      if (subtab === 'panels' && this.tab !== 'welcome') {
        await this.visFactoryService.buildOverviewVisualizations(
          this.filterHandler,
          this.tab,
          subtab,
          localChange || preserveDiscover
        );
      } else {
        this.$scope.$emit('changeTabView', {
          tabView: this.tabView,
          tab: this.tab
        });
      }

      this.checkMetrics(this.tab, subtab);
    } catch (error) {
      this.errorHandler.handle(error.message || error);
    }
    this.$scope.$applyAsync();
    return;
  }

  /**
   * Calculate woodle depending on given tab
   * @param {*} tab
   */
  calculateWodleTagFromTab(tab) {
    if (tab === 'aws') return 'aws-s3';
    return false;
  }

  // Switch tab
  async switchTab(newTab, force = false) {
    this.tabVisualizations.setTab(newTab);
    this.showingMitreTable = false;
    this.$rootScope.rendered = false;
    this.$rootScope.$applyAsync();
    this.falseAllExpand();
    try {
      if (newTab === 'welcome') {
        this.commonData.setRefreshInterval(timefilter.getRefreshInterval());
        timefilter.setRefreshInterval({ pause: true, value: 0 });
      } else if (this.tab === 'welcome') {
        timefilter.setRefreshInterval(this.commonData.getRefreshInterval());
      }

      if (typeof this.agentsCountTotal === 'undefined') {
        await this.getSummary();
      }

      if (newTab === 'pci') {
        const pciTabs = await this.commonData.getPCI();
        this.pciReqs = { items: pciTabs, reqTitle: 'PCI DSS Requirement' };
      }

      if (newTab === 'gdpr') {
        const gdprTabs = await this.commonData.getGDPR();
        this.gdprReqs = { items: gdprTabs, reqTitle: 'GDPR Requirement' };
      }

      if (newTab === 'mitre') {
        const result = await this.apiReq.request('GET', '/rules/mitre', {});
        this.$scope.mitreIds = ((((result || {}).data) || {}).data || {}).items
        
        this.mitreCardsSliderProps = {
          items: this.$scope.mitreIds ,
          attacksCount: this.$scope.attacksCount,
          reqTitle: "MITRE",
          wzReq: (method, path, body) => this.apiReq.request(method, path, body),
          addFilter: (id) => this.addMitrefilter(id)
        }

        this.mitreTableProps = {
          wzReq: (method, path, body) => this.apiReq.request(method, path, body),
          attacksCount: this.$scope.attacksCount,
        }
      }

      if (newTab === 'hipaa') {
        const hipaaTabs = await this.commonData.getHIPAA();
        this.hipaaReqs = { items: hipaaTabs, reqTitle: 'HIPAA Requirement' };
      }

      if (newTab === 'nist') {
        const nistTabs = await this.commonData.getNIST();
        this.nistReqs = {
          items: nistTabs,
          reqTitle: 'NIST 800-53 Requirement'
        };
      }

      if (newTab !== 'welcome') this.tabHistory.push(newTab);

      if (this.tabHistory.length > 2)
        this.tabHistory = this.tabHistory.slice(-2);

      if (this.tab === newTab && !force) return;

      const sameTab =
        ((this.tab === newTab && this.tabHistory.length < 2) ||
          (this.tabHistory.length === 2 &&
            this.tabHistory[0] === this.tabHistory[1])) &&
        force !== 'nav';

      // Restore force value if we come from md-nav action
      if (force === 'nav') force = false;

      this.$location.search('tab', newTab);

      const preserveDiscover =
        this.tabHistory.length === 2 &&
        this.tabHistory[0] === this.tabHistory[1];

      this.tab = newTab;

      await this.switchSubtab('panels', true, sameTab, preserveDiscover);
    } catch (error) {
      this.errorHandler.handle(error.message || error);
    }
    this.setTabs();
    this.$scope.$applyAsync();
    return;
  }

  /**
   * Transform a visualization into an image
   */
  startVis2Png() {
    return this.reportingService.startVis2Png(this.tab);
  }

  /**
   * This fetch de agents summary
   */
  async getSummary() {
    try {
      const data = await this.apiReq.request('GET', '/agents/summary/status', {});

      const result = ((data || {}).data || {}).data || false;

      if (result) {
        const active = result.active - 1;
        const total = result.total - 1;
        this.agentsCountActive = active;
        this.agentsCountDisconnected = result.disconnected;
        this.agentsCountNeverConnected = result['never_connected'];
        this.agentsCountTotal = total;
        this.agentsCoverity = total ? (active / total) * 100 : 0;
      } else {
        throw new Error('Error fetching /agents/summary/status from Wazuh API');
      }
      return;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * This load the configuration settings
   */
  async loadConfiguration() {
    try {
      const configuration = this.wazuhConfig.getConfig();

      this.wzMonitoringEnabled = !!configuration['wazuh.monitoring.enabled'];

      return;
    } catch (error) {
      this.wzMonitoringEnabled = true;
      return Promise.reject(error);
    }
  }

  /**
   * Filter by Mitre.ID
   * @param {*} id 
   */
  addMitrefilter(id){
    const filter = `{"meta":{"index":"wazuh-alerts-3.x-*"},"query":{"match":{"rule.mitre.id":{"query":"${id}","type":"phrase"}}}}`;
    this.$rootScope.$emit('addNewKibanaFilter', { filter : JSON.parse(filter) });
  }

  /**
   * On controller loads
   */
  async init() {
    try {
      await this.loadConfiguration();
      await this.switchTab(this.tab, true);

      this.$scope.$on('sendVisDataRows', (ev, param) => {
        const rows = (param || {}).mitreRows.tables[0].rows
        this.$scope.attacksCount = {}
        for(var i in rows){
          this.$scope.attacksCount[rows[i]["col-0-2"]] = rows[i]["col-1-1"]
        }

        this.mitreTableProps = {
          wzReq: (method, path, body) => this.apiReq.request(method, path, body),
          attacksCount: this.$scope.attacksCount,
        }
        this.mitreCardsSliderProps = {
          items: this.$scope.mitreIds,
          attacksCount: this.$scope.attacksCount,
          reqTitle: "MITRE",
          wzReq: (method, path, body) => this.apiReq.request(method, path, body),
          addFilter: (id) => this.addMitrefilter(id)
          }
        });

    } catch (error) {
      this.errorHandler.handle(error.message || error);
    }
    this.$scope.$applyAsync();
    return;
  }

  falseAllExpand() {
    this.expandArray = [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false
    ];
  }

  expand(i) {
    const oldValue = this.expandArray[i];
    this.falseAllExpand();
    this.expandArray[i] = !oldValue;
  }
}
