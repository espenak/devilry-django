Ext.define('devilry_subjectadmin.view.gradeeditor.Edit' ,{
    extend: 'Ext.container.Container',
    alias: 'widget.gradeeditoredit',
    cls: 'devilry_subjectadmin_gradeeditoredit',

    layout: 'anchor',
    defaults: {
        anchor: '100%'
    },
    items: [{
        xtype: 'box',
        itemId: 'about',
        cls: 'bootstrap',
        margin: '10 0 0 0',
        tpl: [
            '<tpl if="registryitem">',
                '<div class="current_gradeeditor_info">',
                    '<h2>',
                        gettext('Current grading system'),
                        ': ',
                        '<span class="registryitem_title">{registryitem.title}</span>',
                        ' <a href="{changeurl}" class="change_gradeeditor_link">(',
                            gettext('Change'),
                        ')</a>',
                    '</h2>',
                    '<div class="registryitem_description">',
                        '{registryitem.description}',
                    '</div>',
                '</div>',
            '<tpl else>',
                '<h3>', gettext('Loading') + ' ...', '</h3>',
            '</tpl>'
        ],
        data: {
        }
    }, {
        xtype: 'container',
        itemId: 'configContainer',
        margin: '20 0 0 0',
        layout: 'fit',
        items: [{
            xtype: 'box',
            itemId: 'noConfigBody',
            cls: 'bootstrap',
            tpl: [
                '<tpl if="assignmenthash">',
                    '<p>',
                        '<strong><a href="{assignmenthash}" class="return_to_assignmentlink">',
                            gettext('Return to {assignmentname}'),
                        '</a></strong>',
                    '</p>',
                '</tpl>'
            ],
            data: {}
        }]
    }, {
        xtype: 'box',
        margin: '30 0 0 0',
        cls: 'bootstrap what_is_a_gradeeditor_help',
        html: [
            '<div class="alert alert-info">',
                '<h3 class="alert-heading">', gettext('What is a grading system?'), '</h3>',
                '<p>',
                    gettext('A grading system is what examiners use to give feedback to students.'),
                '</p>',

                '<p>', gettext('Internally in Devilry, a grade is stored as'), ':</p>',
                '<dl>',
                    '<dt>', gettext('Points'), '</dt>',
                    '<dd>',
                        gettext('Any grade in Devilry is represented as a number. This number is used for statistics and to calculate final grades. Points is not available directly to students, but some grading systems make them available through the <em>Short text</em> (below).'),
                    '</dd>',

                    '<dt>', gettext('Short text'), '</dt>',
                    '<dd>',
                        gettext('A very short text that students view. Usually something like: <em>Approved</em>, <em>B</em> or <em>7/10</em>.'),
                    '</dd>',

                    '<dt>', gettext('Long text'), '</dt>',
                    '<dd>',
                        gettext('A longer text that students can view. This is usually the detailed feedback text, however some grading systems also fill this with autogenerated information based on input from examiners. What a grading system can display in the long text is virtually unlimited.'),
                    '</dd>',
                '</ul>',
            '</div>'
        ].join('')

    }]
});
