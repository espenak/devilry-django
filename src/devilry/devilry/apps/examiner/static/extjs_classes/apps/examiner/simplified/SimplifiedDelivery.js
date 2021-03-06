// Autogenerated by the dev_coreextjsmodels script. DO NOT CHANGE MANUALLY

/*******************************************************************************
 * NOTE: You will need to add the following before your application code:
 *
 *    Ext.Loader.setConfig({
 *        enabled: true,
 *        paths: {
 *            'devilry': DevilrySettings.DEVILRY_STATIC_URL + '/extjs_classes'
 *        }
 *    });
 *    Ext.syncRequire('devilry.extjshelpers.RestProxy');
 ******************************************************************************/
Ext.define('devilry.apps.examiner.simplified.SimplifiedDelivery', {
    extend: 'Ext.data.Model',
    requires: ['devilry.extjshelpers.RestProxy'],
    fields: [
        {
            "type": "int", 
            "name": "id"
        }, 
        {
            "type": "int", 
            "name": "number"
        }, 
        {
            "type": "date", 
            "name": "time_of_delivery", 
            "dateFormat": "Y-m-d\\TH:i:s"
        }, 
        {
            "type": "auto", 
            "name": "deadline"
        }, 
        {
            "type": "bool", 
            "name": "successful"
        }, 
        {
            "type": "int", 
            "name": "delivery_type"
        }, 
        {
            "type": "auto", 
            "name": "alias_delivery"
        }, 
        {
            "type": "auto", 
            "name": "deadline__assignment_group__candidates__identifier"
        }, 
        {
            "type": "auto", 
            "name": "deadline__assignment_group__parentnode"
        }, 
        {
            "type": "int", 
            "name": "deadline__assignment_group__parentnode__delivery_types"
        }, 
        {
            "type": "auto", 
            "name": "deadline__assignment_group__parentnode__short_name"
        }, 
        {
            "type": "auto", 
            "name": "deadline__assignment_group__parentnode__long_name"
        }, 
        {
            "type": "auto", 
            "name": "deadline__assignment_group__parentnode__parentnode"
        }, 
        {
            "type": "date", 
            "name": "deadline__assignment_group__parentnode__parentnode__start_time", 
            "dateFormat": "Y-m-d\\TH:i:s"
        }, 
        {
            "type": "date", 
            "name": "deadline__assignment_group__parentnode__parentnode__end_time", 
            "dateFormat": "Y-m-d\\TH:i:s"
        }, 
        {
            "type": "auto", 
            "name": "deadline__assignment_group__parentnode__parentnode__short_name"
        }, 
        {
            "type": "auto", 
            "name": "deadline__assignment_group__parentnode__parentnode__long_name"
        }, 
        {
            "type": "auto", 
            "name": "delivered_by__identifier"
        }, 
        {
            "type": "date", 
            "name": "deadline__deadline", 
            "dateFormat": "Y-m-d\\TH:i:s"
        }, 
        {
            "type": "auto", 
            "name": "deadline__assignment_group"
        }, 
        {
            "type": "auto", 
            "name": "deadline__assignment_group__name"
        }, 
        {
            "type": "auto", 
            "name": "deadline__assignment_group__candidates__identifier"
        }, 
        {
            "type": "auto", 
            "name": "deadline__assignment_group__parentnode__parentnode__parentnode"
        }, 
        {
            "type": "auto", 
            "name": "deadline__assignment_group__parentnode__parentnode__parentnode__short_name"
        }, 
        {
            "type": "auto", 
            "name": "deadline__assignment_group__parentnode__parentnode__parentnode__long_name"
        }
    ],
    idProperty: 'id',
    proxy: {
        type: 'devilryrestproxy',
        url: '/examiner/restfulsimplifieddelivery/',
        headers: {
            'X_DEVILRY_USE_EXTJS': true
        },
        extraParams: {
            getdata_in_qrystring: true,
            result_fieldgroups: '["assignment_group_users", "assignment", "period", "delivered_by", "deadline", "assignment_group", "candidates", "subject"]'
        },
        reader: {
            type: 'json',
            root: 'items',
            totalProperty: 'total'
        },
        writer: {
            type: 'json'
        }
    }
});