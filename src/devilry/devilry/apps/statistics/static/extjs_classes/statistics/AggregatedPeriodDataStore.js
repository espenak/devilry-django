Ext.define('devilry.statistics.AggregatedPeriodDataStore', {
    extend: 'Ext.data.Store',
    model: 'devilry.statistics.AggregatedPeriodDataModel',

    setPeriod: function(period_id) {
        this.proxy.url = Ext.String.format(this.proxy.urlpatt, period_id);
    },

    loadForPeriod: function(period_id, loadConfig) {
        this.setPeriod(period_id);
        this.load(loadConfig);
    }
});
