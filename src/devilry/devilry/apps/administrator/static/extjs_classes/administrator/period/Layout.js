Ext.define('devilry.administrator.period.Layout', {
    extend: 'Ext.container.Container',
    alias: 'widget.administrator-periodlayout',

    requires: [
        'devilry.administrator.period.PrettyView',
        'devilry.extjshelpers.RestfulSimplifiedEditPanel',
        'devilry.extjshelpers.forms.administrator.Period',
        'devilry.statistics.PeriodAdminLayout',
        'devilry.administrator.ListOfChildnodes',
        'devilry_header.Breadcrumbs'
    ],

    mainHelpTpl: Ext.create('Ext.XTemplate',
        '<div class="helpsection">',
        '<p>On the left hand side all assignments within this period/semester are listed. Click an assignment to manage the assignment.</p>',
        '<p>In the <span class="menuref">Students</span> tab you can view an overview of all students, and select the criteria that must be met to qualify for final examinations.</p>',
        '<p>Use the <span class="menuref">Administer</span> tab to change the properties of this period/semester, such as administrators and its timespan.</p>',
        '</div>'
    ),
    
    /**
     * @cfg
     */
    periodid: undefined,

    periodmodel_name: 'devilry.apps.administrator.simplified.SimplifiedPeriod',
    
    initComponent: function() {
        var query = Ext.Object.fromQueryString(window.location.search);
        Ext.apply(this, {
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            items: [this.heading = Ext.ComponentManager.create({
                xtype: 'component',
                data: {},
                cls: 'section pathheading',
                tpl: [
                    '<tpl if="!hasdata">',
                    '   <span class="loading">Loading...</span>',
                    '</tpl>',
                    '<tpl if="hasdata">',
                    '    <h1><small>{period.parentnode__short_name}.</small>{period.long_name}</h1>',
                    '</tpl>'
                ]
            }), {
                xtype: 'tabpanel',
                flex: 1,
                activeTab: query.open_students == 'yes'? 1: 0,
                items: [
                {
                    xtype: 'panel',
                    title: 'Assignments',
                    layout: {
                        type: 'hbox',
                        align: 'stretch'
                    },
                    items: [{
                        xtype: 'administrator-listofchildnodes',
                        parentnodeid: this.periodid,
                        orderby: 'publishing_time',
                        modelname: 'devilry.apps.administrator.simplified.SimplifiedAssignment',
                        urlrolepart: 'assignment',
                        readable_type: 'assignment',
                        flex: 7,
                        frame: false,
                        border: false
                    }, {
                        xtype: 'box',
                        flex: 3,
                        html: this.mainHelpTpl.apply({}),
                        autoScroll: true
                    }]
                }, {
                    title: 'Students',
                    xtype: 'statistics-periodadminlayout',
                    periodid: this.periodid,
                    hidesidebar: query.students_hidesidebar == 'yes',
                    defaultViewClsname: 'devilry.statistics.dataview.MinimalGridView',
                    listeners: {
                        activate: function(tab) {
                            tab.loadIfNotLoaded();
                            tab.doLayout();
                        }
                    }
                    //defaultViewClsname: 'devilry.statistics.dataview.FullGridView'
                }, this.prettyview = Ext.widget('administrator_periodprettyview', {
                    title: 'Administer',
                    modelname: this.periodmodel_name,
                    objectid: this.periodid,
                    dashboardUrl: DASHBOARD_URL,
                    listeners: {
                        scope: this,
                        loadmodel: this._onLoadRecord,
                        loadmodelFailed: this._onLoadRecordFailed,
                        edit: this._onEdit
                    }
                })]
            }]
        });
        this.callParent(arguments);
    },

    _onLoadRecord: function(record) {
        this.heading.update({
            hasdata: true,
            period: record.data,
            DEVILRY_URLPATH_PREFIX: DevilrySettings.DEVILRY_URLPATH_PREFIX
        });
        this._setBreadcrumbAndTitle(record);
    },

    _onLoadRecordFailed: function(operation) {
        this.removeAll();
        var title = operation.error.statusText;
        if(operation.error.status == '403') {
            title = gettext('Permission denied');
            message = gettext('You are not administrator on this item or any of its parents.');
        }
        this.add({
            xtype: 'box',
            padding: 20,
            tpl: [
                '<div class="section warning">',
                    '<h2>{title}</h2>',
                    '<p>{message}</p>',
                '</div>'
            ],
            data: {
                title: title,
                message: message
            }
        });
    },

    _setBreadcrumbAndTitle: function(periodRecord) {
        var path = [
            periodRecord.get('parentnode__short_name'),
            periodRecord.get('short_name')].join('.');
        window.document.title = Ext.String.format('{0} - Devilry', path);

        devilry_header.Breadcrumbs.getInBody().set([{
            text: periodRecord.get('parentnode__short_name'),
            url: '../subject/' + periodRecord.get('parentnode')
        }], periodRecord.get('short_name'));
    },

    _onEdit: function(record, button) {
        var editpanel = Ext.ComponentManager.create({
            xtype: 'restfulsimplified_editpanel',
            model: this.periodmodel_name,
            editform: Ext.widget('administrator_periodform'),
            record: record
        });
        var editwindow = Ext.create('devilry.administrator.DefaultEditWindow', {
            editpanel: editpanel,
            prettyview: this.prettyview
        });
        editwindow.show();
    }
});
